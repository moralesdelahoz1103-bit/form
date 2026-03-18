import React from 'react';
import { Button } from '../../../common';

const SeguimientoFiltros = ({
    esAdministrador,
    verGlobal,
    setVerGlobal,
    searchTerm,
    handleSearchChange,
    filtros,
    handleFiltroChange,
    limpiarFiltros,
    unidadesUnicas,
    cargosUnicos
}) => {
    const hayFiltrosActivos = searchTerm || filtros.cargo || filtros.unidad;

    return (
        <div className="seguimiento-header-filtros">
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

            <div className="filters-container">
                <div className="filters-grid">
                    <div className="filter-field">
                        <label className="filter-label">Buscar por nombre o cédula</label>
                        <div className="search-input-wrapper">
                            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Ej: Nicolas Ojeda o 12345..."
                                className="filter-input with-icon"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-field">
                        <label className="filter-label">Dirección</label>
                        <select
                            value={filtros.unidad}
                            onChange={(e) => handleFiltroChange('unidad', e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Todas las direcciones</option>
                            {unidadesUnicas.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-field">
                        <label className="filter-label">Cargo</label>
                        <select
                            value={filtros.cargo}
                            onChange={(e) => handleFiltroChange('cargo', e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Todos los cargos</option>
                            {cargosUnicos.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {hayFiltrosActivos && (
                    <button onClick={limpiarFiltros} className="clear-filters-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );
};

export default SeguimientoFiltros;
