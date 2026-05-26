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

const PERIOD_HOURS = { '24h': 24, '7d': 168, '30d': 720 };

const ConsumptionChart = () => {
    const [allConsumption, setAllConsumption] = useState([]);
    const [allPredictions, setAllPredictions] = useState([]);
    const [data, setData] = useState([]);
    const [period, setPeriod] = useState('24h');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [consumptionResponse, predictionsResponse] = await Promise.all([
                    getConsumptionData(),
                    getPredictions(),
                ]);
                setAllConsumption(consumptionResponse.data);
                setAllPredictions(predictionsResponse.data);
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!allConsumption.length && !allPredictions.length) return;

        const hours = PERIOD_HOURS[period];
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        const filtered = allConsumption.filter(
            item => new Date(item.timestamp) >= cutoff
        );
        const filteredPred = allPredictions.filter(
            item => new Date(item.timestamp) >= cutoff
        );

        const predMap = {};
        filteredPred.forEach(item => {
            predMap[item.timestamp] = item.predicted_value;
        });

        const chartData = filtered.map(item => ({
            label: period === '24h'
                ? new Date(item.timestamp).getHours().toString().padStart(2, '0') + ':00'
                : new Date(item.timestamp).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
            actual: item.consumption_kwh,
            forecast: predMap[item.timestamp] ?? null,
        }));

        setData(chartData);
    }, [period, allConsumption, allPredictions]);

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
                    {payload[1]?.value != null && (
                        <p style={{ margin: 0, color: '#FF6B6B' }}>Прогноз: {payload[1].value} кВт·ч</p>
                    )}
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="chart-container">Загрузка данных...</div>;

    return (
        <div className="chart-container">
            <h2>Потребление и прогноз</h2>
            <div className="period-selector">
                {[['24h', '24 часа'], ['7d', '7 дней'], ['30d', '30 дней']].map(([key, label]) => (
                    <button
                        key={key}
                        className={period === key ? 'active' : ''}
                        onClick={() => setPeriod(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#4CAF50" strokeWidth={2} dot={false} name="Факт" />
                    <Line type="monotone" dataKey="forecast" stroke="#FF6B6B" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Прогноз" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ConsumptionChart;
