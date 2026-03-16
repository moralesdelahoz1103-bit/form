import React from 'react';
import BrandSpinner from '../BrandSpinner/BrandSpinner';
import './Button.css';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  type = 'button',
  fullWidth = false,
  className = ''
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''} ${className}`}
      style={{ position: 'relative' }}
    >
      {/* Texto original: siempre ocupa su espacio para mantener el tamaño del botón */}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {children}
      </span>

      {/* Spinner superpuesto: no ocupa espacio en el flujo del DOM */}
      {loading && (
        <span className="btn-loading-overlay">
          <BrandSpinner size="xs" className="btn-loading-spinner" />
          <span>Cargando</span>
        </span>
      )}
    </button>
  );
};

export default Button;
