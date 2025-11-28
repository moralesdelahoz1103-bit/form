import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Loading from '../common/Loading';
import Toast from '../common/Toast';
import { sesionesService } from '../../services/sesiones';
import { formatters } from '../../utils/formatters';
import './SesionesRegistradas.css';

const SesionesRegistradas = () => {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [filtros, setFiltros] = useState({
    tema: '',
    fecha: '',
    tipo: '',
    facilitador: ''
  });

  useEffect(() => {
    loadSesiones();
  }, []);

  const loadSesiones = async () => {
    try {
      const data = await sesionesService.listar();
      setSesiones(data);
    } catch (error) {
      setToast({ message: 'Error al cargar sesiones', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;

    setEliminando(true);
    try {
      await sesionesService.eliminar(modalEliminar.id);
      setToast({ message: 'Capacitación eliminada exitosamente', type: 'success' });
      setModalEliminar(null);
      loadSesiones();
    } catch (error) {
      setToast({ message: 'Error al eliminar capacitación', type: 'error' });
    } finally {
      setEliminando(false);
    }
  };

  const copiarLink = (link) => {
    navigator.clipboard.writeText(link);
    setToast({ message: '¡Link copiado!', type: 'success' });
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      tema: '',
      fecha: '',
      tipo: '',
      facilitador: ''
    });
  };

  // Exportar sesiones filtradas a XLSX como tabla nativa con exceljs
  const exportarXLSX = async () => {
    const encabezados = ['Tema', 'Fecha', 'Tipo de actividad', 'Facilitador', 'Hora inicio', 'Hora final'];
    const datos = sesionesFiltradas.map(sesion => ([
      sesion.tema || '',
      formatters.fechaCorta(sesion.fecha) || '',
      sesion.tipo_actividad || '',
      sesion.facilitador || '',
      sesion.hora_inicio || '',
      sesion.hora_fin || ''
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
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'sesiones.xlsx');
  };

  // Obtener opciones únicas para los filtros
  const temasUnicos = [...new Set(sesiones.map(s => s.tema).filter(Boolean))];
  const fechasUnicas = [...new Set(sesiones.map(s => s.fecha).filter(Boolean))].sort().reverse();
  const tiposUnicos = [...new Set(sesiones.map(s => s.tipo_actividad).filter(Boolean))];
  const facilitadoresUnicos = [...new Set(sesiones.map(s => s.facilitador).filter(Boolean))];

  const sesionesFiltradas = sesiones.filter(sesion => {
    const cumpleTema = !filtros.tema || sesion.tema === filtros.tema;
    const cumpleFecha = !filtros.fecha || sesion.fecha === filtros.fecha;
    const cumpleTipo = !filtros.tipo || sesion.tipo_actividad === filtros.tipo;
    const cumpleFacilitador = !filtros.facilitador || sesion.facilitador === filtros.facilitador;
    
    return cumpleTema && cumpleFecha && cumpleTipo && cumpleFacilitador;
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="sesiones-registradas">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sesiones registradas</h1>
          <p className="page-subtitle">Administra todas las sesiones creadas</p>
        </div>
        <div className="export-buttons">
          <Button onClick={exportarXLSX} variant="primary">
            Exportar XLSX
          </Button>
        </div>
      </div>

      {sesiones.length === 0 ? (
        <div className="empty-state">
          <p>No hay sesiones registradas aún</p>
          <p className="empty-subtitle">Crea tu primera sesión desde el menú "Crear sesión"</p>
        </div>
      ) : (
        <>
          <div className="filters-container">
            <div className="filters-grid">
              <div className="filter-field">
                <label className="filter-label">Tema / Título</label>
                <select
                  value={filtros.tema}
                  onChange={(e) => handleFiltroChange('tema', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos los temas</option>
                  {temasUnicos.map(tema => (
                    <option key={tema} value={tema}>{tema}</option>
                  ))}
                </select>
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
            </div>
            
            {(filtros.tema || filtros.fecha || filtros.tipo || filtros.facilitador) && (
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
                  <span className="info-label">👨Facilitador:</span>
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
                    <p className="qr-label">Código QR de Acceso:</p>
                    <img src={sesion.qr_code} alt="QR Code" className="qr-image" />
                  </div>
                )}
              </div>

              <div className="sesion-card-footer">
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
            <li>La sesión: <strong>{modalEliminar?.tema}</strong></li>
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
