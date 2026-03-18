import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../common';
import { config } from '../../../../utils/constants';
import { formatters } from '../../../../utils/formatters';
import './QRCodeModal.css';

const QRCodeModal = ({ modalQR, setModalQR, copiarQR, descargarQR }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex(0);
    }, [modalQR]);

    if (!modalQR) return null;

    const isSingleView = !!modalQR._ocurrencia || !(modalQR.ocurrencias && modalQR.ocurrencias.length > 0);

    let items = [];
    if (isSingleView) {
        items = [{
            isOcurrencia: !!modalQR._ocurrencia,
            data: modalQR._ocurrencia || modalQR,
            rootId: modalQR.id,
            indexLabel: ''
        }];
    } else {
        // Para evitar duplicados, filtramos las ocurrencias que tengan el mismo token que la raíz
        const ocurrenciasAdicionales = (modalQR.ocurrencias || []).filter(oc => oc.token !== modalQR.token);
        
        items = [
            {
                isOcurrencia: false,
                data: modalQR,
                rootId: modalQR.id,
                indexLabel: 'Sesión 1'
            },
            ...ocurrenciasAdicionales.map((oc) => ({
                isOcurrencia: true,
                data: oc,
                rootId: modalQR.id,
                indexLabel: '' // Se reasignará abajo
            }))
        ];

        // Ordenar por fecha y reasignar etiquetas
        items.sort((a, b) => new Date(a.data.fecha) - new Date(b.data.fecha));
        items.forEach((item, idx) => {
            item.indexLabel = `Sesión ${idx + 1}`;
        });
    }

    const currentItem = items[currentIndex];

    const qrSrc = currentItem.isOcurrencia
        ? `${config.apiUrl}/api/sesiones/${currentItem.rootId}/ocurrencias/${currentItem.data.id}/qr`
        : `${config.apiUrl}/api/sesiones/${currentItem.rootId}/qr`;

    const temaLabel = currentItem.data.tema || modalQR.tema;
    const fechaLabel = formatters.fechaCorta(currentItem.data.fecha);

    const handleNext = () => {
        if (currentIndex < items.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    return (
        <Modal
            isOpen={!!modalQR}
            onClose={() => setModalQR(null)}
            title="Acceso vía QR"
            size="sm"
        >
            <div className="modal-qr-container">
                <div className="qr-header-info">
                    <h3 className="qr-tema-title">{temaLabel}</h3>
                    <div className="qr-badges-row">
                        {currentItem.indexLabel && <span className="qr-session-badge">{currentItem.indexLabel}</span>}
                        {fechaLabel && <span className="qr-fecha-badge">{fechaLabel}</span>}
                    </div>
                </div>

                <div className="qr-carousel-body">
                    {!isSingleView && (
                        <button
                            className="qr-nav-btn prev"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            title="Anterior sesión"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                    )}

                    <div className="qr-image-wrapper">
                        <img src={qrSrc} alt="QR Code" className="qr-img-refined" />
                    </div>

                    {!isSingleView && (
                        <button
                            className="qr-nav-btn next"
                            onClick={handleNext}
                            disabled={currentIndex === items.length - 1}
                            title="Siguiente sesión"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    )}
                </div>

                {!isSingleView && (
                    <div className="qr-pagination-dots">
                        {items.map((_, idx) => (
                            <button
                                key={idx}
                                className={`qr-dot ${idx === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(idx)}
                                title={`Ir a sesión ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}

                <div className="qr-actions-modern">
                    <button className="btn-qr-action primary" onClick={() => copiarQR(qrSrc)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        <span>Copiar QR</span>
                    </button>
                    <button className="btn-qr-action secondary" onClick={() => descargarQR(qrSrc, temaLabel)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        <span>Descargar</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default QRCodeModal;
