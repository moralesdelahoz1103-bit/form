import { useState, useEffect } from 'react';
import './TabCambiarRoles.css';
import { usuariosService } from '../../services/usuarios';
import Toast from '../common/Toast';

const TabCambiarRoles = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosService.listar();
      setUsuarios(data);
      
      // Inicializar roles seleccionados con los roles actuales
      const rolesIniciales = {};
      data.forEach(usuario => {
        rolesIniciales[usuario.id] = usuario.rol;
      });
      setSelectedRoles(rolesIniciales);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      mostrarToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleRoleChange = (usuarioId, nuevoRol) => {
    setSelectedRoles(prev => ({
      ...prev,
      [usuarioId]: nuevoRol
    }));
  };

  const handleSaveRole = async (usuarioId, nombreUsuario) => {
    const nuevoRol = selectedRoles[usuarioId];
    const usuario = usuarios.find(u => u.id === usuarioId);
    
    if (nuevoRol === usuario.rol) {
      mostrarToast('El rol no ha cambiado', 'info');
      return;
    }

    try {
      await usuariosService.cambiarRol(usuarioId, nuevoRol);
      
      // Actualizar el estado local
      setUsuarios(prev => prev.map(u => 
        u.id === usuarioId ? { ...u, rol: nuevoRol } : u
      ));
      
      mostrarToast(`Rol de ${nombreUsuario} actualizado a ${nuevoRol}`, 'success');
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      mostrarToast('Error al cambiar el rol', 'error');
      
      // Revertir el cambio en el selector
      setSelectedRoles(prev => ({
        ...prev,
        [usuarioId]: usuario.rol
      }));
    }
  };

  // Filtrar usuarios según el término de búsqueda
  const usuariosFiltrados = usuarios.filter(usuario => 
    usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener iniciales para el avatar
  const getInitials = (nombre) => {
    return nombre
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Verificar si el rol ha cambiado
  const hasRoleChanged = (usuarioId) => {
    const usuario = usuarios.find(u => u.id === usuarioId);
    return usuario && selectedRoles[usuarioId] !== usuario.rol;
  };

  if (loading) {
    return (
      <div className="tab-cambiar-roles">
        <div className="loading-state">
          <div className="spinner"></div>
          <p className="loading-text">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-cambiar-roles">
      {/* Sección de búsqueda */}
      <div className="search-section">
        <h3>Buscar Usuario</h3>
        <div className="search-box">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Escribe el nombre de la persona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
        <div className="search-help">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4M12 8h.01"></path>
          </svg>
          <span>Busca por nombre para cambiar rápidamente el rol de un usuario</span>
        </div>
      </div>

      {/* Sección de resultados */}
      <div className="results-section">
        {searchTerm && (
          <div className="results-header">
            <div className="results-count">
              {usuariosFiltrados.length === 0 ? (
                'No se encontraron usuarios'
              ) : (
                <>
                  <strong>{usuariosFiltrados.length}</strong> {usuariosFiltrados.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
                </>
              )}
            </div>
          </div>
        )}

        {!searchTerm ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <h3>Busca un usuario</h3>
            <p>Escribe el nombre en el campo de búsqueda para empezar</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="17" y1="11" x2="23" y2="11"></line>
            </svg>
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otro nombre</p>
          </div>
        ) : (
          <div className="users-list">
            {usuariosFiltrados.map(usuario => (
              <div key={usuario.id} className="user-card">
                <div className="user-card-content">
                  <div className="user-info">
                    <div className="user-avatar">
                      {getInitials(usuario.nombre)}
                    </div>
                    <div className="user-details">
                      <h4 className="user-name">{usuario.nombre}</h4>
                      <p className="user-id">{usuario.id}</p>
                      <div className={`current-role-badge rol-${usuario.rol}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Rol actual: <strong>{usuario.rol}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="role-change-section">
                    <div className="role-select-wrapper">
                      <select
                        className="role-select"
                        value={selectedRoles[usuario.id] || usuario.rol}
                        onChange={(e) => handleRoleChange(usuario.id, e.target.value)}
                      >
                        <option value="Usuario">Usuario</option>
                        <option value="Editor">Editor</option>
                        <option value="Administrador">Administrador</option>
                      </select>
                    </div>
                    <button
                      className="btn-save-role"
                      onClick={() => handleSaveRole(usuario.id, usuario.nombre)}
                      disabled={!hasRoleChanged(usuario.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

export default TabCambiarRoles;
