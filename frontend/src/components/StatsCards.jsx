import React, { useState, useEffect } from 'react';
import { getConsumptionData, getPredictions, getModelMetrics } from '../services/api';
import './StatsCards.css';

const StatsCards = () => {
    const [stats, setStats] = useState([
        { title: 'Всего потреблено', value: '—', icon: '⚡' },
        { title: 'Прогноз', value: '—', icon: '📈' },
        { title: 'Точность (R²)', value: '—', icon: '🎯' },
        { title: 'RMSE', value: '—', icon: '📊' },
    ]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [consumptionRes, predictionsRes, metricsRes] = await Promise.allSettled([
                    getConsumptionData(),
                    getPredictions(),
                    getModelMetrics(1),
                ]);

                const totalConsumed = consumptionRes.status === 'fulfilled'
                    ? consumptionRes.value.data.reduce((sum, item) => sum + item.consumption_kwh, 0)
                    : null;

                const latestPrediction = predictionsRes.status === 'fulfilled' && predictionsRes.value.data.length > 0
                    ? predictionsRes.value.data[0].predicted_value
                    : null;

                const metrics = metricsRes.status === 'fulfilled' && metricsRes.value.data.metrics
                    ? metricsRes.value.data.metrics
                    : null;

                setStats([
                    {
                        title: 'Всего потреблено',
                        value: totalConsumed != null ? `${totalConsumed.toFixed(0)} кВт·ч` : '—',
                        icon: '⚡',
                    },
                    {
                        title: 'Последний прогноз',
                        value: latestPrediction != null ? `${latestPrediction.toFixed(0)} кВт·ч` : '—',
                        icon: '📈',
                    },
                    {
                        title: 'Точность (R²)',
                        value: metrics?.R2 != null ? `${(metrics.R2 * 100).toFixed(1)}%` : '—',
                        icon: '🎯',
                    },
                    {
                        title: 'RMSE',
                        value: metrics?.RMSE != null ? metrics.RMSE.toFixed(2) : '—',
                        icon: '📊',
                    },
                ]);
            } catch (error) {
                console.error('Ошибка загрузки статистики:', error);
            }
        };

        fetchAll();
    }, []);

    return (
        <div className="stats-grid">
            {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-info">
                        <h3>{stat.title}</h3>
                        <p>{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsCards;
