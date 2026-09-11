import { Container, Eyebrow } from "@/components/site/primitives";
import { Analyzer } from "@/components/analyzer/Analyzer";

const tooling = ["Reactjs", "Django", "ConvNeXt-Tiny", "ONNX Runtime", "Pixtral 12B · Mistral AI", "LangSmith", "Hugging Face"];

const navLinks = [
  { href: "#demo", label: "Démo" },
  { href: "#parcours", label: "Parcours" },
  { href: "#resultats", label: "Résultats" },
  { href: "https://github.com/julienlucas/mm-rag-fashionstyle-analyzer", label: "Repo GitHub", external: true },
];

export function Hero() {
  return (
    <section id="top" className="border-b border-hairline bg-paper">
      <Container className="py-10 sm:py-16">
        <div className="flex items-start justify-between gap-10">
          <div className="min-w-0">
            <Eyebrow>Étude de cas · Julien Lucas</Eyebrow>
            <h1 className="display-xl mt-4">
              Style<span className="accent-italic">Analyzer</span>
              <span className="display-md mt-2 block text-ink">
                Analysez une tenue et retrouvez les pièces similaires portées par Taylor Swift — un RAG
                multimodal avec prix et liens, sans entraîner un seul modèle
              </span>
            </h1>
            <p className="copy mt-6">
              Deux modèles de vision, deux rôles. ConvNeXt-Tiny, élagué et quantizé en INT8, retrouve la
              tenue la plus proche parmi 96 looks et 210 articles ; Pixtral 12B de{" "}
              <a href="https://mistral.ai" target="_blank">
                Mistral AI
              </a>{" "}
              décrit chaque pièce — couleurs, motifs, matières — et rédige la fiche. Mettre le catalogue à
              jour, c'est ajouter une photo : aucun ré-entraînement.
            </p>
          </div>

          <nav aria-label="Sections" className="hidden shrink-0 flex-col items-end gap-3 pt-2 sm:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target={l.external ? "_blank" : undefined}
                rel={l.external ? "noreferrer" : undefined}
                className="nav-link mono-xs uppercase"
              >
                {l.label}
                {l.external ? " ↗" : ""}
              </a>
            ))}
          </nav>
        </div>

        <div id="demo" className="scroll-mt-20">
          <Analyzer />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Eyebrow>Construit avec</Eyebrow>
          <ul className="flex flex-wrap items-center gap-1.5">
            {tooling.map((t) => (
              <li key={t} className="tag bg-brand-surface">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
