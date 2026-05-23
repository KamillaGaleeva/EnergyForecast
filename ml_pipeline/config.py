import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_NEW_DIR = BASE_DIR / "data" / "new"
DATA_PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"
PROD_MODEL_PATH = MODELS_DIR / "prod" / "catboost_model.cbm"
PROD_MODEL_DIR = MODELS_DIR / "prod"

TEST_SIZE = 0.2
RANDOM_STATE = 42
N_ESTIMATORS = 1000
LEARNING_RATE = 0.05
MAX_DEPTH = 8

COMPARISON_METRIC = "weighted"  

METRIC_WEIGHTS = {
    'mae': 0.3,
    'rmse': 0.3,
    'r2': 0.4
}

os.makedirs(DATA_NEW_DIR, exist_ok=True)
os.makedirs(DATA_PROCESSED_DIR, exist_ok=True)
os.makedirs(PROD_MODEL_DIR, exist_ok=True)