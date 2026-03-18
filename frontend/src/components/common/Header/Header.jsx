import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';
import logoFSD from '../../../assets/img/logo_fsd.png';
import { logout } from '../../../utils/auth';
import { tienePermiso } from '../../../utils/permisos';
import { Modal, Button } from '../';

const Header = ({ activeView, onModuleChange, onConfigClick }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const name = userInfo.name || 'Usuario';
  const email = userInfo.email || 'usuario@fundacionsantodomingo.org';

  const location = useLocation();
  const showUserBlock = location.pathname.startsWith('/talento');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [puedeAccederConfig, setPuedeAccederConfig] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const verificarPermisos = async () => {
      const puedeConfig = await tienePermiso('acceder_config');
      setPuedeAccederConfig(puedeConfig);
    };
    verificarPermisos();
  }, []);

  // Bloquear el scroll del fondo cuando el menú lateral está abierto (especialmente en móvil)
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open-lock');
    } else {
      document.body.classList.remove('menu-open-lock');
    }
    return () => {
      document.body.classList.remove('menu-open-lock');
    };
  }, [menuOpen]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = () => {
    setConfirmOpen(true);
    setMenuOpen(false);
  };

  const confirmLogout = async () => {
    setConfirmOpen(false);
    try {
      await logout();
    } catch (err) {
      window.location.href = '/login';
    }
  };

  const menuItems = [
    {
      id: 'crear',
      label: 'Crear actividad',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      )
    },
    {
      id: 'sesiones',
      label: 'Actividades registradas',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      id: 'estadisticas',
      label: 'Centro de reportes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      id: 'asistentes',
      label: 'Ver asistentes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'ayuda',
      label: 'Centro de ayuda',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      )
    },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <img src={logoFSD} alt="Logo" className="header-logo" />
        </div>

        <div className="header-right">
          {showUserBlock && (
            <>
              {/* VISTA ESCRITORIO (Original: Separado) */}
              <div className="header-user-desktop desktop-only">
                <div className="header-user-info">
                  <div className="header-user-name">{name}</div>
                  <div className="header-user-email">{email}</div>
                </div>
                <div className="header-avatar-circle">{getInitials(name)}</div>
                <button
                  className="btn-logout-header"
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>

              {/* VISTA MÓVIL (Unificada con Drawer) */}
              <div className={`header-user-container mobile-only ${menuOpen ? 'active' : ''}`} ref={menuRef}>
                <div className="header-user-trigger" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="header-avatar-circle">{getInitials(name)}</div>
                  <div className={`menu-arrow ${menuOpen ? 'up' : ''}`}>▾</div>
                </div>

                {/* Backdrop para cerrar el menú y mejorar el enfoque */}
                {menuOpen && <div className="header-menu-backdrop" onClick={() => setMenuOpen(false)} />}

                <div className={`header-dropdown-menu ${menuOpen ? 'open' : ''}`}>
                  <div className="dropdown-content-wrapper">
                    <div className="dropdown-section profile-info-mobile">
                      <div className="mobile-profile-header">
                        <div className="header-avatar-circle large">{getInitials(name)}</div>
                        <div className="mobile-user-name">{name}</div>
                      </div>
                    </div>

                    <div className="dropdown-section navigation">
                      <div className="dropdown-label">NAVEGACIÓN</div>
                      {menuItems.map(item => (
                        <button
                          key={item.id}
                          className={`dropdown-item ${activeView === item.id ? 'active' : ''}`}
                          onClick={() => {
                            onModuleChange(item.id);
                            setMenuOpen(false);
                          }}
                        >
                          <span className="dropdown-icon">{item.icon}</span>
                          <span className="dropdown-text">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="dropdown-section actions">
                      <div className="dropdown-label">SISTEMA</div>
                      {puedeAccederConfig && (
                        <button
                          className="dropdown-item config"
                          onClick={() => {
                            onConfigClick();
                            setMenuOpen(false);
                          }}
                        >
                          <span className="dropdown-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </span>
                          <span className="dropdown-text">Configuración</span>
                        </button>
                      )}
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <span className="dropdown-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        </span>
                        <span className="dropdown-text">Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar cierre de sesión" size="sm">
        <div className="logout-confirm-modal">
          <p>¿Estás seguro que deseas cerrar sesión?</p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={confirmLogout}>Cerrar sesión</Button>
          </div>
        </div>
      </Modal>
    </header>
  );
};

export default Header;
