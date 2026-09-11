import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

/*
 * Chronologie reconstituée depuis backend/ (app.py, models/, utils/), le dataset
 * backend/dataset/swift-style-embeddings.pkl (210 articles, 96 photos, vecteurs de
 * 1 000 dimensions) et l'historique git (Pixtral Large → Pixtral 12B, passage à ONNX).
 */
type Stage = {
  model: string;
  role: string;
  specs: string[];
  score: string;
  scoreLabel: string;
  text: string;
  lesson: string;
  tone?: "brand";
};

const stages: Stage[] = [
  {
    model: "Le catalogue de tenues",
    role: "Les données",
    specs: ["96 photos", "210 articles", "prix et liens"],
    score: "210",
    scoreLabel: "articles, sur 96 looks",
    text: "Des photos de tenues de Taylor Swift, et pour chacune les articles qui la composent : nom, marque, prix et lien d'achat. Chaque photo est encodée une seule fois, son vecteur stocké à côté des articles dans un fichier de 6 Mo chargé par l'API.",
    lesson: "Le catalogue est la seule chose à maintenir : ajouter une tenue, c'est l'encoder une fois — aucun entraînement.",
  },
  {
    model: "ConvNeXt-Tiny, sans fine-tuning",
    role: "La recherche visuelle",
    specs: ["28,6 M paramètres", "ImageNet", "224 px", "similarité cosinus"],
    score: "~100 %",
    scoreLabel: "des tenues du catalogue retrouvées",
    text: "L'image de l'utilisateur passe dans ConvNeXt-Tiny (2022), pré-entraîné sur ImageNet : sa sortie de 1 000 dimensions sert de signature visuelle. Une similarité cosinus contre tout le catalogue remonte les 15 meilleurs candidats ; la photo en tête ramène tous ses articles, avec prix et liens.",
    lesson: "Les architectures plus anciennes testées n'y parvenaient pas ; avec ConvNeXt-Tiny, un reranker devient inutile.",
  },
  {
    model: "Deux régimes de réponse",
    role: "Le garde-fou",
    specs: ["seuil 0,8", "identique ou similaire"],
    score: "0,8",
    scoreLabel: "de similarité cosinus",
    text: "Au-dessus de 0,8, la tenue est reconnue : Pixtral détaille les articles exacts. En dessous, le prompt change et impose de présenter les articles comme similaires, mais pas forcément identiques — le système ne fait pas passer une ressemblance pour une correspondance.",
    lesson: "Un RAG honnête dit quand il a trouvé, et quand il approche.",
  },
  {
    model: "Pixtral, de Large à 12B",
    role: "L'analyse stylistique",
    specs: ["Mistral AI", "température 0,2", "1 000 tokens max"],
    score: "10–15 s",
    scoreLabel: "par analyse complète",
    text: "Un second modèle de vision, génératif cette fois, reçoit l'image et la liste des articles retrouvés. Le prompt le cadre comme un rédacteur de catalogue professionnel : couleurs, motifs, matières, catégorie de style, noms d'articles traduits en français, prix conservés. Pixtral Large, trop gourmand, a cédé la place à Pixtral 12B ; une réponse trop courte déclenche une fiche de secours.",
    lesson: "Le plus petit Pixtral suffit à reconnaître matières et coupes.",
    tone: "brand",
  },
  {
    model: "Élagué et quantizé",
    role: "La compression",
    specs: ["pruning L1 global 30 %", "INT8 dynamique", "ONNX"],
    score: "29 Mo",
    scoreLabel: "au lieu de ~115 Mo en FP32",
    text: "30 % des poids de ConvNeXt-Tiny, choisis sur l'ensemble du réseau par leur valeur absolue, sont mis à zéro ; le modèle est exporté en ONNX puis quantizé en INT8 avec ONNX Runtime, et publié sur Hugging Face.",
    lesson: "Quatre fois plus léger pour la même tâche : retrouver une tenue ne demande pas la précision du FP32.",
  },
  {
    model: "Servi sans PyTorch",
    role: "La mise en production",
    specs: ["ONNX Runtime", "NumPy", "Django", "LangSmith"],
    score: "−880 Mo",
    scoreLabel: "sur l'image Docker",
    text: "Encodage par ONNX Runtime, similarité en NumPy : PyTorch et scikit-learn quittent le serveur. Le modèle est téléchargé depuis Hugging Face s'il manque, et chaque appel — encodage comme génération, tokens compris — est tracé dans LangSmith.",
    lesson: "Le même pipeline que celui qui répond dans la démo ci-dessus.",
  },
];

export function Journey() {
  return (
    <Section
      id="parcours"
      index="01"
      eyebrow="Le parcours"
      title={
        <>
          Un RAG multimodal qui se met à jour <span className="accent-italic">sans entraînement</span>.
        </>
      }
      intro="Le challenge : analyser le style d'une tenue et recommander des pièces similaires avec leur prix et leur lien, sur un catalogue qu'on doit pouvoir enrichir sans relancer d'entraînement. Il faut pour ça un modèle de vision assez précis pour la recherche, et un second assez fin pour l'analyse stylistique. Les étapes, dans l'ordre."
    >
      <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[0.6875rem] before:top-8 before:w-px before:bg-hairline-strong">
        {stages.map((s, i) => (
          <li key={s.model} className="relative pl-10">
            <span
              aria-hidden
              className={cn(
                "mono-xs absolute left-0 top-7 grid size-[1.375rem] place-items-center rounded-full border text-[0.65rem]",
                s.tone === "brand" ? "border-brand bg-brand text-on-ink" : "border-brand bg-paper text-brand-deep",
              )}
            >
              {i + 1}
            </span>
            <article
              className={cn(
                "grid gap-6 rounded-xl border p-6 sm:grid-cols-[11rem_1fr] sm:p-8",
                s.tone === "brand" ? "border-transparent bg-chart-after/15 shadow-xl" : "border-hairline bg-paper",
              )}
            >
              <div>
                <span className="eyebrow">{s.role}</span>
                <div className="font-display mt-3 text-5xl font-normal tracking-tight tabular-nums">{s.score}</div>
                <div className="mono-xs mt-1 text-muted-foreground">{s.scoreLabel}</div>
              </div>
              <div className="min-w-0">
                <h3 className="display-sm">{s.model}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.specs.map((spec) => (
                    <Badge key={spec} variant="mono">
                      {spec}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">{s.text}</p>
                <p className="mt-4 border-t border-hairline pt-3 text-sm font-medium">
                  <span className="text-brand-deep">→ </span>
                  {s.lesson}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </Section>
  );
}
