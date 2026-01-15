import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';
import logoFSD from '../../assets/img/logo_fsd.png';
import { logout } from '../../utils/auth';
import Modal from '../common/Modal';

const Header = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const name = userInfo.name || 'Usuario';
  const email = userInfo.email || 'usuario@fundacionsantodomingo.org';

  const location = useLocation();
  // Mostrar información de usuario solo en la sección de Talento Humano
  const showUserBlock = location.pathname.startsWith('/talento');

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    const first = parts[0][0];
    const last = parts[parts.length - 1][0];
    return (first + last).toUpperCase();
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = () => {
    setConfirmOpen(true);
  };

  const confirmLogout = async () => {
    setConfirmOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  const cancelLogout = () => {
    setConfirmOpen(false);
  };

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

        <div className="header-right">
          {showUserBlock && (
            <div className="header-user compact">
              <div className="header-user-info compact-info">
                <div className="header-user-name">{name}</div>
                <div className="header-user-email">{email}</div>
              </div>

              <div className="header-avatar">{getInitials(name)}</div>

              <button className="btn-logout-small" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="3" width="12" height="18" rx="1" />
                  <circle cx="11.5" cy="12" r="0.6" />
                </svg>
              </button>
              <Modal isOpen={confirmOpen} onClose={cancelLogout} title="Confirmar cierre de sesión" size="sm">
                <div style={{ padding: '1px 0' }}>
                  <p style={{color: '#333'}}>¿Estás seguro que deseas cerrar sesión?</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button onClick={cancelLogout} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff' }}>Cancelar</button>
                    <button onClick={confirmLogout} style={{ padding: '8px 12px', borderRadius: '8px', background: '#26BC58', color: '#fff', border: 'none' }}>Cerrar sesión</button>
                  </div>
                </div>
              </Modal>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
