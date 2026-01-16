import logging
from mistralai import Mistral
import backend.models.config as config
import os
from dotenv import load_dotenv
from langsmith import Client
from langsmith.run_helpers import traceable, get_current_run_tree

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration LangSmith
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["LANGCHAIN_API_KEY"] = config.LANGSMITH_API_KEY
os.environ["LANGCHAIN_PROJECT"] = "style-analyzer"

langsmith_client = Client()

class PixtralVisionService:
    """
    Fournit des méthodes pour interagir avec le modèle Pixtral LAage.
    """

    def __init__(self, temperature=0.2, top_p=0.6, max_tokens=2000):
        """
        Initialise le service avec le modèle et les paramètres spécifiés.

        Args:
            temperature (float): Contrôle l'aléa dans la génération
            top_p (float): Paramètre de nucleus sampling
            max_tokens (int): Nombre maximum de tokens dans la réponse
        """

        self.model = Mistral(api_key=config.MISTRALAI_API_KEY)
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.top_p = top_p

    @traceable(name="generate_fashion_response", run_type="llm")
    def generate_response(self, encoded_image, prompt):
        """
        Génère une réponse du modèle à partir d'une image et d'un prompt.

        Args:
            encoded_image (str): Chaîne image encodée en base64
            prompt (str): Prompt texte pour guider la réponse du modèle

        Returns:
            str: Réponse du modèle
        """
        try:
            logger.info("Envoi de la requête au LLM avec longueur du prompt : %d", len(prompt))

            model = config.MODEL_ID

            response = self.model.chat.complete(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": "data:image/jpeg;base64," + encoded_image,
                                }
                            }
                        ]
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                top_p=self.top_p
            )

            # Accéder au contenu via les attributs de l'objet
            content = response.choices[0].message.content
            usage = getattr(response, "usage", None)
            if usage:
                if isinstance(usage, dict):
                    prompt_tokens = usage.get("prompt_tokens") or usage.get("input_tokens")
                    completion_tokens = usage.get("completion_tokens") or usage.get("output_tokens")
                    total_tokens = usage.get("total_tokens")
                else:
                    prompt_tokens = getattr(usage, "prompt_tokens", None) or getattr(usage, "input_tokens", None)
                    completion_tokens = getattr(usage, "completion_tokens", None) or getattr(usage, "output_tokens", None)
                    total_tokens = getattr(usage, "total_tokens", None)
                if total_tokens is None and prompt_tokens is not None and completion_tokens is not None:
                    total_tokens = prompt_tokens + completion_tokens
                logger.info(
                    "Tokens - prompt: %s, completion: %s, total: %s",
                    prompt_tokens,
                    completion_tokens,
                    total_tokens,
                )
                run_tree = get_current_run_tree()
                if run_tree:
                    usage_payload = {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "total_tokens": total_tokens,
                    }
                    new_metadata = {
                        "llm_model": model,
                        "vision_model": config.VISION_MODEL_ID,
                        "token_usage": usage_payload,
                    }
                    if hasattr(run_tree, "add_metadata"):
                        run_tree.add_metadata(new_metadata)
                    elif isinstance(run_tree.metadata, dict):
                        run_tree.metadata.update(new_metadata)
                    if hasattr(run_tree, "add_outputs"):
                        run_tree.add_outputs({"usage": usage_payload})
                    elif isinstance(run_tree.outputs, dict):
                        run_tree.outputs.update({"usage": usage_payload})
            logger.info("Réponse reçue avec une longueur de : %d", len(content))

            # Vérifier si la réponse semble tronquée
            if len(content) >= 7900:  # Proche des limites courantes des modèles
                logger.warning("La réponse semble tronquée (longueur : %d)", len(content))

            return content

        except Exception as e:
            logger.error("Erreur lors de la génération de la réponse : %s", str(e))
            return f"Erreur lors de la génération de la réponse : {e}"

    def generate_fashion_response(
            self, user_image_base64, matched_rows, all_items, similarity_score, threshold=0.8
        ):
        """
        Génère une réponse spécifique à la mode en utilisant des prompts basés sur des rôles.

        Args:
            user_image_base64: Image utilisateur encodée en base64
            matched_row: La ligne la plus proche du dataset
            all_items: DataFrame avec tous les articles liés à l'image trouvée
            similarity_score: Score de similarité entre l'image utilisateur et l'image trouvée
            threshold: Similarité minimale pour considérer une correspondance exacte

        Returns:
            str: Réponse détaillée sur la mode
        """
        items_list = []
        for _, row in all_items.iterrows():
            item_str = f"{row['Item Name']} ({row['Price']}): {row['Link']}"
            items_list.append(item_str)

        # Joindre les articles avec des séparateurs clairs
        items_description = "\n".join([f"- {item}" for item in items_list])

        if similarity_score >= threshold:
          # Prompt simplifié focalisé sur l'analyse professionnel mode
          assistant_prompt = (
            "Tu réalises une analyse fashion."
            "Cette image montre des vêtements standards disponibles en magasin."
            "Concentre-toi exclusivement sur l'analyse mode professionnelle pour un détaillant textile."
            f"DÉTAILS DES ARTICLES (inclues toujours cette section dans votre réponse) :\n{items_description}\n\n"
            "Merci de :\n"
            "1. Identifier et décrire objectivement les vêtements (couleurs, motifs, matières)\n"
            "2. Catégoriser le style général (business, casual, etc.)\n"
            "3. Inclure la section DÉTAILS DES ARTICLES à la fin\n\n"
            "Cette analyse est destinée à un catalogue professionnel. Utilises un ton formel et descriptif.\n"
            "Et traduis les noms des articles similaires en français (mais pas les prix) plutôt que laisser les noms en anglais.\n"
          )
        else:
          # Prompt pour correspondance non-exacte
          assistant_prompt = (
            "Tu réalises une analyse fashion."
            "Cette image montre des vêtements standards disponibles en magasin."
            "Concentres-toi exclusivement sur l'analyse mode professionnelle pour un détaillant textile."
            f"ARTICLES SIMILAIRES (inclues toujours cette section dans votre réponse) :\n{items_description}\n\n"
            "Merci de :\n"
            "1. Préciser qu'il s'agit d'articles similaires mais pas forcément identiques\n"
            "2. Identifier objectivement les éléments vestimentaires (couleurs, motifs, matières)\n"
            "3. Inclure la section ARTICLES SIMILAIRES à la fin\n\n"
            "Cette analyse est destinée à un catalogue professionnel. Utilises un ton formel et descriptif.\n"
            "Et traduis les noms des articles similaires en français (mais pas les prix) plutôt que laisser les noms en anglais.\n"
          )
        # Envoyer le prompt au modèle
        response = self.generate_response(user_image_base64, assistant_prompt)

        # Vérifier si la réponse est incomplète
        if len(response) < 100:
            logger.info("La réponse semble incomplète, création d'une réponse basique")
            section_header = "DÉTAILS DES ARTICLES :" if similarity_score >= threshold else "ARTICLES SIMILAIRES :"
            response = f"# Analyse Mode\n\nCette tenue présente une sélection de pièces soigneusement coordonnées.\n\n{section_header}\n{items_description}"

        return response