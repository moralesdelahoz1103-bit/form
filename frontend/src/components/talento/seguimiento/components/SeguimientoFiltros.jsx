import React from 'react';
import { Button } from '../../../common';

const SeguimientoFiltros = ({
    esAdministrador,
    verGlobal,
    setVerGlobal,
    searchTerm,
    handleSearchChange
}) => {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Seguimiento personal FSD</h1>
                    <p className="page-subtitle">Consulta el historial completo de asistencias del personal de la fundación</p>

                    {esAdministrador && (
                        <div className="admin-view-selector" style={{ marginTop: '16px' }}>
                            <button
                                className={`admin-view-btn ${!verGlobal ? 'active' : ''}`}
                                onClick={() => setVerGlobal(false)}
                            >
                                Mis actividades
                            </button>
                            <button
                                className={`admin-view-btn ${verGlobal ? 'active' : ''}`}
                                onClick={() => setVerGlobal(true)}
                            >
                                Todas
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="seguimiento-controls">
                <div className="search-container">
                    <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o cédula..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>
        </>
    );
};

export default SeguimientoFiltros;
