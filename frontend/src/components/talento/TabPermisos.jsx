import { useState, useEffect } from 'react';
import './TabPermisos.css';
import Toast from '../common/Toast';
import { config } from '../../utils/constants';
import { invalidarCachePermisos, getPermisosDefecto } from '../../utils/permisos';

const API_URL = config.apiUrl;

const TabPermisos = ({ cachedData, onDataUpdate }) => {
  const [permisos, setPermisos] = useState(cachedData || {});
  const [permisosOriginales, setPermisosOriginales] = useState({});
  const [loading, setLoading] = useState(!cachedData);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Definición de permisos por categoría
  const categoriasPermisos = [
    {
      id: 'sesiones',
      nombre: 'Formaciones y eventos',
      permisos: [
        { id: 'ver_sesiones', nombre: 'Ver sesiones', descripcion: 'Visualizar la lista de sesiones registradas' },
        { id: 'crear_sesiones', nombre: 'Crear sesiones', descripcion: 'Registrar nuevas sesiones de capacitación' },
        { id: 'editar_sesiones', nombre: 'Editar sesiones', descripcion: 'Modificar información de sesiones existentes' },
        { id: 'eliminar_sesiones', nombre: 'Eliminar sesiones', descripcion: 'Borrar sesiones del sistema' },
        { id: 'exportar_sesiones', nombre: 'Exportar datos', descripcion: 'Descargar reportes y datos de sesiones' },
      ]
    },
    {
      id: 'usuarios',
      nombre: 'Gestión de usuarios',
      permisos: [
        { id: 'ver_usuarios', nombre: 'Ver usuarios', descripcion: 'Visualizar la lista de usuarios del sistema' },
        { id: 'cambiar_roles', nombre: 'Cambiar roles', descripcion: 'Modificar roles de otros usuarios' },
        // { id: 'eliminar_usuarios', nombre: 'Eliminar usuarios', descripcion: 'Remover usuarios del sistema' },
      ]
    },
    {
      id: 'configuracion',
      nombre: 'Configuración y sistema',
      permisos: [
        { id: 'acceder_config', nombre: 'Acceder a configuración', descripcion: 'Entrar al panel de configuración' },
        { id: 'modificar_permisos', nombre: 'Modificar permisos', descripcion: 'Cambiar permisos de los roles' },
      ]
    }
  ];

  const roles = ['Usuario', 'Administrador'];

  useEffect(() => {
    if (!cachedData) {
      cargarPermisos();
    } else {
      setPermisosOriginales(JSON.parse(JSON.stringify(cachedData)));
    }
  }, []);

  const cargarPermisos = async () => {
    try {
      setLoading(true);
      
      // Cargar permisos desde el backend
      const response = await fetch(`${config.apiUrl}/api/permisos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      let permisosData;
      if (response.ok) {
        permisosData = await response.json();
      } else {
        // Permisos por defecto en caso de error
        permisosData = {
          Usuario: {
            ver_sesiones: true,
            crear_sesiones: true,
            editar_sesiones: true,
            eliminar_sesiones: true,
            exportar_sesiones: true,
            ver_usuarios: false,
            cambiar_roles: false,
            eliminar_usuarios: false,
            acceder_config: false,
            modificar_permisos: false,
          },
          Administrador: {
            ver_sesiones: true,
            crear_sesiones: true,
            editar_sesiones: true,
            eliminar_sesiones: true,
            exportar_sesiones: true,
            ver_usuarios: true,
            cambiar_roles: true,
            eliminar_usuarios: true,
            acceder_config: true,
            modificar_permisos: true,
          }
        };
      }

      setPermisos(permisosData);
      setPermisosOriginales(JSON.parse(JSON.stringify(permisosData)));
      
      // Notificar al padre para cachear los datos
      if (onDataUpdate) {
        onDataUpdate(permisosData);
      }
    } catch (error) {
      console.error('Error cargando permisos:', error);
      showToast('Error al cargar permisos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleTogglePermiso = (rol, permisoId) => {
    setPermisos(prev => ({
      ...prev,
      [rol]: {
        ...prev[rol],
        [permisoId]: !prev[rol][permisoId]
      }
    }));
  };

  const tieneChangiosPendientes = () => {
    return JSON.stringify(permisos) !== JSON.stringify(permisosOriginales);
  };

  const handleGuardar = async () => {
    if (!tieneChangiosPendientes()) {
      showToast('No hay cambios para guardar', 'info');
      return;
    }

    try {
      setSaving(true);
      
      // Guardar en el backend
      const response = await fetch(`${config.apiUrl}/api/permisos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(permisos)
      });

      if (response.ok) {
        setPermisosOriginales(JSON.parse(JSON.stringify(permisos)));
        invalidarCachePermisos(); // Invalidar cache para que se recarguen en otros componentes
        showToast('Permisos actualizados correctamente', 'success');
      } else {
        const error = await response.json();
        showToast(error.detail || 'Error al guardar permisos', 'error');
      }
    } catch (error) {
      console.error('Error guardando permisos:', error);
      showToast('Error al guardar permisos', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRestaurar = () => {
    if (window.confirm('¿Estás seguro de descartar los cambios no guardados?')) {
      setPermisos(JSON.parse(JSON.stringify(permisosOriginales)));
      showToast('Cambios descartados', 'info');
    }
  };

  const handleRestaurarDefecto = async () => {
    if (window.confirm('¿Estás seguro de restaurar los permisos por defecto? Esta acción sobrescribirá la configuración actual.')) {
      try {
        setSaving(true);
        
        // Obtener permisos por defecto del código
        const permisosDefecto = getPermisosDefecto();
        
        // Guardar en el backend
        const response = await fetch(`${API_URL}/api/permisos`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify(permisosDefecto)
        });

        if (!response.ok) {
          throw new Error('Error al guardar permisos');
        }

        const data = await response.json();
        
        // Actualizar estado local
        setPermisos(permisosDefecto);
        setPermisosOriginales(JSON.parse(JSON.stringify(permisosDefecto)));
        
        // Actualizar el caché del padre
        if (onDataUpdate) {
          onDataUpdate(permisosDefecto);
        }
        
        // Invalidar cache de permisos
        invalidarCachePermisos();
        
        showToast('Permisos restaurados a valores por defecto', 'success');
      } catch (error) {
        console.error('Error al restablecer permisos:', error);
        showToast('Error al restablecer permisos', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="tab-permisos-loading">
        <div className="loading-spinner"></div>
        <p>Cargando permisos...</p>
      </div>
    );
  }

  return (
    <div className="tab-permisos-container">
      <div className="tab-permisos-header">
        <div>
          <h3>Permisos de roles</h3>
          <p>Configura los permisos para cada rol del sistema</p>
        </div>
        <div className="permisos-actions">
          {tieneChangiosPendientes() && (
            <button className="btn-secondary" onClick={handleRestaurar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              Descartar cambios
            </button>
          )}
          <button 
            className={`btn-primary ${tieneChangiosPendientes() ? 'has-changes' : ''}`}
            onClick={handleGuardar}
            disabled={!tieneChangiosPendientes() || saving}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className="permisos-info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
          <strong>Importante</strong>
          <p>Los cambios en permisos se aplican de inmediato después de guardar. Los usuarios necesitarán recargar la página para ver los nuevos permisos.</p>
        </div>
      </div>

      {categoriasPermisos.map((categoria) => (
        <div key={categoria.id} className="permisos-categoria">
          <div className="categoria-header">
            <h4>{categoria.nombre}</h4>
          </div>

          <div className="permisos-table-container">
            <table className="permisos-table">
              <thead>
                <tr>
                  <th className="permiso-nombre-col">Permiso</th>
                  {roles.map(rol => (
                    <th key={rol} className="rol-col">
                      <div className="rol-header">
                        <span>{rol}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoria.permisos.map((permiso) => (
                  <tr key={permiso.id}>
                    <td className="permiso-info">
                      <div className="permiso-nombre">{permiso.nombre}</div>
                      <div className="permiso-descripcion">{permiso.descripcion}</div>
                    </td>
                    {roles.map(rol => (
                      <td key={`${rol}-${permiso.id}`} className="permiso-switch-cell">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={permisos[rol]?.[permiso.id] || false}
                            onChange={() => handleTogglePermiso(rol, permiso.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="permisos-footer">
        <button className="btn-danger-outline" onClick={handleRestaurarDefecto}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Restaurar valores por defecto
        </button>
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

export default TabPermisos;
