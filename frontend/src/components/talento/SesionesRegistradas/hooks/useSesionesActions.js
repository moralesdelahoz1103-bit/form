import { useState } from 'react';
import { sesionesService } from '../../../../services/sesiones';

export const useSesionesActions = (setSesiones, setToast) => {
    const [modalEliminar, setModalEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [modalQR, setModalQR] = useState(null);
    const [modalEliminarOcurrencia, setModalEliminarOcurrencia] = useState(null);

    const handleEliminar = async () => {
        if (!modalEliminar) return;
        setEliminando(true);
        try {
            await sesionesService.eliminar(modalEliminar.id);
            setSesiones(prev => prev.filter(s => s.id !== modalEliminar.id));
            setModalEliminar(null);
            setToast({ message: 'Actividad eliminada exitosamente', type: 'success' });
        } catch (error) {
            console.error('Error al eliminar:', error);
            setToast({ message: 'Error al eliminar la actividad', type: 'error' });
        } finally {
            setEliminando(false);
        }
    };

    const copiarLink = (link) => {
        navigator.clipboard.writeText(link);
        setToast({ message: '¡Link copiado!', type: 'success' });
    };

    const copiarQR = async (qrUrl) => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            setToast({ message: '¡QR copiado al portapapeles!', type: 'success' });
        } catch (error) {
            console.error('Error al copiar QR:', error);
            setToast({ message: 'Error al copiar QR', type: 'error' });
        }
    };

    const descargarQR = async (qrUrl, nombreSesion) => {
        try {
            const nombreArchivo = nombreSesion ? `QR-${nombreSesion.replace(/[^a-zA-Z0-9]/g, '_')}` : 'QR-actividad';
            const response = await fetch(qrUrl, { mode: 'cors' });
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${nombreArchivo}.png`;
            link.href = blobUrl;
            link.click();
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
            setToast({ message: '¡QR descargado!', type: 'success' });
        } catch (error) {
            console.error('Error al descargar QR:', error);
            setToast({ message: 'Error al descargar QR', type: 'error' });
        }
    };

    return {
        modalEliminar,
        setModalEliminar,
        eliminando,
        modalQR,
        setModalQR,
        modalEliminarOcurrencia,
        setModalEliminarOcurrencia,
        handleEliminar,
        copiarLink,
        copiarQR,
        descargarQR
    };
};
