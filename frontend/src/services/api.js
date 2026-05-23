import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8001';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getConsumptionData = () => {
    return api.get('/consumption/');
};

export const getPredictions = () => {
    return api.get('/predictions/');
};

export const getModelMetrics = (modelId = 1) => {
    return api.get(`/model-metrics/${modelId}`);
};

export const makePrediction = (data) => {
    return api.post('/predict', data);
};

export default api;