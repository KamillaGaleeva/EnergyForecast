import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import DataPage from './pages/DataPage';
import PredictionPage from './pages/PredictionPage';
import MetricsPage from './pages/MetricsPage';
import PredictionsHistoryPage from './pages/PredictionsHistoryPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

const AppRouter = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [page, setPage] = useState('dashboard');

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
        window.location.href = '/dashboard';

    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    };

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    };

    if (!isAuthenticated) {
        return (
            <div className="app">
                <div className="main-content" style={{ marginLeft: 0 }}>
                    <div className="content">
                        <BrowserRouter>
                            <Routes>
                                <Route path="/login" element={<LoginPage onLogin={handleLogin} onNavigateToRegister={() => window.location.href = '/register'} />} />
                                <Route path="/register" element={<RegisterPage onRegister={() => window.location.href = '/login'} onNavigateToLogin={() => window.location.href = '/login'} />} />
                                <Route path="*" element={<Navigate to="/login" />} />
                            </Routes>
                        </BrowserRouter>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <BrowserRouter>
                <div className="app">
                    <Sidebar onLogout={handleLogout} />
                    <div className="main-content">
                        <div className="header">
                            <h1>⚡ Energy Forecast ⚡</h1>
                            <div className="theme-toggle" onClick={toggleTheme}>
                                <span>{isDark ? '☀️ Светлая' : '🌙 Тёмная'}</span>
                            </div>
                        </div>
                        <div className="content">
                            <Routes>
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/data" element={<DataPage />} />
                                <Route path="/prediction" element={<PredictionPage />} />
                                <Route path="/metrics" element={<MetricsPage />} />
                                <Route path="/predictions-history" element={<PredictionsHistoryPage />} />
                                <Route path="/chat" element={<ChatPage />} />
                                <Route path="*" element={<Navigate to="/dashboard" />} />
                            </Routes>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        </ThemeProvider>
    );
};

export default AppRouter;