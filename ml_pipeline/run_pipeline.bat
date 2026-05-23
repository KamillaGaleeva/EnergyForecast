@echo off
echo Запуск ML пайплайна для дообучения модели
echo %date% %time%

cd /d E:\EnergyForecastFullStack\EnergyForecastFullStack

call venv\Scripts\activate

cd ml_pipeline

echo [%time%] Обработка новых данных
python data_processor.py
if %errorlevel% neq 0 (
    echo [%time%] Ошибка при обработке данных
    exit /b %errorlevel%
)

echo [%time%] Обучение модели
python train.py
if %errorlevel% neq 0 (
    echo [%time%] Ошибка при обучении
    exit /b %errorlevel%
)

echo [%time%] Сравнение моделей
python evaluate.py
if %errorlevel% neq 0 (
    echo [%time%] Ошибка при сравнении
    exit /b %errorlevel%
)

echo [%time%] Пайплайн успешно завершён
