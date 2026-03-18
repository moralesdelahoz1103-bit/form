import React from 'react';
import { Button } from '../../../common';
import { formatters } from '../../../../utils/formatters';
import './SessionsView.css';

const SessionsView = ({
    currentSesiones,
    sesiones,
    verGlobal,
    copiarLink,
    setModalQR,
    setModalDetalles,
    setModalEliminar,
    setSesionTabActiva,
    // Pagination
    totalPages,
    currentPage,
    setCurrentPage,
    indexOfFirstItem,
    indexOfLastItem,
    totalFiltradas,
}) => {

    const userEmail = JSON.parse(localStorage.getItem('userInfo') || '{}').email;

    // Vista de tabla (list)
    return (
        <>
            <div className="sesiones-table-container">
                <table className="sesiones-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: '16px' }}>Tema / título</th>
                            <th>Fecha</th>
                            <th>Actividad</th>
                            <th>Horario</th>
                            <th>Dirigido a</th>
                            <th>Facilitador / Empresa o entidad</th>
                            <th>Asistentes</th>
                            {verGlobal && <th>Creado por</th>}
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentSesiones.map(sesion => (
                            <tr
                                key={sesion.uid}
                                onClick={() => {
                                    setSesionTabActiva('__principal__');
                                    setModalDetalles(sesion);
                                }}
                                className="sesion-row-clickable"
                            >
                                <td className="col-tema" title={sesion.tema}>
                                    <div className="col-tema-content" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span className="col-tema-title">{sesion.tema}</span>
                                        {sesion.tiene_ocurrencias && (
                                            <span className="badge-recurrent-pro">
                                                {sesion.total_fechas} sesiones
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    {formatters.fechaCorta(sesion.fecha)}
                                    {sesion.tiene_ocurrencias && <span className="fecha-plus"> (+{sesion.total_fechas - 1})</span>}
                                </td>
                                <td>{sesion.actividad}</td>
                                <td className="whitespace-nowrap">{sesion.hora_inicio} - {sesion.hora_fin}</td>
                                <td>{sesion.dirigido_a}</td>
                                <td className="col-facilitador_entidad" title={`${sesion.facilitador_entidad} (${sesion.tipo_actividad || 'Interno'})`}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>{sesion.facilitador_entidad}</span>
                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{sesion.tipo_actividad || 'Interno'}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="badge-count-table">{sesion.total_asistentes_view || 0}</span>
                                </td>
                                {verGlobal && (
                                    <td className="col-creator" title={sesion.created_by}>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            {sesion.created_by === userEmail ? '(Yo)' : (sesion.created_by_name || sesion.created_by?.split('@')[0])}
                                        </span>
                                    </td>
                                )}
                                <td>
                                    <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setModalQR(sesion);
                                            }}
                                            className="btn-table-action"
                                            title="Ver QR específico"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSesionTabActiva('__principal__');
                                                setModalDetalles(sesion);
                                            }}
                                            className="btn-table-action"
                                            title="Ver detalles"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                            </svg>
                                        </button>
                                        {sesion.created_by === userEmail && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setModalEliminar(sesion);
                                                }}
                                                className="btn-table-action btn-delete"
                                                title="Eliminar capacitación completa"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination {...{ totalPages, currentPage, setCurrentPage, indexOfFirstItem, indexOfLastItem, totalFiltradas }} />
        </>
    );
};

/** Componente interno de paginación */
const Pagination = ({ totalPages, currentPage, setCurrentPage, indexOfFirstItem, indexOfLastItem, totalFiltradas }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                Mostrando <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, totalFiltradas)}</strong> de <strong>{totalFiltradas}</strong>
            </div>
            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    title="Anterior"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>

                <div className="pagination-numbers">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                            return (
                                <button key={pageNum} className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`} onClick={() => setCurrentPage(pageNum)}>
                                    {pageNum}
                                </button>
                            );
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return <span key={pageNum} className="pagination-ellipsis">...</span>;
                        }
                        return null;
                    })}
                </div>

                <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    title="Siguiente"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
            </div>
        </div>
    );
};

export default SessionsView;
