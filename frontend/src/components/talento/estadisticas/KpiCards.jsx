import React from 'react';

const TrendIcon = ({ type }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {type === 'up' ? (
            <>
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
            </>
        ) : (
            <>
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
            </>
        )}
    </svg>
);

const KpiCards = ({ metrics }) => {
    const deltas = metrics.deltas || {};

    const cards = [
        {
            label: 'Total actividades',
            value: metrics.totalFormaciones,
            delta: deltas.formaciones,
            color: 'blue'
        },
        {
            label: 'Asistentes totales',
            value: metrics.totalAsistentes,
            delta: deltas.asistentes,
            color: 'green'
        },
        {
            label: 'Horas totales',
            value: metrics.totalHoras,
            delta: deltas.horas,
            color: 'orange'
        },
        {
            label: 'Promedio duración',
            value: metrics.promedioDuracion,
            color: 'purple'
        },
        {
            label: 'Promedio asistentes',
            value: metrics.promedioAsistentes,
            delta: deltas.promedioAsistentes,
            color: 'blue'
        }
    ];

    return (
        <div className="kpi-grid">
            {cards.map((card, index) => (
                <div key={index} className="kpi-card">
                    <div className="kpi-info" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span className="kpi-label" style={{ fontSize: '11px', textTransform: 'none' }}>{card.label}</span>
                            {card.delta !== undefined && card.delta !== 0 && (
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: card.delta > 0 ? '#16a34a' : '#dc2626',
                                    backgroundColor: card.delta > 0 ? '#f0fdf4' : '#fef2f2',
                                    padding: '2px 8px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <TrendIcon type={card.delta > 0 ? 'up' : 'down'} />
                                    {Math.abs(card.delta)}%
                                </span>
                            )}
                        </div>
                        <span className="kpi-value" style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{card.value}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KpiCards;
