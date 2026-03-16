import React from 'react';
import { MESES } from '../utils/constants';
import { BrandSpinner } from '../../../common';

const EncabezadoEstadisticas = ({ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, years, onExportExcel, exportLoading }) => {
    return (
        <header className="page-header">
            <div>
                <h1 className="page-title">Centro de reportes</h1>
                <p className="page-subtitle">Análisis consolidado para la toma de decisiones estratégicas</p>
            </div>
            <div className="global-controls-row">
                <div className="header-actions">
                    <button
                        title="Exportar"
                        className={`btn-exportar-excel ${exportLoading ? 'loading' : ''}`}
                        onClick={onExportExcel}
                        disabled={exportLoading}
                    >

                        {exportLoading ? (
                            <BrandSpinner size="xs" className="estadisticas-export-spinner" />
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        )}
                        <span>{exportLoading ? 'Exportando...' : 'Exportar excel'}</span>
                    </button>
                </div>
                <div className="filtro-discreto">
                    <label className="intel-label-label">Año</label>
                    <select
                        className="intel-select-clean"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="filtro-discreto">
                    <label className="intel-label-label">Mes</label>
                    <select
                        className="intel-select-clean"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="Todos">Todos los meses</option>
                        {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>
        </header>
    );
};

export default EncabezadoEstadisticas;
