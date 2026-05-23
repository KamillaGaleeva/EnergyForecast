import pandas as pd
import numpy as np
from catboost import CatBoostRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import sys
from pathlib import Path
from datetime import datetime
import glob
import shutil

sys.path.append(str(Path(__file__).parent.parent))
from ml_pipeline.config import PROD_MODEL_PATH, MODELS_DIR, COMPARISON_METRIC, METRIC_WEIGHTS

def load_model(model_path):
    """Loads CatBoost model"""
    model = CatBoostRegressor()
    model.load_model(str(model_path))
    return model

def get_validation_data():
    """
    Loads fresh data for validation
    """
    processed_files = glob.glob(str(MODELS_DIR.parent / "data/processed/*.parquet"))
    if not processed_files:
        return None
    
    latest_data = max(processed_files, key=lambda f: Path(f).stat().st_mtime)
    df = pd.read_parquet(latest_data)
    
    split_idx = int(len(df) * 0.8)
    val_df = df.iloc[split_idx:]
    
    exclude = ['timestamp', 'consumption_kwh', 'id']
    feature_cols = [col for col in val_df.columns if col not in exclude]
    
    X_val = val_df[feature_cols]
    y_val = val_df['consumption_kwh']
    
    return X_val, y_val

def calculate_metrics(model, X_val, y_val):
    """Calculates metrics for model"""
    y_pred = model.predict(X_val)
    
    return {
        'mae': mean_absolute_error(y_val, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_val, y_pred)),
        'r2': r2_score(y_val, y_pred)
    }

def is_new_model_better(prod_metrics, new_metrics, method="weighted"):
    """
    Compares models using different strategies
    """
    if method == "mae":
        return new_metrics['mae'] < prod_metrics['mae']
    
    elif method == "rmse":
        return new_metrics['rmse'] < prod_metrics['rmse']
    
    elif method == "r2":
        return new_metrics['r2'] > prod_metrics['r2']
    
    elif method == "weighted":
        mae_ratio = prod_metrics['mae'] / new_metrics['mae']
        rmse_ratio = prod_metrics['rmse'] / new_metrics['rmse']
        r2_ratio = new_metrics['r2'] / prod_metrics['r2']
        
        score = (
            METRIC_WEIGHTS['mae'] * mae_ratio +
            METRIC_WEIGHTS['rmse'] * rmse_ratio +
            METRIC_WEIGHTS['r2'] * r2_ratio
        )
        
        return score > 1.0
    
    elif method == "majority":
        votes = 0
        votes += 1 if new_metrics['mae'] < prod_metrics['mae'] else 0
        votes += 1 if new_metrics['rmse'] < prod_metrics['rmse'] else 0
        votes += 1 if new_metrics['r2'] > prod_metrics['r2'] else 0
        
        return votes >= 2
    
    else:
        return new_metrics['mae'] < prod_metrics['mae']

def compare_models():
    """
    Compares new model with production model
    """
    print(f"[{datetime.now()}] Starting model comparison...")
    
    new_models = glob.glob(str(MODELS_DIR / "new_model_*.cbm"))
    if not new_models:
        print("No new models to compare")
        return None
    
    latest_new_model = max(new_models, key=lambda f: Path(f).stat().st_mtime)
    
    if not PROD_MODEL_PATH.exists():
        print("No production model found, new model becomes production")
        shutil.copy(latest_new_model, PROD_MODEL_PATH)
        return "new_becomes_prod"
    
    X_val, y_val = get_validation_data()
    if X_val is None:
        print("No validation data available")
        return None
    
    prod_model = load_model(PROD_MODEL_PATH)
    new_model = load_model(latest_new_model)
    
    prod_metrics = calculate_metrics(prod_model, X_val, y_val)
    new_metrics = calculate_metrics(new_model, X_val, y_val)
    
    print("\n Metrics comparison:")
    print(f"{'Metric':<10} {'Production':<15} {'New':<15} {'Better'}")
    print("-" * 50)
    
    for metric in ['mae', 'rmse', 'r2']:
        prod_val = prod_metrics[metric]
        new_val = new_metrics[metric]
        
        if metric == 'r2':
            better = new_val > prod_val
        else:
            better = new_val < prod_val
        
        better_str = "yes" if better else "no"
        print(f"{metric:<10} {prod_val:<15.4f} {new_val:<15.4f} {better_str}")
    
    is_better = is_new_model_better(prod_metrics, new_metrics, COMPARISON_METRIC)
    
    if is_better:
        print(f"\n New model is better by '{COMPARISON_METRIC}' strategy! Updating production...")
        
        archive_name = PROD_MODEL_PATH.parent / f"archive_{datetime.now().strftime('%Y%m%d_%H%M%S')}.cbm"
        shutil.move(PROD_MODEL_PATH, archive_name)
        
        shutil.copy(latest_new_model, PROD_MODEL_PATH)
        
        print(f"Old model archived to: {archive_name}")
        print(f"New model set as production: {PROD_MODEL_PATH}")
        
        return "new_better"
    else:
        print(f"\n New model is worse by '{COMPARISON_METRIC}' strategy. Keeping current production model.")
        return "prod_better"

if __name__ == "__main__":
    result = compare_models()
    print(f"Result: {result}")