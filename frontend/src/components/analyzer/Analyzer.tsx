import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Clock, ImageUp, RotateCcw, Shirt, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "@/api";
import { renderMarkdown } from "@/lib/markdown";
import { useElapsed } from "@/hooks/useTimer";
import { ImagePanel, checkImage } from "./ImagePanel";
import { exampleOutfits, savedExample, type ExampleOutfit } from "./examples";
import type { Analysis, Subject } from "./types";

const DEFAULT_OUTFIT = exampleOutfits.find((o) => o.id === savedExample.outfitId)!;
const MAX_ANSWER_H = 420;

/* Étapes de backend/app.py, animées pendant l'attente : le backend répond en un bloc. */
const steps = [
  { label: "Encodage ConvNeXt-Tiny INT8 — un vecteur de 1 000 dimensions", ms: 700 },
  { label: "Similarité cosinus sur les 210 articles du catalogue", ms: 500 },
  { label: "Articles de la tenue la plus proche : noms, prix, liens", ms: 400 },
  { label: "Analyse stylistique Pixtral 12B", ms: 0 },
];

function subjectFromOutfit(o: ExampleOutfit): Subject {
  return { id: o.id, title: o.title, src: o.src, source: "example" };
}

function savedAnalysis(): Analysis {
  return { status: "done", answer: savedExample.answer, closestImageUrl: savedExample.closestImageUrl, live: false };
}

/** Analyse repliée, dépliable par « Voir toute l'analyse ». */
function CollapsibleAnswer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const inner = useRef<HTMLDivElement>(null);

  // mesure avant peinture : sinon le bloc s'affiche déplié puis se referme
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const check = () => setFullHeight(el.scrollHeight);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  const overflows = fullHeight > MAX_ANSWER_H + 8;
  const collapsed = !fullHeight || (overflows && !open);

  return (
    <div>
      <div
        className="relative overflow-hidden transition-[max-height] duration-300"
        style={{ maxHeight: collapsed ? MAX_ANSWER_H : fullHeight }}
      >
        <div ref={inner}>{children}</div>
        {overflows && !open ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"
          />
        ) : null}
      </div>
      {overflows ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mono-xs mt-3 inline-flex cursor-pointer items-center gap-1 text-brand-deep transition-colors hover:text-brand-strong"
        >
          {open ? "Réduire" : "Voir toute l'analyse"}
          <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
        </button>
      ) : null}
    </div>
  );
}

export function Analyzer() {
  const [subject, setSubject] = useState<Subject>(() => subjectFromOutfit(DEFAULT_OUTFIT));
  const [analysis, setAnalysis] = useState<Analysis>(savedAnalysis);
  const [stage, setStage] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const pending = analysis.status === "pending";
  const elapsed = useElapsed(pending);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const token = useRef(0);
  const objectUrl = useRef<string | null>(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const releaseUpload = () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  };

  useEffect(
    () => () => {
      clearTimers();
      releaseUpload();
    },
    [],
  );

  async function analyze(target: Subject) {
    const run = ++token.current;
    clearTimers();
    setStage(0);
    setAnalysis({ status: "pending" });

    let acc = 0;
    steps.forEach((s, i) => {
      if (s.ms > 0 && i + 1 < steps.length) {
        acc += s.ms;
        timers.current.push(setTimeout(() => setStage(i + 1), acc));
      }
    });

    const started = performance.now();
    try {
      let file = target.file;
      if (!file) {
        const blob = await fetch(target.src).then((r) => r.blob());
        file = new File([blob], target.src.split("/").pop() || "tenue.png", { type: blob.type || "image/png" });
      }
      const res = await api.analyze(file);
      if (run !== token.current) return;
      setAnalysis({
        status: "done",
        answer: res.bot_response,
        closestImageUrl: res.closest_image_url,
        elapsed: Math.round((performance.now() - started) / 100) / 10,
        live: true,
      });
    } catch (err) {
      if (run !== token.current) return;
      const message = err instanceof Error ? err.message : "Erreur de connexion au backend";
      setAnalysis({ status: "error", message });
      toast.error("L'analyse a échoué", { description: message });
    } finally {
      if (run === token.current) clearTimers();
    }
  }

  const showOutfit = (o: ExampleOutfit) => {
    token.current++;
    clearTimers();
    releaseUpload();
    setSubject(subjectFromOutfit(o));
    setAnalysis(o.id === savedExample.outfitId ? savedAnalysis() : { status: "idle" });
  };

  const selectExample = (id: string) => {
    const o = exampleOutfits.find((e) => e.id === id);
    if (o && o.id !== subject.id) showOutfit(o);
  };

  const upload = (file: File) => {
    releaseUpload();
    const src = URL.createObjectURL(file);
    objectUrl.current = src;
    const next: Subject = { id: `upload-${Date.now()}`, title: file.name, src, source: "upload", file };
    setSubject(next);
    analyze(next);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (pending) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const error = checkImage(file);
    if (error) {
      toast.error("Image refusée", { description: error });
      return;
    }
    upload(file);
  };

  const closest = analysis.status === "done" ? analysis.closestImageUrl : "";

  return (
    <div>
      <ImagePanel
        active={subject}
        onSelectExample={selectExample}
        onUpload={upload}
        onRemoveUpload={() => showOutfit(DEFAULT_OUTFIT)}
        busy={pending}
      />

      <h3 className="display-sm pb-3 pt-8">L'analyse</h3>

      <div className="card-paper overflow-hidden bg-white">
        <div className="grid md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
          {/* colonne images : la tenue analysée et la plus proche du catalogue */}
          <div className="grid grid-cols-2 gap-3 border-b border-hairline bg-paper-2 p-4 sm:p-5 md:grid-cols-1 md:content-start md:border-b-0 md:border-r">
            <figure>
              <figcaption className="eyebrow mb-2">Votre tenue</figcaption>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!pending) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className="relative aspect-[3/4] overflow-hidden rounded-md bg-ink"
              >
                <img
                  key={subject.src}
                  src={subject.src}
                  alt={subject.title}
                  className="rise-in absolute inset-0 size-full object-cover object-top"
                />
                {pending ? (
                  <span aria-hidden className="absolute inset-0 overflow-hidden">
                    <span className="scan-line absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-gold-300/45 to-transparent" />
                  </span>
                ) : null}
                <span className="mono-xs absolute left-2 top-2 hidden rounded-sm bg-ink/60 px-2 py-1 text-on-ink-muted sm:block">
                  glissez-déposez une tenue
                </span>
                {dragOver ? (
                  <div className="absolute inset-2 grid place-items-center rounded-md border-2 border-dashed border-brand bg-brand-surface-strong/90 p-3 text-center">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <ImageUp className="size-4 shrink-0 text-brand-deep" /> Déposez l'image pour l'analyser
                    </span>
                  </div>
                ) : null}
              </div>
            </figure>

            <figure>
              <figcaption className="eyebrow mb-2">La plus proche du catalogue</figcaption>
              <div className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-md border border-dashed border-hairline-strong bg-paper">
                {closest ? (
                  <img
                    key={closest}
                    src={closest}
                    alt="Tenue la plus proche dans le catalogue"
                    className="rise-in absolute inset-0 size-full object-cover object-top"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-2 px-4 text-center text-xs text-muted-foreground">
                    <Shirt className="size-5 text-ink-faint" />
                    {pending ? "recherche en cours…" : "apparaît après l'analyse"}
                  </span>
                )}
              </div>
            </figure>
          </div>

          {/* analyse stylistique */}
          <div className="flex min-h-[32rem] flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="eyebrow">Analyse stylistique · Pixtral 12B</span>
              {analysis.status === "done" ? (
                analysis.live ? (
                  <span className="mono-xs inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" /> analyse en direct ·{" "}
                    {analysis.elapsed?.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} s
                  </span>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="mono-xs cursor-help text-muted-foreground underline decoration-dotted underline-offset-4">
                        réponse enregistrée
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Sortie réelle du pipeline, conservée pour que la page ne s'ouvre pas à vide. « Analyser en
                      direct » relance ConvNeXt et Pixtral.
                    </TooltipContent>
                  </Tooltip>
                )
              ) : null}
            </div>

            <div className="mt-4 flex-1">
              {analysis.status === "done" ? (
                <div className="rise-in">
                  <CollapsibleAnswer>
                    <div className="prose-rag">{renderMarkdown(analysis.answer)}</div>
                  </CollapsibleAnswer>
                </div>
              ) : null}

              {analysis.status === "idle" ? (
                <div className="rise-in">
                  <p className="display-sm">« {subject.title} » est prête à être analysée.</p>
                  <p className="copy mt-2 text-sm">
                    ConvNeXt-Tiny retrouve la tenue la plus proche dans le catalogue, puis Pixtral 12B décrit
                    chaque pièce — couleurs, motifs, matières — et liste les articles similaires avec leur prix
                    et leur lien.
                  </p>
                </div>
              ) : null}

              {analysis.status === "pending" ? (
                <div className="rise-in space-y-2 rounded-2xl border border-dashed border-brand/50 bg-brand-surface/40 px-4 py-3.5">
                  {steps.map((s, i) => {
                    const done = stage > i;
                    const running = stage === i;
                    return (
                      <div
                        key={s.label}
                        className={cn("flex items-center gap-2.5 text-xs transition-opacity", !done && !running && "opacity-40")}
                      >
                        {done ? (
                          <span className="size-3.5 shrink-0 rounded-full bg-success/80" />
                        ) : (
                          <span
                            className={cn("size-3.5 shrink-0 rounded-full border border-brand", running && "signal-dot bg-brand")}
                          />
                        )}
                        <span className={cn("font-medium", done && "text-ink-muted")}>{s.label}</span>
                        {running ? <span className="mono-xs text-muted-foreground">en cours…</span> : null}
                      </div>
                    );
                  })}
                  <p className="mono-xs pt-1 text-muted-foreground">
                    {elapsed}s · comptez 10 à 15 s, l'essentiel pour la génération de Pixtral
                  </p>
                </div>
              ) : null}

              {analysis.status === "error" ? (
                <p className="rise-in flex gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3.5 text-sm text-destructive">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  {analysis.message}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
              <Button variant="brand" onClick={() => analyze(subject)} disabled={pending}>
                {analysis.status === "done" && analysis.live ? <RotateCcw /> : null}
                {analysis.status === "done" && analysis.live ? "Relancer l'analyse" : "Analyser en direct"}
                <Sparkles />
              </Button>
              <span className="mono-xs text-muted-foreground">recherche locale ONNX · analyse via l'API Mistral</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
