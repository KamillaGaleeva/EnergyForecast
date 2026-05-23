import React, { useState, useEffect } from 'react';
import StatsCards from '../components/StatsCards';
import StatisticsCards from '../components/StatisticsCards';
import ConsumptionChart from '../components/ConsumptionChart';
import Loader from '../components/Loader';
import './Page.css';

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="page-transition">
                <Loader />
            </div>
        );
    }

    return (
        <div className="page-transition">
            <StatsCards />
            <StatisticsCards />  
            <ConsumptionChart />
        </div>
    );
};

export default DashboardPage;