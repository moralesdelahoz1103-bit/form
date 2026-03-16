import React from 'react';
import { formatters } from '../../../../utils/formatters';
import { Loading, Button } from '../../../common';

const SeguimientoDrawer = ({
    selectedParticipante,
    setSelectedParticipante,
    detalle,
    loadingDetalle,
    error,
    handleVerDetalle
}) => {
    if (!selectedParticipante) return null;

    return (
        <div className="drawer-overlay" onClick={() => setSelectedParticipante(null)}>
            <div className="drawer-content" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', color: '#26bc58' }}>Historial</h2>
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                            {selectedParticipante.nombre.toUpperCase()}
                        </p>
                        <p style={{ margin: '2px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
                            C.C. {selectedParticipante.cedula}
                        </p>
                    </div>
                    <button className="close-btn" onClick={() => setSelectedParticipante(null)}>&times;</button>
                </div>

                <div className="drawer-body">
                    {loadingDetalle ? (
                        <div style={{ padding: '40px 0' }}><Loading /></div>
                    ) : detalle ? (
                        <div className="timeline">
                            {detalle.historial.map((item, idx) => (
                                <div className="timeline-item" key={idx}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-date">{formatters.fechaHora(item.fecha_registro)}</div>
                                    <div className="timeline-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                            <div className="timeline-tema" style={{ fontSize: '15px', color: '#111827' }}>{item.tema}</div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    background: item.tipo_formacion === 'Externa' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(38, 188, 88, 0.1)',
                                                    color: item.tipo_formacion === 'Externa' ? '#3b82f6' : '#26bc58',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontWeight: '700',
                                                    border: `1px solid ${item.tipo_formacion === 'Externa' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(38, 188, 88, 0.2)'}`,
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {item.tipo_formacion}
                                                </span>
                                                {item.sesion_nro && (
                                                    <span style={{
                                                        fontSize: '11px',
                                                        background: 'rgba(38, 188, 88, 0.1)',
                                                        color: '#26bc58',
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontWeight: '700',
                                                        border: '1px solid rgba(38, 188, 88, 0.2)',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        Sesión {item.sesion_nro}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="timeline-responsable">
                                            <span style={{ fontWeight: '600', color: '#4b5563' }}>Fecha actividad:</span> {formatters.fechaCorta(item.fecha_formacion)}
                                        </div>
                                        <div className="timeline-responsable" style={{ marginTop: '4px' }}>
                                            <span style={{ fontWeight: '600', color: '#4b5563' }}>Facilitador:</span> {item.facilitador || 'N/A'}
                                        </div>
                                        <div className="timeline-responsable" style={{ marginTop: '2px' }}>
                                            <span style={{ fontWeight: '600', color: '#4b5563' }}>Modalidad:</span> {item.modalidad || item.tipo_formacion}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="drawer-error">
                            <p>{error}</p>
                            <Button onClick={() => handleVerDetalle(selectedParticipante)} variant="secondary" small>Reintentar</Button>
                        </div>
                    ) : (
                        <p>No se encontró historial para este participante.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeguimientoDrawer;
