import { useState } from 'react';
import { sesionesService } from '../../../../services/sesiones';
import { validations } from '../../../../utils/validations';
import { config } from '../../../../utils/constants';

export const useCapacitacionForm = () => {
    const [formData, setFormData] = useState({
        tema: '',
        fecha: '',
        actividad: '',
        facilitador_entidad: '',
        tipo_actividad: 'Interno',
        responsable: '',
        cargo_responsable: '',
        contenido: '',
        hora_inicio: '',
        hora_fin: '',
        dirigido_a: 'Personal FSD',
        modalidad: ''
    });

    const [customTipo, setCustomTipo] = useState('');
    const [toasts, setToasts] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [linkGenerado, setLinkGenerado] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [nombreFormacion, setNombreFormacion] = useState('');
    const [nuevaSesion, setNuevaSesion] = useState(null);

    const addToast = (message, type = 'error') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const addMultipleToasts = (messages) => {
        setToasts([]);
        const newToasts = messages.map(msg => ({ id: Math.random(), message: msg, type: 'error' }));
        setToasts(newToasts);
        setTimeout(() => {
            setToasts(prev => {
                const idsToRemove = newToasts.map(t => t.id);
                return prev.filter(t => !idsToRemove.includes(t.id));
            });
        }, 5000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = value;
        if (type === 'checkbox') {
            if (name === 'dirigido_a') {
                finalValue = checked ? 'Externa' : 'Interna';
            } else {
                finalValue = checked;
            }
        }

        if (name === 'actividad_custom') {
            setCustomTipo(finalValue);
        }
        if (name === 'actividad' && finalValue !== 'Otros (eventos)') {
            setCustomTipo('');
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));

        const error = validations[name]?.(finalValue);
        if (name === 'actividad_custom') {
            if (!finalValue || finalValue.trim() === '') {
                setErrors(prev => ({ ...prev, actividad_custom: 'Por favor especifica el tipo de actividad' }));
            } else {
                setErrors(prev => { const { actividad_custom, ...rest } = prev; return rest; });
            }
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                if (error) { newErrors[name] = error; } else { delete newErrors[name]; }
                return newErrors;
            });
        }
    };

    const validateForm = (recurrenceData) => {
        const newErrors = {};

        if (!formData.tema?.trim()) newErrors.tema = 'El tema es requerido';
        if (!formData.fecha?.trim()) newErrors.fecha = 'La fecha es requerida';
        if (!formData.actividad?.trim()) newErrors.actividad = 'La actividad es requerida';
        if (formData.actividad === 'Otros (eventos)' && (!customTipo || customTipo.trim() === '')) {
            newErrors.actividad_custom = 'Por favor especifica el tipo de actividad';
        }
        if (!formData.facilitador_entidad?.trim()) newErrors.facilitador_entidad = 'El facilitador es requerido';
        if (!formData.responsable?.trim()) newErrors.responsable = 'El responsable es requerido';
        if (!formData.cargo_responsable?.trim()) newErrors.cargo_responsable = 'El cargo es requerido';
        if (!formData.contenido?.trim()) newErrors.contenido = 'El contenido es requerido';
        if (!formData.hora_inicio?.trim()) newErrors.hora_inicio = 'La hora de inicio es requerida';
        if (!formData.hora_fin?.trim()) newErrors.hora_fin = 'La hora de fin es requerida';
        if (!formData.tipo_actividad) newErrors.tipo_actividad = 'El tipo de actividad es requerido';
        if (!formData.dirigido_a) newErrors.dirigido_a = 'El campo dirigido a es requerido';
        if (!formData.modalidad) newErrors.modalidad = 'La modalidad es obligatoria';

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

        const nuevosErroresOc = {};
        if (recurrenceData?.esRecurrente) {
            recurrenceData.ocurrenciasProgramadas.forEach(oc => {
                const ocErrors = {};
                if (!oc.fecha) ocErrors.fecha = 'La fecha es requerida';
                if (oc.hora_inicio && oc.hora_fin && oc.hora_fin <= oc.hora_inicio) {
                    ocErrors.hora_fin = 'Hora fin debe ser posterior a hora inicio';
                }
                if (Object.keys(ocErrors).length > 0) nuevosErroresOc[oc.id] = ocErrors;
            });
        }

        setErrors(newErrors);
        return {
            isValid: Object.keys(newErrors).length === 0 && Object.keys(nuevosErroresOc).length === 0,
            errors: newErrors,
            nuevosErroresOc
        };
    };

    const handleSubmit = async (e, recurrenceData, onClearRecurrence) => {
        e.preventDefault();
        const { isValid, errors: formErrors, nuevosErroresOc } = validateForm(recurrenceData);

        if (!isValid) {
            recurrenceData?.setErroresOcurrencias(nuevosErroresOc);
            const allErrorMessages = [
                ...Object.values(formErrors),
                ...Object.values(nuevosErroresOc).flatMap(oe => Object.values(oe))
            ];
            addMultipleToasts(allErrorMessages.length ? allErrorMessages : ['Por favor corrige los errores']);
            return;
        }

        setSubmitting(true);
        try {
            const payload = { ...formData };

            if (formData.actividad === 'Otros (eventos)') {
                payload.actividad_custom = customTipo;
            }

            payload.es_recurrente = recurrenceData?.esRecurrente || false;
            if (payload.es_recurrente && recurrenceData?.ocurrenciasProgramadas?.length > 0) {
                payload.ocurrencias_programadas = recurrenceData.ocurrenciasProgramadas.map(oc => ({
                    fecha: oc.fecha,
                    hora_inicio: oc.hora_inicio || null,
                    hora_fin: oc.hora_fin || null,
                    facilitador_entidad: oc.facilitador || null,
                    contenido: oc.contenido || null,
                }));
            } else {
                payload.ocurrencias_programadas = [];
            }

            const response = await sesionesService.crear(payload);
            setLinkGenerado(response.link);
            setNombreFormacion(formData.tema);
            setNuevaSesion(response);
            setShowModal(true);
            addToast('¡Formulario creado exitosamente!', 'success');

            setFormData({
                tema: '', fecha: '', actividad: '', facilitador_entidad: '', responsable: '',
                cargo_responsable: '', contenido: '', hora_inicio: '', hora_fin: '',
                dirigido_a: 'Personal FSD', modalidad: '', tipo_actividad: 'Interno'
            });
            setCustomTipo('');
            setErrors({});
            onClearRecurrence?.();
        } catch (error) {
            console.error('Error:', error);
            addToast(error.message || error.detail || 'Error al crear la formación', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const copiarLink = () => {
        navigator.clipboard.writeText(linkGenerado);
        addToast('¡Link copiado al portapapeles!', 'success');
    };

    const copiarQR = async () => {
        try {
            if (!nuevaSesion?.id) { addToast('QR no disponible', 'error'); return; }
            const qrUrl = `${config.apiUrl}/api/sesiones/${nuevaSesion.id}/qr`;
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            addToast('¡QR copiado al portapapeles!', 'success');
        } catch (error) {
            addToast('Error al copiar QR', 'error');
        }
    };

    const descargarQR = async () => {
        if (!nuevaSesion?.id) { addToast('QR no disponible', 'error'); return; }
        try {
            const qrUrl = `${config.apiUrl}/api/sesiones/${nuevaSesion.id}/qr`;
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const nombreArchivo = nombreFormacion ? `QR-${nombreFormacion.replace(/[^a-zA-Z0-9]/g, '_')}` : 'QR-formacion';
            link.download = `${nombreArchivo}.png`;
            link.href = url;
            link.click();
            window.URL.revokeObjectURL(url);
            addToast('¡QR descargado!', 'success');
        } catch (error) {
            addToast('Error al descargar QR', 'error');
        }
    };

    const cerrarModal = () => {
        setShowModal(false);
        setLinkGenerado('');
        setNuevaSesion(null);
        setNombreFormacion('');
    };

    return {
        formData,
        errors,
        submitting,
        toasts,
        linkGenerado,
        showModal,
        nombreFormacion,
        nuevaSesion,
        customTipo,
        handleChange,
        handleSubmit,
        addToast,
        removeToast,
        copiarLink,
        copiarQR,
        descargarQR,
        cerrarModal
    };
};
