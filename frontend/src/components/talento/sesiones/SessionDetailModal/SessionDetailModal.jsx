import React, { useRef } from 'react';
import { Modal, Button } from '../../../common';
import { formatters } from '../../../../utils/formatters';
import { sesionesService } from '../../../../services/sesiones';
import './SessionDetailModal.css';

const modalidades = ['Virtual', 'Presencial', 'Híbrida'];
const tiposFormacionBase = ['Personal FSD', 'Personal Externo'];

const SessionDetailModal = ({
    modalDetalles, setModalDetalles,
    modoEdicion, setModoEdicion,
    sesionTabActiva, setSesionTabActiva,
    // Edición
    datosEdicion, setDatosEdicion,
    erroresEdicion, setErroresEdicion,
    customTipoEdicion,
    handleEditar, handleCancelarEdicion, handleCambioEdicion, handleGuardarEdicion,
    guardando,
    // Ocurrencias
    mostrarFormOcurrencia, setMostrarFormOcurrencia,
    nuevaOcurrencia, setNuevaOcurrencia,
    mostrarContenidoNuevaOc, setMostrarContenidoNuevaOc,
    guardandoOcurrencia, setGuardandoOcurrencia,
    // Callbacks
    setSesiones, setToast,
    setModalQR, setModalEliminarOcurrencia,
    onCloseModal
}) => {
    const tabsRef = useRef(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userEmail = userInfo.email;
    const esAdmin = userInfo.role === 'Administrador' || userInfo.rol === 'Administrador';
    const esCreador = modalDetalles?.created_by === userEmail;
    const puedeEditar = esCreador || esAdmin;

    if (!modalDetalles) return null;

    // Preparar datos de sesiones de forma que no se duplique la principal
    const ocurrenciasAdicionales = (modalDetalles.ocurrencias || []).filter(oc => oc.token !== modalDetalles.token);
    
    let todasSesiones = [
        { id: '__principal__', label: 'Sesión 1', fecha: modalDetalles.fecha, hora_inicio: modalDetalles.hora_inicio, hora_fin: modalDetalles.hora_fin, facilitador_entidad: modalDetalles.facilitador_entidad, contenido: modalDetalles.contenido, total_asistentes: modalDetalles.total_asistentes_principal || 0, link: modalDetalles.link, token: modalDetalles.token, _esPrincipal: true },
        ...ocurrenciasAdicionales.map((oc) => ({ ...oc, _esPrincipal: false }))
    ];

    todasSesiones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    todasSesiones = todasSesiones.map((s, idx) => ({ ...s, label: `Sesión ${idx + 1}` }));

    const tabActual = todasSesiones.find(s => s.id === sesionTabActiva) || todasSesiones[todasSesiones.length - 1];

    const scrollTabs = (direction) => {
        if (tabsRef.current) {
            const scrollAmount = 200;
            tabsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <Modal
            isOpen={!!modalDetalles}
            onClose={onCloseModal}
            title={modoEdicion ? "Editar actividad" : "Detalles de la actividad"}
            size="md"
        >
            <div className="modal-ver-detalle-content">
                {!modoEdicion ? (
                    <>
                        {/* ── TEMA ── */}
                        <div className="modal-detalle-header">
                            <h2 className="modal-detalle-tema">{tabActual.tema || modalDetalles.tema}</h2>
                            <div className="modal-detalle-subinfo">
                                <span className="badge-neutral">{tabActual.actividad || modalDetalles.actividad}</span>
                                <span className="badge-neutral">{tabActual.modalidad || modalDetalles.modalidad}</span>
                                <span className="badge-asistentes">
                                    <strong>{tabActual.total_asistentes || 0}</strong> asistentes
                                </span>
                            </div>
                        </div>

                        {/* ── Grid de Información ── */}
                        <div className="modal-detalle-grid-cards">
                            <div className="detalle-card">
                                <div className="card-header">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    <span>Sesión</span>
                                </div>
                                <div className="card-body">
                                    <div className="card-stat"><label>Fecha</label><span>{formatters.fechaCorta(tabActual.fecha)}</span></div>
                                    <div className="card-stat"><label>Horario</label><span>{tabActual.hora_inicio || '--:--'} - {tabActual.hora_fin || '--:--'}</span></div>
                                    <div className="card-stat"><label>Duración</label><span>{formatters.calcularDuracion(tabActual.hora_inicio, tabActual.hora_fin)}</span></div>
                                    <div className="card-stat"><label>Dirigido a</label><span>{tabActual.dirigido_a || modalDetalles.dirigido_a}</span></div>
                                    <div className="card-stat"><label>Tipo de actividad</label><span>{tabActual.tipo_actividad || modalDetalles.tipo_actividad}</span></div>
                                    {(tabActual.actividad === 'Otros (eventos)' || modalDetalles.actividad === 'Otros (eventos)') && (
                                        <div className="card-stat"><label>Especificación</label><span>{tabActual.actividad_custom || modalDetalles.actividad_custom}</span></div>
                                    )}
                                </div>
                            </div>
                            <div className="detalle-card">
                                <div className="card-header">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    <span>Equipo</span>
                                </div>
                                <div className="card-body">
                                    <div className="card-stat">
                                        <label>Facilitador</label>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="text-highlight">{tabActual.facilitador_entidad || modalDetalles.facilitador_entidad}</span>
                                        </div>
                                    </div>
                                    <div className="card-stat"><label>Responsable</label><span>{tabActual.responsable || modalDetalles.responsable}</span></div>
                                    <div className="card-stat"><label>Cargo</label><span>{tabActual.cargo_responsable || modalDetalles.cargo_responsable}</span></div>
                                    <div className="card-stat" style={{ borderTop: '1px dashed #e2e8f0', marginTop: '4px', paddingTop: '4px' }}>
                                        <label>Creado por</label>
                                        <span style={{ color: '#64748b', fontSize: '12px' }}>
                                            {modalDetalles.created_by_name || modalDetalles.created_by?.split('@')[0] || 'Sistema'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Contenido ── */}
                        <div className="modal-detalle-section">
                            <div className="section-title-clean">Contenido de la actividad</div>
                            <div className="content-box-clean">{tabActual.contenido || modalDetalles.contenido}</div>
                        </div>

                        {/* ── Footer de Acceso ── */}
                        <div className="modal-detalle-footer-acceso">
                            <div className="footer-link-container">
                                <div className="link-info">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    <span className="url-text">{tabActual.link}</span>
                                </div>
                                <div className="footer-actions">
                                    <button className="btn-footer-action" title="Copiar link" onClick={() => { navigator.clipboard.writeText(tabActual.link); setToast({ message: 'Link copiado', type: 'success' }); }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    </button>
                                    <button className="btn-footer-action" title="Ver QR" onClick={() => tabActual._esPrincipal ? setModalQR(modalDetalles) : setModalQR({ ...modalDetalles, id: modalDetalles.id, _ocurrencia: tabActual })}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                    </button>
                                    {puedeEditar && !tabActual._esPrincipal && (
                                        <button className="btn-footer-action delete" title="Eliminar sesión" onClick={() => setModalEliminarOcurrencia({ sesionId: modalDetalles.id, ocurrenciaId: tabActual.id, fecha: tabActual.fecha })}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Carrusel de Sesiones ── */}
                        <div className="modal-tabs-carousel-wrapper">
                            <button className="btn-carousel-nav left" onClick={() => scrollTabs('left')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            <div className="modal-sesion-tabs" ref={tabsRef}>
                                {todasSesiones.map(s => (
                                    <button key={s.id} className={`modal-sesion-tab ${sesionTabActiva === s.id && !mostrarFormOcurrencia ? 'active' : ''}`} onClick={() => { setSesionTabActiva(s.id); setMostrarFormOcurrencia(false); }}>
                                        {s.label}
                                        <span className="modal-sesion-tab-fecha">{formatters.fechaCorta(s.fecha)}</span>
                                    </button>
                                ))}
                            </div>
                            <button className="btn-carousel-nav right" onClick={() => scrollTabs('right')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                            {puedeEditar && (
                                <button className={`modal-sesion-tab modal-sesion-tab-add ${mostrarFormOcurrencia ? 'active' : ''}`} onClick={() => { setMostrarFormOcurrencia(true); setMostrarContenidoNuevaOc(false); setNuevaOcurrencia({ fecha: '', hora_inicio: '', hora_fin: '', facilitador_entidad: '', contenido: '' }); }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Añadir
                                </button>
                            )}
                        </div>

                        {/* ── Formulario Añadir Sesión ── */}
                        {mostrarFormOcurrencia && (
                            <div className="form-nueva-ocurrencia-inline">
                                <div className="nueva-oc-card-header">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    <span>Añadir sesión adicional</span>
                                </div>
                                <div className="nueva-oc-grid">
                                    <div className="form-group-inline">
                                        <label>Fecha <span className="req">*</span></label>
                                        <input type="date" value={nuevaOcurrencia.fecha} onChange={e => setNuevaOcurrencia(p => ({ ...p, fecha: e.target.value }))} />
                                    </div>
                                    <div className="form-group-inline">
                                        <label>Inicio</label>
                                        <input type="time" value={nuevaOcurrencia.hora_inicio} onChange={e => setNuevaOcurrencia(p => ({ ...p, hora_inicio: e.target.value }))} />
                                    </div>
                                    <div className="form-group-inline">
                                        <label>Fin</label>
                                        <input type="time" value={nuevaOcurrencia.hora_fin} onChange={e => setNuevaOcurrencia(p => ({ ...p, hora_fin: e.target.value }))} />
                                    </div>
                                    <div className="form-group-inline">
                                        <label>
                                            {(nuevaOcurrencia.dirigido_a?.includes('Externo') || (!nuevaOcurrencia.dirigido_a && modalDetalles.dirigido_a?.includes('Externo'))) ? 'Entidad / Empresa' : 'Facilitador'}
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder={(nuevaOcurrencia.dirigido_a?.includes('Externo') || (!nuevaOcurrencia.dirigido_a && modalDetalles.dirigido_a?.includes('Externo'))) ? '¿Cuál es la entidad o empresa que imparte la actividad?' : '¿Quién imparte la actividad?'} 
                                            value={nuevaOcurrencia.facilitador_entidad || ''} 
                                            onChange={e => setNuevaOcurrencia(p => ({ ...p, facilitador_entidad: e.target.value }))} 
                                        />
                                    </div>
                                    <div className="form-group-inline" style={{ gridColumn: '1 / -1' }}>
                                        {mostrarContenidoNuevaOc ? (
                                            <>
                                                <label>Contenido</label>
                                                <textarea className="input-textarea-inline" value={nuevaOcurrencia.contenido} onChange={e => setNuevaOcurrencia(p => ({ ...p, contenido: e.target.value }))} />
                                                <button type="button" className="btn-toggle-contenido-inline" onClick={() => { setMostrarContenidoNuevaOc(false); setNuevaOcurrencia(p => ({ ...p, contenido: '' })); }}>Quitar contenido</button>
                                            </>
                                        ) : (
                                            <button type="button" className="btn-toggle-contenido-inline" onClick={() => setMostrarContenidoNuevaOc(true)}>+ Añadir contenido</button>
                                        )}
                                    </div>
                                </div>
                                <div className="nueva-oc-actions-inline">
                                    <button className="btn-cancel-inline" onClick={() => { setMostrarFormOcurrencia(false); setMostrarContenidoNuevaOc(false); }}>Cancelar</button>
                                    <button className="btn-save-inline" onClick={async () => {
                                        if (!nuevaOcurrencia.fecha) { setToast({ message: 'La fecha es requerida', type: 'error' }); return; }
                                        setGuardandoOcurrencia(true);
                                        try {
                                            const oc = await sesionesService.agregarOcurrencia(modalDetalles.id, {
                                                fecha: nuevaOcurrencia.fecha,
                                                hora_inicio: nuevaOcurrencia.hora_inicio || null,
                                                hora_fin: nuevaOcurrencia.hora_fin || null,
                                                facilitador_entidad: nuevaOcurrencia.facilitador_entidad || null,
                                                tipo_actividad: nuevaOcurrencia.tipo_actividad || null,
                                                contenido: nuevaOcurrencia.contenido || null
                                            });
                                            const sesionActualizada = { ...modalDetalles, es_recurrente: true, ocurrencias: [...(modalDetalles.ocurrencias || []), { ...oc, total_asistentes: 0 }] };
                                            setModalDetalles(sesionActualizada);
                                            setSesiones(prev => prev.map(s => s.id === modalDetalles.id ? { ...s, es_recurrente: true, ocurrencias: sesionActualizada.ocurrencias } : s));
                                            setMostrarFormOcurrencia(false);
                                            setSesionTabActiva(oc.id);
                                            setToast({ message: 'Sesión añadida', type: 'success' });
                                        } catch (e) {
                                            let errorMsg = 'Error al añadir sesión';
                                            if (e.response?.data?.detail) {
                                                const detail = e.response.data.detail;
                                                errorMsg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0].msg : JSON.stringify(detail));
                                            }
                                            setToast({ message: errorMsg, type: 'error' });
                                        } finally {
                                            setGuardandoOcurrencia(false);
                                        }
                                    }} disabled={guardandoOcurrencia}>{guardandoOcurrencia ? '...' : 'Añadir'}</button>
                                </div>
                            </div>
                        )}

                        <div className="modal-ver-detalle-actions">
                            {puedeEditar && (
                                <Button onClick={handleEditar} variant="secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Editar
                                </Button>
                            )}
                            <Button onClick={() => { setModalDetalles(null); setMostrarFormOcurrencia(false); }} variant="primary">Cerrar</Button>
                        </div>
                    </>
                ) : (
                    // Modo edición
                    <>
                        <div className="modal-edicion-grid">
                            <div className="modal-edicion-field modal-edicion-field-full">
                                <label className="modal-edicion-label">Tema / Título <span style={{ fontSize: 11, color: '#9ca3af' }}>(Cambia en todas las sesiones)</span></label>
                                <input 
                                    type="text" 
                                    value={datosEdicion.tema || ''} 
                                    onChange={(e) => handleCambioEdicion('tema', e.target.value)}
                                    className="modal-edicion-input" 
                                    placeholder="Nombre de la actividad" 
                                />
                            </div>

                            <div className="modal-edicion-field">
                                <label className="modal-edicion-label">Fecha *</label>
                                <input type="date" value={datosEdicion.fecha || ''} onChange={(e) => handleCambioEdicion('fecha', e.target.value)} className={`modal-edicion-input ${erroresEdicion.fecha ? 'input-error' : ''}`} />
                                {erroresEdicion.fecha && <span className="error-message">{erroresEdicion.fecha}</span>}
                            </div>

                            <div className="modal-edicion-field">
                                <label className="modal-edicion-label">Hora de inicio {sesionTabActiva === '__principal__' ? '*' : <span style={{ fontSize: 11, color: '#9ca3af' }}>(opcional)</span>}</label>
                                <input type="time" value={datosEdicion.hora_inicio || ''} onChange={(e) => handleCambioEdicion('hora_inicio', e.target.value)} className={`modal-edicion-input ${erroresEdicion.hora_inicio ? 'input-error' : ''}`} />
                                {erroresEdicion.hora_inicio && <span className="error-message">{erroresEdicion.hora_inicio}</span>}
                            </div>

                            <div className="modal-edicion-field">
                                <label className="modal-edicion-label">Hora de fin {sesionTabActiva === '__principal__' ? '*' : <span style={{ fontSize: 11, color: '#9ca3af' }}>(opcional)</span>}</label>
                                <input type="time" value={datosEdicion.hora_fin || ''} onChange={(e) => handleCambioEdicion('hora_fin', e.target.value)} className={`modal-edicion-input ${erroresEdicion.hora_fin ? 'input-error' : ''}`} />
                                {erroresEdicion.hora_fin && <span className="error-message">{erroresEdicion.hora_fin}</span>}
                            </div>

                            <div className="modal-edicion-field">
                                <label className="modal-edicion-label">Actividad <span style={{ fontSize: 11, color: '#9ca3af' }}>(Cambia en todas las sesiones)</span></label>
                                <select value={datosEdicion.actividad || ''} onChange={(e) => handleCambioEdicion('actividad', e.target.value)} className={`modal-edicion-input ${erroresEdicion.actividad ? 'input-error' : ''}`}>
                                    <option value="Capacitación">Capacitación</option>
                                    <option value="Inducción">Inducción</option>
                                    <option value="Formación">Formación</option>
                                    <option value="Otros (eventos)">Otros (eventos)</option>
                                </select>
                                {erroresEdicion.actividad && <span className="error-message">{erroresEdicion.actividad}</span>}
                            </div>

                            {datosEdicion.actividad === 'Otros (eventos)' && (
                                <div className="modal-edicion-field">
                                    <label className="modal-edicion-label">Especificar tipo *</label>
                                    <input type="text" value={customTipoEdicion} onChange={(e) => handleCambioEdicion('actividad_custom', e.target.value)} className={`modal-edicion-input ${erroresEdicion.actividad_custom ? 'input-error' : ''}`} placeholder="Ej: Taller, Conferencia, etc." />
                                    {erroresEdicion.actividad_custom && <span className="error-message">{erroresEdicion.actividad_custom}</span>}
                                </div>
                            )}

                            <div className="modal-edicion-field">
                                <label className="modal-edicion-label">Dirigido a <span style={{ fontSize: 11, color: '#9ca3af' }}>(Cambia en todas las sesiones)</span></label>
                                <select value={datosEdicion.dirigido_a || ''} onChange={(e) => handleCambioEdicion('dirigido_a', e.target.value)} className={`modal-edicion-input ${erroresEdicion.dirigido_a ? 'input-error' : ''}`}>
                                    {(datosEdicion.actividad === 'Otros (eventos)' ? [...tiposFormacionBase, 'Personal FSD y externo'] : tiposFormacionBase).map(tipo => (<option key={tipo} value={tipo}>{tipo}</option>))}
                                </select>
                                {erroresEdicion.dirigido_a && <span className="error-message">{erroresEdicion.dirigido_a}</span>}
                            </div>

                            <div className="modal-edicion-field">
                                <label className="modal-edicion-label">Modalidad {sesionTabActiva !== '__principal__' && <span style={{ fontSize: 11, color: '#9ca3af' }}>(opcional)</span>}</label>
                                <select value={datosEdicion.modalidad || ''} onChange={(e) => handleCambioEdicion('modalidad', e.target.value)} className={`modal-edicion-input ${erroresEdicion.modalidad ? 'input-error' : ''}`}>
                                    {modalidades.map(mod => (<option key={mod} value={mod}>{mod}</option>))}
                                </select>
                                {erroresEdicion.modalidad && <span className="error-message">{erroresEdicion.modalidad}</span>}
                            </div>

                            <div className="modal-edicion-field">
                                <label className="modal-edicion-label">
                                    {(datosEdicion.dirigido_a?.includes('Externo') || (!datosEdicion.dirigido_a && modalDetalles.dirigido_a?.includes('Externo'))) ? 'Entidad / Empresa *' : 'Facilitador *'}
                                </label>
                                <input 
                                    type="text" 
                                    value={datosEdicion.facilitador_entidad || ''} 
                                    onChange={(e) => handleCambioEdicion('facilitador_entidad', e.target.value)} 
                                    className={`modal-edicion-input ${erroresEdicion.facilitador_entidad ? 'input-error' : ''}`} 
                                    placeholder={(datosEdicion.dirigido_a?.includes('Externo') || (!datosEdicion.dirigido_a && modalDetalles.dirigido_a?.includes('Externo'))) ? '¿Cuál es la entidad o empresa que imparte la actividad?' : '¿Quién imparte la actividad?'} 
                                />
                                {erroresEdicion.facilitador_entidad && <span className="error-message">{erroresEdicion.facilitador_entidad}</span>}
                            </div>

                            <div className="modal-edicion-field">
                                <label className="modal-edicion-label">Responsable {sesionTabActiva !== '__principal__' && <span style={{ fontSize: 11, color: '#9ca3af' }}>(opcional)</span>}</label>
                                <input type="text" value={datosEdicion.responsable || ''} onChange={(e) => handleCambioEdicion('responsable', e.target.value)} className={`modal-edicion-input ${erroresEdicion.responsable ? 'input-error' : ''}`} placeholder="Nombre del responsable" />
                                {erroresEdicion.responsable && <span className="error-message">{erroresEdicion.responsable}</span>}
                            </div>

                            <div className="modal-edicion-field">
                                <label className="modal-edicion-label">Cargo {sesionTabActiva !== '__principal__' && <span style={{ fontSize: 11, color: '#9ca3af' }}>(opcional)</span>}</label>
                                <input type="text" value={datosEdicion.cargo_responsable || ''} onChange={(e) => handleCambioEdicion('cargo_responsable', e.target.value)} className={`modal-edicion-input ${erroresEdicion.cargo_responsable ? 'input-error' : ''}`} placeholder="Cargo del responsable" />
                                {erroresEdicion.cargo_responsable && <span className="error-message">{erroresEdicion.cargo_responsable}</span>}
                            </div>

                            <div className="modal-edicion-field modal-edicion-field-full">
                                <label className="modal-edicion-label">Contenido *</label>
                                <textarea value={datosEdicion.contenido || ''} onChange={(e) => handleCambioEdicion('contenido', e.target.value)} className={`modal-edicion-textarea ${erroresEdicion.contenido ? 'input-error' : ''}`} placeholder="Descripción del contenido de la actividad" rows={4} />
                                {erroresEdicion.contenido && <span className="error-message">{erroresEdicion.contenido}</span>}
                            </div>
                        </div>

                        <div className="modal-ver-detalle-actions">
                            <Button onClick={handleCancelarEdicion} variant="secondary" disabled={guardando}>Cancelar</Button>
                            <Button onClick={handleGuardarEdicion} variant="primary" loading={guardando}>Guardar cambios</Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SessionDetailModal;
