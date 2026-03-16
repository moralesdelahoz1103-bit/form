import { useState } from 'react';
import { sesionesService } from '../../../../services/sesiones';

export const useSesionEditor = (setSesiones, setToast) => {
    const [modalDetalles, setModalDetalles] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({});
    const [erroresEdicion, setErroresEdicion] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [customTipoEdicion, setCustomTipoEdicion] = useState('');
    const [sesionTabActiva, setSesionTabActiva] = useState('__principal__');

    // Estado para agregar nuevas ocurrencias desde el modal de detalles
    const [mostrarFormOcurrencia, setMostrarFormOcurrencia] = useState(false);
    const [nuevaOcurrencia, setNuevaOcurrencia] = useState({
        fecha: '', hora_inicio: '', hora_fin: '', facilitador: '', contenido: ''
    });
    const [mostrarContenidoNuevaOc, setMostrarContenidoNuevaOc] = useState(false);
    const [guardandoOcurrencia, setGuardandoOcurrencia] = useState(false);

    const handleEditar = () => {
        const tabActualData = sesionTabActiva === '__principal__'
            ? modalDetalles
            : (modalDetalles.ocurrencias || []).find(oc => oc.id === sesionTabActiva) || {};

        setDatosEdicion({
            tema: tabActualData.tema || modalDetalles.tema || '',
            fecha: tabActualData.fecha || '',
            hora_inicio: tabActualData.hora_inicio || '',
            hora_fin: tabActualData.hora_fin || '',
            facilitador_entidad: tabActualData.facilitador_entidad || modalDetalles.facilitador_entidad || '',
            tipo_actividad: tabActualData.tipo_actividad || modalDetalles.tipo_actividad || 'Interno',
            actividad: tabActualData.actividad || modalDetalles.actividad || '',
            dirigido_a: tabActualData.dirigido_a || modalDetalles.dirigido_a || '',
            modalidad: tabActualData.modalidad || modalDetalles.modalidad || '',
            responsable: tabActualData.responsable || modalDetalles.responsable || '',
            cargo_responsable: tabActualData.cargo_responsable || modalDetalles.cargo_responsable || '',
            contenido: tabActualData.contenido || modalDetalles.contenido || ''
        });
        setModoEdicion(true);
    };

    const handleCancelarEdicion = () => {
        setModoEdicion(false);
        setDatosEdicion({});
        setErroresEdicion({});
        setCustomTipoEdicion('');
    };

    const handleCambioEdicion = (campo, valor) => {
        if (campo === 'actividad_custom') {
            setCustomTipoEdicion(valor);
            if (erroresEdicion.actividad_custom) {
                setErroresEdicion(prev => ({ ...prev, actividad_custom: null }));
            }
            return;
        }
        if (campo === 'actividad' && !valor.startsWith('Otros')) {
            setCustomTipoEdicion('');
            setErroresEdicion(prev => ({ ...prev, actividad_custom: undefined }));
        }
        setDatosEdicion(prev => ({ ...prev, [campo]: valor }));
        if (erroresEdicion[campo]) {
            setErroresEdicion(prev => ({ ...prev, [campo]: null }));
        }
    };

    const validarEdicion = () => {
        const errores = {};
        const esPrincipal = sesionTabActiva === '__principal__';
        if (esPrincipal) {
            if (!datosEdicion.hora_inicio) errores.hora_inicio = 'Hora inicio es obligatoria';
            if (!datosEdicion.hora_fin) errores.hora_fin = 'Hora fin es obligatoria';
            if (!datosEdicion.actividad) errores.actividad = 'Selecciona un tipo';
            if (datosEdicion.actividad?.startsWith('Otros') && !customTipoEdicion?.trim()) {
                errores.actividad_custom = 'Especifica el tipo';
            }
            if (!datosEdicion.contenido?.trim()) errores.contenido = 'El contenido es obligatorio';
            if (datosEdicion.contenido?.trim() && datosEdicion.contenido.trim().length < 100) {
                errores.contenido = 'El contenido debe tener al menos 100 caracteres';
            }
            if (!datosEdicion.facilitador_entidad?.trim()) errores.facilitador_entidad = 'El facilitador es obligatorio';
            if (!datosEdicion.dirigido_a) errores.dirigido_a = 'Selecciona a quién va dirigido';
            if (!datosEdicion.modalidad) errores.modalidad = 'Selecciona una modalidad';
            if (!datosEdicion.responsable?.trim()) errores.responsable = 'El responsable es obligatorio';
            if (!datosEdicion.cargo_responsable?.trim()) errores.cargo_responsable = 'El cargo es obligatorio';
        }
        if (!datosEdicion.fecha) errores.fecha = 'La fecha es obligatoria';
        setErroresEdicion(errores);
        return Object.keys(errores).length === 0;
    };

    const handleGuardarEdicion = async () => {
        if (!validarEdicion()) return;
        setGuardando(true);
        try {
            const datosParaGuardar = {
                ...datosEdicion,
                actividad: datosEdicion.actividad?.startsWith('Otros') ? customTipoEdicion : datosEdicion.actividad,
            };

            // Si se cambió el tema, actualizar en modalDetalles (esto afectará a todas las sesiones visualmente)
            const temaCambiado = datosParaGuardar.tema !== modalDetalles.tema;

            if (sesionTabActiva !== '__principal__') {
                Object.keys(datosParaGuardar).forEach(key => {
                    if (datosParaGuardar[key] === '' || datosParaGuardar[key] === null) {
                        datosParaGuardar[key] = null;
                    }
                });
            }

            if (sesionTabActiva === '__principal__') {
                await sesionesService.actualizar(modalDetalles.id, datosParaGuardar);
                
                // Actualizar todas las ocurrencias para que hereden estos campos si se editan desde la principal
                const camposGlobales = {
                    tema: datosParaGuardar.tema,
                    actividad: datosParaGuardar.actividad,
                    actividad_custom: datosParaGuardar.actividad_custom,
                    dirigido_a: datosParaGuardar.dirigido_a
                };
                
                const nuevasOcurrenciasSync = (modalDetalles.ocurrencias || []).map(oc => ({
                    ...oc,
                    ...camposGlobales
                }));

                const sesionActualizada = { ...modalDetalles, ...datosParaGuardar, ocurrencias: nuevasOcurrenciasSync };
                setModalDetalles(sesionActualizada);
                setSesiones(prev => prev.map(s => s.id === modalDetalles.id ? { ...s, ...datosParaGuardar, ocurrencias: nuevasOcurrenciasSync } : s));
            } else {
                await sesionesService.actualizarOcurrencia(modalDetalles.id, sesionTabActiva, datosParaGuardar);
                
                // Extraer los campos que deben sincronizarse globalmente
                const camposGlobales = {
                    tema: datosParaGuardar.tema,
                    actividad: datosParaGuardar.actividad,
                    actividad_custom: datosParaGuardar.actividad_custom,
                    dirigido_a: datosParaGuardar.dirigido_a
                };

                // Actualizar la ocurrencia específica con todos sus datos, 
                // pero a las demás solo le aplicamos los campos globales
                const nuevasOcurrenciasSync = (modalDetalles.ocurrencias || []).map(oc =>
                    oc.id === sesionTabActiva 
                        ? { ...oc, ...datosParaGuardar } 
                        : { ...oc, ...camposGlobales }
                );

                const sesionActualizada = { 
                    ...modalDetalles, 
                    ...camposGlobales, // Actualizar la principal también
                    ocurrencias: nuevasOcurrenciasSync 
                };
                
                setModalDetalles(sesionActualizada);
                setSesiones(prev => prev.map(s => s.id === modalDetalles.id ? 
                    { ...s, ...camposGlobales, ocurrencias: nuevasOcurrenciasSync } : s
                ));
            }
            setModoEdicion(false);
            setDatosEdicion({});
            setErroresEdicion({});
            setCustomTipoEdicion('');
            setToast({ message: 'Cambios guardados exitosamente', type: 'success' });
        } catch (error) {
            console.error('Error al guardar:', error);
            setToast({ message: 'Error al guardar los cambios', type: 'error' });
        } finally {
            setGuardando(false);
        }
    };

    const cerrarModal = () => {
        setModalDetalles(null);
        setModoEdicion(false);
        setSesionTabActiva('__principal__');
        setMostrarFormOcurrencia(false);
    };

    return {
        modalDetalles,
        setModalDetalles,
        modoEdicion,
        setModoEdicion,
        datosEdicion,
        setDatosEdicion,
        erroresEdicion,
        setErroresEdicion,
        guardando,
        customTipoEdicion,
        setCustomTipoEdicion,
        sesionTabActiva,
        setSesionTabActiva,
        mostrarFormOcurrencia,
        setMostrarFormOcurrencia,
        nuevaOcurrencia,
        setNuevaOcurrencia,
        mostrarContenidoNuevaOc,
        setMostrarContenidoNuevaOc,
        guardandoOcurrencia,
        setGuardandoOcurrencia,
        handleEditar,
        handleCancelarEdicion,
        handleCambioEdicion,
        handleGuardarEdicion,
        cerrarModal
    };
};
