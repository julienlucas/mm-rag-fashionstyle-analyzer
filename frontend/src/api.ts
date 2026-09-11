const API_URL = import.meta.env.VITE_RAILWAY_API_URL || "";

/** Réponse de `backend/views.py` : l'analyse markdown de Pixtral et la tenue la plus proche. */
export type AnalyzeResponse = {
  bot_response: string;
  closest_image_url: string;
};

export const api = {
  /** Recherche ConvNeXt-Tiny dans le catalogue + analyse stylistique Pixtral 12B. */
  async analyze(file: File): Promise<AnalyzeResponse> {
    const body = new FormData();
    body.append("image", file);
    const response = await fetch(`${API_URL}/analyze`, { method: "POST", body });
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      /* corps vide */
    }
    if (!response.ok) throw new Error(data?.Erreur || data?.error || `Erreur serveur (${response.status})`);
    // En cas d'échec métier, le backend renvoie une chaîne d'erreur à la place de l'objet.
    if (typeof data?.message === "string") throw new Error(data.message.replace(/^Erreur\s*:\s*/, ""));
    if (!data?.message?.bot_response) throw new Error("Réponse invalide du serveur");
    return data.message as AnalyzeResponse;
  },
};
