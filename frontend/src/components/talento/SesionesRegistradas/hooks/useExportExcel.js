import { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatters } from '../../../../utils/formatters';

export const useExportExcel = (sesiones, filtros, userEmail, setToast) => {
    const [showExportModal, setShowExportModal] = useState(false);

    const exportarXLSX = async (tipo = 'all') => {
        const sesionesBase = (tipo === 'mine')
            ? sesiones.filter(s => s.created_by === userEmail)
            : sesiones;

        const datosFiltradosFinales = sesionesBase.filter(sesion => {
            const cumpleBusqueda = !filtros.busqueda || sesion.tema?.toLowerCase().includes(filtros.busqueda.toLowerCase());
            const cumpleFecha = !filtros.fecha || sesion.fecha === filtros.fecha;
            const cumpleTipo = !filtros.tipo || sesion.tipo_actividad === filtros.tipo;
            const cumpleFacilitador = !filtros.facilitador || sesion.facilitador === filtros.facilitador;
            const cumpleResponsable = !filtros.responsable || sesion.responsable === filtros.responsable;
            const cumpleDirigidoA = !filtros.dirigido_a || sesion.dirigido_a === filtros.dirigido_a;
            const cumpleModalidad = !filtros.modalidad || sesion.modalidad === filtros.modalidad;
            return cumpleBusqueda && cumpleFecha && cumpleTipo && cumpleFacilitador && cumpleResponsable && cumpleDirigidoA && cumpleModalidad;
        });

        if (datosFiltradosFinales.length === 0) {
            setToast({ message: 'No hay datos para exportar con estos filtros', type: 'error' });
            setShowExportModal(false);
            return;
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Actividades');

        ws.columns = [
            { header: 'Tema', key: 'tema', width: 40 },
            { header: 'Sesión nro.', key: 'nro_sesion', width: 12 },
            { header: 'Fecha', key: 'fecha', width: 14 },
            { header: 'Hora inicio', key: 'hora_inicio', width: 12 },
            { header: 'Hora fin', key: 'hora_fin', width: 12 },
            { header: 'Horas de actividad', key: 'horas_actividad', width: 18 },
            { header: 'Actividad', key: 'actividad', width: 20 },
            { header: 'Tipo de actividad', key: 'tipo_actividad', width: 18 },
            { header: 'Dirigido a', key: 'dirigido_a', width: 18 },
            { header: 'Modalidad', key: 'modalidad', width: 14 },
            { header: 'Facilitador / Entidad', key: 'facilitador_entidad', width: 26 },
            { header: 'Responsable', key: 'responsable', width: 26 },
            { header: 'Cargo responsable', key: 'cargo_responsable', width: 26 },
            { header: 'Creado por', key: 'created_by_name', width: 26 },
            { header: 'Descripción / Contenido', key: 'contenido', width: 40 },
            { header: 'Total asistentes', key: 'total_asistentes', width: 14 },
        ];

        datosFiltradosFinales.forEach(s => {
            const hasOcurrencias = s.ocurrencias && s.ocurrencias.length > 0;
            
            if (!hasOcurrencias) {
                ws.addRow({
                    tema: s.tema,
                    nro_sesion: 'Única',
                    fecha: formatters.fecha(s.fecha),
                    hora_inicio: s.hora_inicio,
                    hora_fin: s.hora_fin,
                    horas_actividad: s.hora_inicio && s.hora_fin ? parseFloat(((s.hora_fin.split(':').map(Number)[0] * 60 + s.hora_fin.split(':').map(Number)[1] - (s.hora_inicio.split(':').map(Number)[0] * 60 + s.hora_inicio.split(':').map(Number)[1])) / 60).toFixed(2)) : 0,
                    actividad: s.actividad,
                    tipo_actividad: s.tipo_actividad || 'Interno',
                    dirigido_a: s.dirigido_a || '',
                    modalidad: s.modalidad || '',
                    facilitador_entidad: s.facilitador_entidad,
                    responsable: s.responsable || '',
                    cargo_responsable: s.cargo_responsable || '',
                    created_by_name: s.created_by_name || s.created_by || '',
                    contenido: s.contenido || '',
                    total_asistentes: s.total_asistentes_principal || 0,
                });
            } else {
                const ocurrenciasOrdenadas = [...s.ocurrencias].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                const esUnica = ocurrenciasOrdenadas.length === 1;
                
                ocurrenciasOrdenadas.forEach((oc, index) => {
                    ws.addRow({
                        tema: oc.tema || s.tema,
                        nro_sesion: esUnica ? 'Única' : `Sesión ${index + 1}`,
                        fecha: formatters.fecha(oc.fecha),
                        hora_inicio: oc.hora_inicio || s.hora_inicio,
                        hora_fin: oc.hora_fin || s.hora_fin,
                        horas_actividad: (oc.hora_inicio || s.hora_inicio) && (oc.hora_fin || s.hora_fin) ? parseFloat((((oc.hora_fin || s.hora_fin).split(':').map(Number)[0] * 60 + (oc.hora_fin || s.hora_fin).split(':').map(Number)[1] - ((oc.hora_inicio || s.hora_inicio).split(':').map(Number)[0] * 60 + (oc.hora_inicio || s.hora_inicio).split(':').map(Number)[1])) / 60).toFixed(2)) : 0,
                        actividad: oc.actividad || s.actividad,
                        tipo_actividad: oc.tipo_actividad || s.tipo_actividad || 'Interno',
                        dirigido_a: oc.dirigido_a || s.dirigido_a || '',
                        modalidad: oc.modalidad || s.modalidad || '',
                        facilitador_entidad: oc.facilitador_entidad || s.facilitador_entidad,
                        responsable: oc.responsable || s.responsable || '',
                        cargo_responsable: oc.cargo_responsable || s.cargo_responsable || '',
                        created_by_name: s.created_by_name || s.created_by || '',
                        contenido: oc.contenido || s.contenido || '',
                        total_asistentes: oc.total_asistentes || (index === 0 ? s.total_asistentes_principal : 0),
                    });
                });
            }
        });

        const columnasCentradas = ['nro_sesion', 'fecha', 'hora_inicio', 'hora_fin', 'horas_actividad', 'tipo_actividad', 'dirigido_a', 'modalidad', 'total_asistentes'];

        ws.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                const columnKey = ws.getColumn(colNumber).key;
                const isCenterColumn = columnasCentradas.includes(columnKey);

                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };

                if (rowNumber === 1 || isCenterColumn) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                }

                if (rowNumber === 1) {
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF26BC58' } };
                }
                if (rowNumber > 1 && cell.address.includes('F')) {
                    cell.numFmt = '0.00';
                }
            });
        });

        ws.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: ws.rowCount, column: ws.columnCount }
        };

        const nombreArchivo = tipo === 'mine' ? 'Mis actividades.xlsx' : 'Todas las actividades.xlsx';
        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo);
        setToast({ message: '¡Archivo exportado!', type: 'success' });
        setShowExportModal(false);
    };

    return {
        showExportModal,
        setShowExportModal,
        exportarXLSX
    };
};
