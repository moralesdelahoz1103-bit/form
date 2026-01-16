import { useState, useEffect } from 'react';
import './ConfiguracionModal.css';
import TabUsuarios from './TabUsuarios';
import TabPermisos from './TabPermisos';
import { getUserInfo } from '../../utils/auth';
import { tienePermiso } from '../../utils/permisos';

const ConfiguracionModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [userRole, setUserRole] = useState('Usuario');
  const [permisos, setPermisos] = useState({
    verUsuarios: false,
    modificarPermisos: false
  });
  // Cachear datos para evitar recargas innecesarias
  const [usuariosData, setUsuariosData] = useState(null);
  const [permisosData, setPermisosData] = useState(null);

  useEffect(() => {
    const userInfo = getUserInfo();
    setUserRole(userInfo?.rol || 'Usuario');
    
    // Cargar permisos
    const cargarPermisos = async () => {
      const [verUsuarios, modificarPermisos] = await Promise.all([
        tienePermiso('ver_usuarios'),
        tienePermiso('modificar_permisos')
      ]);
      setPermisos({ verUsuarios, modificarPermisos });
    };
    cargarPermisos();
  }, [isOpen]);

  if (!isOpen) return null;

  const userInfo = getUserInfo() || {};
  const userName = userInfo.nombre || 'Usuario';

  const esAdmin = userRole === 'Administrador';

  // Tabs disponibles según el rol
  const tabs = [
    { 
      id: 'perfil', 
      label: 'Mi perfil', 
      icon: 'user',
      description: 'Información de tu cuenta'
    },
    { 
      id: 'usuarios', 
      label: 'Gestión de usuarios', 
      icon: 'users',
      description: 'Administra roles',
      requierePermiso: 'verUsuarios'
    },
    { 
      id: 'permisos', 
      label: 'Permisos de roles', 
      icon: 'shield',
      description: 'Configura permisos por rol',
      requierePermiso: 'modificarPermisos'
    },
    { 
      id: 'sistema', 
      label: 'Sistema', 
      icon: 'settings',
      description: 'Información del sistema',
      adminOnly: false
    },
  ];

  // Filtrar tabs según permisos
  const availableTabs = tabs.filter(tab => {
    if (!tab.requierePermiso) return true;
    return permisos[tab.requierePermiso];
  });

  const renderIcon = (iconName) => {
    const icons = {
      users: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      shield: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      user: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      settings: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
      help: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perfil':
        return <TabPerfil userInfo={userInfo} userRole={userRole} />;
      case 'usuarios':
        return permisos.verUsuarios ? (
          <TabUsuarios 
            cachedData={usuariosData}
            onDataUpdate={setUsuariosData}
          />
        ) : <PermisosDenegados />;
      case 'permisos':
        return permisos.modificarPermisos ? (
          <TabPermisos 
            cachedData={permisosData}
            onDataUpdate={setPermisosData}
          />
        ) : <PermisosDenegados />;
      case 'sistema':
        return <TabSistema />;
      default:
        return <TabPerfil userInfo={userInfo} userRole={userRole} />;
    }
  };

  return (
    <div className="config-modal-overlay" onClick={onClose}>
      <div className="config-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="config-modal-header">
          <div className="config-header-content">
            <div className="config-header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div className="config-header-text">
              <h2>Configuración</h2>
              <p>Gestiona las preferencias del sistema</p>
            </div>
          </div>
          <button className="config-close-btn" onClick={onClose} aria-label="Cerrar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="config-modal-body">
          <nav className="config-sidebar">
            <div className="config-sidebar-header">
              <div className="config-user-mini">
                <div className="config-user-avatar">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="config-user-info">
                  <span className="config-user-name">{userName}</span>
                  <span className="config-user-role">{userRole}</span>
                </div>
              </div>
            </div>
            
            <div className="config-tabs">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`config-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="config-tab-icon">{renderIcon(tab.icon)}</span>
                  <div className="config-tab-content">
                    <span className="config-tab-label">{tab.label}</span>
                    <span className="config-tab-desc">{tab.description}</span>
                  </div>
                  {activeTab === tab.id && (
                    <span className="config-tab-indicator"></span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          <div className="config-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Perfil
const TabPerfil = ({ userInfo, userRole }) => {
  return (
    <div className="config-section">
      <div className="config-section-header">
        <h3>Mi perfil</h3>
        <p>Información de tu cuenta en el sistema</p>
      </div>

      <div className="config-cards">
        <div className="config-card">
          <div className="config-card-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <h4>Información personal</h4>
          </div>
          <div className="config-card-body">
            <div className="info-item">
              <span className="info-label">Nombre completo</span>
              <span className="info-value">{userInfo.nombre || 'No disponible'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Correo electrónico</span>
              <span className="info-value">{userInfo.email || 'No disponible'}</span>
            </div>
          </div>
        </div>

        <div className="config-card">
          <div className="config-card-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h4>Rol y permisos</h4>
          </div>
          <div className="config-card-body">
            <div className="info-item">
              <span className="info-label">Rol actual</span>
              <span className={`role-badge role-${userRole.toLowerCase()}`}>{userRole}</span>
            </div>
            <div className="permissions-list">
              <h5>Permisos actuales:</h5>
              {userRole === 'Administrador' && (
                <ul>
                  <li><span className="check">✓</span> Acceso total al sistema</li>
                  <li><span className="check">✓</span> Crear y editar sesiones</li>
                  <li><span className="check">✓</span> Gestionar usuarios</li>
                  <li><span className="check">✓</span> Cambiar roles</li>
                </ul>
              )}
              {userRole === '' && (
                <ul>
                  <li><span className="check">✓</span> Crear y editar sesiones</li>
                  <li><span className="check">✓</span> Gestionar asistentes</li>
                  <li><span className="check">✓</span> Ver estadísticas</li>
                  <li><span className="cross">✗</span> Gestionar usuarios</li>
                </ul>
              )}
              {userRole === 'Usuario' && (
                <ul>
                  <li><span className="check">✓</span> Ver sesiones</li>
                  <li><span className="check">✓</span> Ver asistentes</li>
                  <li><span className="cross">✗</span> Crear sesiones</li>
                  <li><span className="cross">✗</span> Gestionar usuarios</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Sistema
const TabSistema = () => {
  return (
    <div className="config-section">
      <div className="config-section-header">
        <h3>Información del sistema</h3>
        <p>Detalles técnicos y versión</p>
      </div>

      <div className="config-cards">
        <div className="config-card">
          <div className="config-card-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            <h4>Versión</h4>
          </div>
          <div className="config-card-body">
            <div className="info-item">
              <span className="info-label">Sistema</span>
              <span className="info-value">Formaciones y Eventos v1.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">Última actualización</span>
              <span className="info-value">Enero 2026</span>
            </div>
          </div>
        </div>

        <div className="config-card">
          <div className="config-card-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
            <h4>Tecnología</h4>
          </div>
          <div className="config-card-body">
            <div className="info-item">
              <span className="info-label">Frontend</span>
              <span className="info-value">React + Vite</span>
            </div>
            <div className="info-item">
              <span className="info-label">Backend</span>
              <span className="info-value">FastAPI (Python)</span>
            </div>
            <div className="info-item">
              <span className="info-label">Base de datos</span>
              <span className="info-value">Azure Cosmos DB</span>
            </div>
            <div className="info-item">
              <span className="info-label">Autenticación</span>
              <span className="info-value">Microsoft Entra ID</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente cuando no hay permisos
const PermisosDenegados = () => {
  return (
    <div className="config-section">
      <div className="permisos-denegados">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
        </svg>
        <h3>Acceso Restringido</h3>
        <p>Solo los administradores pueden acceder a esta sección.</p>
        <p className="help-text">Contacta a un administrador si necesitas cambiar roles de usuario.</p>
      </div>
    </div>
  );
};

export default ConfiguracionModal;
