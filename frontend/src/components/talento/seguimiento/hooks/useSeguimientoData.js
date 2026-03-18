import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { seguimientoService } from '../../../../services/seguimiento';
import { formatters } from '../../../../utils/formatters';

export const useSeguimientoData = (esAdministrador, userEmail) => {
    const [participantes, setParticipantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParticipante, setSelectedParticipante] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [error, setError] = useState(null);
    const [verGlobal, setVerGlobal] = useState(esAdministrador);

    // Filtros avanzados
    const [filtros, setFiltros] = useState({
        cargo: '',
        unidad: ''
    });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Valores únicos para filtros
    const [unidadesUnicas, setUnidadesUnicas] = useState([]);
    const [cargosUnicos, setCargosUnicos] = useState([]);

    useEffect(() => {
        fetchParticipantes();
    }, [verGlobal, userEmail]);

    // Extraer valores únicos cuando cambian los participantes
    useEffect(() => {
        if (participantes.length > 0) {
            const unidades = [...new Set(participantes.map(p => p.unidad).filter(Boolean))].sort();
            const cargos = [...new Set(participantes.map(p => p.cargo).filter(Boolean))].sort();
            setUnidadesUnicas(unidades);
            setCargosUnicos(cargos);
        }
    }, [participantes]);

    const handleFiltroChange = (name, value) => {
        setFiltros(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const limpiarFiltros = () => {
        setSearchTerm('');
        setFiltros({
            cargo: '',
            unidad: ''
        });
        setCurrentPage(1);
    };

    const fetchParticipantes = async () => {
        setLoading(true);
        setError(null);
        try {
            const emailParam = (verGlobal || !userEmail) ? null : userEmail;
            const data = await seguimientoService.listarParticipantes(emailParam);
            setParticipantes(data);
        } catch (err) {
            console.error('Error al cargar participantes:', err);
            setError(err.message || 'Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleVerDetalle = async (p) => {
        setSelectedParticipante(p);
        setLoadingDetalle(true);
        setError(null);
        try {
            const emailParam = (verGlobal || !userEmail) ? null : userEmail;
            const data = await seguimientoService.obtenerDetalle(p.cedula, emailParam);
            setDetalle(data);
        } catch (err) {
            console.error('Error al cargar detalle:', err);
            setError('No se pudo cargar el historial detallado. Intenta de nuevo.');
        } finally {
            setLoadingDetalle(false);
        }
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1); // Resetear a la primera página al buscar
    };

    const filteredParticipantes = participantes.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.cedula.includes(searchTerm);
        
        const matchesCargo = !filtros.cargo || p.cargo === filtros.cargo;
        const matchesUnidad = !filtros.unidad || p.unidad === filtros.unidad;

        return matchesSearch && matchesCargo && matchesUnidad;
    });

    // Lógica de paginación
    const totalPages = Math.ceil(filteredParticipantes.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentParticipantes = filteredParticipantes.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const exportarHistorialIndividual = async (e, p) => {
        e.stopPropagation(); // Evitar abrir el drawer
        try {
            const emailParam = (verGlobal || !userEmail) ? null : userEmail;
            const data = await seguimientoService.obtenerDetalle(p.cedula, emailParam);
            if (!data || !data.historial) return;

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Historial de actividades');

            // Información general del colaborador
            ws.addRow(['Reporte individual de actividad']).font = { bold: true, size: 14 };
            ws.addRow(['']);
            ws.addRow(['Nombre del colaborador:', p.nombre]);
            ws.addRow(['Cédula:', p.cedula]);
            ws.addRow(['Cargo:', p.cargo]);
            ws.addRow(['Dirección:', p.unidad || 'N/A']);
            ws.addRow(['Total sesiones asistidas:', p.total_asistencias]);
            ws.addRow(['']);

            // Preparar los datos para la tabla
            const tableRows = data.historial.map(item => {
                const [fechaReg, horaReg] = formatters.fechaHora(item.fecha_registro).split(', ');

                // Cálculo robusto de duración decimal
                let horasDecimal = 0;
                if (item.hora_inicio && item.hora_fin) {
                    const [hI, mI] = item.hora_inicio.split(':').map(Number);
                    const [hF, mF] = item.hora_fin.split(':').map(Number);
                    horasDecimal = (hF * 60 + mF - (hI * 60 + mI)) / 60;
                }

                return [
                    item.tema,
                    item.sesion_nro ? `Sesión ${item.sesion_nro}` : 'Única',
                    formatters.fechaCorta(item.fecha_actividad || item.fecha_formacion),
                    item.hora_inicio || 'N/A',
                    item.hora_fin || 'N/A',
                    horasDecimal > 0 ? parseFloat(horasDecimal.toFixed(2)) : 0,
                    item.facilitador_entidad || item.facilitador || 'N/A',
                    item.modalidad || 'N/A',
                    item.actividad || item.tipo_formacion || 'Interna',
                    fechaReg,
                    horaReg
                ];
            });

            // Agregar Tabla oficial (empezando en A9 después de los metadatos)
            ws.addTable({
                name: 'HistorialIndividualTable',
                ref: 'A9',
                headerRow: true,
                style: {
                    theme: 'TableStyleMedium7',
                    showRowStripes: true,
                },
                columns: [
                    { name: 'Tema de actividad', filterButton: true },
                    { name: 'Sesión', filterButton: true },
                    { name: 'Fecha de actividad', filterButton: true },
                    { name: 'Hora inicio', filterButton: true },
                    { name: 'Hora fin', filterButton: true },
                    { name: 'Horas de actividad', filterButton: true },
                    { name: 'Facilitador', filterButton: true },
                    { name: 'Modalidad', filterButton: true },
                    { name: 'Actividad', filterButton: true },
                    { name: 'Fecha registro', filterButton: true },
                    { name: 'Hora registro', filterButton: true }
                ],
                rows: tableRows
            });

            // Estilos adicionales (Bordes y Alineación)
            const encabezados = [
                'Tema de actividad', 'Sesión', 'Fecha de actividad', 'Hora inicio', 'Hora fin',
                'Horas de actividad', 'Facilitador', 'Modalidad', 'Tipo de actividad',
                'Fecha registro', 'Hora registro'
            ];
            const cabecerasCentradas = [
                'Sesión', 'Fecha de actividad', 'Hora inicio', 'Hora fin', 'Horas de actividad',
                'Modalidad', 'Tipo de actividad', 'Fecha registro', 'Hora registro'
            ];

            ws.eachRow((row, rowNumber) => {
                row.eachCell((cell, colNum) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                    };

                    if (rowNumber === 9) {
                        // Estilos de cabecera de la tabla
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF26BC58' } };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else if (rowNumber > 9) {
                        // Estilos de los datos de la tabla
                        const headerName = encabezados[colNum - 1];
                        if (cabecerasCentradas.includes(headerName)) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        }

                        // Formato de número para horas
                        if (headerName === 'Horas de actividad') {
                            cell.numFmt = '0.00';
                        }
                    } else {
                        // Filas 1-8 (información superior)
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    }
                });
            });

            ws.columns.forEach(column => {
                column.width = 25;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `historial_${p.cedula}.xlsx`);
        } catch (error) {
            console.error('Error al exportar historial individual:', error);
        }
    };

    return {
        participantes,
        loading,
        searchTerm,
        handleSearchChange,
        selectedParticipante,
        setSelectedParticipante,
        detalle,
        loadingDetalle,
        error,
        verGlobal,
        setVerGlobal,
        currentPage,
        totalPages,
        indexOfFirstItem,
        indexOfLastItem,
        currentParticipantes,
        filteredParticipantes,
        handlePageChange,
        handleVerDetalle,
        exportarHistorialIndividual,
        fetchParticipantes,
        filtros,
        handleFiltroChange,
        limpiarFiltros,
        unidadesUnicas,
        cargosUnicos
    };
};
