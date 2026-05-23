from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConsumptionDataBase(BaseModel):
    timestamp: datetime
    consumption_kwh: float
    is_consumption: bool
    temperature: Optional[float] = None
    humidity: Optional[float] = None

class ConsumptionDataCreate(ConsumptionDataBase):
    pass

class ConsumptionData(ConsumptionDataBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ModelBase(BaseModel):
    model_name: str
    model_type: str
    model_version: Optional[str] = None
    file_path: Optional[str] = None

class ModelCreate(ModelBase):
    pass

class Model(ModelBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PredictionBase(BaseModel):
    model_id: int
    timestamp: datetime
    predicted_value: float
    actual_value: Optional[float] = None

class PredictionCreate(PredictionBase):
    pass

class Prediction(PredictionBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ModelMetricBase(BaseModel):
    model_id: int
    metrics_date: date
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None
    mape: Optional[float] = None

class ModelMetricCreate(ModelMetricBase):
    pass

class ModelMetric(ModelMetricBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PredictionRequest(BaseModel):
    target_lag_12h: float = 0.0
    target_lag_48h: float = 0.0
    target_lag_336h: float = 0.0
    target_lag_72h: float = 0.0
    is_consumption: int = 1

class PredictionResponse(BaseModel):
    prediction: float
    model_version: str = "catboost_15.17"

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    title: Optional[str] = "new dialog"

class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str

class ChatResponse(BaseModel):
    conversation_id: int
    reply: str