import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { getConsumptionData, getPredictions } from '../services/api';
import './ConsumptionChart.css';

const ConsumptionChart = () => {
    const [data, setData] = useState([]);
    const [period, setPeriod] = useState('24h');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const consumptionResponse = await getConsumptionData();
                const predictionsResponse = await getPredictions();

                const consumptionMap = {};
                consumptionResponse.data.forEach(item => {
                    const date = new Date(item.timestamp);
                    const hour = date.getHours().toString().padStart(2, '0') + ':00';
                    consumptionMap[hour] = item.consumption_kwh;
                });

                const forecastMap = {};
                predictionsResponse.data.forEach(item => {
                    const date = new Date(item.timestamp);
                    const hour = date.getHours().toString().padStart(2, '0') + ':00';
                    forecastMap[hour] = item.predicted_value;
                });

                const chartData = [];
                for (let i = 0; i < 24; i++) {
                    const hour = i.toString().padStart(2, '0') + ':00';
                    chartData.push({
                        hour,
                        actual: consumptionMap[hour] || 0,
                        forecast: forecastMap[hour] || 0,
                    });
                }

                setData(chartData);
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [period]); 

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                }}>
                    <p style={{ margin: 0, color: '#2c3e50' }}>Время: {label}</p>
                    <p style={{ margin: 0, color: '#4CAF50' }}>Факт: {payload[0]?.value} кВт·ч</p>
                    <p style={{ margin: 0, color: '#FF6B6B' }}>Прогноз: {payload[1]?.value} кВт·ч</p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return <div className="chart-container">Загрузка данных...</div>;
    }

    return (
        <div className="chart-container">
            <h2>Потребление и прогноз</h2>
            <div className="period-selector">
                <button
                    className={period === '24h' ? 'active' : ''}
                    onClick={() => setPeriod('24h')}
                >
                    24 часа
                </button>
                <button
                    className={period === '7d' ? 'active' : ''}
                    onClick={() => setPeriod('7d')}
                >
                    7 дней
                </button>
                <button
                    className={period === '30d' ? 'active' : ''}
                    onClick={() => setPeriod('30d')}
                >
                    30 дней
                </button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#4CAF50"
                        strokeWidth={2}
                        dot={false}
                        name="Факт"
                    />
                    <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#FF6B6B"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Прогноз"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ConsumptionChart;