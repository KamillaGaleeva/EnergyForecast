import React, { useState, useEffect } from 'react';
import { getPredictions } from '../services/api';
import Loader from '../components/Loader';
import './PredictionsHistoryPage.css';

const PredictionsHistoryPage = () => {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const response = await getPredictions();
                setPredictions(response.data);
            } catch (error) {
                console.error('Ошибка загрузки прогнозов:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPredictions();
    }, []);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/upload-actual', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();
            setUploadMessage(`✅ ${result.message}`);

            // Обновляем список прогнозов
            const predictionsResponse = await getPredictions();
            setPredictions(predictionsResponse.data);

        } catch (error) {
            setUploadMessage('❌ Ошибка загрузки файла');
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    if (loading) {
        return (
            <div className="page-transition">
                <Loader />
            </div>
        );
    }

    const totalWithActual = predictions.filter(p => p.actual_value !== null).length;

    return (
        <div className="page-transition predictions-page">
            <h2>История прогнозов</h2>

            {/* Кнопка загрузки CSV */}
            <div className="upload-section">
                <label className="upload-btn">
                    📤 Загрузить CSV с реальными значениями
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                </label>
                {uploading && <span className="upload-status">Загрузка...</span>}
                {uploadMessage && <div className="upload-message">{uploadMessage}</div>}
                <div className="upload-hint">
                    Формат CSV: timestamp,actual_value<br />
                    Пример: 2026-05-19 01:00:00,4100
                </div>
            </div>

            <div className="stats-summary">
                <div className="stat-badge">
                    <span>Всего прогнозов:</span>
                    <strong>{predictions.length}</strong>
                </div>
                <div className="stat-badge">
                    <span>С фактическими:</span>
                    <strong>{totalWithActual}</strong>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Дата и время</th>
                            <th>Прогноз (кВт·ч)</th>
                            <th>Факт (кВт·ч)</th>
                            <th>Ошибка</th>
                            <th>Точность</th>
                        </tr>
                    </thead>
                    <tbody>
                        {predictions.map((pred) => {
                            const error = pred.actual_value
                                ? Math.abs(pred.predicted_value - pred.actual_value).toFixed(2)
                                : '-';
                            const accuracy = pred.actual_value
                                ? ((1 - Math.abs(pred.predicted_value - pred.actual_value) / pred.actual_value) * 100).toFixed(1)
                                : '-';

                            return (
                                <tr key={pred.id} className={pred.actual_value ? 'has-actual' : ''}>
                                    <td>{pred.id}</td>
                                    <td>{formatDate(pred.timestamp)}</td>
                                    <td>{pred.predicted_value.toFixed(2)}</td>
                                    <td>{pred.actual_value?.toFixed(2) || '—'}</td>
                                    <td>{error}</td>
                                    <td>{accuracy !== '-' ? `${accuracy}%` : '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PredictionsHistoryPage;