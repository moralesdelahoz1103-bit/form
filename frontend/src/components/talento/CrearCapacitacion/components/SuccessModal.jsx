import React from 'react';
import { config } from '../../../../utils/constants';

const SuccessModal = ({
    show,
    onClose,
    nuevaSesion,
    linkGenerado,
    nombreFormacion,
    onCopiarLink,
    onCopiarQR,
    onDescargarQR
}) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-qr" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="modal-header">
                    <h2>Actividad creada exitosamente</h2>
                </div>

                <div className="modal-body">
                    <div className="qr-container">
                        {nuevaSesion?.id && (
                            <img
                                src={`${config.apiUrl}/api/sesiones/${nuevaSesion.id}/qr`}
                                alt="QR Code"
                                className="qr-image"
                            />
                        )}
                    </div>

                    <div className="qr-actions">
                        <button className="btn-qr-action" onClick={onCopiarQR}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copiar
                        </button>
                        <button className="btn-qr-action" onClick={onDescargarQR}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Descargar
                        </button>
                    </div>

                    <div className="link-section">
                        <label>Link principal de registro</label>
                        <div className="link-input-group">
                            <input type="text" value={linkGenerado} readOnly className="link-input-modal" />
                            <button className="btn-copy-link" onClick={onCopiarLink}>Copiar</button>
                        </div>
                    </div>

                    {nuevaSesion?.ocurrencias?.length > 1 && (
                        <div className="modal-info-alert">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            <p>
                                Las URL y QR de las <strong>{nuevaSesion.ocurrencias.length - 1} {nuevaSesion.ocurrencias.length - 1 === 1 ? 'sesión adicional' : 'sesiones adicionales'}</strong> se encuentran en el menú Actividades registradas.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;
