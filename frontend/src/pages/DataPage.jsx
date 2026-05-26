import React, { useState, useEffect } from 'react';
import api, { getConsumptionData } from '../services/api';
import './DataPage.css';

const DataPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getConsumptionData();
                setData(response.data);
            } catch (error) {
                console.error('Ошибка загрузки:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCSVUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload-consumption', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadMessage(`✅ ${response.data.message}`);
            const newData = await getConsumptionData();
            setData(newData.data);
        } catch (error) {
            setUploadMessage('❌ Ошибка загрузки файла');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleString('ru-RU');

    if (loading) return <div className="loading">Загрузка данных...</div>;

    return (
        <div className="data-page">
            <div className="data-header">
                <h2>Данные потребления</h2>
                <div className="upload-csv-section">
                    <label className="upload-csv-btn">
                        📤 Загрузить CSV
                        <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} disabled={uploading} />
                    </label>
                    {uploading && <span className="upload-status">Загрузка...</span>}
                    {uploadMessage && <div className="upload-message">{uploadMessage}</div>}
                </div>
                <div className="filter-section">
                    <input type="date" placeholder="От" />
                    <input type="date" placeholder="До" />
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Дата и время</th>
                            <th>Потребление (кВт·ч)</th>
                            <th>Режим</th>
                            <th>Температура (°C)</th>
                            <th>Влажность (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id}>
                                <td>{formatDate(item.timestamp)}</td>
                                <td>{item.consumption_kwh}</td>
                                <td>{item.is_consumption ? 'Потребление' : 'Производство'}</td>
                                <td>{item.temperature || '-'}</td>
                                <td>{item.humidity || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataPage;
