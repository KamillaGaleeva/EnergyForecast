import React, { useState, useEffect } from 'react';
import { getModelMetrics } from '../services/api';
import './MetricsPage.css';

const MetricsPage = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noData, setNoData] = useState(false);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await getModelMetrics(1);
                if (response.data.message) {
                    setNoData(true);
                } else {
                    setMetrics(response.data.metrics);
                }
            } catch (error) {
                console.error('Ошибка загрузки метрик:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) return <div className="loading">Загрузка метрик...</div>;

    if (noData) return (
        <div className="metrics-page">
            <h2>Метрики модели</h2>
            <div className="metrics-info">
                <p>Нет данных для расчёта метрик. Загрузите фактические значения в разделе «История прогнозов».</p>
            </div>
        </div>
    );

    const metricItems = [
        { key: 'MAE', label: 'Средняя абсолютная ошибка', value: metrics?.MAE },
        { key: 'RMSE', label: 'Среднеквадратичная ошибка', value: metrics?.RMSE },
        { key: 'R2', label: 'Коэффициент детерминации (R²)', value: metrics?.R2 },
        { key: 'R2_adjusted', label: 'Скорректированный R²', value: metrics?.R2_adjusted },
        { key: 'MAPE', label: 'Средняя процентная ошибка', value: metrics?.MAPE },
        { key: 'Durbin_Watson', label: 'Критерий Дарбина-Уотсона', value: metrics?.Durbin_Watson },
    ];

    return (
        <div className="metrics-page">
            <h2>Метрики модели</h2>
            <div className="metrics-grid">
                {metricItems.map((metric) => (
                    <div key={metric.key} className="metric-card">
                        <h3>{metric.label}</h3>
                        <p className="metric-value">
                            {metric.value != null ? metric.value.toFixed(4) : '—'}
                        </p>
                    </div>
                ))}
            </div>
            <div className="metrics-info">
                <p>Метрики рассчитаны на основе исторических прогнозов</p>
            </div>
        </div>
    );
};

export default MetricsPage;
