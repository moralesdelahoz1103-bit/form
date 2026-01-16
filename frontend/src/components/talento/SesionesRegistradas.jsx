import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Loading from '../common/Loading';
import Toast from '../common/Toast';
import { sesionesService } from '../../services/sesiones';
import { config } from '../../utils/constants';
import { formatters } from '../../utils/formatters';
import { tienePermiso } from '../../utils/permisos';
import './SesionesRegistradas.css';

const SesionesRegistradas = () => {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalDetalles, setModalDetalles] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [erroresEdicion, setErroresEdicion] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [customTipoEdicion, setCustomTipoEdicion] = useState('');
  
  // Estados de permisos
  const [permisos, setPermisos] = useState({
    ver: false,
    editar: false,
    eliminar: false,
    exportar: false
  });
  const [verificandoPermiso, setVerificandoPermiso] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    fecha: '',
    tipo: '',
    facilitador: '',
    responsable: ''
  });

  // Cargar permisos al montar el componente
  useEffect(() => {
    const cargarPermisos = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const permisosPromise = Promise.all([
          tienePermiso('ver_sesiones'),
          tienePermiso('editar_sesiones'),
          tienePermiso('eliminar_sesiones'),
          tienePermiso('exportar_sesiones')
        ]);
        
        const [ver, editar, eliminar, exportar] = await Promise.race([
          permisosPromise,
          timeoutPromise
        ]);
        
        setPermisos({
          ver,
          editar,
          eliminar,
          exportar
        });
      } catch (error) {
        console.error('Error cargando permisos:', error);
        // Mantener permisos por defecto
        setPermisos({
          ver: false,
          editar: false,
          eliminar: false,
          exportar: false
        });
      } finally {
        setVerificandoPermiso(false);
      }
    };
    cargarPermisos();
  }, []);

  useEffect(() => {
    loadSesiones();
  }, []);

  const loadSesiones = async () => {
    try {
      const data = await sesionesService.listar();
      setSesiones(data);
    } catch (error) {
      setToast({ message: 'Error al cargar formaciones o eventos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;

    setEliminando(true);
    try {
      await sesionesService.eliminar(modalEliminar.id);
      setToast({ message: 'Formación o evento eliminado exitosamente', type: 'success' });
      setModalEliminar(null);
      loadSesiones();
    } catch (error) {
      setToast({ message: 'Error al eliminar formación o evento', type: 'error' });
    } finally {
      setEliminando(false);
    }
  };

  const handleEditar = () => {
    setDatosEdicion({ ...modalDetalles });
    setErroresEdicion({});
    // Si el tipo de actividad no es uno de los predefinidos, se considera "Otros"
    const tiposPredefinidos = ['Inducción', 'Formación', 'Evento'];
    if (modalDetalles.tipo_actividad && !tiposPredefinidos.includes(modalDetalles.tipo_actividad)) {
      setCustomTipoEdicion(modalDetalles.tipo_actividad);
      setDatosEdicion({ ...modalDetalles, tipo_actividad: 'Otros' });
    } else {
      setCustomTipoEdicion('');
    }
    setModoEdicion(true);
  };

  const handleCancelarEdicion = () => {
    setModoEdicion(false);
    setDatosEdicion({});
    setErroresEdicion({});
    setCustomTipoEdicion('');
  };

  const handleCambioEdicion = (campo, valor) => {
    // Manejar cambio en campo custom_tipo
    if (campo === 'custom_tipo') {
      setCustomTipoEdicion(valor);
      if (erroresEdicion.custom_tipo) {
        setErroresEdicion(prev => ({ ...prev, custom_tipo: null }));
      }
      return;
    }

    // Si se cambia tipo_actividad y no es "Otros", limpiar customTipo
    if (campo === 'tipo_actividad' && valor !== 'Otros') {
      setCustomTipoEdicion('');
      setErroresEdicion(prev => ({ ...prev, custom_tipo: undefined }));
    }

    setDatosEdicion(prev => ({ ...prev, [campo]: valor }));
    // Limpiar error del campo si existe
    if (erroresEdicion[campo]) {
      setErroresEdicion(prev => ({ ...prev, [campo]: null }));
    }
  };

  const validarEdicion = () => {
    const errores = {};
    
    if (!datosEdicion.tema || datosEdicion.tema.trim().length < 3) {
      errores.tema = 'El tema debe tener al menos 3 caracteres';
    }
    if (!datosEdicion.fecha) {
      errores.fecha = 'La fecha es requerida';
    }
    if (!datosEdicion.tipo_actividad) {
      errores.tipo_actividad = 'El tipo de actividad es requerido';
    }
    // Si seleccionó "Otros", validar el campo de texto
    if (datosEdicion.tipo_actividad === 'Otros') {
      if (!customTipoEdicion || customTipoEdicion.trim() === '') {
        errores.custom_tipo = 'Por favor especifica el tipo de actividad';
      } else if (customTipoEdicion.trim().length < 3) {
        errores.custom_tipo = 'El tipo de actividad debe tener al menos 3 caracteres';
      }
    }
    if (!datosEdicion.facilitador || datosEdicion.facilitador.trim().length < 3) {
      errores.facilitador = 'El facilitador debe tener al menos 3 caracteres';
    }
    if (!datosEdicion.responsable || datosEdicion.responsable.trim().length < 3) {
      errores.responsable = 'El responsable debe tener al menos 3 caracteres';
    }
    if (!datosEdicion.cargo || datosEdicion.cargo.trim().length < 3) {
      errores.cargo = 'El cargo debe tener al menos 3 caracteres';
    }
    if (!datosEdicion.contenido || datosEdicion.contenido.trim().length < 10) {
      errores.contenido = 'El contenido debe tener al menos 10 caracteres';
    }
    if (!datosEdicion.hora_inicio) {
      errores.hora_inicio = 'La hora de inicio es requerida';
    }
    if (!datosEdicion.hora_fin) {
      errores.hora_fin = 'La hora de fin es requerida';
    }
    if (datosEdicion.hora_fin && datosEdicion.hora_inicio && datosEdicion.hora_fin <= datosEdicion.hora_inicio) {
      errores.hora_fin = 'Hora fin debe ser posterior a hora inicio';
    }
    
    setErroresEdicion(errores);
    return Object.keys(errores).length === 0;
  };

  const handleGuardarEdicion = async () => {
    if (!validarEdicion()) {
      setToast({ message: 'Por favor corrige los errores en el formulario', type: 'error' });
      return;
    }

    setGuardando(true);
    try {
      const datosActualizacion = {
        tema: datosEdicion.tema,
        fecha: datosEdicion.fecha,
        tipo_actividad: datosEdicion.tipo_actividad,
        facilitador: datosEdicion.facilitador,
        responsable: datosEdicion.responsable,
        cargo: datosEdicion.cargo,
        contenido: datosEdicion.contenido,
        hora_inicio: datosEdicion.hora_inicio,
        hora_fin: datosEdicion.hora_fin
      };

      // Si se seleccionó "Otros", enviar el valor personalizado
      if (datosEdicion.tipo_actividad === 'Otros') {
        datosActualizacion.tipo_actividad_custom = customTipoEdicion;
      }

      const sesionActualizada = await sesionesService.actualizar(modalDetalles.id, datosActualizacion);
      
      setToast({ message: 'Formación o evento actualizado exitosamente', type: 'success' });
      setModoEdicion(false);
      setModalDetalles(sesionActualizada);
      loadSesiones();
    } catch (error) {
      console.error('Error actualizando sesión:', error);
      setToast({ 
        message: error.response?.data?.detail || 'Error al actualizar formación o evento', 
        type: 'error' 
      });
    } finally {
      setGuardando(false);
    }
  };

  const copiarLink = (link) => {
    navigator.clipboard.writeText(link);
    setToast({ message: '¡Link copiado!', type: 'success' });
  };

  const copiarQR = async (qrUrl) => {
    try {
      const fullUrl = qrUrl.startsWith('/') ? `${config.apiUrl}${qrUrl}` : qrUrl;
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setToast({ message: '¡QR copiado al portapapeles!', type: 'success' });
    } catch (error) {
      console.error('Error al copiar QR:', error);
      setToast({ message: 'Error al copiar QR', type: 'error' });
    }
  };

  const descargarQR = async (qrUrl, nombreSesion) => {
    try {
      const fullUrl = qrUrl.startsWith('/') ? `${config.apiUrl}${qrUrl}` : qrUrl;
      const nombreArchivo = nombreSesion ? `QR-${nombreSesion.replace(/[^a-zA-Z0-9]/g, '_')}` : 'QR-evento';
      
      // Descargar la imagen como blob
      const response = await fetch(fullUrl, { mode: 'cors' });
      const blob = await response.blob();
      
      // Crear URL temporal del blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear link y descargar
      const link = document.createElement('a');
      link.download = `${nombreArchivo}.png`;
      link.href = blobUrl;
      link.click();
      
      // Limpiar URL temporal
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
      
      setToast({ message: '¡QR descargado!', type: 'success' });
    } catch (error) {
      console.error('Error al descargar QR:', error);
      setToast({ message: 'Error al descargar QR', type: 'error' });
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      fecha: '',
      tipo: '',
      facilitador: '',
      responsable: ''
    });
  };

  // Exportar sesiones filtradas a XLSX como tabla nativa con exceljs
  const exportarXLSX = async () => {
    const encabezados = ['Tema', 'Fecha', 'Tipo de actividad', 'Facilitador', 'Responsable', 'Cargo', 'Hora inicio', 'Hora final', 'Cantidad de asistentes'];
    const datos = sesionesFiltradas.map(sesion => ([
      sesion.tema || '',
      formatters.fechaCorta(sesion.fecha) || '',
      sesion.tipo_actividad || '',
      sesion.facilitador || '',
      sesion.responsable || '',
      sesion.cargo || '',
      sesion.hora_inicio || '',
      sesion.hora_fin || '',
      sesion.total_asistentes || 0
    ]));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sesiones');
    worksheet.addTable({
      name: 'SesionesTable',
      ref: 'A1',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium9',
        showRowStripes: true,
      },
      columns: encabezados.map(h => ({ name: h })),
      rows: datos
    });
    // Aplicar fondo verde al encabezado
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF257137' } // Verde oscuro
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });
    // Ajustar ancho de columnas automáticamente
    encabezados.forEach((h, idx) => {
      worksheet.getColumn(idx + 1).width = Math.max(h.length + 2, 18);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Formaciones_o_Eventos.xlsx');
  };

  // Obtener opciones únicas para los filtros
  const fechasUnicas = [...new Set(sesiones.map(s => s.fecha).filter(Boolean))].sort().reverse();
  const tiposUnicos = [...new Set(sesiones.map(s => s.tipo_actividad).filter(Boolean))];
  const facilitadoresUnicos = [...new Set(sesiones.map(s => s.facilitador).filter(Boolean))];
  const responsablesUnicos = [...new Set(sesiones.map(s => s.responsable).filter(Boolean))];

  const sesionesFiltradas = sesiones.filter(sesion => {
    const cumpleBusqueda = !filtros.busqueda || 
      sesion.tema?.toLowerCase().includes(filtros.busqueda.toLowerCase());
    const cumpleFecha = !filtros.fecha || sesion.fecha === filtros.fecha;
    const cumpleTipo = !filtros.tipo || sesion.tipo_actividad === filtros.tipo;
    const cumpleFacilitador = !filtros.facilitador || sesion.facilitador === filtros.facilitador;
    const cumpleResponsable = !filtros.responsable || sesion.responsable === filtros.responsable;
    
    return cumpleBusqueda && cumpleFecha && cumpleTipo && cumpleFacilitador && cumpleResponsable;
  });

  if (verificandoPermiso) {
    return <Loading />;
  }

  if (!permisos.ver) {
    return (
      <div className="sesiones-registradas">
        <div className="page-header">
          <h1 className="page-title">Acceso Denegado</h1>
        </div>
        <div className="empty-state">
          <p>No tienes permiso para ver las formaciones o eventos</p>
          <p className="empty-subtitle">Contacta al administrador del sistema si necesitas acceso</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="sesiones-registradas">
      <div className="page-header">
        <div>
          <h1 className="page-title">Formaciones o eventos registrados</h1>
          <p className="page-subtitle">Administra todas las formaciones o eventos creados</p>
        </div>
        {permisos.exportar && (
          <div className="export-buttons">
            <Button onClick={exportarXLSX} variant="primary">
              Exportar Excel
            </Button>
          </div>
        )}
      </div>

      {sesiones.length === 0 ? (
        <div className="empty-state">
          <p>No hay formaciones o eventos registrados aún</p>
          <p className="empty-subtitle">Crea tu primera formación o evento desde el menú "Crear formación o evento"</p>
        </div>
      ) : (
        <>
          <div className="filters-container">
            <div className="filters-grid">
              <div className="filter-field">
                <label className="filter-label">Buscar por nombre</label>
                <input
                  type="text"
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  className="filter-input"
                  placeholder="Buscar capacitación o evento..."
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
                <label className="filter-label">Tipo de Actividad</label>
                <select
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos los tipos</option>
                  {tiposUnicos.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-field">
                <label className="filter-label">Facilitador</label>
                <select
                  value={filtros.facilitador}
                  onChange={(e) => handleFiltroChange('facilitador', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos los facilitadores</option>
                  {facilitadoresUnicos.map(facilitador => (
                    <option key={facilitador} value={facilitador}>{facilitador}</option>
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
            </div>
            
            {(filtros.busqueda || filtros.fecha || filtros.tipo || filtros.facilitador || filtros.responsable) && (
              <button onClick={limpiarFiltros} className="clear-filters-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Limpiar filtros
              </button>
            )}
          </div>

          {sesionesFiltradas.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron resultados</p>
              <p className="empty-subtitle">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="sesiones-grid">
              {sesionesFiltradas.map(sesion => (
            <div key={sesion.id} className="sesion-card">
              <div className="sesion-card-header">
                <h3 className="sesion-card-titulo">{sesion.tema}</h3>
                <span className={`sesion-badge ${sesion.token_active ? 'badge-active' : 'badge-inactive'}`}>
                  {sesion.token_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="sesion-card-body">
                <div className="sesion-info-row">
                  <span className="info-label">Fecha:</span>
                  <span className="info-value">{formatters.fechaCorta(sesion.fecha)}</span>
                </div>
                <div className="sesion-info-row">
                  <span className="info-label">Horario:</span>
                  <span className="info-value">{sesion.hora_inicio} - {sesion.hora_fin}</span>
                </div>
                <div className="sesion-info-row">
                  <span className="info-label">Tipo:</span>
                  <span className="info-value">{sesion.tipo_actividad}</span>
                </div>
                <div className="sesion-info-row">
                  <span className="info-label">Facilitador:</span>
                  <span className="info-value">{sesion.facilitador}</span>
                </div>
                <div className="sesion-info-row">
                  <span className="info-label">Asistentes:</span>
                  <span className="info-value badge-count">{sesion.total_asistentes || 0}</span>
                </div>

                <div className="sesion-link">
                  <input
                    type="text"
                    value={sesion.link}
                    readOnly
                    className="link-mini"
                  />
                  <button onClick={() => copiarLink(sesion.link)} className="btn-copy-mini">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>

                {sesion.qr_code && (
                  <div className="sesion-qr">
                    <p className="qr-label">Código QR de acceso:</p>
                    <img src={sesion.qr_code.startsWith('/') ? `${config.apiUrl}${sesion.qr_code}` : sesion.qr_code} alt="QR Code" className="qr-image" />
                    <div className="qr-actions-mini">
                      <button onClick={() => copiarQR(sesion.qr_code)} className="btn-qr-mini">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copiar
                      </button>
                      <button onClick={() => descargarQR(sesion.qr_code, sesion.tema)} className="btn-qr-mini">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Descargar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="sesion-card-footer">
                <Button
                  onClick={() => setModalDetalles(sesion)}
                  variant="secondary"
                  className="btn-detalles"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  Ver detalles
                </Button>
                {permisos.eliminar && (
                  <Button
                    onClick={() => setModalEliminar(sesion)}
                    variant="danger"
                    className="btn-eliminar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Eliminar
                  </Button>
                )}
              </div>
              </div>
            ))}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={!!modalEliminar}
        onClose={() => setModalEliminar(null)}
        title="¿Estás seguro?"
        size="sm"
      >
        <div className="modal-eliminar-content">
          <p>Esta acción no se puede deshacer. Se eliminarán:</p>
          <ul>
            <li>La formación o evento: <strong>{modalEliminar?.tema}</strong></li>
            <li>Todos los asistentes registrados ({modalEliminar?.total_asistentes || 0})</li>
            <li>Todas las firmas asociadas</li>
          </ul>
          <div className="modal-actions">
            <Button onClick={() => setModalEliminar(null)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleEliminar} variant="danger" loading={eliminando}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!modalDetalles}
        onClose={() => {
          setModalDetalles(null);
          setModoEdicion(false);
          setDatosEdicion({});
          setErroresEdicion({});
          setCustomTipoEdicion('');
        }}
        title={modoEdicion ? "Editar formación o evento" : "Detalles de la formación o evento"}
        size="md"
      >
        {modalDetalles && (
          <div className="modal-ver-detalle-content">
            {!modoEdicion ? (
              // Modo lectura
              <>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Tema / Título:</span>
                  <span className="modal-ver-detalle-value">{modalDetalles.tema}</span>
                </div>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Fecha:</span>
                  <span className="modal-ver-detalle-value">{formatters.fechaCorta(modalDetalles.fecha)}</span>
                </div>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Hora de inicio:</span>
                  <span className="modal-ver-detalle-value">{modalDetalles.hora_inicio}</span>
                </div>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Hora de fin:</span>
                  <span className="modal-ver-detalle-value">{modalDetalles.hora_fin}</span>
                </div>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Tipo de actividad:</span>
                  <span className="modal-ver-detalle-value">{modalDetalles.tipo_actividad}</span>
                </div>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Facilitador:</span>
                  <span className="modal-ver-detalle-value">{modalDetalles.facilitador}</span>
                </div>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Responsable:</span>
                  <span className="modal-ver-detalle-value">{modalDetalles.responsable || 'No especificado'}</span>
                </div>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Cargo:</span>
                  <span className="modal-ver-detalle-value">{modalDetalles.cargo || 'No especificado'}</span>
                </div>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Contenido:</span>
                  <span className="modal-ver-detalle-value modal-ver-detalle-contenido">{modalDetalles.contenido}</span>
                </div>
                <div className="modal-ver-detalle-row">
                  <span className="modal-ver-detalle-label">Total de asistentes:</span>
                  <span className="modal-ver-detalle-value modal-ver-detalle-badge">{modalDetalles.total_asistentes || 0}</span>
                </div>
                <div className="modal-ver-detalle-actions">
                  {permisos.editar && (
                    <Button onClick={handleEditar} variant="secondary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Editar
                    </Button>
                  )}
                  <Button onClick={() => setModalDetalles(null)} variant="primary">
                    Cerrar
                  </Button>
                </div>
              </>
            ) : (
              // Modo edición
              <>
                <div className="modal-edicion-grid">
                  <div className="modal-edicion-field">
                    <label className="modal-edicion-label">Tema / Título *</label>
                    <input
                      type="text"
                      value={datosEdicion.tema || ''}
                      onChange={(e) => handleCambioEdicion('tema', e.target.value)}
                      className={`modal-edicion-input ${erroresEdicion.tema ? 'input-error' : ''}`}
                      placeholder="Título de la formación o evento"
                    />
                    {erroresEdicion.tema && <span className="error-message">{erroresEdicion.tema}</span>}
                  </div>

                  <div className="modal-edicion-field">
                    <label className="modal-edicion-label">Fecha *</label>
                    <input
                      type="date"
                      value={datosEdicion.fecha || ''}
                      onChange={(e) => handleCambioEdicion('fecha', e.target.value)}
                      className={`modal-edicion-input ${erroresEdicion.fecha ? 'input-error' : ''}`}
                    />
                    {erroresEdicion.fecha && <span className="error-message">{erroresEdicion.fecha}</span>}
                  </div>

                  <div className="modal-edicion-field">
                    <label className="modal-edicion-label">Hora de inicio *</label>
                    <input
                      type="time"
                      value={datosEdicion.hora_inicio || ''}
                      onChange={(e) => handleCambioEdicion('hora_inicio', e.target.value)}
                      className={`modal-edicion-input ${erroresEdicion.hora_inicio ? 'input-error' : ''}`}
                    />
                    {erroresEdicion.hora_inicio && <span className="error-message">{erroresEdicion.hora_inicio}</span>}
                  </div>

                  <div className="modal-edicion-field">
                    <label className="modal-edicion-label">Hora de fin *</label>
                    <input
                      type="time"
                      value={datosEdicion.hora_fin || ''}
                      onChange={(e) => handleCambioEdicion('hora_fin', e.target.value)}
                      className={`modal-edicion-input ${erroresEdicion.hora_fin ? 'input-error' : ''}`}
                    />
                    {erroresEdicion.hora_fin && <span className="error-message">{erroresEdicion.hora_fin}</span>}
                  </div>

                  <div className="modal-edicion-field">
                    <label className="modal-edicion-label">Tipo de actividad *</label>
                    <select
                      value={datosEdicion.tipo_actividad || ''}
                      onChange={(e) => handleCambioEdicion('tipo_actividad', e.target.value)}
                      className={`modal-edicion-input ${erroresEdicion.tipo_actividad ? 'input-error' : ''}`}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Inducción">Inducción</option>
                      <option value="Formación">Formación</option>
                      <option value="Evento">Evento</option>
                      <option value="Otros">Otros</option>
                    </select>
                    {erroresEdicion.tipo_actividad && <span className="error-message">{erroresEdicion.tipo_actividad}</span>}
                  </div>

                  {datosEdicion.tipo_actividad === 'Otros' && (
                    <div className="modal-edicion-field">
                      <label className="modal-edicion-label">Especificar tipo *</label>
                      <input
                        type="text"
                        value={customTipoEdicion}
                        onChange={(e) => handleCambioEdicion('custom_tipo', e.target.value)}
                        className={`modal-edicion-input ${erroresEdicion.custom_tipo ? 'input-error' : ''}`}
                        placeholder="Ej: Taller, Conferencia, etc."
                      />
                      {erroresEdicion.custom_tipo && <span className="error-message">{erroresEdicion.custom_tipo}</span>}
                    </div>
                  )}

                  <div className="modal-edicion-field">{datosEdicion.tipo_actividad !== 'Otros' && <div className="modal-edicion-field"></div>}
                    <label className="modal-edicion-label">Facilitador *</label>
                    <input
                      type="text"
                      value={datosEdicion.facilitador || ''}
                      onChange={(e) => handleCambioEdicion('facilitador', e.target.value)}
                      className={`modal-edicion-input ${erroresEdicion.facilitador ? 'input-error' : ''}`}
                      placeholder="Nombre del facilitador"
                    />
                    {erroresEdicion.facilitador && <span className="error-message">{erroresEdicion.facilitador}</span>}
                  </div>

                  <div className="modal-edicion-field">
                    <label className="modal-edicion-label">Responsable *</label>
                    <input
                      type="text"
                      value={datosEdicion.responsable || ''}
                      onChange={(e) => handleCambioEdicion('responsable', e.target.value)}
                      className={`modal-edicion-input ${erroresEdicion.responsable ? 'input-error' : ''}`}
                      placeholder="Nombre del responsable"
                    />
                    {erroresEdicion.responsable && <span className="error-message">{erroresEdicion.responsable}</span>}
                  </div>

                  <div className="modal-edicion-field">
                    <label className="modal-edicion-label">Cargo *</label>
                    <input
                      type="text"
                      value={datosEdicion.cargo || ''}
                      onChange={(e) => handleCambioEdicion('cargo', e.target.value)}
                      className={`modal-edicion-input ${erroresEdicion.cargo ? 'input-error' : ''}`}
                      placeholder="Cargo del responsable"
                    />
                    {erroresEdicion.cargo && <span className="error-message">{erroresEdicion.cargo}</span>}
                  </div>

                  <div className="modal-edicion-field modal-edicion-field-full">
                    <label className="modal-edicion-label">Contenido *</label>
                    <textarea
                      value={datosEdicion.contenido || ''}
                      onChange={(e) => handleCambioEdicion('contenido', e.target.value)}
                      className={`modal-edicion-textarea ${erroresEdicion.contenido ? 'input-error' : ''}`}
                      placeholder="Descripción del contenido de la formación o evento"
                      rows={4}
                    />
                    {erroresEdicion.contenido && <span className="error-message">{erroresEdicion.contenido}</span>}
                  </div>
                </div>

                <div className="modal-ver-detalle-actions">
                  <Button onClick={handleCancelarEdicion} variant="secondary" disabled={guardando}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGuardarEdicion} variant="primary" loading={guardando}>
                    Guardar cambios
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SesionesRegistradas;
