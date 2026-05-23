import React from 'react';
import './StatsCards.css';

const StatsCards = () => {
    const stats = [
        { title: 'Всего потреблено', value: '2450 кВт·ч', icon: '⚡' },    
        { title: 'Прогноз', value: '2623 кВт·ч', icon: '📈' },             
        { title: 'Точность', value: '94.7%', icon: '🎯' },                 
        { title: 'RMSE', value: '120.3', icon: '📊' },                      
    ];

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