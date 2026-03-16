import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { sesionesService } from '../../../../services/sesiones';
import { formatters } from '../../../../utils/formatters';

/**
 * Hook de lógica de negocio para VerAsistentes:
 * - Carga de sesiones y asistentes
 * - Selección de sesión/ocurrencia
 * - Exportación a XLSX
 */
export const useVerAsistentes = () => {
    const [sesiones, setSesiones] = useState([]);
    const [sesionSeleccionada, setSesionSeleccionada] = useState('');
    const [ocurrenciaSeleccionada, setOcurrenciaSeleccionada] = useState('__principal__');
    const [asistentes, setAsistentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAsistentes, setLoadingAsistentes] = useState(false);
    const [toast, setToast] = useState(null);

    const sesionActual = sesiones.find(s => s.id === sesionSeleccionada);

    useEffect(() => { loadSesiones(); }, []); // eslint-disable-line

    useEffect(() => {
        if (sesionSeleccionada) loadAsistentes();
    }, [sesionSeleccionada, ocurrenciaSeleccionada]); // eslint-disable-line

    // ── Carga de datos ────────────────────────────────────────────────────────
    const loadSesiones = async () => {
        try {
            const data = await sesionesService.listar();
            setSesiones(data);
        } catch {
            setToast({ message: 'Error al cargar actividades registradas', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const loadAsistentes = async () => {
        setLoadingAsistentes(true);
        try {
            const ocId = ocurrenciaSeleccionada !== '__principal__' ? ocurrenciaSeleccionada : null;
            const data = await sesionesService.obtenerAsistentes(sesionSeleccionada, ocId);
            setAsistentes(data);
        } catch {
            setToast({ message: 'Error al cargar asistentes', type: 'error' });
        } finally {
            setLoadingAsistentes(false);
        }
    };

    // ── Selección de sesión ───────────────────────────────────────────────────
    const handleSeleccionarSesion = (id) => {
        setSesionSeleccionada(id);
        setOcurrenciaSeleccionada('__principal__');
        // Limpiar asistentes al cambiar de actividad para evitar que persistan datos de la tabla anterior
        setAsistentes([]);
    };

    // ── Datos derivados para el panel de información ──────────────────────────
    const ocurrenciaActual = (() => {
        if (!sesionActual || ocurrenciaSeleccionada === '__principal__') return null;
        return (sesionActual.ocurrencias || []).find(oc => oc.id === ocurrenciaSeleccionada) || null;
    })();

    const fechaMostrada = ocurrenciaActual ? ocurrenciaActual.fecha : sesionActual?.fecha;

    const horaMostrada = ocurrenciaActual
        ? (ocurrenciaActual.hora_inicio && ocurrenciaActual.hora_fin
            ? `${ocurrenciaActual.hora_inicio} – ${ocurrenciaActual.hora_fin}`
            : 'Por definir')
        : (sesionActual ? `${sesionActual.hora_inicio} – ${sesionActual.hora_fin}` : '');

    const facilitadorMostrado = ocurrenciaActual?.facilitador_entidad || sesionActual?.facilitador_entidad;
    const totalSesiones = sesionActual 
        ? (sesionActual.ocurrencias && sesionActual.ocurrencias.length > 0 
            ? sesionActual.ocurrencias.length 
            : 1) 
        : 0;

    // ── Exportar XLSX ─────────────────────────────────────────────────────────
    const exportarXLSX = async () => {
        if (!sesionActual) return;

        const workbook = new ExcelJS.Workbook();
        const esInterna = sesionActual.dirigido_a === 'Interna';

        const encabezados = ['Cédula', 'Nombre completo', 'Cargo', 'Dirección', 'Correo electrónico', 'Fecha de registro', 'Hora de registro'];

        // Helper para crear hojas
        const crearHoja = async (datosSesionRef, nombreHoja, identificador) => {
            // Fetch asistentes específico para esta ocurrencia si es necesario, o usar los actuales si coinciden
            let asistentesHojas = asistentes;
            if (identificador !== ocurrenciaSeleccionada) {
                try {
                    const ocId = identificador !== '__principal__' ? identificador : null;
                    asistentesHojas = await sesionesService.obtenerAsistentes(sesionSeleccionada, ocId);
                } catch {
                    asistentesHojas = [];
                }
            }

            const datos = asistentesHojas.map(a => {
                const [fechaStr = '', horaStr = ''] = formatters.fechaHora(a.fecha_registro).split(', ');
                return [a.cedula || '', a.nombre || '', a.cargo || '', a.unidad || '', a.correo || '', fechaStr, horaStr];
            });

            // Reemplazar caracteres no válidos para nombres de hoja en Excel
            const safeSheetName = nombreHoja.replace(/[\\/?*[\]]/g, '').substring(0, 31);
            const ws = workbook.addWorksheet(safeSheetName);

            const ref = (field) => datosSesionRef[field] || sesionActual[field];
            ws.addRow(['Tema de actividad:', ref('tema')]);
            ws.addRow(['Responsable:', ref('responsable')]);
            ws.addRow(['Cargo responsable:', ref('cargo_responsable')]);
            ws.addRow(['Facilitador / Entidad:', ref('facilitador_entidad')]);
            ws.addRow(['Actividad:', ref('actividad')]);
            ws.addRow(['Tipo de actividad:', ref('tipo_actividad')]); // Interno / Externo
            ws.addRow(['Dirigido a:', ref('dirigido_a')]); // Personal FSD / Externo
            ws.addRow(['Fecha sesión:', formatters.fechaCorta(datosSesionRef.fecha)]);
            ws.addRow(['Horario:', `${ref('hora_inicio')} - ${ref('hora_fin')}`]);

            const [h1, m1] = (ref('hora_inicio') || '0:0').split(':').map(Number);
            const [h2, m2] = (ref('hora_fin') || '0:0').split(':').map(Number);
            const horasDec = parseFloat(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60).toFixed(2));
            const rowHoras = ws.addRow(['Horas de actividad:', isNaN(horasDec) ? 0 : horasDec]);
            rowHoras.getCell(2).numFmt = '0.00';
            rowHoras.getCell(2).alignment = { horizontal: 'left' };

            ws.addRow(['Modalidad:', ref('modalidad')]);
            ws.addRow(['Cantidad de asistentes:', asistentesHojas.length]);
            if (ref('contenido')) ws.addRow(['Descripción:', ref('contenido')]);

            ws.addRow([]);
            const rowTabla = ws.rowCount + 1;
            
            // CORRECCIÓN CORRUPCIÓN: Asegurar que los datos estén antes o se manejen fuera de la tabla si hay conflictos
            ws.addTable({
                name: `AsistentesTable_${safeSheetName.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.floor(Math.random()*1000)}`,
                ref: `A${rowTabla}`,
                headerRow: true,
                style: { theme: 'TableStyleMedium9', showRowStripes: true },
                columns: encabezados.map(h => ({ name: h, filterButton: true })),
                rows: datos.length > 0 ? datos : [Array(encabezados.length).fill('')]
            });

            // Estilos de cabecera
            ws.getRow(rowTabla).eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF26BC58' } };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
            });
            ws.eachRow((row, rowNum) => {
                if (rowNum > rowTabla) {
                    row.eachCell((cell, colNum) => {
                        cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };

                        const headerName = encabezados[colNum - 1];
                        const cabecerasCentradas = ['Cédula', 'Cargo', 'Teléfono de contacto', 'Fecha de registro', 'Hora de registro'];

                        if (cabecerasCentradas.includes(headerName)) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        }
                    });
                }
            });
            encabezados.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(h.length + 2, 18); });
        };

        // Lógica de exportación según selección
        if (sesionActual.es_recurrente && ocurrenciaSeleccionada === '__principal__') {
            const hasOcurrenciasFinal = sesionActual.ocurrencias && sesionActual.ocurrencias.length > 0;
            
            if (!hasOcurrenciasFinal) {
                // Caso raro: marcada como recurrente pero sin ocurrencias
                await crearHoja(sesionActual, 'Sesión 1', '__principal__');
            } else {
                const ocurrenciasOrdenadas = [...sesionActual.ocurrencias].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                for (let i = 0; i < ocurrenciasOrdenadas.length; i++) {
                    const oc = ocurrenciasOrdenadas[i];
                    // Si i === 0, es la principal (puedo usar __principal__ para los asistentes)
                    const idHoja = i === 0 ? '__principal__' : oc.id;
                    await crearHoja(oc, `Sesión ${i + 1} (${formatters.fechaCorta(oc.fecha)})`, idHoja);
                }
            }
        } else {
            // Exportar solo la seleccionada (principal en sesión no recurrente, o una ocurrencia específica)
            const datosSesionRef = ocurrenciaSeleccionada === '__principal__' ? sesionActual : (sesionActual.ocurrencias || []).find(oc => oc.id === ocurrenciaSeleccionada) || sesionActual;
            await crearHoja(datosSesionRef, 'Asistentes', ocurrenciaSeleccionada);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `asistentes_${sesionActual.tema || 'actividad'}.xlsx`);
    };

    const exportarConsolidadoXLSX = async () => {
        if (!sesionActual) return;

        const workbook = new ExcelJS.Workbook();
        let asistentesConsolidados = [];

        const hasOcurrenciasConsol = sesionActual.ocurrencias && sesionActual.ocurrencias.length > 0;

        if (!hasOcurrenciasConsol) {
            try {
                const asisPrincipal = await sesionesService.obtenerAsistentes(sesionActual.id, null);
                asisPrincipal.forEach(a => asistentesConsolidados.push({ ...a, nombre_sesion: 'Sesión 1' }));
            } catch { }
        } else {
            for (let i = 0; i < sesionActual.ocurrencias.length; i++) {
                try {
                    const oc = sesionActual.ocurrencias[i];
                    const ocId = i === 0 ? null : oc.id;
                    const asisOc = await sesionesService.obtenerAsistentes(sesionActual.id, ocId);
                    asisOc.forEach(a => asistentesConsolidados.push({ ...a, nombre_sesion: `Sesión ${i + 1}` }));
                } catch { }
            }
        }

        const esInterna = sesionActual.dirigido_a === 'Interna';

        const encabezados = ['Sesión', 'Cédula', 'Nombre completo', 'Cargo', 'Dirección', 'Correo electrónico', 'Fecha de registro', 'Hora de registro'];

        const datos = asistentesConsolidados.map(a => {
            const [fechaStr = '', horaStr = ''] = formatters.fechaHora(a.fecha_registro).split(', ');
            return [a.nombre_sesion || '', a.cedula || '', a.nombre || '', a.cargo || '', a.unidad || '', a.correo || '', fechaStr, horaStr];
        });

        const ws = workbook.addWorksheet('Todos los Asistentes');

        // Calcular la suma total de horas y las fechas mínima/máxima
        let totalHorasFormacion = 0;
        let fechasTodas = [];

        const calcularHoras = (inicio, fin) => {
            if (!inicio || !fin) return 0;
            const [h1, m1] = inicio.split(':').map(Number);
            const [h2, m2] = fin.split(':').map(Number);
            return parseFloat(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60).toFixed(2));
        };

        const hasOcurrenciasHoras = sesionActual.ocurrencias && sesionActual.ocurrencias.length > 0;

        if (!hasOcurrenciasHoras) {
            if (sesionActual.hora_inicio && sesionActual.hora_fin) {
                totalHorasFormacion += calcularHoras(sesionActual.hora_inicio, sesionActual.hora_fin);
            }
            if (sesionActual.fecha) fechasTodas.push(new Date(sesionActual.fecha));
        } else {
            sesionActual.ocurrencias.forEach(oc => {
                const hIni = oc.hora_inicio || sesionActual.hora_inicio;
                const hFin = oc.hora_fin || sesionActual.hora_fin;
                if (hIni && hFin) {
                    totalHorasFormacion += calcularHoras(hIni, hFin);
                }
                const f = oc.fecha || sesionActual.fecha;
                if (f) fechasTodas.push(new Date(f));
            });
        }
        totalHorasFormacion = parseFloat(totalHorasFormacion.toFixed(2));

        let rangoFechasStr = '—';
        if (fechasTodas.length > 0) {
            const minFecha = new Date(Math.min(...fechasTodas));
            const maxFecha = new Date(Math.max(...fechasTodas));
            if (minFecha.getTime() === maxFecha.getTime()) {
                rangoFechasStr = formatters.fechaCorta(minFecha);
            } else {
                rangoFechasStr = `${formatters.fechaCorta(minFecha)} - ${formatters.fechaCorta(maxFecha)}`;
            }
        }

        const ref = (field) => sesionActual[field];
        ws.addRow(['Tema de actividad:', ref('tema')]);
        ws.addRow(['Responsable:', ref('responsable')]);
        ws.addRow(['Cargo responsable:', ref('cargo_responsable')]);
        ws.addRow(['Facilitador / Entidad:', ref('facilitador_entidad')]);
        ws.addRow(['Actividad:', ref('actividad')]);
        ws.addRow(['Tipo de actividad:', ref('tipo_actividad')]);
        ws.addRow(['Dirigido a:', ref('dirigido_a')]);
        ws.addRow(['Rango de fechas:', rangoFechasStr]);

        const rowHoras = ws.addRow(['Horas de actividad (Total):', totalHorasFormacion]);
        rowHoras.getCell(2).numFmt = '0.00';
        rowHoras.getCell(2).alignment = { horizontal: 'left' };

        ws.addRow(['Modalidad:', ref('modalidad')]);
        ws.addRow(['Total registros:', asistentesConsolidados.length]);
        if (ref('contenido')) ws.addRow(['Descripción:', ref('contenido')]);
        ws.addRow([]);

        const rowTabla = ws.rowCount + 1;
        ws.addTable({
            name: `ConsolidadoTable_${Math.random().toString(36).substring(2, 9)}`,
            ref: `A${rowTabla}`,
            headerRow: true,
            style: { theme: 'TableStyleMedium9', showRowStripes: true },
            columns: encabezados.map(h => ({ name: h, filterButton: true })),
            rows: datos.length > 0 ? datos : [Array(encabezados.length).fill('')]
        });

        ws.getRow(rowTabla).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF26BC58' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
        });
        ws.eachRow((row, rowNum) => {
            if (rowNum > rowTabla) {
                row.eachCell((cell, colNum) => {
                    cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
                    const headerName = encabezados[colNum - 1];
                    const cabecerasCentradas = ['Sesión', 'Cédula', 'Cargo', 'Fecha de registro', 'Hora de registro'];
                    if (cabecerasCentradas.includes(headerName)) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    }
                });
            }
        });
        encabezados.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(h.length + 2, 18); });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `asistentes_consolidado_${sesionActual.tema || 'actividad'}.xlsx`);
    };

    return {
        sesiones, sesionSeleccionada, ocurrenciaSeleccionada, setOcurrenciaSeleccionada,
        asistentes, loading, loadingAsistentes, toast, setToast,
        sesionActual, ocurrenciaActual, fechaMostrada, horaMostrada,
        facilitadorMostrado, totalSesiones,
        handleSeleccionarSesion, exportarXLSX, exportarConsolidadoXLSX,
    };
};
