import shap
import pandas as pd
import numpy as np
from .ml_model import load_model

_explainer = None
_model = None
_feature_names = None

def get_explainer():
    """Initialize the SHAP explainer for the model"""
    global _explainer, _model, _feature_names
    
    if _explainer is None:
        _model, _feature_names = load_model()
        _explainer = shap.TreeExplainer(_model)
        print("✅ SHAP explainer downdolad")
    
    return _explainer, _model, _feature_names

def explain_prediction(features: dict):
    """
    Accepts attributes, returns SHAP values for the forecast
    """
    explainer, model, feature_names = get_explainer()
    
    input_df = pd.DataFrame(0.0, index=[0], columns=feature_names)
    
    for key, value in features.items():
        if key in feature_names:
            input_df[key] = value
    
    shap_values = explainer.shap_values(input_df)
    
    if isinstance(shap_values, list):
        shap_values = shap_values[0]
    
    explanation = []
    for i, name in enumerate(feature_names):
        explanation.append({
            'feature': name,
            'value': float(input_df.iloc[0][name]),
            'shap_value': float(shap_values[0][i]) if len(shap_values.shape) > 1 else float(shap_values[i]),
            'importance': abs(float(shap_values[0][i])) if len(shap_values.shape) > 1 else abs(float(shap_values[i]))
        })
    
    explanation.sort(key=lambda x: x['importance'], reverse=True)
    
    return explanation