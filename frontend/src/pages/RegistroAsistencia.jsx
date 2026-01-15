import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/common/Header';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Toast from '../components/common/Toast';
import FirmaCanvas from '../components/asistente/FirmaCanvas';
import PantallaExito from '../components/asistente/PantallaExito';
import { asistentesService } from '../services/asistentes';
import { validations } from '../utils/validations';
import { formatters } from '../utils/formatters';
import './RegistroAsistencia.css';

const RegistroAsistencia = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [sesion, setSesion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    cargo: '',
    unidad: '',
    correo: '',
    firma: '',
    autorizacion: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (token) {
      loadSesion();
    } else {
      setToast({ message: 'Token no proporcionado', type: 'error' });
      setLoading(false);
    }
  }, [token]);

  const loadSesion = async () => {
    try {
      const data = await asistentesService.obtenerSesionPorToken(token);
      setSesion(data);
    } catch (error) {
      setToast({ 
        message: error.message || 'No se pudo cargar la información de la capacitación', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cedula') {
      formattedValue = formatters.cedula(value);
    } else if (['nombre', 'cargo', 'unidad'].includes(name)) {
      formattedValue = formatters.nombre(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Validar en tiempo real
    if (errors[name]) {
      const error = validations[name](formattedValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleFirmaChange = (firma) => {
    setFormData(prev => ({ ...prev, firma }));
    if (errors.firma) {
      setErrors(prev => ({ ...prev, firma: firma ? null : 'La firma es obligatoria' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach(key => {
      if (key === 'firma') {
        if (!formData.firma) {
          newErrors.firma = 'La firma es obligatoria';
        }
      } else if (key === 'autorizacion') {
        if (!formData.autorizacion) {
          newErrors.autorizacion = 'Debe autorizar el tratamiento de datos personales';
        }
      } else if (validations[key]) {
        const error = validations[key](formData[key]);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setToast({ message: 'Por favor verifica los campos del formulario', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      // Construir FormData y convertir la firma (dataURL) a Blob
      const fd = new FormData();
      fd.append('cedula', formData.cedula);
      fd.append('nombre', formData.nombre);
      fd.append('cargo', formData.cargo);
      fd.append('unidad', formData.unidad);
      fd.append('correo', formData.correo);
      fd.append('token', token);

      // Convertir dataURL a Blob
      const dataUrl = formData.firma;
      const dataURLtoBlob = (dataurl) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };

      const blob = dataURLtoBlob(dataUrl);
      const filename = `${formData.cedula || 'firma'}.png`;
      fd.append('firma', blob, filename);

      await asistentesService.registrar(fd);
      setSuccess(true);
    } catch (error) {
      setToast({ 
        message: (error.response && error.response.data && error.response.data.detail) || error.message || 'Error al registrar la asistencia', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (success) {
    return <PantallaExito />;
  }

  if (!sesion) {
    return (
      <div className="error-page">
        <h1>Formación o evento no encontrado</h1>
        <p>El enlace proporcionado no es válido o ha expirado.</p>
      </div>
    );
  }

  return (
    <div className="registro-page">
      <Header />
      
      <div className="registro-container">
        <div className="registro-card">
          <div className="sesion-info">
            <h1 className="sesion-titulo">{sesion.tema}</h1>
            <div className="sesion-detalles">
              <div className="sesion-detalle">
                <span className="detalle-label">Fecha:</span>
                <span className="detalle-value">{formatters.fecha(sesion.fecha)}</span>
              </div>
              <div className="sesion-detalle">
                <span className="detalle-label">Horario:</span>
                <span className="detalle-value">{sesion.hora_inicio} - {sesion.hora_fin}</span>
              </div>
              <div className="sesion-detalle">
                <span className="detalle-label">Facilitador:</span>
                <span className="detalle-value">{sesion.facilitador}</span>
              </div>
              <div className="sesion-detalle">
                <span className="detalle-label">Tipo:</span>
                <span className="detalle-value">{sesion.tipo_actividad}</span>
              </div>
              {sesion.responsable && (
                <div className="sesion-detalle">
                  <span className="detalle-label">Responsable:</span>
                  <span className="detalle-value">{sesion.responsable}</span>
                </div>
              )}
              {sesion.cargo && (
                <div className="sesion-detalle">
                  <span className="detalle-label">Cargo:</span>
                  <span className="detalle-value">{sesion.cargo}</span>
                </div>
              )}
            </div>
            {sesion.contenido && (
              <div className="sesion-contenido">
                <h3>Descripción:</h3>
                <p>{sesion.contenido}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="registro-form">
            <h2 className="form-title">Registro de asistencia</h2>
            
            <div className="form-grid">
              <Input
                label="Cédula"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                error={errors.cedula}
                placeholder="Ej: 1234567890"
                required
                maxLength={10}
              />

              <Input
                label="Nombres y apellidos"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                error={errors.nombre}
                placeholder="Ej: Juan Pérez"
                required
              />

              <Input
                label="Cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                error={errors.cargo}
                placeholder="Ej: Analista"
                required
              />

              <Input
                label="Unidad/Area"
                name="unidad"
                value={formData.unidad}
                onChange={handleChange}
                error={errors.unidad}
                placeholder="Ej: Recursos Humanos"
                required
              />
            </div>

            <Input
              label="Correo"
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              error={errors.correo}
              placeholder="correo@fundacionsantodomingo.org"
              required
            />

            <FirmaCanvas 
              onChange={handleFirmaChange}
              error={errors.firma}
            />

            <div className="autorizacion-container">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="autorizacion"
                  checked={formData.autorizacion}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, autorizacion: e.target.checked }));
                    if (errors.autorizacion && e.target.checked) {
                      setErrors(prev => ({ ...prev, autorizacion: null }));
                    }
                  }}
                  className="checkbox-input"
                />
                <span className="checkbox-text">
                  Autorizo a Fundación Santo Domingo-FSD al tratamiento de mis datos personales conforme a la política de Tratamiento de Datos Personales.{' '}
                  <a 
                    href="https://fundacionsantodomingo.org/conocenos/politica-de-proteccion-de-datos/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="politica-link"
                  >
                    Ver más
                  </a>
                </span>
              </label>
              {errors.autorizacion && <span className="error-message">{errors.autorizacion}</span>}
            </div>

            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
              fullWidth
            >
              Registrar asistencia
            </Button>
          </form>
        </div>
      </div>

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

export default RegistroAsistencia;
