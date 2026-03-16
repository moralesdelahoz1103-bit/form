import React from 'react';
import { Modal, Button } from '../../../common';
import { formatters } from '../../../../utils/formatters';
import './DeleteModals.css';

/**
 * Modal de confirmación para eliminar una sesión completa.
 */
export const DeleteSessionModal = ({ modalEliminar, setModalEliminar, handleEliminar, eliminando }) => (
    <Modal isOpen={!!modalEliminar} onClose={() => setModalEliminar(null)} title="¿Estás seguro?" size="sm">
        <div className="modal-eliminar-content">
            <p>Esta acción no se puede deshacer. Se eliminarán:</p>
            <ul>
                <li>La actividad: <strong>{modalEliminar?.tema}</strong></li>
                <li>Todos los asistentes registrados ({modalEliminar?.total_asistentes || 0})</li>
            </ul>
            <div className="modal-actions">
                <Button onClick={() => setModalEliminar(null)} variant="secondary">Cancelar</Button>
                <Button onClick={handleEliminar} variant="danger" loading={eliminando}>Eliminar</Button>
            </div>
        </div>
    </Modal>
);

/**
 * Modal de confirmación para eliminar una ocurrencia individual.
 */
export const DeleteOccurrenceModal = ({
    modalEliminarOcurrencia,
    setModalEliminarOcurrencia,
    modalDetalles,
    setModalDetalles,
    setSesiones,
    setToast,
    sesionesService
}) => (
    <Modal isOpen={!!modalEliminarOcurrencia} onClose={() => setModalEliminarOcurrencia(null)} title="Eliminar fecha" size="sm">
        <div className="modal-eliminar-content">
            <p>¿Eliminar la fecha <strong>{formatters.fechaCorta(modalEliminarOcurrencia?.fecha)}</strong>? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
                <Button onClick={() => setModalEliminarOcurrencia(null)} variant="secondary">Cancelar</Button>
                <Button variant="danger" onClick={async () => {
                    try {
                        await sesionesService.eliminarOcurrencia(modalEliminarOcurrencia.sesionId, modalEliminarOcurrencia.ocurrenciaId);
                        const nuevasOcurrencias = (modalDetalles.ocurrencias || []).filter(oc => oc.id !== modalEliminarOcurrencia.ocurrenciaId);
                        const sesionAct = { ...modalDetalles, ocurrencias: nuevasOcurrencias, es_recurrente: nuevasOcurrencias.length > 0 };
                        setModalDetalles(sesionAct);
                        setSesiones(prev => prev.map(s => s.id === modalDetalles.id ? { ...s, ocurrencias: nuevasOcurrencias, es_recurrente: nuevasOcurrencias.length > 0 } : s));
                        setModalEliminarOcurrencia(null);
                        setToast({ message: 'Fecha eliminada', type: 'success' });
                    } catch {
                        setToast({ message: 'Error al eliminar fecha', type: 'error' });
                    }
                }}>Eliminar</Button>
            </div>
        </div>
    </Modal>
);
