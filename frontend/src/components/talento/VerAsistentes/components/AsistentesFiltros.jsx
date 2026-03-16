import React from 'react';
import { formatters } from '../../../../utils/formatters';

/**
 * Panel de filtros y metadatos de la sesión seleccionada en VerAsistentes.
 */
const AsistentesFiltros = ({
    sesiones,
    sesionSeleccionada,
    sesionActual,
    ocurrenciaSeleccionada,
    setOcurrenciaSeleccionada,
    fechaMostrada,
    horaMostrada,
    facilitadorMostrado,
    totalSesiones,
    asistentes,
    handleSeleccionarSesion,
    exportarXLSX,
    exportarConsolidadoXLSX,
}) => (
    <div className="asistentes-filtros-container">
        <div className="va-filtros-panel">

            {/* Selector de formación */}
            <div className="va-filtro-campo va-filtro-nombre">
                <label className="va-filtro-label">Actividad</label>
                <select
                    className="va-select"
                    value={sesionSeleccionada}
                    onChange={(e) => handleSeleccionarSesion(e.target.value)}
                >
                    <option value="">Elige una actividad…</option>
                    {sesiones.map(s => (
                        <option key={s.id} value={s.id}>{s.tema}</option>
                    ))}
                </select>
            </div>

            {/* Fecha */}
            <div className="va-filtro-campo va-filtro-fecha">
                <label className="va-filtro-label">Fecha sesión</label>
                <div className="va-input-readonly">
                    {sesionActual ? formatters.fechaCorta(fechaMostrada) : '—'}
                </div>
            </div>

            {/* Horario */}
            <div className="va-filtro-campo va-filtro-hora">
                <label className="va-filtro-label">Horario</label>
                <div className="va-input-readonly">
                    {sesionActual ? horaMostrada : '—'}
                </div>
            </div>

            {/* Facilitador */}
            <div className="va-filtro-campo va-filtro-facilitador_entidad">
                <label className="va-filtro-label">Facilitador</label>
                <div className="va-input-readonly" title={facilitadorMostrado}>
                    {facilitadorMostrado || '—'}
                </div>
            </div>

            {/* Selector de sesión específica (solo si es recurrente) */}
            {sesionActual?.es_recurrente && (
                <div className="va-filtro-campo va-filtro-selector-sesion">
                    <label className="va-filtro-label">Sesión específica</label>
                    <select
                        className="va-select"
                        value={ocurrenciaSeleccionada}
                        onChange={(e) => setOcurrenciaSeleccionada(e.target.value)}
                    >
                        {(sesionActual.ocurrencias || []).map((oc, idx) => (
                            <option key={oc.id} value={idx === 0 ? '__principal__' : oc.id}>
                                Sesión {idx + 1} — {formatters.fechaCorta(oc.fecha)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Total sesiones */}
            {sesionActual && (
                <div className="va-filtro-campo">
                    <label className="va-filtro-label">Sesiones</label>
                    <div className="va-badge-sesiones">{totalSesiones}</div>
                </div>
            )}

            {/* Botón exportar */}
            {sesionActual && asistentes.length > 0 && (
                <div className={`va-filtro-campo ${sesionActual.es_recurrente ? 'va-filtro-acciones-doble' : ''}`}>
                    <label className="va-filtro-label">Acciones</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={exportarXLSX} className="btn-exportar-excel" title="Exportar vista actual">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Exportar sesión actual
                        </button>
                        {sesionActual.es_recurrente && (
                            <button onClick={exportarConsolidadoXLSX} className="btn-exportar-excel" style={{ backgroundColor: '#1e833f' }} title="Exportar todas las sesiones juntas">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="8" y1="13" x2="16" y2="13" />
                                    <line x1="8" y1="17" x2="16" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                                Exportar todas las sesiones
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
);

export default AsistentesFiltros;
