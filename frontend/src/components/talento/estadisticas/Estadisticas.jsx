import React, { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { sesionesService } from '../../../services/sesiones';

import { getChartData, calculateKPIs } from './utils/dataEngine';
import { formatters } from '../../../utils/formatters';
import { Loading } from '../../common';
import './Estadisticas.css';

import { MESES, DIMENSION_LABELS, METRIC_LABELS, DIMENSION_METRICS_MAP } from './utils/constants';
import { Iconos } from './components/Iconos';
import PanelLateral from './components/PanelLateral';
import EncabezadoEstadisticas from './components/EncabezadoEstadisticas';
import TarjetasIndicadores from './components/TarjetasIndicadores';
import CuadriculaGraficos from './components/CuadriculaGraficos';

const Estadisticas = () => {
    const [loading, setLoading] = useState(true);
    const [sesionesRaw, setSesionesRaw] = useState([]);
    const [selectedYear, setSelectedYear] = useState('Todos');
    const [selectedMonth, setSelectedMonth] = useState('Todos');
    const [exportLoading, setExportLoading] = useState(false);

    const [metrics, setMetrics] = useState({
        totalFormaciones: 0,
        totalAsistentes: 0,
        totalHoras: '0h',
        horasInternas: 0,
        horasExternas: 0,
        promedioAsistentes: 0
    });

    const [slots, setSlots] = useState([
        {
            id: 1,
            title: 'Análisis detallado',
            dimension: 'facilitador_entidad',
            metric: 'horas',
            type: 'bar-vertical',
            year: 'Todos',
            month: 'Todos',
            grouping: 'month',
            color: '#26BC58',
            visualOptions: {
                gridType: 'polygon',
                radarOpacity: 0.5,
                barSize: 30,
                borderRadius: 6,
                innerRadius: 0,
                paddingAngle: 0,
                areaOpacity: 0.2
            }
        }
    ]);

    const [comparisonMode, setComparisonMode] = useState(false);
    const [activeSlotId, setActiveSlotId] = useState(1);

    const handleToggleComparison = (checked) => {
        setComparisonMode(checked);
        if (checked && slots.length === 1) {
            // Duplicar el slot actual como punto de partida para el segundo
            setSlots(prev => [...prev, {
                ...prev[0],
                id: 2,
                year: selectedYear,
                month: selectedMonth
            }]);
        } else if (!checked && slots.length === 2) {
            // Volver a un solo slot
            setSlots(prev => [prev[0]]);
            setActiveSlotId(1);
        }
    };


    const { sesionesFiltradas, sesionesPasadas, slotSessions, slotChartData } = useMemo(() => {
        const source = sesionesRaw;

        const filterByTime = (year, month) => source.filter(s => {
            if (!s.fecha) return false;
            const fecha = new Date(s.fecha);
            const matchYear = year === 'Todos' || fecha.getFullYear().toString() === year;
            const matchMonth = month === 'Todos' || MESES[fecha.getMonth()] === month;
            return matchYear && matchMonth;
        });

        const current = filterByTime(selectedYear, selectedMonth);

        // Calcular sesiones del periodo anterior para deltas globales
        let pasadas = [];
        if (selectedYear !== 'Todos') {
            const yearNum = parseInt(selectedYear);
            if (selectedMonth !== 'Todos') {
                const monthIndex = MESES.indexOf(selectedMonth);
                const prevM = monthIndex === 0 ? 11 : monthIndex - 1;
                const prevY = monthIndex === 0 ? yearNum - 1 : yearNum;
                pasadas = source.filter(s => {
                    if (!s.fecha) return false;
                    const f = new Date(s.fecha);
                    return f.getFullYear() === prevY && f.getMonth() === prevM;
                });
            } else {
                pasadas = source.filter(s => {
                    if (!s.fecha) return false;
                    return new Date(s.fecha).getFullYear() === yearNum - 1;
                });
            }
        }

        // Calcular sesiones específicas por slot
        const slotSessionsMap = {};
        slots.forEach(slot => {
            // En modo VS el usuario elige año/mes para cada slot, si no, usa el global
            const targetY = comparisonMode ? slot.year : selectedYear;
            const targetM = comparisonMode ? slot.month : selectedMonth;

            slotSessionsMap[slot.id] = source.filter(s => {
                if (!s.fecha) return false;
                const f = new Date(s.fecha);
                const matchY = targetY === 'Todos' || f.getFullYear().toString() === targetY;
                const matchM = targetM === 'Todos' || MESES[f.getMonth()] === targetM;
                return matchY && matchM;
            });
        });

        const slotChartData = {};
        slots.forEach(slot => {
            slotChartData[slot.id] = getChartData(
                slotSessionsMap[slot.id] || [],
                slot.dimension,
                slot.metric,
                { groupByYear: slot.grouping === 'year' }
            );
        });

        return {
            sesionesFiltradas: current,
            sesionesPasadas: pasadas,
            slotSessions: slotSessionsMap,
            slotChartData
        };
    }, [selectedYear, selectedMonth, sesionesRaw, slots]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const sesiones = await sesionesService.listar();
            setSesionesRaw(sesiones);
            setMetrics(calculateKPIs(sesiones));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const years = useMemo(() => {
        const yearsSet = new Set();
        sesionesRaw.forEach(s => {
            if (s.fecha) yearsSet.add(new Date(s.fecha).getFullYear().toString());
        });
        return ['Todos', ...Array.from(yearsSet).sort((a, b) => b - a)];
    }, [sesionesRaw]);

    useEffect(() => {
        setMetrics(calculateKPIs(sesionesFiltradas, sesionesPasadas));
    }, [sesionesFiltradas, sesionesPasadas]);

    const handleSlotChange = (id, field, value) => {
        setSlots(prev => prev.map(slot => {
            if (slot.id === id) {
                const newSlot = { ...slot, [field]: value };

                // Si cambia la dimensión, verificar que la métrica actual siga siendo válida
                if (field === 'dimension') {
                    const validMetrics = DIMENSION_METRICS_MAP[value] || [];
                    const isMetricValid = validMetrics.some(m => m.value === slot.metric);
                    if (!isMetricValid && validMetrics.length > 0) {
                        newSlot.metric = validMetrics[0].value;
                    }
                }

                return newSlot;
            }
            return slot;
        }));
    };

    const handleVisualOptionChange = (id, field, value) => {
        setSlots(prev => prev.map(slot =>
            slot.id === id ? {
                ...slot,
                visualOptions: { ...slot.visualOptions, [field]: value }
            } : slot
        ));
    };



    const handleExportExcel = (slot) => {
        const data = slotChartData[slot.id] || [];
        const dimensionLabel = DIMENSION_LABELS[slot.dimension];

        let csvContent = "";

        if (slot.dimension === 'resumen_mensual') {
            csvContent = `${dimensionLabel};Sesiones;Horas\n`;
            data.forEach(row => {
                csvContent += `${row.name};${row.cantidad};${row.horas}\n`;
            });
        } else {
            const metricLabel = METRIC_LABELS[slot.metric];
            csvContent = `${dimensionLabel};${metricLabel}\n`;
            data.forEach(row => {
                csvContent += `${row.name};${row.valor}\n`;
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `analisis_${slot.dimension}_${slot.metric.toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportGlobal = async () => {
        setExportLoading(true);
        try {
            const data = await sesionesService.obtenerReporteCompleto();

            // Filtrar por año/mes actual si no es 'Todos'
            const filteredData = data.filter(item => {
                if (!item.fecha) return false;
                const d = new Date(item.fecha);
                const yearMatch = selectedYear === 'Todos' || d.getFullYear().toString() === selectedYear;
                const monthMatch = selectedMonth === 'Todos' || MESES[d.getMonth()] === selectedMonth;
                return yearMatch && monthMatch;
            });

            if (filteredData.length === 0) {
                alert('No hay datos para exportar con los filtros seleccionados.');
                return;
            }

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Reporte Consolidado');

            // Formato oración para strings
            const toSentence = (str) => {
                if (!str || typeof str !== 'string') return str;
                return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            };

            // Definir columnas (para el ancho principalmente)
            ws.columns = [
                { header: 'Tema de actividad', key: 'tema', width: 40 },
                { header: 'Sesión', key: 'sesion_nro', width: 12 },
                { header: 'Asistente', key: 'asistente', width: 30 },
                { header: 'Cédula', key: 'cedula', width: 15 },
                { header: 'Correo', key: 'correo', width: 30 },
                { header: 'Dirección', key: 'direccion', width: 30 },
                { header: 'Actividad', key: 'actividad', width: 20 },
                { header: 'Tipo de actividad', key: 'tipo_actividad', width: 18 },
                { header: 'Dirigido a', key: 'dirigido_a', width: 18 },
                { header: 'Modalidad', key: 'modalidad', width: 15 },
                { header: 'Facilitador / Entidad', key: 'facilitador_entidad', width: 25 },
                { header: 'Responsable', key: 'responsable', width: 25 },
                { header: 'Hora inicio', key: 'hora_inicio', width: 12 },
                { header: 'Hora fin', key: 'hora_fin', width: 12 },
                { header: 'Horas de actividad', key: 'horas', width: 18 },
                { header: 'Fecha', key: 'fecha', width: 14 },
                { header: 'Mes', key: 'mes', width: 12 }
            ];

            // Preparar filas para la tabla
            const tableRows = filteredData.map(item => {
                const d = new Date(item.fecha);

                // Cálculo robusto de duración decimal
                let horasDecimal = 0;
                if (item.hora_inicio && item.hora_fin) {
                    const [hI, mI] = item.hora_inicio.split(':').map(Number);
                    const [hF, mF] = item.hora_fin.split(':').map(Number);
                    horasDecimal = (hF * 60 + mF - (hI * 60 + mI)) / 60;
                }

                return [
                    toSentence(item.tema),
                    item.sesion_nro,
                    toSentence(item.asistente),
                    item.cedula,
                    item.correo?.toLowerCase() || 'n/a',
                    toSentence(item.unidad),
                    toSentence(item.actividad),
                    toSentence(item.tipo_actividad) || 'Interno',
                    toSentence(item.dirigido_a),
                    toSentence(item.modalidad),
                    toSentence(item.facilitador_entidad),
                    toSentence(item.responsable),
                    item.hora_inicio,
                    item.hora_fin,
                    horasDecimal > 0 ? parseFloat(horasDecimal.toFixed(2)) : 0,
                    formatters.fechaCorta(item.fecha),
                    MESES[d.getMonth()]
                ];
            });

            // Agregar Tabla con estilo
            ws.addTable({
                name: 'ReporteAsistencias',
                ref: 'A1',
                headerRow: true,
                totalsRow: false,
                style: {
                    theme: 'TableStyleMedium7',
                    showRowStripes: true,
                },
                columns: [
                    { name: 'Tema de actividad', filterButton: true },
                    { name: 'Sesión', filterButton: true },
                    { name: 'Asistente', filterButton: true },
                    { name: 'Cédula', filterButton: true },
                    { name: 'Correo', filterButton: true },
                    { name: 'Dirección', filterButton: true },
                    { name: 'Actividad', filterButton: true },
                    { name: 'Tipo de actividad', filterButton: true },
                    { name: 'Dirigido a', filterButton: true },
                    { name: 'Modalidad', filterButton: true },
                    { name: 'Facilitador / Entidad', filterButton: true },
                    { name: 'Responsable', filterButton: true },
                    { name: 'Hora inicio', filterButton: true },
                    { name: 'Hora fin', filterButton: true },
                    { name: 'Horas de actividad', filterButton: true },
                    { name: 'Fecha', filterButton: true },
                    { name: 'Mes', filterButton: true }
                ],
                rows: tableRows,
            });

            // Nombres de los encabezados (en orden)
            const encabezadosActivos = [
                'Tema de actividad', 'Sesión', 'Asistente', 'Cédula', 'Correo',
                'Dirección', 'Actividad', 'Tipo de actividad', 'Dirigido a', 'Modalidad', 'Facilitador / Entidad', 'Responsable',
                'Hora inicio', 'Hora fin', 'Horas de actividad', 'Fecha', 'Mes'
            ];
            const columnasCentradas = [
                'Sesión', 'Cédula', 'Actividad', 'Tipo de actividad', 'Dirigido a', 'Modalidad', 'Hora inicio', 'Hora fin',
                'Horas de actividad', 'Fecha', 'Mes'
            ];

            // Personalización adicional de estilos (Bordes y Alineación)
            ws.eachRow((row, rowNumber) => {
                row.eachCell((cell, colNum) => {
                    // Bordes delgados grises como en la imagen
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                    };

                    if (rowNumber === 1) {
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF26BC58' }
                        };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else {
                        const colName = encabezadosActivos[colNum - 1];
                        if (columnasCentradas.includes(colName)) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        }
                    }

                    // Forzar formato numérico en la columna de horas (M = 13)
                    if (rowNumber > 1 && cell.address.includes('M')) {
                        cell.numFmt = '0.00';
                    }
                });
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Reporte_general_${selectedYear}_${selectedMonth}.xlsx`);
        } catch (error) {
            console.error('Error al exportar reporte global:', error);
            alert('Error al generar el reporte.');
        } finally {
            setExportLoading(false);
        }
        // Plan de actividades y capacitaciones ejecutadas 
    };

    const handleExportJPG = async (containerId, slot) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const originalSvg = container.querySelector('svg');
        if (!originalSvg) {
            alert('no se pudo encontrar el gráfico para exportar.');
            return;
        }

        try {
            const title = `${METRIC_LABELS[slot.metric]} por ${DIMENSION_LABELS[slot.dimension].toLowerCase()}`;
            const subtitle = `análisis detallado de ${METRIC_LABELS[slot.metric].toLowerCase()} distribuidos por ${DIMENSION_LABELS[slot.dimension].toLowerCase()}`;

            // clonar el svg para no afectar el dom original
            const svg = originalSvg.cloneNode(true);

            // obtener dimensiones reales del contenedor
            const rect = originalSvg.getBoundingClientRect();
            const width = rect.width || 800;
            const height = rect.height || 500;

            // asegurar que el svg tenga dimensiones absolutas y viewBox correcto
            svg.setAttribute('width', width);
            svg.setAttribute('height', height);
            if (!svg.getAttribute('viewBox')) {
                svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            }

            // aplicar estilos básicos para asegurar que las fuentes se vean bien
            svg.style.fontFamily = 'Arial, sans-serif';

            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            const scale = 2; // alta resolución
            const padding = 40;
            const titleAreaHeight = 110;

            canvas.width = width * scale;
            canvas.height = (height + titleAreaHeight) * scale;
            ctx.scale(scale, scale);

            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                // fondo blanco
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height + titleAreaHeight);

                // dibujar título (un poco más de margen)
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 22px Arial';
                ctx.fillText(title.toLowerCase(), padding, 45);

                // dibujar subtítulo
                ctx.fillStyle = '#64748b';
                ctx.font = '14px Arial';
                ctx.fillText(subtitle.toLowerCase(), padding, 75);

                // línea divisoria sutil
                ctx.strokeStyle = '#f1f5f9';
                ctx.beginPath();
                ctx.moveTo(padding, 95);
                ctx.lineTo(width - padding, 95);
                ctx.stroke();

                // dibujar el gráfico
                ctx.drawImage(img, 0, titleAreaHeight, width, height);

                const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
                const downloadLink = document.createElement('a');
                downloadLink.href = jpgUrl;
                downloadLink.download = `analisis_${slot.dimension}_${slot.metric.toLowerCase()}.jpg`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            };

            img.onerror = (err) => {
                console.error('error al cargar la imagen del svg:', err);
                alert('hubo un problema al generar la imagen. por favor intente de nuevo.');
            };

            img.src = url;
        } catch (error) {
            console.error('Error exportando imagen:', error);
            alert('Error al generar la imagen.');
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="estadisticas-view">
            <EncabezadoEstadisticas
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                years={years}
                onExportExcel={handleExportGlobal}
                exportLoading={exportLoading}
            />

            <TarjetasIndicadores metrics={metrics} />

            {/* Centro de Análisis Intelligence */}
            <div className="intelligence-center-container">
                <PanelLateral
                    comparisonMode={comparisonMode}
                    handleToggleComparison={handleToggleComparison}
                    activeSlotId={activeSlotId}
                    setActiveSlotId={setActiveSlotId}
                    slots={slots}
                    handleSlotChange={handleSlotChange}
                    handleVisualOptionChange={handleVisualOptionChange}
                    years={years}
                />

                <CuadriculaGraficos
                    comparisonMode={comparisonMode}
                    slots={slots}
                    slotChartData={slotChartData}
                    handleExportExcel={handleExportExcel}
                    handleExportJPG={handleExportJPG}
                />
            </div>
        </div>
    );
};

export default Estadisticas;
