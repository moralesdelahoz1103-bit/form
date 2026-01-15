import { useState, useEffect } from 'react';
import './AyudaModal.css';
import TabAyuda from './TabAyuda';

const AyudaModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="ayuda-modal-overlay" onClick={onClose}>
      <div className="ayuda-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="ayuda-modal-header">
          <div className="ayuda-header-content">
            <div className="ayuda-header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div className="ayuda-header-text">
              <h2>Centro de ayuda</h2>
              <p>Guías y respuestas a preguntas frecuentes</p>
            </div>
          </div>
          <button className="ayuda-close-btn" onClick={onClose} aria-label="Cerrar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="ayuda-modal-body">
          <TabAyuda />
        </div>
      </div>
    </div>
  );
};

export default AyudaModal;
