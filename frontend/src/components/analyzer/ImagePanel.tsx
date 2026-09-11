import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPTED_TYPES, MAX_FILE_MB, exampleOutfits } from "./examples";
import type { Subject } from "./types";

/** Une puce de tenue : vignette ronde et titre. */
function OutfitChip({
  subject,
  active,
  onSelect,
  onRemove,
}: {
  subject: Pick<Subject, "title" | "src">;
  active: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}) {
  const clickable = !!onSelect && !active;
  return (
    <span
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={onSelect ? active : undefined}
      onClick={clickable ? onSelect : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition-colors",
        active ? "border-brand bg-brand-surface text-ink" : "border-hairline bg-paper text-ink-muted",
        clickable && "cursor-pointer hover:border-brand hover:text-ink",
      )}
    >
      <img src={subject.src} alt="" className="size-6 shrink-0 rounded-full border border-hairline object-cover object-top" />
      <span className="max-w-[12rem] truncate font-medium">{subject.title}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Retirer ${subject.title}`}
          className="text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </span>
  );
}

/** Valide un fichier image ; renvoie un message d'erreur ou null. */
export function checkImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Format non supporté : PNG, JPG ou WebP.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Image trop lourde (max ${MAX_FILE_MB} Mo).`;
  return null;
}

export function ImagePanel({
  active,
  onSelectExample,
  onUpload,
  onRemoveUpload,
  busy,
}: {
  active: Subject;
  onSelectExample: (id: string) => void;
  onUpload: (file: File) => void;
  onRemoveUpload: () => void;
  busy: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const accept = (files: FileList | null) => {
    setFileError(null);
    const file = files?.[0];
    if (!file) return;
    const error = checkImage(file);
    if (error) {
      setFileError(error);
      return;
    }
    onUpload(file);
  };

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            accept(e.target.files);
            e.target.value = "";
          }}
        />
        <Button variant="outline" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
          <Upload /> Charger une tenue
        </Button>

        <span className="mono-xs text-muted-foreground">ou parmi nos exemples</span>

        {exampleOutfits.map((ex) => (
          <OutfitChip
            key={ex.id}
            subject={ex}
            active={active.id === ex.id}
            onSelect={busy ? undefined : () => onSelectExample(ex.id)}
          />
        ))}

        {active.source === "upload" ? (
          <OutfitChip subject={active} active onRemove={busy ? undefined : onRemoveUpload} />
        ) : null}
      </div>

      {fileError ? <p className="mt-2 text-xs text-destructive">{fileError}</p> : null}
    </div>
  );
}
