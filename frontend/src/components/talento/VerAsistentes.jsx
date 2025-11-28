import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Button from '../common/Button';
import Select from '../common/Select';
import Modal from '../common/Modal';
import Loading from '../common/Loading';
import Toast from '../common/Toast';
import { sesionesService } from '../../services/sesiones';
import { formatters } from '../../utils/formatters';
import { config } from '../../utils/constants';
import './VerAsistentes.css';

const VerAsistentes = () => {

    // Exportar asistentes y datos de la sesión a XLSX como tabla nativa
    const exportarXLSX = async () => {
      if (!sesionActual || asistentes.length === 0) return;
      const encabezados = ['Cédula', 'Nombre', 'Cargo', 'Unidad', 'Correo', 'Fecha'];
      const datos = asistentes.map(a => ([
        a.cedula || '',
        a.nombre || '',
        a.cargo || '',
        a.unidad || '',
        a.correo || '',
        formatters.fechaHora(a.fecha_registro) || ''
      ]));
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Asistentes');
      // Información de la sesión en filas separadas, cada dato en dos celdas
      worksheet.addRow(['Tema:', sesionActual.tema || '']);
      worksheet.addRow(['Fecha:', formatters.fechaCorta(sesionActual.fecha) || '']);
      worksheet.addRow(['Facilitador:', sesionActual.facilitador || '']);
      worksheet.addRow(['Tipo de actividad:', sesionActual.tipo_actividad || '']);
      worksheet.addRow(['Hora inicio:', sesionActual.hora_inicio || '']);
      worksheet.addRow(['Hora final:', sesionActual.hora_fin || '']);
      worksheet.addRow([]); // Espacio
      // Tabla de asistentes
      worksheet.addTable({
        name: 'AsistentesTable',
        ref: 'A8',
        headerRow: true,
        style: {
          theme: 'TableStyleMedium9',
          showRowStripes: true,
        },
        columns: encabezados.map(h => ({ name: h })),
        rows: datos
      });
      // Encabezado verde
      const headerRow = worksheet.getRow(8);
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF257137' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });
      // Ajustar ancho de columnas
      encabezados.forEach((h, idx) => {
        worksheet.getColumn(idx + 1).width = Math.max(h.length + 2, 18);
      });
      // Ajustar ancho de columnas para info de sesión
      worksheet.getColumn(1).width = 18;
      worksheet.getColumn(2).width = 30;
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `asistentes_${sesionActual.tema || 'evento'}.xlsx`);
    };
  const [sesiones, setSesiones] = useState([]);
  const [sesionSeleccionada, setSesionSeleccionada] = useState('');
  const [asistentes, setAsistentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAsistentes, setLoadingAsistentes] = useState(false);
  const [firmaModal, setFirmaModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSesiones();
  }, []);

  useEffect(() => {
    if (sesionSeleccionada) {
      loadAsistentes();
    }
  }, [sesionSeleccionada]);

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

  const loadAsistentes = async () => {
    setLoadingAsistentes(true);
    try {
      const data = await sesionesService.obtenerAsistentes(sesionSeleccionada);
      setAsistentes(data);
    } catch (error) {
      setToast({ message: 'Error al cargar asistentes', type: 'error' });
    } finally {
      setLoadingAsistentes(false);
    }
  };

  const sesionOptions = sesiones.map(s => ({
    value: s.id,
    label: `${s.tema} — ${formatters.fechaCorta(s.fecha)}`
  }));

  const sesionActual = sesiones.find(s => s.id === sesionSeleccionada);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="ver-asistentes">
      <div className="page-header">
        <h1 className="page-title">Ver asistentes</h1>
        <p className="page-subtitle">Consulta los participantes registrados en cada formación o evento</p>
      </div>

      <div className="card">
        <Select
          label="Seleccionar formación o evento"
          value={sesionSeleccionada}
          onChange={(e) => setSesionSeleccionada(e.target.value)}
          options={sesionOptions}
          placeholder="Elige una formación o evento..."
        />

        {sesionActual && (
          <div className="sesion-info-box">
            <div className="sesion-info-header">
              <h3>{sesionActual.tema}</h3>
              <Button onClick={exportarXLSX} variant="primary">
                Exportar Excel
              </Button>
            </div>
            <div className="info-grid">
              <div>
                <span className="label">Fecha:</span>
                <span className="valor">{formatters.fechaCorta(sesionActual.fecha)}</span>
              </div>
              <div>
                <span className="label">Horario:</span>
                <span className="valor">
                  {sesionActual.hora_inicio} - {sesionActual.hora_fin}
                </span>
              </div>
              <div>
                <span className="label">Facilitador:</span>
                <span className="valor">{sesionActual.facilitador}</span>
              </div>
              <div>
                <span className="label">Total Asistentes:</span> 
                <span className="badge-total">{asistentes.length}</span>
              </div>
            </div>
          </div>
        )}

        {loadingAsistentes ? (
          <Loading />
        ) : asistentes.length === 0 && sesionSeleccionada ? (
          <div className="empty-asistentes">
            <p>Aún no hay asistentes registrados para esta formación o evento</p>
          </div>
        ) : asistentes.length > 0 ? (
          <div className="tabla-wrapper">
            <table className="tabla-asistentes">
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Cargo</th>
                  <th>Unidad</th>
                  <th>Correo</th>
                  <th>Fecha Registro</th>
                  <th>Firma</th>
                </tr>
              </thead>
              <tbody>
                {asistentes.map((asistente, index) => (
                  <tr key={asistente.id}>
                    <td>{asistente.cedula}</td>
                    <td>{asistente.nombre}</td>
                    <td>{asistente.cargo}</td>
                    <td>{asistente.unidad}</td>
                    <td className="email-cell">{asistente.correo}</td>
                    <td>{formatters.fechaHora(asistente.fecha_registro)}</td>
                    <td>
                      <button
                        onClick={() => {
                          // Limpiar la ruta: remover ./ y convertir \ a /
                          const cleanPath = asistente.firma_path
                            .replace(/^\.\//, '')
                            .replace(/\\/g, '/');
                          setFirmaModal(cleanPath);
                        }}
                        className="btn-ver-firma"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={!!firmaModal}
        onClose={() => setFirmaModal(null)}
        title="Firma Digital"
        size="md"
      >
        <div className="firma-modal-content">
          {firmaModal && (
            <img 
              src={`${config.apiUrl}/${firmaModal}`} 
              alt="Firma" 
              className="firma-imagen"
            />
          )}
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

export default VerAsistentes;
