# backend/statistics.py
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from . import models

def get_period_comparison(db: Session):
    """Comparative consumption over different periods"""
    
    today = datetime.now().date()
    
    current_month_start = today.replace(day=1)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = current_month_start - timedelta(days=1)
    
    current_month = db.query(func.sum(models.ConsumptionData.consumption_kwh))\
        .filter(
            models.ConsumptionData.timestamp >= current_month_start,
            models.ConsumptionData.timestamp < today + timedelta(days=1)
        ).scalar() or 0
    
    last_month = db.query(func.sum(models.ConsumptionData.consumption_kwh))\
        .filter(
            models.ConsumptionData.timestamp >= last_month_start,
            models.ConsumptionData.timestamp <= last_month_end
        ).scalar() or 0
    
    week_ago = today - timedelta(days=7)
    two_weeks_ago = today - timedelta(days=14)
    
    last_7_days = db.query(func.sum(models.ConsumptionData.consumption_kwh))\
        .filter(
            models.ConsumptionData.timestamp >= week_ago,
            models.ConsumptionData.timestamp < today + timedelta(days=1)
        ).scalar() or 0
    
    previous_7_days = db.query(func.sum(models.ConsumptionData.consumption_kwh))\
        .filter(
            models.ConsumptionData.timestamp >= two_weeks_ago,
            models.ConsumptionData.timestamp < week_ago
        ).scalar() or 0
    
    yesterday = today - timedelta(days=1)
    day_before = today - timedelta(days=2)
    
    yesterday_val = db.query(func.sum(models.ConsumptionData.consumption_kwh))\
        .filter(
            models.ConsumptionData.timestamp >= yesterday,
            models.ConsumptionData.timestamp < today
        ).scalar() or 0
    
    day_before_val = db.query(func.sum(models.ConsumptionData.consumption_kwh))\
        .filter(
            models.ConsumptionData.timestamp >= day_before,
            models.ConsumptionData.timestamp < yesterday
        ).scalar() or 0
    
    return {
        "monthly": {
            "current": round(current_month, 2),
            "previous": round(last_month, 2),
            "difference": round(current_month - last_month, 2),
            "percent": round(((current_month - last_month) / last_month * 100), 1) if last_month else 0
        },
        "weekly": {
            "current": round(last_7_days, 2),
            "previous": round(previous_7_days, 2),
            "difference": round(last_7_days - previous_7_days, 2),
            "percent": round(((last_7_days - previous_7_days) / previous_7_days * 100), 1) if previous_7_days else 0
        },
        "daily": {
            "current": round(yesterday_val, 2),
            "previous": round(day_before_val, 2),
            "difference": round(yesterday_val - day_before_val, 2),
            "percent": round(((yesterday_val - day_before_val) / day_before_val * 100), 1) if day_before_val else 0
        }
    }