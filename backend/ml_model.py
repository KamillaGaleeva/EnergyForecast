import os
import joblib
import pandas as pd
import numpy as np
from catboost import CatBoostRegressor
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from . import models

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "models/catboost_model.cbm")
FEATURES_PATH = os.getenv("FEATURES_PATH", "models/feature_list.pkl")

_model = None
_feature_names = None

def load_model():
    """Loads the CatBoost model and the list of features"""
    global _model, _feature_names
    
    if _model is None:
        print(f"Loading a model from {MODEL_PATH}...")
        _model = CatBoostRegressor()
        _model.load_model(MODEL_PATH)
        print("The model is loaded")
    
    if _feature_names is None:
        print(f"Loading features from {FEATURES_PATH}...")
        _feature_names = joblib.load(FEATURES_PATH)
        print(f"Uploaded {len(_feature_names)} features")
    
    return _model, _feature_names

def predict(features: dict):
    """
    Accepts a dictionary with attributes, returns a forecast
    """
    model, feature_names = load_model()
    
    input_df = pd.DataFrame(0.0, index=[0], columns=feature_names)
    
    for key, value in features.items():
        if key in feature_names:
            input_df[key] = value
    
    prediction = model.predict(input_df)[0]
    
    return float(prediction)

def save_prediction_to_db(
    db: Session,
    model_id: int,
    predicted_value: float,
    user_id: int,
    timestamp = None
):
    from datetime import datetime
    
    if timestamp is None:
        timestamp = datetime.now()
    
    db_prediction = models.Prediction(
        model_id=model_id,
        user_id=user_id,
        timestamp=timestamp,
        predicted_value=predicted_value,
        actual_value=None  
    )
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction