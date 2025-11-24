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
    firma: ''
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
      setToast({ message: 'Por favor corrige los errores en el formulario', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      await asistentesService.registrar({
        ...formData,
        token
      });
      setSuccess(true);
    } catch (error) {
      setToast({ 
        message: error.message || 'Error al registrar la asistencia', 
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
        <h1>Capacitación no encontrada</h1>
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
            </div>
            {sesion.contenido && (
              <div className="sesion-contenido">
                <h3>Descripción:</h3>
                <p>{sesion.contenido}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="registro-form">
            <h2 className="form-title">Registro de Asistencia</h2>
            
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
                label="Nombre Completo"
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
                label="Unidad/Departamento"
                name="unidad"
                value={formData.unidad}
                onChange={handleChange}
                error={errors.unidad}
                placeholder="Ej: Recursos Humanos"
                required
              />
            </div>

            <Input
              label="Correo Institucional"
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

            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
              fullWidth
            >
              Registrar Asistencia
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
