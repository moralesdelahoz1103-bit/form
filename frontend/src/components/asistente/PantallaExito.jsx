import React from 'react';
import './PantallaExito.css';

const PantallaExito = () => {
  return (
    <div className="exito-container">
      <div className="exito-card">
        <div className="exito-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 className="exito-title">¡Registro Exitoso!</h1>
        <p className="exito-message">
          Tu asistencia ha sido registrada correctamente
        </p>
        <p className="exito-secondary">
          Gracias por participar. Puedes cerrar esta ventana.
        </p>
      </div>
    </div>
  );
};

export default PantallaExito;
