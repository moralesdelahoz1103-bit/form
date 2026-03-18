import React from 'react';
import { usePermisos } from '../../../utils/permisos';
import { formatters } from '../../../utils/formatters';
import { Loading, Button } from '../../common';
import { useSeguimientoData } from './hooks/useSeguimientoData';
import SeguimientoFiltros from './components/SeguimientoFiltros';
import SeguimientoDrawer from './components/SeguimientoDrawer';
import './Seguimiento.css';

const Seguimiento = () => {
    const { esAdministrador } = usePermisos();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userEmail = userInfo.email;

    const {
        loading,
        searchTerm,
        handleSearchChange,
        selectedParticipante,
        setSelectedParticipante,
        detalle,
        loadingDetalle,
        error,
        verGlobal,
        setVerGlobal,
        currentPage,
        totalPages,
        indexOfFirstItem,
        indexOfLastItem,
        currentParticipantes,
        filteredParticipantes,
        handlePageChange,
        handleVerDetalle,
        exportarHistorialIndividual,
        fetchParticipantes,
        filtros,
        handleFiltroChange,
        limpiarFiltros,
        unidadesUnicas,
        cargosUnicos
    } = useSeguimientoData(esAdministrador, userEmail);

    if (loading) return <Loading />;

    return (
        <div className="seguimiento-container">
            <SeguimientoFiltros
                esAdministrador={esAdministrador}
                verGlobal={verGlobal}
                setVerGlobal={setVerGlobal}
                searchTerm={searchTerm}
                handleSearchChange={handleSearchChange}
                filtros={filtros}
                handleFiltroChange={handleFiltroChange}
                limpiarFiltros={limpiarFiltros}
                unidadesUnicas={unidadesUnicas}
                cargosUnicos={cargosUnicos}
            />

            {error && !loading && (
                <div className="seguimiento-error">
                    <div className="error-message">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{error}</span>
                    </div>
                    <Button onClick={fetchParticipantes} variant="secondary">Reintentar carga</Button>
                </div>
            )}

            <div className="table-wrapper">
                <table className="participantes-table">
                    <thead>
                        <tr>
                            <th>Participante</th>
                            <th style={{ textAlign: 'center' }}>Sesiones</th>
                            <th>Última asistencia</th>
                            <th>Cargo</th>
                            <th>Dirección</th>
                            <th style={{ textAlign: 'center' }}>Excel</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentParticipantes.map(p => (
                            <tr key={p.cedula} onClick={() => handleVerDetalle(p)}>
                                <td>
                                    <div>{p.nombre}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>C.C. {p.cedula}</div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className="badge-count" style={{ fontSize: '14px', padding: '4px 12px' }}>{p.total_asistencias}</span>
                                </td>
                                <td>{formatters.fechaCorta(p.ultima_asistencia)}</td>
                                <td>
                                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{p.cargo}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.correo || 'N/A'}</div>
                                </td>
                                <td>{p.unidad || 'N/A'}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        onClick={(e) => exportarHistorialIndividual(e, p)}
                                        className="btn-export-individual"
                                        title="Exportar historial"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredParticipantes.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    No se encontraron participantes que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="pagination-container">
                    <div className="pagination-info">
                        Mostrando <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredParticipantes.length)}</strong> de <strong>{filteredParticipantes.length}</strong> asistentes
                    </div>
                    <div className="pagination-controls">
                        <button
                            className="pagination-btn"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            title="Anterior"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>

                        <div className="pagination-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => {
                                // Lógica para mostrar solo algunas páginas si hay muchas
                                if (
                                    number === 1 ||
                                    number === totalPages ||
                                    (number >= currentPage - 1 && number <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={number}
                                            className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                                            onClick={() => handlePageChange(number)}
                                        >
                                            {number}
                                        </button>
                                    );
                                } else if (
                                    number === currentPage - 2 ||
                                    number === currentPage + 2
                                ) {
                                    return <span key={number} className="pagination-ellipsis">...</span>;
                                }
                                return null;
                            })}
                        </div>

                        <button
                            className="pagination-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            title="Siguiente"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <SeguimientoDrawer
                selectedParticipante={selectedParticipante}
                setSelectedParticipante={setSelectedParticipante}
                detalle={detalle}
                loadingDetalle={loadingDetalle}
                error={error}
                handleVerDetalle={handleVerDetalle}
            />
        </div>
    );
};

export default Seguimiento;

