import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Toast from '../common/Toast';
import { sesionesService } from '../../services/sesiones';
import { validations } from '../../utils/validations';
import { tienePermiso } from '../../utils/permisos';
import './CrearCapacitacion.css';

const CrearCapacitacion = () => {
  const [puedeCrear, setPuedeCrear] = useState(false);
  const [verificandoPermisos, setVerificandoPermisos] = useState(true);
  const [formData, setFormData] = useState({
    tema: '',
    fecha: '',
    tipo_actividad: '',
    facilitador: '',
    responsable: '',
    cargo: '',
    contenido: '',
    hora_inicio: '',
    hora_fin: ''
  });

  // Campo editable cuando se selecciona "Otros"
  const [customTipo, setCustomTipo] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [linkGenerado, setLinkGenerado] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userName = userInfo.name || 'Usuario autenticado';
  const userEmail = userInfo.email || 'correo@fundacionsantodomingo.org';

  const tiposActividad = ['Inducción', 'Formación', 'Evento', 'Otros'];

  // Verificar permisos al cargar el componente
  useEffect(() => {
    const verificarPermisos = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        const puede = await Promise.race([
          tienePermiso('crear_sesiones'),
          timeoutPromise
        ]);
        setPuedeCrear(puede);
      } catch (error) {
        console.error('Error verificando permisos:', error);
        setPuedeCrear(false);
      } finally {
        setVerificandoPermisos(false);
      }
    };
    verificarPermisos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Si se está cambiando el campo custom_tipo, actualizamos su estado independiente
    if (name === 'custom_tipo') {
      setCustomTipo(value);
      if (errors.custom_tipo) {
        const error = validations.custom_tipo?.(value);
        setErrors(prev => ({ ...prev, custom_tipo: error }));
      }
      return;
    }

    // Si se selecciona otro tipo distinto a "Otros", limpiar customTipo
    if (name === 'tipo_actividad' && value !== 'Otros') {
      setCustomTipo('');
      setErrors(prev => ({ ...prev, custom_tipo: undefined }));
    }

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

    // Si seleccionó "Otros", validar el campo de texto
    if (formData.tipo_actividad === 'Otros') {
      if (!customTipo || customTipo.trim() === '') {
        newErrors.custom_tipo = 'Por favor especifica el tipo de actividad';
      }
    }
    if (!formData.facilitador || formData.facilitador.trim() === '') {
      newErrors.facilitador = 'El facilitador es requerido';
    }
    if (!formData.responsable || formData.responsable.trim() === '') {
      newErrors.responsable = 'El responsable es requerido';
    }
    if (!formData.cargo || formData.cargo.trim() === '') {
      newErrors.cargo = 'El cargo es requerido';
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
      // Si el usuario eligió "Otros", enviar el valor personalizado en tipo_actividad_custom
      const payload = {
        ...formData
      };
      
      if (formData.tipo_actividad === 'Otros') {
        payload.tipo_actividad_custom = customTipo;
      }

      const response = await sesionesService.crear(payload);
      console.log('Respuesta del servidor:', response);
      setLinkGenerado(response.link);
      setToast({ message: '¡Formulario creado exitosamente!', type: 'success' });
      
      // Limpiar formulario
      setFormData({
        tema: '',
        fecha: '',
        tipo_actividad: '',
        facilitador: '',
        responsable: '',
        cargo: '',
        contenido: '',
        hora_inicio: '',
        hora_fin: ''
      });
        setCustomTipo('');
      setErrors({});
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error message:', error.message);
      console.error('Error detail:', error.detail);
      setToast({ 
        message: error.message || error.detail || 'Error al crear la formación/evento', 
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



  // Mostrar mensaje si no tiene permisos
  if (verificandoPermisos) {
    return (
      <div className="crear-capacitacion">
        <div className="page-header">
          <h1 className="page-title">Crear formación o evento</h1>
        </div>
        <div className="card">
          <p style={{ textAlign: 'center', padding: '2rem' }}>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!puedeCrear) {
    return (
      <div className="crear-capacitacion">
        <div className="page-header">
          <h1 className="page-title">Crear formación o evento</h1>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ color: '#666', marginBottom: '1rem' }}>Acceso restringido</h3>
            <p style={{ color: '#999' }}>
              No tienes permisos para crear formaciones o eventos. Contacta a un administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="crear-capacitacion">
      <div className="page-header">
        <h1 className="page-title">Crear formación o evento</h1>
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
            placeholder="Ej: Inducción a la organización"
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
              label="Actividad"
              name="tipo_actividad"
              value={formData.tipo_actividad}
              onChange={handleChange}
              options={tiposActividad}
              error={errors.tipo_actividad}
              required
            />
            {formData.tipo_actividad === 'Otros' && (
              <div className="full-width">
                <Input
                  label="Especificar tipo de actividad"
                  name="custom_tipo"
                  value={customTipo}
                  onChange={handleChange}
                  error={errors.custom_tipo}
                  placeholder="Escribe el tipo de actividad"
                  required
                />
              </div>
            )}
          </div>

          <Input
            label="Facilitador"
            name="facilitador"
            value={formData.facilitador}
            onChange={handleChange}
            error={errors.facilitador}
            placeholder="Ej: María García"
            required
          />

          <div className="form-row">
            <Input
              label="Responsable"
              name="responsable"
              value={formData.responsable}
              onChange={handleChange}
              error={errors.responsable}
              placeholder="¿Quién organiza la formación o evento?"
              required
            />

            <Input
              label="Cargo del responsable"
              name="cargo"
              value={formData.cargo}
              onChange={handleChange}
              error={errors.cargo}
              placeholder="Ej: Coordinador de Talento Humano"
              required
            />
          </div>

          <div className="form-group">
            <label className="input-label">
              Contenido<span className="required">*</span>
            </label>
            <textarea
              name="contenido"
              value={formData.contenido}
              onChange={handleChange}
              className={`textarea ${errors.contenido ? 'input-error' : ''}`}
              placeholder="Describe los temas que se tratarán en la formación o evento..."
              rows={5}
            />
            {errors.contenido && <span className="error-message">{errors.contenido}</span>}
          </div>

          <div className="form-row">
            <Input
              label="Hora de inicio"
              type="time"
              name="hora_inicio"
              value={formData.hora_inicio}
              onChange={handleChange}
              error={errors.hora_inicio}
              required
            />

            <Input
              label="Hora de fin"
              type="time"
              name="hora_fin"
              value={formData.hora_fin}
              onChange={handleChange}
              error={errors.hora_fin}
              required
            />
          </div>

          <Button type="submit" loading={submitting} fullWidth>
            Crear formulario
          </Button>
        </form>

        {linkGenerado && (
          <div className="link-generado">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'middle'}}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Link de registro generado
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
              Comparte este enlace con los participantes de la formacion o evento para que puedan registrar su asistencia
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
