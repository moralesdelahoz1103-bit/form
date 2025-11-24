import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Toast from '../common/Toast';
import { sesionesService } from '../../services/sesiones';
import { validations } from '../../utils/validations';
import './CrearCapacitacion.css';

const CrearCapacitacion = () => {
  const [formData, setFormData] = useState({
    tema: '',
    fecha: '',
    tipo_actividad: '',
    facilitador: '',
    contenido: '',
    hora_inicio: '',
    hora_fin: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [linkGenerado, setLinkGenerado] = useState('');

  const tiposActividad = ['Inducción', 'Formación', 'Evento'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      const error = validations[name]?.(value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos requeridos
    if (!formData.tema || formData.tema.trim() === '') {
      newErrors.tema = 'El tema es requerido';
    }
    if (!formData.fecha || formData.fecha.trim() === '') {
      newErrors.fecha = 'La fecha es requerida';
    }
    if (!formData.tipo_actividad || formData.tipo_actividad.trim() === '') {
      newErrors.tipo_actividad = 'El tipo de actividad es requerido';
    }
    if (!formData.facilitador || formData.facilitador.trim() === '') {
      newErrors.facilitador = 'El facilitador es requerido';
    }
    if (!formData.contenido || formData.contenido.trim() === '') {
      newErrors.contenido = 'El contenido es requerido';
    }
    if (!formData.hora_inicio || formData.hora_inicio.trim() === '') {
      newErrors.hora_inicio = 'La hora de inicio es requerida';
    }
    if (!formData.hora_fin || formData.hora_fin.trim() === '') {
      newErrors.hora_fin = 'La hora de fin es requerida';
    }
    
    // Validar con reglas específicas
    Object.keys(formData).forEach(key => {
      if (!newErrors[key] && validations[key]) {
        const error = validations[key](formData[key]);
        if (error) newErrors[key] = error;
      }
    });

    if (formData.hora_fin && formData.hora_inicio) {
      if (formData.hora_fin <= formData.hora_inicio) {
        newErrors.hora_fin = 'Hora fin debe ser posterior a hora inicio';
      }
    }

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
    console.log('Datos a enviar:', formData);

    try {
      const response = await sesionesService.crear(formData);
      console.log('Respuesta del servidor:', response);
      setLinkGenerado(response.link);
      setToast({ message: '¡Capacitación creada exitosamente!', type: 'success' });
      
      // Limpiar formulario
      setFormData({
        tema: '',
        fecha: '',
        tipo_actividad: '',
        facilitador: '',
        contenido: '',
        hora_inicio: '',
        hora_fin: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error message:', error.message);
      console.error('Error detail:', error.detail);
      setToast({ 
        message: error.message || error.detail || 'Error al crear la capacitación', 
        type: 'error' 
      });
      setLinkGenerado(''); // Limpiar link previo en caso de error
    } finally {
      setSubmitting(false);
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkGenerado);
    setToast({ message: '¡Link copiado al portapapeles!', type: 'success' });
  };

  return (
    <div className="crear-capacitacion">
      <div className="page-header">
        <h1 className="page-title">Crear Nueva Capacitación</h1>
        <p className="page-subtitle">Complete el formulario para generar un enlace de registro</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <Input
            label="Tema / Título"
            name="tema"
            value={formData.tema}
            onChange={handleChange}
            error={errors.tema}
            placeholder="Ej: Inducción a la Empresa"
            required
          />

          <div className="form-row">
            <Input
              label="Fecha"
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              error={errors.fecha}
              required
            />

            <Select
              label="Tipo de Actividad"
              name="tipo_actividad"
              value={formData.tipo_actividad}
              onChange={handleChange}
              options={tiposActividad}
              error={errors.tipo_actividad}
              required
            />
          </div>

          <Input
            label="Facilitador / Instructor"
            name="facilitador"
            value={formData.facilitador}
            onChange={handleChange}
            error={errors.facilitador}
            placeholder="Ej: María García"
            required
          />

          <div className="form-group">
            <label className="input-label">
              Contenido / Descripción <span className="required">*</span>
            </label>
            <textarea
              name="contenido"
              value={formData.contenido}
              onChange={handleChange}
              className={`textarea ${errors.contenido ? 'input-error' : ''}`}
              placeholder="Describe los temas que se tratarán en la capacitación..."
              rows={5}
            />
            {errors.contenido && <span className="error-message">{errors.contenido}</span>}
          </div>

          <div className="form-row">
            <Input
              label="Hora de Inicio"
              type="time"
              name="hora_inicio"
              value={formData.hora_inicio}
              onChange={handleChange}
              error={errors.hora_inicio}
              required
            />

            <Input
              label="Hora de Fin"
              type="time"
              name="hora_fin"
              value={formData.hora_fin}
              onChange={handleChange}
              error={errors.hora_fin}
              required
            />
          </div>

          <Button type="submit" loading={submitting} fullWidth>
            Crear Capacitación
          </Button>
        </form>

        {linkGenerado && (
          <div className="link-generado">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'middle'}}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Link de Registro Generado
            </h3>
            <div className="link-box">
              <input
                type="text"
                value={linkGenerado}
                readOnly
                className="link-input"
              />
              <Button onClick={copiarLink} variant="secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copiar
              </Button>
            </div>
            <p className="link-info">
              Comparte este enlace con los participantes de la capacitación
            </p>
          </div>
        )}
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

export default CrearCapacitacion;
