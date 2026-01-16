import { getUserInfo } from './auth';
import { config } from './constants';

/**
 * Sistema de gestión de permisos basado en roles
 * Verifica y controla el acceso a funcionalidades según el rol del usuario
 */

// Cache de permisos en memoria
let permisosCache = null;
let cacheTimestamp = null;
let fetchPromise = null; // Para evitar múltiples fetches simultáneos
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene los permisos desde el backend o del cache
 */
export const obtenerPermisos = async () => {
  // Verificar si el cache es válido
  const now = Date.now();
  if (permisosCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return permisosCache;
  }

  // Si ya hay un fetch en progreso, esperar su resultado
  if (fetchPromise) {
    return fetchPromise;
  }

  // Crear nuevo fetch y guardarlo
  fetchPromise = (async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${config.apiUrl}/api/permisos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const permisos = await response.json();
        permisosCache = permisos;
        cacheTimestamp = now;
        return permisos;
      }
    } catch (error) {
      console.error('Error obteniendo permisos:', error);
    } finally {
      // Limpiar el promise después de un breve retraso
      setTimeout(() => {
        fetchPromise = null;
      }, 100);
    }

    // Permisos por defecto si falla la carga
    return getPermisosDefecto();
  })();

  return fetchPromise;
};

/**
 * Invalida el cache de permisos (útil después de actualizar permisos)
 */
export const invalidarCachePermisos = () => {
  permisosCache = null;
  cacheTimestamp = null;
  fetchPromise = null;
};

/**
 * Permisos por defecto del sistema
 */
export const getPermisosDefecto = () => ({
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
});

/**
 * Obtiene el rol del usuario actual
 */
export const obtenerRolUsuario = () => {
  const userInfo = getUserInfo();
  return userInfo?.rol || 'Usuario';
};

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permiso - Nombre del permiso a verificar
 * @returns {Promise<boolean>} - true si tiene el permiso
 */
export const tienePermiso = async (permiso) => {
  const rol = obtenerRolUsuario();
  const permisos = await obtenerPermisos();
  
  return permisos[rol]?.[permiso] || false;
};

/**
 * Verifica múltiples permisos (el usuario debe tener todos)
 * @param {string[]} permisosRequeridos - Array de permisos requeridos
 * @returns {Promise<boolean>} - true si tiene todos los permisos
 */
export const tienePermisosMultiples = async (permisosRequeridos) => {
  const checks = await Promise.all(
    permisosRequeridos.map(p => tienePermiso(p))
  );
  return checks.every(result => result === true);
};

/**
 * Verifica si el usuario tiene al menos uno de los permisos especificados
 * @param {string[]} permisosRequeridos - Array de permisos
 * @returns {Promise<boolean>} - true si tiene al menos uno
 */
export const tieneAlgunPermiso = async (permisosRequeridos) => {
  const checks = await Promise.all(
    permisosRequeridos.map(p => tienePermiso(p))
  );
  return checks.some(result => result === true);
};

/**
 * Verifica si el usuario es administrador
 */
export const esAdministrador = () => {
  return obtenerRolUsuario() === 'Administrador';
};

/**
 * Verifica si el usuario es  o superior
 */
export const esOSuperior = () => {
  const rol = obtenerRolUsuario();
  return rol === '' || rol === 'Administrador';
};

/**
 * Hook para usar en componentes React
 */
export const usePermisos = () => {
  const [permisos, setPermisos] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const rol = obtenerRolUsuario();

  React.useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const permisosData = await obtenerPermisos();
      setPermisos(permisosData[rol] || {});
      setLoading(false);
    };
    cargar();
  }, [rol]);

  return {
    permisos,
    loading,
    tienePermiso: (permiso) => permisos?.[permiso] || false,
    rol,
    esAdministrador: rol === 'Administrador',
    esUsuario: rol === 'Usuario'
  };
};
