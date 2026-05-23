import React from 'react';
import { FiHome, FiDatabase, FiCpu, FiBarChart2, FiClock, FiMessageSquare, FiLogOut } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ||
            (path === '/dashboard' && location.pathname === '/');
    };

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="logo">
                <h2>📋 Панель управления</h2>
            </div>
            <ul className="nav-menu">
                <li className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
                    <FiHome className="icon" />
                    <span>Главная</span>
                </li>
                <li className={`nav-item ${isActive('/data') ? 'active' : ''}`} onClick={() => navigate('/data')}>
                    <FiDatabase className="icon" />
                    <span>Данные</span>
                </li>
                <li className={`nav-item ${isActive('/prediction') ? 'active' : ''}`} onClick={() => navigate('/prediction')}>
                    <FiCpu className="icon" />
                    <span>Прогноз</span>
                </li>
                <li className={`nav-item ${isActive('/metrics') ? 'active' : ''}`} onClick={() => navigate('/metrics')}>
                    <FiBarChart2 className="icon" />
                    <span>Метрики</span>
                </li>
                <li className={`nav-item ${isActive('/predictions-history') ? 'active' : ''}`} onClick={() => navigate('/predictions-history')}>
                    <FiClock className="icon" />
                    <span>История прогнозов</span>
                </li>
                <li className={`nav-item ${isActive('/chat') ? 'active' : ''}`} onClick={() => navigate('/chat')}>
                    <FiMessageSquare className="icon" />
                    <span>Чат</span>
                </li>
                <li className="nav-item logout" onClick={handleLogout}>
                    <FiLogOut className="icon" />
                    <span>Выйти</span>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;