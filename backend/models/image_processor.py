import numpy as np
import requests
import base64
import os
import torch
import torchvision.transforms as transforms
from torchvision.models import convnext_tiny, ConvNeXt_Tiny_Weights
from sklearn.metrics.pairwise import cosine_similarity
from io import BytesIO
from PIL import Image
import onnxruntime as ort
from pathlib import Path
from huggingface_hub import hf_hub_download
from langsmith.run_helpers import traceable, get_current_run_tree
import backend.models.config as config

class ImageProcessor:
    """
    Gère le traitement d'image, l'encodage et les comparaisons de similarité.
    """

    def __init__(
            self, image_size=(224, 224),
            norm_mean=[0.485, 0.456, 0.406],
            norm_std=[0.229, 0.224, 0.225]
        ):
        """
        Initialise le processeur d'image avec un modèle ConvNeXt-Tiny pré-entraîné.

        Args:
            image_size (tuple): Taille cible pour les images en entrée
            norm_mean (list): Valeurs moyennes de normalisation pour les canaux RGB
            norm_std (list): Écarts-types de normalisation pour les canaux RGB
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.root_dir = Path(__file__).resolve().parents[2]
        self.onnx_path = str(self.root_dir / "backend" / "models" / "convnext_tiny.onnx")
        self.use_onnx = bool(config.VISION_USE_ONNX)
        self.onnx_session = None

        weights = ConvNeXt_Tiny_Weights.IMAGENET1K_V1
        self.model = None
        if not self.use_onnx:
            self.model = convnext_tiny(weights=weights).to(self.device)
            self.model.eval()

        # Pipeline de prétraitement d'image
        self.preprocess = transforms.Compose([
            transforms.Resize(image_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=norm_mean, std=norm_std),
        ])

        if self.use_onnx:
            self._ensure_onnx_file()
            self._warmup_onnx()

    def _get_onnx_session(self):
        if self.onnx_session is None:
            self.onnx_session = ort.InferenceSession(self.onnx_path)
        return self.onnx_session

    def _ensure_onnx_file(self):
        if os.path.exists(self.onnx_path):
            return
        hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_TOKEN")
        local_dir = os.path.dirname(self.onnx_path)
        local_path = hf_hub_download(
            repo_id=config.VISION_MODEL_ONNX_REPO,
            filename=os.path.basename(self.onnx_path),
            token=hf_token,
            local_dir=local_dir,
            local_dir_use_symlinks=False,
        )
        os.makedirs(local_dir, exist_ok=True)
        if local_path != self.onnx_path:
            os.replace(local_path, self.onnx_path)

    def _warmup_onnx(self):
        session = self._get_onnx_session()
        input_name = session.get_inputs()[0].name
        dummy = np.zeros((1, 3, 224, 224), dtype=np.float32)
        session.run(None, {input_name: dummy})

    @traceable(name="convnext_tiny_encode", run_type="tool")
    def encode_image(self, image_input, is_url=True):
        """
        Encode une image et extrait son vecteur de caractéristiques.

        Args:
            image_input: URL ou chemin local de l'image
            is_url: Indique si l'entrée est une URL (True) ou un chemin local (False)

        Returns:
            dict: Contient la chaîne 'base64', le 'vector' ConvNeXt et le 'clip_vector'
        """
        try:
            if is_url:
                # Récupère l'image depuis l'URL
                response = requests.get(image_input)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content)).convert("RGB")
            else:
                # Charge l'image depuis un fichier local
                image = Image.open(image_input).convert("RGB")

            # Convertit l'image en Base64
            buffered = BytesIO()
            image.save(buffered, format="JPEG")
            base64_string = base64.b64encode(buffered.getvalue()).decode("utf-8")

            run_tree = get_current_run_tree()
            if run_tree:
                new_metadata = {
                    "vision_model": config.VISION_MODEL_ID,
                    "vision_model_weights": config.VISION_MODEL_WEIGHTS,
                }
                if hasattr(run_tree, "add_metadata"):
                    run_tree.add_metadata(new_metadata)
                elif isinstance(run_tree.metadata, dict):
                    run_tree.metadata.update(new_metadata)

            # Prétraitement ConvNeXt
            input_tensor = self.preprocess(image).unsqueeze(0)
            if self.use_onnx:
                session = self._get_onnx_session()
                input_name = session.get_inputs()[0].name
                outputs = session.run(None, {input_name: input_tensor.numpy().astype(np.float32)})
                feature_vector = np.array(outputs[0]).flatten()
            else:
                input_tensor = input_tensor.to(self.device)
                with torch.no_grad():
                    features = self.model(input_tensor)
                feature_vector = features.cpu().numpy().flatten()

            return {"base64": base64_string, "vector": feature_vector}
        except Exception as e:
            print(f"Erreur lors de l'encodage de l'image : {e}")
            return {"base64": None, "vector": None, "clip_vector": None}

    def find_closest_match(self, user_vector, dataset, metric='cosine', top_k=3):
        """
        Trouve les top_k correspondances les plus proches dans le jeu de données selon la métrique choisie.

        Args:
            user_vector: Vecteur de caractéristiques ConvNeXt de l'image utilisateur
            dataset: DataFrame contenant les vecteurs de caractéristiques pré-calculés
            metric: Métrique de similarité ('cosine' ou 'l2')
            top_k: Nombre de résultats les plus proches à retourner

        Returns:
            list: Liste de tuples (ligne, score de similarité) pour les top_k plus proches
        """
        try:
            # Filtrer les entrées avec des embeddings valides
            valid_dataset = dataset.dropna(subset=['Embedding'])
            dataset_vectors = np.vstack(valid_dataset['Embedding'].values)

            # Recherche initiale avec ConvNeXt
            if metric == 'cosine':
                similarities = cosine_similarity(user_vector.reshape(1, -1), dataset_vectors)
                # Récupérer plus de candidats pour le re-ranking
                initial_k = min(top_k * 3, len(valid_dataset))
                top_indices = np.argsort(similarities[0])[-initial_k:][::-1]
                top_scores = similarities[0][top_indices]

            # Préparer les candidats pour le re-ranking
            candidates = []
            for i, (idx, score) in enumerate(zip(top_indices, top_scores)):
                row = valid_dataset.iloc[idx]
                candidates.append((row, score, valid_dataset.index[idx]))

            results = candidates[:top_k]

            return results

        except Exception as e:
            print(f"Erreur lors de la recherche de la correspondance la plus proche : {e}")
            return []