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
  
  // Estados de permisos
  const [permisos, setPermisos] = useState({
    ver: true,
    editar: false,
    eliminar: false,
    exportar: false
  });
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
          tienePermiso('editar_sesiones'),
          tienePermiso('eliminar_sesiones'),
          tienePermiso('exportar_sesiones')
        ]);
        
        const [editar, eliminar, exportar] = await Promise.race([
          permisosPromise,
          timeoutPromise
        ]);
        
        setPermisos({
          ver: true,
          editar,
          eliminar,
          exportar
        });
      } catch (error) {
        console.error('Error cargando permisos:', error);
        // Mantener permisos por defecto
        setPermisos({
          ver: true,
          editar: false,
          eliminar: false,
          exportar: false
        });
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
        onClose={() => setModalDetalles(null)}
        title="Detalles de la formación o evento"
        size="md"
      >
        {modalDetalles && (
          <div className="modal-ver-detalle-content">
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
              <Button onClick={() => setModalDetalles(null)} variant="primary" fullWidth>
                Cerrar
              </Button>
            </div>
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
