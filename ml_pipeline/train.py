import pandas as pd
import numpy as np
from catboost import CatBoostRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import sys
from pathlib import Path
from datetime import datetime
import glob

sys.path.append(str(Path(__file__).parent.parent))
from ml_pipeline.config import (
    DATA_PROCESSED_DIR, MODELS_DIR, TEST_SIZE, RANDOM_STATE,
    N_ESTIMATORS, LEARNING_RATE, MAX_DEPTH
)

def find_latest_data():
    """Finds the most recently processed file"""
    parquet_files = glob.glob(str(DATA_PROCESSED_DIR / "*.parquet"))
    if not parquet_files:
        return None
    return max(parquet_files, key=lambda f: Path(f).stat().st_mtime)

def train_model(data_path):
    """
    Trains the model on new data
    """
    print(f"[{datetime.now()}] start to train the model...")
    
    df = pd.read_parquet(data_path)
    print(f"Lines uploaded: {len(df)}")
    
    target_col = 'consumption_kwh'
    
    exclude = ['timestamp', 'consumption_kwh', 'id']
    feature_cols = [col for col in df.columns if col not in exclude]
    
    X = df[feature_cols]
    y = df[target_col]
    
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, shuffle=False
    )
    
    print(f"Train: {X_train.shape}")
    print(f"Val: {X_val.shape}")
    
    model = CatBoostRegressor(
        iterations=N_ESTIMATORS,
        learning_rate=LEARNING_RATE,
        depth=MAX_DEPTH,
        loss_function='MAE',
        eval_metric='MAE',
        random_seed=RANDOM_STATE,
        verbose=100,
        early_stopping_rounds=50
    )
    
    model.fit(
        X_train, y_train,
        eval_set=(X_val, y_val)
    )
    
    y_pred = model.predict(X_val)
    
    metrics = {
        'mae': mean_absolute_error(y_val, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_val, y_pred)),
        'r2': r2_score(y_val, y_pred),
        'timestamp': datetime.now().isoformat()
    }
    
    print(f"MAE: {metrics['mae']:.2f}")
    print(f"RMSE: {metrics['rmse']:.2f}")
    print(f"R²: {metrics['r2']:.4f}")
    
    model_path = MODELS_DIR / f"new_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.cbm"
    model.save_model(str(model_path))
    
    metrics_path = model_path.with_suffix('.json')
    joblib.dump(metrics, metrics_path)
    
    print(f"The model is saved: {model_path}")
    
    return model_path, metrics

if __name__ == "__main__":
    latest_data = find_latest_data()
    if latest_data:
        train_model(latest_data)
    else:
        print("No training data available")