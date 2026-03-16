import React from 'react';

const TarjetasIndicadores = ({ metrics }) => {
    return (
        <div className="strategic-kpi-row">
            <div className="intel-kpi-card">
                <div>
                    <span className="kpi-label-discreet">Total actividades</span>
                    <span className="kpi-value-hero">{metrics.totalFormaciones}</span>
                </div>
            </div>
            <div className="intel-kpi-card">
                <div>
                    <span className="kpi-label-discreet">Asistentes totales</span>
                    <span className="kpi-value-hero">{metrics.totalAsistentes}</span>
                </div>
            </div>
            <div className="intel-kpi-card">
                <div>
                    <span className="kpi-label-discreet">Inversión horaria</span>
                    <span className="kpi-value-hero">{metrics.totalHoras}</span>
                </div>
            </div>
            <div className="intel-kpi-card">
                <div>
                    <span className="kpi-label-discreet">Horas de actividades internas</span>
                    <span className="kpi-value-hero">{metrics.horasInternas}h</span>
                </div>
            </div>
            <div className="intel-kpi-card">
                <div>
                    <span className="kpi-label-discreet">Horas de actividades externas</span>
                    <span className="kpi-value-hero">{metrics.horasExternas}h</span>
                </div>
            </div>
        </div>
    );
};

export default TarjetasIndicadores;
