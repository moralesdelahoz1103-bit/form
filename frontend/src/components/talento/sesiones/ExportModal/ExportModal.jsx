import React from 'react';
import { Modal, Button } from '../../../common';
import './ExportModal.css';

const ExportModal = ({ isOpen, onClose, onExport }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Opciones de exportación" size="md">
            <div className="export-modal-content">
                <p className="export-modal-description">
                    ¿Qué información deseas incluir en tu reporte de Excel? Selecciona una de las siguientes opciones:
                </p>
                <div className="export-options-grid">
                    <button className="export-option-card" onClick={() => onExport('all')}>
                        <div className="option-icon-wrapper all">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <div className="option-details">
                            <span className="option-title">Todas las actividades</span>
                            <span className="option-desc">Exporta el consolidado completo de todas las áreas y responsables.</span>
                        </div>
                        <div className="option-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                    </button>

                    <button className="export-option-card" onClick={() => onExport('mine')}>
                        <div className="option-icon-wrapper mine">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="option-details">
                            <span className="option-title">Solo mis actividades</span>
                            <span className="option-desc">Genera un reporte filtrado únicamente con las sesiones de tu autoría.</span>
                        </div>
                        <div className="option-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                    </button>
                </div>
                <div className="export-modal-footer">
                    <Button onClick={onClose} variant="secondary">Cancelar</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ExportModal;
