import { useState, useEffect, useMemo } from 'react';
import { sesionesService, hayCacheValida } from '../../../../services/sesiones';
// Normaliza el campo dirigido_a para evitar valores nulos o inconsistentes
function normalizarDirigidoA(valor) {
    return valor || '';
}

export const useSesionesData = (esAdministrador, userEmail, setToast) => {
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(!hayCacheValida());
    const [verGlobal, setVerGlobal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [filtros, setFiltros] = useState({
        busqueda: '',
        fecha: '',
        tipo: '',
        facilitador: '',
        responsable: '',
        dirigido_a: '',
        modalidad: ''
    });

    useEffect(() => {
        loadSesiones();
    }, []);

    const loadSesiones = async () => {
        try {
            const data = await sesionesService.listar();
            setSesiones(data);
        } catch (error) {
            console.error('Error cargando sesiones:', error);
            setToast({ message: 'Error al cargar las actividades', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
        setCurrentPage(1);
    };

    const limpiarFiltros = () => {
        setFiltros({
            busqueda: '', fecha: '', tipo: '', facilitador: '',
            responsable: '', dirigido_a: '', modalidad: ''
        });
        setCurrentPage(1);
    };

    const sesionesAgrupadas = useMemo(() => {
        const sesionesAMapear = (esAdministrador && !verGlobal)
            ? sesiones.filter(s => s.created_by === userEmail)
            : sesiones;

        return sesionesAMapear.map(s => {
            let total_asistentes = 0;
            let tiene_ocurrencias = false;
            let total_fechas = 1;

            if (s.ocurrencias && s.ocurrencias.length > 0) {
                total_fechas = s.ocurrencias.length;
                tiene_ocurrencias = total_fechas > 1;
                total_asistentes = s.ocurrencias.reduce((acc, oc) => acc + (oc.total_asistentes || 0), 0);
            } else {
                total_asistentes = s.total_asistentes || 0;
            }

            return {
                ...s,
                dirigido_a: normalizarDirigidoA(s.dirigido_a),
                ocurrencias: (s.ocurrencias || []).map(oc => ({
                    ...oc,
                    dirigido_a: normalizarDirigidoA(oc.dirigido_a)
                })),
                uid: s.id,
                tiene_ocurrencias,
                total_fechas,
                total_asistentes_view: total_asistentes
            };
        });
    }, [sesiones, esAdministrador, verGlobal, userEmail]);

    const sesionesFiltradas = sesionesAgrupadas.filter(sesion => {
        const cumpleBusqueda = !filtros.busqueda || sesion.tema?.toLowerCase().includes(filtros.busqueda.toLowerCase());
        const cumpleFecha = !filtros.fecha || sesion.fecha === filtros.fecha;
        const cumpleTipo = !filtros.tipo || sesion.actividad === filtros.tipo;
        const cumpleFacilitador = !filtros.facilitador || sesion.facilitador_entidad === filtros.facilitador;
        const cumpleResponsable = !filtros.responsable || sesion.responsable === filtros.responsable;
        const cumpleDirigidoA = !filtros.dirigido_a || sesion.dirigido_a === filtros.dirigido_a;
        const cumpleModalidad = !filtros.modalidad || sesion.modalidad === filtros.modalidad;
        return cumpleBusqueda && cumpleFecha && cumpleTipo && cumpleFacilitador && cumpleResponsable && cumpleDirigidoA && cumpleModalidad;
    });

    const totalPages = Math.ceil(sesionesFiltradas.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentSesiones = sesionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);

    // Opciones únicas para filtros
    const uniqueOptions = useMemo(() => ({
        tipos: [...new Set(sesionesAgrupadas.map(s => s.actividad).filter(Boolean))],
        facilitadores: [...new Set(sesionesAgrupadas.map(s => s.facilitador_entidad).filter(Boolean))],
        responsables: [...new Set(sesionesAgrupadas.map(s => s.responsable).filter(Boolean))],
        dirigido_a: [...new Set(sesionesAgrupadas.map(s => s.dirigido_a).filter(Boolean))],
        modalidades: [...new Set(sesionesAgrupadas.map(s => s.modalidad).filter(Boolean))]
    }), [sesionesAgrupadas]);

    return {
        sesiones,
        setSesiones,
        loading,
        verGlobal,
        setVerGlobal,
        currentPage,
        setCurrentPage,
        filtros,
        handleFiltroChange,
        limpiarFiltros,
        sesionesFiltradas,
        currentSesiones,
        totalPages,
        indexOfFirstItem,
        indexOfLastItem,
        uniqueOptions,
        loadSesiones
    };
};
