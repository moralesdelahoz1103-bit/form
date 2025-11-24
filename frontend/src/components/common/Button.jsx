import React from 'react';
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
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
