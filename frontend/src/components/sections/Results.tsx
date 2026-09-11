import { useState, type CSSProperties } from "react";
import { Table2 } from "lucide-react";
import { Section } from "@/components/site/primitives";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * Reconnaissance : constat du projet sur les tenues du catalogue (README : « proche de 100 %,
 * pas parfait »). Latence : ancienne étude de cas, traces LangSmith. Tailles : fichier
 * backend/models/convnext_tiny_pruned_int8.onnx (29 Mo) et estimation FP32 (28,6 M × 4 octets).
 */
const levels = [
  {
    label: "Reconnaissance",
    value: "~100 %",
    unit: "des tenues du catalogue retrouvées",
    detail: "ConvNeXt-Tiny, sans reranker",
    setup: "Proche de 100 %, pas parfait : mesuré sur les tenues du catalogue elles-mêmes, ce qui compte pour un moteur de recommandation.",
    tone: "brand" as const,
  },
  {
    label: "Latence",
    value: "10–15 s",
    unit: "par analyse complète",
    detail: "recherche + analyse Pixtral 12B",
    setup: "La recherche visuelle est quasi instantanée ; l'essentiel du temps part dans la génération de Pixtral.",
    tone: "muted" as const,
  },
  {
    label: "Entraînement",
    value: "0",
    unit: "entraînement nécessaire",
    detail: "ni fine-tuning, ni ré-entraînement",
    setup: "Ajouter une tenue au catalogue revient à calculer un vecteur : la mise à jour prend quelques secondes.",
    tone: "ref" as const,
  },
];

const sizes = [
  { label: "ConvNeXt-Tiny FP32", value: 115, hint: "estimation : 28,6 M paramètres × 4 octets" },
  { label: "Élagué 30 % + INT8", value: 29, hint: "convnext_tiny_pruned_int8.onnx, en production" },
];
const MAX_SIZE = 120;

function SizeChart() {
  const [table, setTable] = useState(false);
  return (
    <figure className="card-paper border-hairline p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <figcaption className="display-sm">Le modèle de recherche, quatre fois plus léger</figcaption>
          <p className="mono-xs mt-1 text-muted-foreground">taille du fichier du modèle, en Mo</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="-mt-1 ml-auto shrink-0"
          onClick={() => setTable((t) => !t)}
          aria-pressed={table}
        >
          <Table2 /> {table ? "Graphique" : "Tableau"}
        </Button>
      </div>

      {table ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-2 font-medium">Modèle</th>
              <th className="py-2 font-medium">Taille</th>
              <th className="py-2 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((s) => (
              <tr key={s.label} className="border-t border-hairline">
                <td className="py-2 font-medium">{s.label}</td>
                <td className="py-2">{s.value} Mo</td>
                <td className="py-2 text-ink-muted">{s.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-6 space-y-4">
          {sizes.map((s, i) => (
            <div key={s.label} className="grid gap-1 sm:grid-cols-[12rem_1fr]">
              <div>
                <span className="text-sm font-medium">{s.label}</span>
                <span className="mt-0.5 block text-[0.7rem] leading-snug text-muted-foreground">{s.hint}</span>
              </div>
              <div className="border-l border-hairline pl-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-5 items-center gap-2">
                      <span
                        className={cn("h-2.5 rounded-r-[4px]", i === sizes.length - 1 ? "bg-chart-after" : "bg-chart-before")}
                        style={{ width: `calc((100% - 4rem) * ${s.value / MAX_SIZE})` }}
                      />
                      <span className="mono-xs shrink-0 text-ink-muted">
                        {i === 0 ? "~" : ""}
                        {s.value} Mo
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {s.label} · {s.value} Mo — {s.hint}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}

const levers = [
  {
    title: "Des vecteurs pré-calculés, pas d'entraînement",
    text: "Chaque photo du catalogue est encodée une fois pour toutes. Enrichir le catalogue, c'est ajouter une ligne : aucun modèle à ré-entraîner, aucun pipeline de fine-tuning à maintenir.",
  },
  {
    title: "ConvNeXt-Tiny pour la recherche",
    text: "Une architecture de 2022 dont la signature visuelle distingue assez finement les tenues pour se passer de reranker, là où des modèles plus anciens échouaient.",
  },
  {
    title: "Un seuil de similarité à 0,8",
    text: "Deux prompts selon le score : les articles exacts quand la tenue est reconnue, des articles similaires — présentés comme tels — quand elle ne l'est pas.",
  },
  {
    title: "La tenue entière, pas un article isolé",
    text: "La meilleure correspondance ramène tous les articles de sa photo : manteau, sac, ceinture, bottes, chacun avec son prix et son lien.",
  },
  {
    title: "Un prompt de rédacteur de catalogue",
    text: "Couleurs, motifs, matières, catégorie de style, ton formel, noms traduits en français et prix conservés ; température 0,2 pour des fiches régulières.",
  },
  {
    title: "Pixtral 12B plutôt que Large",
    text: "Le modèle le plus léger de la famille suffit à reconnaître matières et coupes, pour une latence et un coût contenus.",
  },
  {
    title: "Pruning, INT8 et ONNX seul",
    text: "30 % des poids élagués, quantization INT8, puis ONNX Runtime et NumPy en production : PyTorch et scikit-learn disparaissent de l'image Docker.",
  },
];

export function Results() {
  return (
    <Section
      id="resultats"
      index="02"
      eyebrow="L'évaluation"
      title={
        <>
          Les tenues du catalogue retrouvées, en <span className="accent-italic">10 à 15 secondes</span>, sans
          une heure d'entraînement.
        </>
      }
      intro="Un moteur de recommandation se juge sur une question simple : devant une tenue, retrouve-t-il la bonne dans son catalogue, avec les bons articles ? Puis sur la qualité de la fiche qu'il rédige, et sur le temps qu'il met à le faire."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((l, i) => (
          <div
            key={l.label}
            className={cn(
              "flex h-full flex-col rounded-xl border p-8",
              l.tone === "muted" && "border-hairline bg-chart-after/5",
              l.tone === "brand" && "border-transparent bg-chart-after/15 shadow-xl",
              l.tone === "ref" && "border-hairline bg-chart-ref/5",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow">{l.label}</span>
              <span className="mono-xs text-ink-faint">0{i + 1}</span>
            </div>
            <div className="font-display mt-4 text-5xl font-normal tracking-tight">{l.value}</div>
            <div className="mt-1 text-sm font-medium">{l.unit}</div>
            <div className="mono-xs mt-1 text-muted-foreground">{l.detail}</div>
            <p className="mt-4 border-t border-hairline pt-3 text-xs leading-relaxed text-ink-muted">{l.setup}</p>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <SizeChart />
      </div>

      {/* Ce que les chiffres autorisent à dire — et pas plus. Hors de la carte, exprès. */}
      <figure className="grid max-w-4xl gap-x-6 pt-18 sm:grid-cols-[3.5rem_1fr]">
        <span aria-hidden className="display-xl -mt-3 hidden select-none leading-none text-brand sm:block">
          &ldquo;
        </span>
        <div>
          <span className="eyebrow">Ce que les chiffres disent</span>
          <blockquote className="display-md mt-3 text-ink">
            Sur les tenues de son catalogue, le système retrouve la bonne photo{" "}
            <span className="accent-italic">presque à chaque fois</span>, et rédige une fiche avec prix et
            liens en 10 à 15 secondes. Ce n'est pas un benchmark : c'est la preuve qu'un RAG multimodal
            utile se construit sans entraîner de modèle.
          </blockquote>
        </div>
      </figure>

      <div className="mt-16">
        <h3 className="display-md max-w-3xl">Ce qui a été fait</h3>
        <ol className="mt-6 space-y-1">
          {levers.map((l, i) => {
            // Du levier le plus structurant au plus fin : une teinte déjà légère au premier
            // rang, qui s'estompe jusqu'au papier au dernier.
            const strength = 0.14 - (i / (levers.length - 1)) * 0.13;
            return (
              <li
                key={l.title}
                data-strong={i === 0 || undefined}
                className="lever-row grid gap-1 rounded-sm px-4 py-4 sm:grid-cols-[2rem_16rem_1fr] sm:gap-4"
                style={{ "--lever-strength": `${Math.round(strength * 100)}%` } as CSSProperties}
              >
                <span className="lever-index mono-xs pt-1">0{i + 1}</span>
                <span className="text-sm font-medium">{l.title}</span>
                <span className="lever-text text-sm leading-relaxed">{l.text}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
