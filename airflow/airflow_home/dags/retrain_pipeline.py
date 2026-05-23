from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
import sys
import os

sys.path.append('/opt/airflow/ml_pipeline')

from data_processor import process_new_data
from train import train_model, find_latest_data
from evaluate import compare_models

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'retrain_pipeline',
    default_args=default_args,
    description='Автоматическое дообучение модели',
    schedule_interval='0 2 * * *', 
    catchup=False,
    tags=['ml', 'retraining'],
)

def process_data_func(**context):
    """Оборачивает функцию process_new_data для использования в PythonOperator"""
    result = process_new_data()
    if not result:
        raise Exception("Нет новых данных для обработки")
    return "Данные обработаны"

process_task = PythonOperator(
    task_id='process_new_data',
    python_callable=process_data_func,
    dag=dag,
)

def train_func(**context):
    """Ищет последние обработанные данные и запускает обучение"""
    latest_data = find_latest_data()
    if latest_data is None:
        raise Exception("Нет данных для обучения")
    
    model_path, metrics = train_model(latest_data)
    context['task_instance'].xcom_push(key='model_path', value=str(model_path))
    return "Модель обучена"

train_task = PythonOperator(
    task_id='train_model',
    python_callable=train_func,
    dag=dag,
)

def evaluate_func(**context):
    """Сравнивает новую модель с текущей продакшн-моделью"""
    result = compare_models()
    return f"Результат сравнения: {result}"

evaluate_task = PythonOperator(
    task_id='evaluate_model',
    python_callable=evaluate_func,
    dag=dag,
)

notification_task = BashOperator(
    task_id='send_notification',
    bash_command='echo "Pipeline completed"',
    dag=dag,
)

process_task >> train_task >> evaluate_task >> notification_task