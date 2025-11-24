import React from 'react';
import './Select.css';

const Select = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  error, 
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  name
}) => {
  return (
    <div className="select-group">
      {label && (
        <label className="select-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        name={name}
        className={`select ${error ? 'select-error' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default Select;
