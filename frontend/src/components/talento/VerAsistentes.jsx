import React, { useState, useEffect } from 'react';
import Select from '../common/Select';
import Modal from '../common/Modal';
import Loading from '../common/Loading';
import Toast from '../common/Toast';
import { sesionesService } from '../../services/sesiones';
import { formatters } from '../../utils/formatters';
import './VerAsistentes.css';

const VerAsistentes = () => {
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
      setToast({ message: 'Error al cargar sesiones', type: 'error' });
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
        <h1 className="page-title">Ver Asistentes</h1>
        <p className="page-subtitle">Consulta los participantes registrados en cada capacitación</p>
      </div>

      <div className="card">
        <Select
          label="Seleccionar Capacitación"
          value={sesionSeleccionada}
          onChange={(e) => setSesionSeleccionada(e.target.value)}
          options={sesionOptions}
          placeholder="Elige una capacitación..."
        />

        {sesionActual && (
          <div className="sesion-info-box">
            <div className="sesion-info-header">
              <h3>{sesionActual.tema}</h3>
            </div>
            <div className="info-grid">
              <div>
                <span className="label">Fecha:</span> {formatters.fechaCorta(sesionActual.fecha)}
              </div>
              <div>
                <span className="label">Horario:</span> {sesionActual.hora_inicio} - {sesionActual.hora_fin}
              </div>
              <div>
                <span className="label">Facilitador:</span> {sesionActual.facilitador}
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
            <p>Aún no hay asistentes registrados para esta sesión</p>
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
              src={`http://localhost:8000/${firmaModal}`} 
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
