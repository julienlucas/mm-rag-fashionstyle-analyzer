import { Section } from "@/components/site/primitives";

/*
 * La séparation des rôles : backend/models/image_processor.py (recherche),
 * backend/models/config.py (seuil), backend/models/llm_service.py (analyse).
 */
const roles = [
  {
    verb: "Retrouver",
    signature: "convnext_tiny_pruned_int8.onnx",
    text: "Local, déterministe et gratuit : ConvNeXt-Tiny encode l'image et la compare aux 210 articles du catalogue par similarité cosinus. Toujours la même réponse pour la même image.",
  },
  {
    verb: "Décider",
    signature: "similarity >= 0.8",
    text: "Le score de la meilleure correspondance choisit le prompt : articles exacts si la tenue est reconnue, articles similaires — annoncés comme tels — sinon.",
  },
  {
    verb: "Décrire",
    signature: "pixtral-12b-2409",
    text: "Génératif, via l'API Mistral : Pixtral regarde l'image, reçoit les articles retrouvés et rédige la fiche — couleurs, motifs, matières, style, prix et liens.",
  },
];

const production = [
  { value: "29 Mo", label: "modèle de recherche", detail: "ConvNeXt-Tiny élagué 30 % et quantizé en INT8" },
  { value: "−880 Mo", label: "sur l'image Docker", detail: "sans PyTorch ni scikit-learn : ONNX Runtime et NumPy" },
  { value: "10–15 s", label: "par analyse", detail: "dont l'essentiel pour la génération de Pixtral" },
];

const limits = [
  {
    title: "Un catalogue de 96 looks",
    text: "Une seule garde-robe, celle de Taylor Swift : les recommandations ne sortent jamais de ces 210 articles. Élargir le catalogue ne demande aucun entraînement, seulement des photos et leurs articles.",
  },
  {
    title: "Une signature visuelle générique",
    text: "Le vecteur est la sortie ImageNet de ConvNeXt-Tiny (1 000 classes), pas un embedding appris sur la mode. Il suffit pour ce catalogue ; un modèle spécialisé mode serait plus robuste sur un catalogue de milliers de pièces.",
  },
  {
    title: "Des matières parfois supposées",
    text: "Pixtral déduit la matière de l'image (« tweed, probablement en laine ») : la fiche reste une description, pas une fiche technique fournisseur.",
  },
  {
    title: "Une latence portée par l'API",
    text: "La recherche est locale et rapide ; les 10 à 15 secondes viennent de la génération. Streamer la réponse rendrait l'attente bien plus courte à l'œil.",
  },
];

export function Architecture() {
  return (
    <Section
      id="architecture"
      index="03"
      eyebrow="Le levier déterminant"
      title={
        <>
          Un modèle pour retrouver, un autre pour <span className="accent-italic">décrire</span>.
        </>
      }
      intro="Demander à un seul grand modèle de reconnaître la tenue, retrouver les articles et rédiger la fiche, c'est l'exposer à inventer des produits et des prix. Ici, la recherche est confiée à un modèle de vision local et déterministe ; le modèle génératif ne fait que décrire, à partir d'articles qui existent vraiment dans le catalogue."
    >
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {roles.map((r, i) => (
          <div key={r.verb} className="card-paper border-hairline flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <span className="eyebrow">{r.verb}</span>
              <span className="mono-xs text-ink-faint">0{i + 1}</span>
            </div>
            <code className="mono-xs mt-3 w-fit max-w-full break-words rounded-sm bg-brand-surface px-2 py-1 text-brand-deep">
              {r.signature}
            </code>
            <p className="mb-2 mt-3 text-sm leading-relaxed text-ink-muted">{r.text}</p>
          </div>
        ))}
      </div>

      <div className="card-paper border-hairline mt-10 p-6 sm:p-8">
        <p className="display-sm">En production</p>
        <p className="mono-xs mt-1 text-muted-foreground">
          API Django · Docker · Railway · modèle sur Hugging Face · traces LangSmith
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {production.map((g) => (
            <div key={g.label} className="border-l-2 border-brand pl-4">
              <div className="font-display text-4xl font-normal tracking-tight tabular-nums">{g.value}</div>
              <div className="mt-1 text-sm font-medium">{g.label}</div>
              <div className="mono-xs mt-1 text-muted-foreground">{g.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14">
        <p className="display-md mt-3">Ce qui limite encore</p>
        <ol className="mt-6 divide-y divide-border border-t border-hairline">
          {limits.map((l, i) => (
            <li key={l.title} className="grid gap-1 py-4 sm:grid-cols-[2rem_16rem_1fr] sm:gap-4">
              <span className="mono-xs pt-1 text-ink-faint">0{i + 1}</span>
              <span className="text-sm font-medium">{l.title}</span>
              <span className="text-sm leading-relaxed text-ink-muted">{l.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
