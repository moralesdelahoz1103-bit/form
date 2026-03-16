import React from 'react';
import estrellaVerde from '../../../assets/img/Estrella verde.png';
import './BrandSpinner.css';

const BrandSpinner = ({ size = 'md', className = '' }) => {
  return (
    <span className={`brand-spinner brand-spinner-${size} ${className}`.trim()} aria-hidden="true">
      <img src={estrellaVerde} alt="" />
    </span>
  );
};

export default BrandSpinner;
