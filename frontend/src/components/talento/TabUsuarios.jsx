import { useState, useEffect } from 'react';
import './TabUsuarios.css';
import Toast from '../common/Toast';
import { usuariosService } from '../../services/usuarios';
import { tienePermiso } from '../../utils/permisos';

const TabUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [changingRol, setChangingRol] = useState(null);
  const [rolesTemporales, setRolesTemporales] = useState({}); // Roles seleccionados pero no guardados
  const [searchNombre, setSearchNombre] = useState('');
  const [filterRol, setFilterRol] = useState('');
  
  // Permisos
  const [permisos, setPermisos] = useState({
    ver: false,
    cambiarRoles: false,
    eliminar: false
  });
  const [verificandoPermisos, setVerificandoPermisos] = useState(true);

  // Cargar permisos al montar
  useEffect(() => {
    const cargarPermisos = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const permisosPromise = Promise.all([
          tienePermiso('ver_usuarios'),
          tienePermiso('cambiar_roles'),
          tienePermiso('eliminar_usuarios')
        ]);
        
        const [ver, cambiarRoles, eliminar] = await Promise.race([
          permisosPromise,
          timeoutPromise
        ]);
        
        setPermisos({ ver, cambiarRoles, eliminar });
      } catch (error) {
        console.error('Error cargando permisos:', error);
        setPermisos({ ver: false, cambiarRoles: false, eliminar: false });
      } finally {
        setVerificandoPermisos(false);
      }
    };
    cargarPermisos();
  }, []);

  // Cargar usuarios una sola vez al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosService.listar();
      setUsuarios(data);
      
      // Inicializar roles temporales con los roles actuales
      const rolesIniciales = {};
      data.forEach(usuario => {
        rolesIniciales[usuario.id] = usuario.rol;
      });
      setRolesTemporales(rolesIniciales);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleCambiarRol = (usuarioId, nuevoRol) => {
    // Solo actualizar el estado local, no guardar aún
    setRolesTemporales(prev => ({
      ...prev,
      [usuarioId]: nuevoRol
    }));
  };

  const handleGuardarRol = async (usuarioId, nombreUsuario) => {
    const nuevoRol = rolesTemporales[usuarioId];
    const usuario = usuarios.find(u => u.id === usuarioId);
    
    if (nuevoRol === usuario.rol) {
      showToast('No hay cambios para guardar', 'info');
      return;
    }

    try {
      setChangingRol(usuarioId);
      await usuariosService.cambiarRol(usuarioId, nuevoRol);
      showToast(`Rol de ${nombreUsuario} actualizado a ${nuevoRol}`, 'success');
      await cargarUsuarios();
    } catch (error) {
      showToast(error.message || 'Error al cambiar rol', 'error');
      // Revertir cambio local en caso de error
      setRolesTemporales(prev => ({
        ...prev,
        [usuarioId]: usuario.rol
      }));
    } finally {
      setChangingRol(null);
    }
  };

  const tieneChangiosPendientes = (usuarioId) => {
    const usuario = usuarios.find(u => u.id === usuarioId);
    return usuario && rolesTemporales[usuarioId] !== usuario.rol;
  };

  const handleDelete = async (userId) => {
    if (window.confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await usuariosService.eliminar(userId);
        showToast('Usuario eliminado exitosamente', 'success');
        await cargarUsuarios();
      } catch (error) {
        showToast(error.message || 'Error al eliminar usuario', 'error');
      }
    }
  };

  const getRoleBadge = (rol) => {
    const roles = {
      'Administrador': { class: 'badge-admin', icon: '👑' },
      'Editor': { class: 'badge-editor', icon: '✏️' },
      'Usuario': { class: 'badge-user', icon: '👤' }
    };
    return roles[rol] || roles['Usuario'];
  };

  const formatearFecha = (fecha) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  // Filtrar usuarios según los criterios de búsqueda
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchNombre = usuario.nombre.toLowerCase().includes(searchNombre.toLowerCase());
    const matchRol = filterRol === '' || usuario.rol === filterRol;
    return matchNombre && matchRol;
  });

  const hayFiltrosActivos = searchNombre !== '' || filterRol !== '';

  if (verificandoPermisos) {
    return (
      <div className="tab-usuarios-loading">
        <div className="loading-spinner"></div>
        <p>Verificando permisos...</p>
      </div>
    );
  }

  if (!permisos.ver) {
    return (
      <div className="tab-usuarios-container">
        <div className="tab-usuarios-header">
          <h3>Gestión de usuarios</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h4 style={{ color: '#666', marginBottom: '1rem' }}>Acceso restringido</h4>
          <p style={{ color: '#999' }}>
            No tienes permisos para ver la lista de usuarios. Contacta a un administrador si necesitas acceso.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tab-usuarios-loading">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="tab-usuarios-container">
      <div className="tab-usuarios-header">
        <div>
          <h3>Gestión de usuarios</h3>
          <p>Administra los roles de los usuarios registrados en el sistema</p>
        </div>
        <div className="usuarios-stats">
          <div className="stat-item">
            <span className="stat-label">Administradores</span>
            <span className="stat-value">
              {usuarios.filter(u => u.rol === 'Administrador').length}
            </span>
          </div>
        </div>
      </div>

      <div className="info-banner">
        <div>
          <strong>Los usuarios se registran automáticamente</strong>
          <p>Cuando alguien inicia sesión con Microsoft, se registra automáticamente con rol de "Usuario". Aquí puedes cambiar sus roles según sea necesario.</p>
        </div>
      </div>

      <div className="roles-legend">
        <h4>Roles disponibles:</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="badge badge-user">Usuario</span>
            <span>Crear y editar formaciones</span>
          </div>
          <div className="legend-item">
            <span className="badge badge-editor">Editor</span>
            <span>Crear y editar sesiones</span>
          </div>
          <div className="legend-item">
            <span className="badge badge-admin">Administrador</span>
            <span>Acceso total + gestión de usuarios</span>
          </div>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="filtros-container">
        <div className="filtro-busqueda">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchNombre}
            onChange={(e) => setSearchNombre(e.target.value)}
            className="input-busqueda"
          />
          {searchNombre && (
            <button
              className="btn-clear"
              onClick={() => setSearchNombre('')}
              title="Limpiar búsqueda"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <div className="filtro-rol">
          <label>Filtrar por rol:</label>
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="select-filtro-rol"
          >
            <option value="">Todos los roles</option>
            <option value="Usuario">Usuario</option>
            <option value="Editor">Editor</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>

        {hayFiltrosActivos && (
          <button
            className="btn-limpiar-filtros"
            onClick={() => {
              setSearchNombre('');
              setFilterRol('');
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Limpiar filtros
          </button>
        )}
      </div>

      <>
        {hayFiltrosActivos && usuariosFiltrados.length > 0 && (
          <div className="resultados-info">
            <span>Mostrando <strong>{usuariosFiltrados.length}</strong> de <strong>{usuarios.length}</strong> usuarios</span>
          </div>
        )}
        <div className="usuarios-table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Fecha de ingreso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!hayFiltrosActivos ? (
                  <tr>
                    <td colSpan="4" className="empty-table-message">
                      <div className="empty-table-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"></circle>
                          <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <h3>Busca un usuario</h3>
                        <p>Usa los filtros de arriba para buscar usuarios por nombre o rol</p>
                      </div>
                    </td>
                  </tr>
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-table-message">
                      <div className="empty-table-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3>No se encontraron usuarios</h3>
                        <p>Intenta con otros criterios de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => {
                const roleBadge = getRoleBadge(usuario.rol);
                return (
                  <tr key={usuario.id}>
                    <td>
                      <div className="usuario-cell">
                        <div className="usuario-avatar">
                          {usuario.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="usuario-info">
                          <span className="usuario-nombre">{usuario.nombre}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="rol-select-wrapper">
                        <select
                          className={`rol-select ${roleBadge.class}`}
                          value={rolesTemporales[usuario.id] || usuario.rol}
                          onChange={(e) => handleCambiarRol(usuario.id, e.target.value)}
                          disabled={changingRol === usuario.id || !permisos.cambiarRoles}
                        >
                          <option value="Usuario">Usuario</option>
                          <option value="Editor">Editor</option>
                          <option value="Administrador">Administrador</option>
                        </select>
                        <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </td>
                    <td>
                      <span className="fecha-text">
                        {formatearFecha(usuario.fecha_ingreso)}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        {permisos.cambiarRoles && (
                          <button
                            className={`btn-action btn-save ${tieneChangiosPendientes(usuario.id) ? 'has-changes' : ''}`}
                            onClick={() => handleGuardarRol(usuario.id, usuario.nombre)}
                            disabled={!tieneChangiosPendientes(usuario.id) || changingRol === usuario.id}
                            title={tieneChangiosPendientes(usuario.id) ? "Guardar cambios" : "Sin cambios"}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
};

export default TabUsuarios;
