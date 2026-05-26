from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import os
import csv
import io
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from pydantic import BaseModel
 
from . import models, schemas
from .database import engine, get_db
from .ml_model import predict as ml_predict, save_prediction_to_db
from .statistics import get_period_comparison
from .shap_explainer import explain_prediction
from .auth import get_password_hash, verify_password, create_access_token, get_current_user
from fastapi.middleware.cors import CORSMiddleware
 
load_dotenv()
 
models.Base.metadata.create_all(bind=engine)
 
app = FastAPI(title="Energy Forecast API")
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
  
@app.get("/")
def root():
    return {"message": "Energy Forecast API work good"}
 
@app.get("/health")
def health():
    return {"status": "ok", "database": "connected"}
 
 
class UserRegister(BaseModel):
    username: str
    password: str
    email: str = None
 
class UserLogin(BaseModel):
    username: str
    password: str
 
@app.post("/auth/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        created_at=datetime.now()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "message": "User created"}
 
@app.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
 
 
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(
        username=user.username,
        password_hash=get_password_hash(user.password)  
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
 
@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users
 
@app.get("/users/me", response_model=schemas.User)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user
 
 
@app.post("/consumption/", response_model=schemas.ConsumptionData)
def create_consumption_data(data: schemas.ConsumptionDataCreate, db: Session = Depends(get_db)):
    db_data = models.ConsumptionData(**data.dict())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data
 
@app.get("/consumption/", response_model=List[schemas.ConsumptionData])
def read_consumption_data(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    data = db.query(models.ConsumptionData).order_by(
        models.ConsumptionData.timestamp.desc()
    ).offset(skip).limit(limit).all()
    return data
 
 
@app.post("/models/", response_model=schemas.Model)
def create_model(model: schemas.ModelCreate, db: Session = Depends(get_db)):
    db_model = models.Model(**model.dict())
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model
 
@app.get("/models/", response_model=List[schemas.Model])
def read_models(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    models_list = db.query(models.Model).offset(skip).limit(limit).all()
    return models_list
 
 
@app.post("/predictions/", response_model=schemas.Prediction)
def create_prediction(prediction: schemas.PredictionCreate, db: Session = Depends(get_db)):
    db_prediction = models.Prediction(**prediction.dict())
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction
 
@app.get("/predictions/", response_model=List[schemas.Prediction])
def read_predictions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    predictions = db.query(models.Prediction)\
        .order_by(models.Prediction.timestamp.desc())\
        .offset(skip).limit(limit).all()
    return predictions
 
@app.get("/predictions/my", response_model=List[schemas.Prediction])
def read_my_predictions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    predictions = db.query(models.Prediction).filter(
        models.Prediction.user_id == current_user.id
    ).order_by(models.Prediction.timestamp.desc()).offset(skip).limit(limit).all()
    return predictions
 
@app.put("/predictions/{prediction_id}")
def update_actual_value(
    prediction_id: int,
    actual_value: float,
    db: Session = Depends(get_db)
):
    prediction = db.query(models.Prediction).filter(
        models.Prediction.id == prediction_id
    ).first()
    if not prediction:
        raise HTTPException(status_code=404, detail=f"Forecast with id {prediction_id} not found")
    prediction.actual_value = actual_value
    db.commit()
    return {
        "message": "actual_value обновлён",
        "id": prediction_id,
        "actual_value": actual_value
    }
 
 
def _get_or_create_model(db: Session) -> models.Model:
    """Возвращает первую запись модели или создаёт её."""
    model = db.query(models.Model).first()
    if not model:
        model = models.Model(
            model_name="CatBoost",
            model_type="catboost",
            model_version="15.17",
            file_path="models/catboost_model.cbm"
        )
        db.add(model)
        db.commit()
        db.refresh(model)
    return model
 
@app.post("/predict", response_model=schemas.PredictionResponse)
def predict_endpoint(
    request: schemas.PredictionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        features = request.dict()
        prediction = ml_predict(features)
        model = _get_or_create_model(db)
        save_prediction_to_db(
            db=db,
            model_id=model.id,
            predicted_value=prediction,
            user_id=current_user.id
        )
        return {"prediction": prediction, "model_version": "catboost_15.17"}
    except Exception as e:
        print(f"ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error model: {str(e)}")
 
@app.post("/explain")
def explain_endpoint(
    request: schemas.PredictionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)  
):
    try:
        features = request.dict()
        prediction = ml_predict(features)
        explanation = explain_prediction(features)
        model = _get_or_create_model(db)
        save_prediction_to_db(
            db=db,
            model_id=model.id,
            predicted_value=prediction,
            user_id=current_user.id  
        )
        return {
            "prediction": float(prediction),
            "explanation": explanation
        }
    except Exception as e:
        print(f"ERROR in /explain: {str(e)}")
        raise HTTPException(status_code=500, detail=f"SHAP error: {str(e)}")
 
 
@app.get("/model-metrics/{model_id}")
def get_model_metrics(model_id: int, db: Session = Depends(get_db)):
    from statsmodels.stats.stattools import durbin_watson
 
    predictions = db.query(models.Prediction)\
        .filter(
            models.Prediction.model_id == model_id,
            models.Prediction.actual_value.isnot(None)
        ).all()
 
    if not predictions:
        return {
            "model_id": model_id,
            "message": "There are no predictions with actual_value for this model"
        }
 
    y_true = np.array([p.actual_value for p in predictions])
    y_pred = np.array([p.predicted_value for p in predictions])
    n = len(y_true)
 
    mae = np.mean(np.abs(y_true - y_pred))
    mse = np.mean((y_true - y_pred) ** 2)
    rmse = np.sqrt(mse)
 
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
 
    p = 1
    r2_adj = 1 - (1 - r2) * (n - 1) / (n - p - 1) if n > p + 1 else r2
 
    mask = y_true > 0.1
    mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100 if np.any(mask) else None
 
    residuals = y_true - y_pred
    dw = durbin_watson(residuals)
 
    return {
        "model_id": model_id,
        "total_predictions": len(predictions),
        "metrics": {
            "MAE": round(mae, 4),
            "MSE": round(mse, 4),
            "RMSE": round(rmse, 4),
            "R2": round(r2, 4),
            "R2_adjusted": round(r2_adj, 4),
            "MAPE": round(mape, 4) if mape is not None else None,
            "Durbin_Watson": round(dw, 4)
        }
    }
 
 
@app.get("/statistics/comparison")
def get_statistics(db: Session = Depends(get_db)):
    return get_period_comparison(db)
 
 
@app.post("/chat", response_model=schemas.ChatResponse)
def chat(
    request: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if request.conversation_id is None:
        conversation = models.Conversation(
            user_id=current_user.id,
            title=request.message[:50]
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        conversation_id = conversation.id
    else:
        conversation_id = request.conversation_id
        conversation = db.query(models.Conversation).filter(
            models.Conversation.id == conversation_id,
            models.Conversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="The dialog was not found")
 
    user_message = models.Message(
        conversation_id=conversation_id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    db.commit()
 
    user_query = request.message.lower()
 
    if "привет" in user_query:
        reply = "Привет! Я твой ИИ-помощник. Спрашивай меня о прогнозах, метриках или SHAP."
    elif "прогноз" in user_query:
        reply = ("Прогноз строится на основе лагов (12, 24, 48, 72, 336 часов), "
                 "режима работы (потребление/производство) и погоды. "
                 "Лучшая модель — CatBoost (MAE = 107 МВт·ч).")
    elif "метрик" in user_query or "mae" in user_query or "r2" in user_query:
        reply = ("MAE (средняя ошибка) = 107.27 МВт·ч. "
                 "R² (качество модели) = 0.905. Ошибки почти нет.")
    elif "shap" in user_query or "шэп" in user_query:
        reply = ("SHAP показывает, какие признаки влияют на прогноз: "
                 "например, потребление 12ч назад или режим работы. "
                 "График SHAP можно посмотреть на странице 'Прогноз'.")
    elif "чат" in user_query or "бот" in user_query:
        reply = ("Я отвечаю на вопросы про прогнозы, метрики и SHAP. "
                 "Просто спроси меня о чём-то из этого!")
    else:
        reply = ("Я пока умею отвечать только про прогнозы, метрики (MAE, R²) и SHAP. "
                 "Что именно тебя интересует?")
 
    assistant_message = models.Message(
        conversation_id=conversation_id,
        role="assistant",
        content=reply
    )
    db.add(assistant_message)
    db.commit()
 
    return {"conversation_id": conversation_id, "reply": reply}
 
@app.get("/chat/conversations", response_model=List[schemas.ConversationResponse])
def get_conversations(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    conversations = db.query(models.Conversation).filter(
        models.Conversation.user_id == current_user.id
    ).order_by(models.Conversation.updated_at.desc()).offset(skip).limit(limit).all()
    return conversations
 
@app.get("/chat/conversations/{conversation_id}", response_model=schemas.ConversationResponse)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="The dialog was not found")
    return conversation
 
 
@app.post("/upload-actual")
async def upload_actual_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) 
):
    """
    Загружает CSV с реальными значениями и обновляет actual_value в прогнозах.
    CSV должен содержать колонки: timestamp, actual_value
    """
    contents = await file.read()
    csv_data = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(csv_data)
 
    updated_count = 0
    errors = []
 
    for row_num, row in enumerate(reader, start=2):
        try:
            timestamp = datetime.fromisoformat(row['timestamp'].replace('Z', '+00:00'))
            actual_value = float(row['actual_value'])
            prediction = db.query(models.Prediction).filter(
                models.Prediction.timestamp == timestamp
            ).order_by(models.Prediction.timestamp.desc()).first()
            if prediction:
                prediction.actual_value = actual_value
                updated_count += 1
            else:
                errors.append(f"Строка {row_num}: прогноз на {timestamp} не найден")
        except Exception as e:
            errors.append(f"Строка {row_num}: {str(e)}")
 
    db.commit()
    return {
        "updated": updated_count,
        "errors": errors,
        "message": f"Обновлено {updated_count} прогнозов"
    }
 
@app.post("/upload-consumption")
async def upload_consumption_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Загружает CSV с данными потребления.
    CSV должен содержать колонки: timestamp, consumption_kwh, is_consumption, temperature, humidity
    """
    contents = await file.read()
    csv_data = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(csv_data)
 
    added_count = 0
    errors = []
 
    for row_num, row in enumerate(reader, start=2):
        try:
            timestamp = datetime.fromisoformat(row['timestamp'].replace('Z', '+00:00'))
            new_data = models.ConsumptionData(
                timestamp=timestamp,
                consumption_kwh=float(row['consumption_kwh']),
                is_consumption=row.get('is_consumption', '1').lower() in ['1', 'true', 'yes'],
                temperature=float(row['temperature']) if row.get('temperature') else None,
                humidity=float(row['humidity']) if row.get('humidity') else None,
                created_at=datetime.now()
            )
            db.add(new_data)
            added_count += 1
        except Exception as e:
            errors.append(f"Строка {row_num}: {str(e)}")
 
    db.commit()
    return {
        "added": added_count,
        "errors": errors,
        "message": f"Добавлено {added_count} записей"
    }