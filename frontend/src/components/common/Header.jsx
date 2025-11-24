import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <img 
            src="https://raw.githubusercontent.com/moralesdelahoz1103-bit/img/refs/heads/main/Fundacion-Santo-Domingo-Logo.png" 
            alt="Logo Fundación Santo Domingo" 
            className="header-logo"
          />
          <div className="header-text">
            <h1 className="header-title">Fundación</h1>
            <h2 className="header-subtitle">Santo Domingo</h2>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
