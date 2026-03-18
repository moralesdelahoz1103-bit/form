import React, { useState } from 'react';
import { Header, Input, Button, Toast } from '../../../../components/common';
import PantallaExito from '../../../../components/asistente/PantallaExito';
import { asistentesService } from '../../../../services/asistentes';
import { validations } from '../../../../utils/validations';
import { formatters } from '../../../../utils/formatters';
import '../Registro.css';

const RegistroInterno = ({ sesion, token }) => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    cargo: '',
    unidad: '',
    correo: '',
    autorizacion: false
  });

  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const buscarAsistente = async (cedula) => {
    const cleanCedula = cedula.replace(/\D/g, '');
    if (cleanCedula.length >= 8) {
      setIsSearching(true);
      try {
        const asistente = await asistentesService.buscarPorCedula(cleanCedula);
        if (asistente) {
          setFormData(prev => ({
            ...prev,
            nombre: asistente.nombre || '',
            cargo: asistente.cargo || '',
            unidad: asistente.unidad || '',
            correo: asistente.correo || '',
          }));
          setIsExistingUser(true);
        } else {
          setIsExistingUser(false);
        }
      } catch (error) {
        setIsExistingUser(false);
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
    }
  };

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cedula') {
      formattedValue = formatters.cedula(value);
      const cleanValue = formattedValue.replace(/\D/g, '');
      if (cleanValue.length >= 8) {
        buscarAsistente(cleanValue);
      } else {
        setHasSearched(false);
        setIsExistingUser(false);
        setFormData(prev => ({
          ...prev,
          nombre: '',
          cargo: '',
          unidad: '',
          correo: ''
        }));
      }
    } else if (['nombre', 'cargo', 'unidad'].includes(name)) {
      formattedValue = formatters.nombre(value);
    } else if (name === 'correo') {
      formattedValue = value.toLowerCase();
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));

    // Validar en tiempo real
    if (errors[name]) {
      const error = validations[name](formattedValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    
    // Si la persona existe, actualizamos sus datos al perder el foco
    if (isExistingUser && ['nombre', 'cargo', 'unidad', 'correo'].includes(name)) {
      const error = validations[name] ? validations[name](value) : null;
      if (!error) {
        try {
          await asistentesService.actualizarAsistente(formData.cedula, { [name]: value });
        } catch (error) {
          console.error(`Error actualizando el campo ${name}:`, error);
        }
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach(key => {
      if (key === 'autorizacion') {
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
      await asistentesService.registrarInterno({
        cedula: formData.cedula,
        nombre: formData.nombre,
        cargo: formData.cargo,
        unidad: formData.unidad,
        correo: formData.correo,
        token: token
      });
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

  if (success) {
    return <PantallaExito />;
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
                <span className="detalle-value">{sesion.facilitador_entidad}</span>
              </div>
              {sesion.responsable && (
                <div className="sesion-detalle">
                  <span className="detalle-label">Responsable:</span>
                  <span className="detalle-value">{sesion.responsable}</span>
                </div>
              )}
              {sesion.cargo_responsable && (
                <div className="sesion-detalle">
                  <span className="detalle-label">Cargo responsable:</span>
                  <span className="detalle-value">{sesion.cargo_responsable}</span>
                </div>
              )}
              <div className="sesion-detalle">
                <span className="detalle-label">Actividad:</span>
                <span className="detalle-value">{sesion.actividad}</span>
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
                loading={isSearching}
              />

              <Input
                label="Nombres y apellidos"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.nombre}
                placeholder={!hasSearched ? "Ingresa la cédula primero" : "Ej: Juan Pérez"}
                required
                disabled={!hasSearched || isSearching}
              />

              <Input
                label="Cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.cargo}
                placeholder={!hasSearched ? "Ingresa la cédula primero" : "Ej: Analista"}
                required
                disabled={!hasSearched || isSearching}
              />

              <Input
                label="Dirección"
                name="unidad"
                value={formData.unidad}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.unidad}
                placeholder={!hasSearched ? "Ingresa la cédula primero" : "Ej: Recursos Humanos"}
                required
                disabled={!hasSearched || isSearching}
              />

              <Input
                label="Correo electrónico"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.correo}
                placeholder={!hasSearched ? "Ingresa la cédula primero" : "Ej: usuario@empresa.com"}
                required
                type="email"
                disabled={!hasSearched || isSearching}
              />
            </div>

            <div className={`autorizacion-container ${formData.autorizacion ? 'accepted' : ''}`}>
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
                  Autorizo a Fundación Santo Domingo para el tratamiento de mis datos personales conforme con la política de Protección de Datos Personales.{' '}
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
        <div className="toast-container">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
};

export default RegistroInterno;
