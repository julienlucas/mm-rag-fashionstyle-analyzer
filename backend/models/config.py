import os
from dotenv import load_dotenv

load_dotenv()

MISTRALAI_API_KEY = os.getenv("MISTRALAI_API_KEY")
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")

MODEL_ID = "pixtral-large-latest"
# MODEL_ID = "pixtral-12b-2409"
VISION_MODEL_ID = "convnext_tiny"
VISION_MODEL_WEIGHTS = "imagenet1k_v1"

# Image processing settings
IMAGE_SIZE = (224, 224)
NORMALIZATION_MEAN = [0.485, 0.456, 0.406]
NORMALIZATION_STD = [0.229, 0.224, 0.225]

# Default similarity threshold
SIMILARITY_THRESHOLD = 0.8

# Number of alternatives to return from search
DEFAULT_ALTERNATIVES_COUNT = 5
