import React, { useState } from 'react';
import './SHAPChart.css';

const featureTranslations = {
    'target_lag_12h': 'Потребление 12ч назад',
    'target_lag_24h': 'Потребление 24ч назад',
    'target_lag_48h': 'Потребление 2 дня назад',
    'target_lag_72h': 'Потребление 3 дня назад',
    'target_lag_168h': 'Потребление 7 дней назад',
    'target_lag_336h': 'Потребление 14 дней назад',
    'target_pct_change_24h': 'Изменение за сутки (%)',
    'is_consumption': 'Режим работы',
    'temperature': 'Температура',
    'humidity': 'Влажность',
    'hour_sin': 'Час суток',
    'hour_cos': 'Час суток',
    'month_sin': 'Месяц',
    'month_cos': 'Месяц',
};

const mergeFeatures = {
    'Час суток': ['hour_sin', 'hour_cos'],
    'Месяц': ['month_sin', 'month_cos'],
};

const mainFeatures = ['target_lag_12h', 'target_lag_48h', 'target_lag_336h', 'target_lag_72h', 'is_consumption'];
const otherFeatures = ['target_pct_change_24h', 'temperature', 'humidity', 'target_lag_168h', 'target_lag_24h'];

const typicalValues = {
    'target_lag_12h': 350,
    'target_lag_24h': 340,
    'target_lag_48h': 335,
    'target_lag_72h': 330,
    'target_lag_168h': 320,
    'target_lag_336h': 310,
    'target_pct_change_24h': 5,
    'temperature': 15,
    'humidity': 65,
    'is_consumption': 1,
};

const getColorIntensity = (value, isPositive) => {
    const intensity = Math.min(Math.abs(value) / 800, 0.5);
    if (isPositive) {
        return `rgba(255, 100, 100, ${0.1 + intensity * 0.25})`;
    } else {
        return `rgba(100, 200, 100, ${0.1 + intensity * 0.25})`;
    }
};

const SHAPChart = ({ explanation, prediction }) => {
    const [showAll, setShowAll] = useState(false);
    const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

    if (!explanation || explanation.length === 0) return null;

    const explanationMap = {};
    explanation.forEach(item => {
        explanationMap[item.feature] = item;
    });

    const mergedItems = [];
    const usedFeatures = new Set();

    for (const [groupName, features] of Object.entries(mergeFeatures)) {
        const existingFeatures = features.filter(f => explanationMap[f]);
        if (existingFeatures.length > 0) {
            const totalShap = existingFeatures.reduce((sum, f) => sum + explanationMap[f].shap_value, 0);
            const avgValue = existingFeatures.reduce((sum, f) => sum + explanationMap[f].value, 0) / existingFeatures.length;
            mergedItems.push({
                feature: groupName,
                shap_value: totalShap,
                value: avgValue,
                original: groupName
            });
            existingFeatures.forEach(f => usedFeatures.add(f));
        }
    }

    const regularItems = explanation.filter(item => !usedFeatures.has(item.feature));

    const mainItems = [];
    const otherItems = [];

    regularItems.forEach(item => {
        if (mainFeatures.includes(item.feature)) {
            mainItems.push(item);
        } else if (otherFeatures.includes(item.feature)) {
            otherItems.push(item);
        }
    });

    mergedItems.forEach(item => {
        if (mainFeatures.includes(item.original)) {
            mainItems.push(item);
        } else {
            otherItems.push(item);
        }
    });

    mainItems.sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value));
    otherItems.sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value));

    const getPercentEffect = (shapValue) => {
        if (!prediction || prediction === 0) return 0;
        return (Math.abs(shapValue) / prediction * 100).toFixed(1);
    };

    const getConclusion = () => {
        const positiveItems = mainItems.filter(item => item.shap_value > 0);
        const negativeItems = mainItems.filter(item => item.shap_value < 0);
        const maxPositive = positiveItems.length > 0 ? positiveItems.reduce((a, b) => a.shap_value > b.shap_value ? a : b) : null;
        const maxNegative = negativeItems.length > 0 ? negativeItems.reduce((a, b) => a.shap_value < b.shap_value ? a : b) : null;

        const formatName = (name) => `«${name}»`;

        if (maxPositive && maxNegative) {
            return `Прогноз получился выше из-за ${formatName(featureTranslations[maxPositive.feature] || maxPositive.feature)}, но ниже из-за ${formatName(featureTranslations[maxNegative.feature] || maxNegative.feature)}.`;
        } else if (maxPositive) {
            return `Прогноз получился выше в основном из-за ${formatName(featureTranslations[maxPositive.feature] || maxPositive.feature)}.`;
        } else if (maxNegative) {
            return `Прогноз получился ниже в основном из-за ${formatName(featureTranslations[maxNegative.feature] || maxNegative.feature)}.`;
        }
        return null;
    };

    const handleMouseEnter = (item, event) => {
        const typical = typicalValues[item.feature] || 0;
        const currentValue = item.value;
        const diffPercent = typical ? ((currentValue - typical) / typical * 100).toFixed(1) : 0;
        const direction = currentValue > typical ? 'выше' : 'ниже';

        let tooltipText = `${featureTranslations[item.feature] || item.feature}: ${currentValue.toFixed(1)}`;
        if (typical) {
            tooltipText += `\nОбычно: ${typical.toFixed(1)} (${direction} на ${Math.abs(diffPercent)}%)`;
        }
        tooltipText += `\nВлияние: ${item.shap_value > 0 ? 'увеличивает' : 'уменьшает'} прогноз на ${Math.abs(item.shap_value).toFixed(0)} кВт·ч`;

        setTooltip({
            visible: true,
            text: tooltipText,
            x: event.clientX + 15,
            y: event.clientY + 15
        });
    };

    const handleMouseLeave = () => {
        setTooltip({ visible: false, text: '', x: 0, y: 0 });
    };

    const renderItem = (item) => {
        const isPositive = item.shap_value > 0;
        const percentEffect = getPercentEffect(item.shap_value);
        const backgroundColor = getColorIntensity(item.shap_value, isPositive);
        const displayName = featureTranslations[item.feature] || item.feature;

        return (
            <div
                key={item.feature}
                className="shap-item"
                style={{ backgroundColor }}
                onMouseEnter={(e) => handleMouseEnter(item, e)}
                onMouseLeave={handleMouseLeave}
            >
                <div className="shap-item-name">{displayName}</div>
                <div className="shap-item-value">{item.value.toFixed(1)}</div>
                <div className="shap-item-effect">
                    {isPositive ? '▲' : '▼'} {Math.abs(item.shap_value).toFixed(0)}
                    <span className="shap-item-percent">({percentEffect}%)</span>
                </div>
            </div>
        );
    };

    return (
        <div className="shap-container">
            <div className="shap-header">
                <h3>Почему такой прогноз?</h3>
                <div className="shap-prediction">
                    <span className="prediction-label">Прогноз</span>
                    <span className="prediction-value">{prediction?.toFixed(0)}</span>
                    <span className="prediction-unit">кВт·ч</span>
                </div>
            </div>

            <div className="shap-main-list">
                {mainItems.map(renderItem)}
            </div>

            {getConclusion() && (
                <div className="shap-conclusion">
                    💡 {getConclusion()}
                </div>
            )}

            {otherItems.length > 0 && (
                <div className="shap-other-section">
                    <button
                        className="shap-toggle-btn"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? '▼ Скрыть остальное' : '▶ Показать остальное'} ({otherItems.length})
                    </button>

                    {showAll && (
                        <div className="shap-other-list">
                            {otherItems.map(renderItem)}
                        </div>
                    )}
                </div>
            )}

            <div className="shap-footer">
                <div className="legend-dot positive-dot"></div>
                <span>увеличивает</span>
                <div className="legend-dot negative-dot"></div>
                <span>уменьшает</span>
                <div className="legend-info">наведите → подробнее</div>
            </div>

            {tooltip.visible && (
                <div className="shap-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
                    {tooltip.text.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SHAPChart;