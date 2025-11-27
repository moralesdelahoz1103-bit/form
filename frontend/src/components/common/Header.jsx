import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
            <img 
              src={logoFSD}
              alt="Logo Fundación Santo Domingo" 
              className="header-logo"
            />
        </div>
      </div>
    </header>
  );
};
import logoFSD from '../../assets/img/logo_fsd.png';

export default Header;
