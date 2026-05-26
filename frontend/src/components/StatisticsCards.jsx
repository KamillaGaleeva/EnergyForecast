import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiCalendar, FiClock, FiSun } from 'react-icons/fi';
import './StatisticsCards.css';

const StatisticsCards = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/statistics/comparison');
                setStats(response.data);
            } catch (error) {
                console.error('Ошибка загрузки статистики:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="stats-loading">Загрузка аналитики...</div>;
    if (!stats) return null;

    const periods = [
        {
            title: 'Месяц',
            icon: <FiCalendar />,
            current: stats.monthly.current,
            previous: stats.monthly.previous,
            diff: stats.monthly.difference,
            percent: stats.monthly.percent,
        },
        {
            title: 'Неделя',
            icon: <FiSun />,
            current: stats.weekly.current,
            previous: stats.weekly.previous,
            diff: stats.weekly.difference,
            percent: stats.weekly.percent,
        },
        {
            title: 'День',
            icon: <FiClock />,
            current: stats.daily.current,
            previous: stats.daily.previous,
            diff: stats.daily.difference,
            percent: stats.daily.percent,
        },
    ];

    return (
        <div className="statistics-section">
            <h3>📊 Сравнение периодов</h3>
            <div className="statistics-grid">
                {periods.map((period, index) => (
                    <div key={index} className="stat-period-card">
                        <div className="period-header">
                            <span className="period-icon">{period.icon}</span>
                            <h4>{period.title}</h4>
                        </div>
                        <div className="period-values">
                            <div className="value-row">
                                <span className="value-label">Текущий:</span>
                                <span className="value-number">{period.current.toLocaleString()} кВт·ч</span>
                            </div>
                            <div className="value-row">
                                <span className="value-label">Прошлый:</span>
                                <span className="value-number">{period.previous.toLocaleString()} кВт·ч</span>
                            </div>
                            <div className={`value-row change ${period.diff >= 0 ? 'positive' : 'negative'}`}>
                                <span className="value-label">Изменение:</span>
                                <span className="value-number">
                                    {period.diff >= 0 ? '▲' : '▼'} {Math.abs(period.diff).toLocaleString()} кВт·ч
                                    <span className="percent"> ({period.percent > 0 ? '+' : ''}{period.percent}%)</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatisticsCards;
