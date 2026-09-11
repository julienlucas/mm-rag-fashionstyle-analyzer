export type ExampleOutfit = {
  id: string;
  src: string;
  title: string;
};

export const exampleOutfits: ExampleOutfit[] = [
  { id: "tweed", src: "/static/test-6.png", title: "Manteau en tweed" },
  { id: "tartan", src: "/static/test-2.png", title: "Tailleur écossais" },
  { id: "black-dress", src: "/static/test-1.png", title: "Robe noire" },
  { id: "flannel", src: "/static/test-4c.png", title: "Chemise à carreaux" },
  { id: "leather", src: "/static/test-5.png", title: "Blouson en cuir" },
];

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const MAX_FILE_MB = 10;

/**
 * Réponse enregistrée du pipeline complet pour la tenue « Manteau en tweed » : affichée
 * tant qu'aucune analyse en direct n'a été lancée — et étiquetée comme telle.
 */
export const savedExample = {
  outfitId: "tweed",
  closestImageUrl:
    "https://64.media.tumblr.com/800a49287ede1fa2b0529d6ffbd363b6/c200f906907b3c8e-b6/s540x810/1ded8ff32cfbbb39b36c5bb03e2eebe9da95270e.pnj",
  answer:
    "### Analyse Mode Professionnelle\n\nL'image présente une tenue élégante et sophistiquée, idéale pour une clientèle recherchant des pièces de haute qualité et de style intemporel. Voici une description détaillée des éléments vestimentaires observés :\n\n1. **Manteau en Tweed Noir et Blanc** :\n   - **Couleurs** : Noir et blanc.\n   - **Motif** : Tweed avec un motif en losanges.\n   - **Matière** : Tweed, probablement en laine, offrant une texture riche et une chaleur confortable.\n   - **Description** : Ce manteau est une pièce maîtresse de la tenue, apportant une touche de sophistication et de classicisme. Le motif en losanges ajoute une dimension visuelle intéressante tout en restant sobre.\n\n2. **Combinaison en Laine Jersey** :\n   - **Couleurs** : Noir.\n   - **Matière** : Laine jersey, offrant une texture douce et confortable.\n   - **Description** : La combinaison est une pièce polyvalente qui peut être portée seule ou sous des couches supplémentaires. Elle épouse parfaitement la silhouette, offrant une allure élégante et moderne.\n\n3. **Gants en Cuir à Côtes** :\n   - **Couleurs** : Noir.\n   - **Matière** : Cuir.\n   - **Description** : Les gants en cuir ajoutent une touche de luxe et de praticité à la tenue. Leur design à côtes offre une texture supplémentaire et une meilleure adhérence.\n\n4. **Sac Mini à Rabat** :\n   - **Couleurs** : Noir.\n   - **Matière** : Cuir matelassé.\n   - **Description** : Ce sac est un accessoire emblématique, reconnaissable par son design matelassé et son rabat. Il ajoute une touche de luxe et de sophistication à l'ensemble de la tenue.\n\n5. **Ceinture à Chaîne** :\n   - **Couleurs** : Noir.\n   - **Matière** : Cuir et chaîne métallique.\n   - **Description** : La ceinture à chaîne est un accessoire tendance qui ajoute une touche de modernité et de sophistication à la tenue. Elle peut être portée pour cintrer la taille et ajouter une dimension supplémentaire à la silhouette.\n\n6. **Bottes en Cuir à Talons** :\n   - **Couleurs** : Noir.\n   - **Matière** : Cuir.\n   - **Description** : Les bottes en cuir à talons complètent parfaitement la tenue, offrant une allure élégante et sophistiquée. Leur design épuré et leur talon haut ajoutent une touche de féminité et de raffinement.\n\n### Articles Similaires\n\nIl est important de noter que les articles suivants sont similaires mais pas nécessairement identiques à ceux présentés sur l'image.\n\n- **Manteau en Tweed Noir et Blanc Chanel** (\\$9,600.00) : https://go.shopmy.us/p-12166868\n- **Gants en Cuir à Côtes Canada Goose** (\\$195.00) : https://go.shopmy.us/p-12252721\n- **Sac Mini à Rabat Chanel** (\\$5,000.00) : https://go.shopmy.us/p-12167440\n- **Combinaison en Laine Jersey Chanel** (\\$4,650.00) : https://go.shopmy.us/p-12166868\n- **Ceinture à Chaîne Chanel** (\\$2,250.00) : https://go.shopmy.us/p-12166880\n\nCes articles similaires offrent des options de haute qualité pour recréer ou s'inspirer de la tenue présentée, tout en permettant une personnalisation selon les préférences individuelles.",
};
