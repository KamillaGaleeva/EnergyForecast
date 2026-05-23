import React, { useState } from 'react';
import axios from 'axios';
import SHAPChart from '../components/SHAPChart';
import './PredictionPage.css';

const PredictionPage = () => {
    const [formData, setFormData] = useState({
        target_lag_12h: '',
        target_lag_48h: '',
        target_lag_336h: '',
        target_lag_72h: '',
        is_consumption: 1
    });
    const [prediction, setPrediction] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPrediction(null);
        setExplanation(null);

        try {
            const response = await axios.post('http://127.0.0.1:8000/explain', formData);
            setPrediction(response.data.prediction);
            setExplanation(response.data.explanation);
        } catch (error) {
            console.error('Ошибка прогноза:', error);
            alert('Ошибка при получении прогноза');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="prediction-page">
            <h2>Прогнозирование потребления</h2>

            <div className="prediction-container">
                <form onSubmit={handleSubmit} className="prediction-form">
                    <div className="form-group">
                        <label>Потребление 12ч назад (кВт·ч)</label>
                        <input
                            type="number"
                            name="target_lag_12h"
                            value={formData.target_lag_12h}
                            onChange={handleChange}
                            placeholder="например: 687.00"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Потребление 48ч назад (кВт·ч)</label>
                        <input
                            type="number"
                            name="target_lag_48h"
                            value={formData.target_lag_48h}
                            onChange={handleChange}
                            placeholder="например: 610.00"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Потребление 14 дней назад (кВт·ч)</label>
                        <input
                            type="number"
                            name="target_lag_336h"
                            value={formData.target_lag_336h}
                            onChange={handleChange}
                            placeholder="например: 12.00"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Потребление 72ч назад (кВт·ч)</label>
                        <input
                            type="number"
                            name="target_lag_72h"
                            value={formData.target_lag_72h}
                            onChange={handleChange}
                            placeholder="например: 560.00"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Режим работы</label>
                        <select
                            name="is_consumption"
                            value={formData.is_consumption}
                            onChange={handleChange}
                        >
                            <option value={1}>🏠 Потребление</option>
                            <option value={0}>☀️ Производство</option>
                        </select>
                    </div>

                    <button type="submit" className="predict-btn" disabled={loading}>
                        {loading ? '⏳ Загрузка...' : '🔮 Получить прогноз'}
                    </button>
                </form>

                {prediction && (
                    <div className="prediction-result">
                        <h3>Результат прогноза</h3>
                        <div className="result-card">
                            <span className="result-value">{prediction.toFixed(2)}</span>
                            <span className="result-unit">кВт·ч</span>
                        </div>
                    </div>
                )}
            </div>

            {explanation && <SHAPChart explanation={explanation} prediction={prediction} />}
        </div>
    );
};

export default PredictionPage;