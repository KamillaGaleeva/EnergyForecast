# Energy Forecast — веб-сервис прогнозирования потребления электроэнергии

Веб-сервис для прогнозирования поведения потребителей электроэнергии с применением методов машинного обучения (CatBoost). Включает бэкенд на FastAPI, фронтенд на React, ML-пайплайн и автоматизацию через Apache Airflow.


## Структура проекта

```
EnergyForecastFullStack/
├── backend/          # FastAPI бэкенд
├── frontend/         # React фронтенд
├── ml_pipeline/      # Скрипты обучения модели
├── models/           # Сохранённые модели
├── airflow/          # DAG для переобучения
└── requirements.txt
```

## Установка и запуск

### 1. Клонировать репозиторий

```bash
git clone https://github.com/KamillaGaleeva/EnergyForecast.git
cd EnergyForecast
```

### 2. Создать и заполнить `.env`

```bash
cp .env.example .env
```

Заполнить значения в `.env` (данные БД, секретный ключ).

### 3. Установить зависимости Python

```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
```

### 4. Запустить PostgreSQL и создать базу данных

```sql
CREATE DATABASE energy_forecast;
```

### 5. Запустить бэкенд

```bash
cd backend
uvicorn main:app --reload
```

Бэкенд будет доступен по адресу: `http://127.0.0.1:8000`

Документация API: `http://127.0.0.1:8000/docs`

### 6. Запустить фронтенд

```bash
cd frontend
npm install
npm start
```

Фронтенд будет доступен по адресу: `http://localhost:3000`

## ML-пайплайн

Для обучения модели вручную:

```bash
cd ml_pipeline
python data_processor.py
python train.py
python evaluate.py
```

Или запустить через батник:

```bash
ml_pipeline\run_pipeline.bat
```

## Автоматическое переобучение (Airflow)

```bash
cd airflow
docker-compose up -d
```

Airflow UI: `http://localhost:8080`

DAG `retrain_pipeline` запускается каждый день в 02:00 и автоматически переобучает модель на новых данных.

## Основные возможности

- Прогнозирование потребления электроэнергии на основе лаговых признаков
- Объяснение прогнозов через SHAP-значения
- Загрузка данных через CSV
- История прогнозов с расчётом точности
- Сравнение периодов потребления
- Метрики модели: MAE, RMSE, R², MAPE, критерий Дарбина-Уотсона
- Тёмная и светлая темы
- ИИ-ассистент для вопросов о прогнозах
