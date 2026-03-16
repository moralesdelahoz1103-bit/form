import React from 'react';
import './SessionsFilters.css';

const SessionsFilters = ({
    filtros,
    handleFiltroChange,
    limpiarFiltros,
    tiposUnicos,
    facilitadoresUnicos,
    responsablesUnicos,
    dirigido_a_Unicos,
    modalidadesUnicas
}) => {
    const hayFiltrosActivos = filtros.busqueda || filtros.fecha || filtros.tipo || filtros.facilitador_entidad || filtros.responsable || filtros.dirigido_a || filtros.modalidad;

    return (
        <div className="filters-container">
            <div className="filters-grid">
                <div className="filter-field">
                    <label className="filter-label">Buscar por nombre</label>
                    <input
                        type="text"
                        value={filtros.busqueda}
                        onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                        className="filter-input"
                        placeholder="Buscar actividad..."
                    />
                </div>

                <div className="filter-field">
                    <label className="filter-label">Fecha</label>
                    <input
                        type="date"
                        value={filtros.fecha}
                        onChange={(e) => handleFiltroChange('fecha', e.target.value)}
                        className="filter-input"
                    />
                </div>

                <div className="filter-field">
                    <label className="filter-label">Actividad</label>
                    <select
                        value={filtros.tipo}
                        onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todas las actividades</option>
                        {tiposUnicos.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label className="filter-label">Facilitador / Empresa o entidad</label>
                    <select
                        value={filtros.facilitador_entidad}
                        onChange={(e) => handleFiltroChange('facilitador_entidad', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todos los facilitadores/entidades</option>
                        {facilitadoresUnicos.map(facilitador_entidad => (
                            <option key={facilitador_entidad} value={facilitador_entidad}>{facilitador_entidad}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label className="filter-label">Responsable</label>
                    <select
                        value={filtros.responsable}
                        onChange={(e) => handleFiltroChange('responsable', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todos los responsables</option>
                        {responsablesUnicos.map(responsable => (
                            <option key={responsable} value={responsable}>{responsable}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label className="filter-label">Tipo de actividad</label>
                    <select
                        value={filtros.dirigido_a || ''}
                        onChange={(e) => handleFiltroChange('dirigido_a', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todas</option>
                        {dirigido_a_Unicos.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label className="filter-label">Modalidad</label>
                    <select
                        value={filtros.modalidad || ''}
                        onChange={(e) => handleFiltroChange('modalidad', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todas</option>
                        {modalidadesUnicas.map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
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
    );
};

export default SessionsFilters;
