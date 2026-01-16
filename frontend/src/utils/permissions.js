/**
 * Sistema de permisos basado en roles
 */

export const ROLES = {
  USUARIO: 'Usuario',
  ADMINISTRADOR: 'Administrador'
};

export const PERMISSIONS = {
  // Visualización
  VER_SESIONES: 'ver_sesiones',
  VER_ASISTENTES: 'ver_asistentes',
  VER_ESTADISTICAS: 'ver_estadisticas',
  
  // Creación y edición
  CREAR_SESION: 'crear_sesion',
  EDITAR_SESION: 'editar_sesion',
  ELIMINAR_SESION: 'eliminar_sesion',
  GESTIONAR_ASISTENTES: 'gestionar_asistentes',
  
  // Administración
  GESTIONAR_USUARIOS: 'gestionar_usuarios',
  CAMBIAR_ROLES: 'cambiar_roles'
};

// Permisos por rol
const ROLE_PERMISSIONS = {
  [ROLES.USUARIO]: [
    PERMISSIONS.VER_SESIONES,
    PERMISSIONS.VER_ASISTENTES,
    PERMISSIONS.VER_ESTADISTICAS
  ],
  
  [ROLES.ADMINISTRADOR]: Object.values(PERMISSIONS) // Todos los permisos
};

/**
 * Verifica si un rol tiene un permiso específico
 * @param {string} rol - El rol del usuario
 * @param {string} permission - El permiso a verificar
 * @returns {boolean}
 */
export const hasPermission = (rol, permission) => {
  const permissions = ROLE_PERMISSIONS[rol] || [];
  return permissions.includes(permission);
};

/**
 * Verifica si el usuario actual tiene un permiso
 * @param {string} permission - El permiso a verificar
 * @returns {boolean}
 */
export const canUser = (permission) => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) return false;
  
  try {
    const userInfo = JSON.parse(userInfoStr);
    return hasPermission(userInfo.rol, permission);
  } catch {
    return false;
  }
};

/**
 * Verifica si el usuario es administrador
 * @returns {boolean}
 */
export const isAdmin = () => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) return false;
  
  try {
    const userInfo = JSON.parse(userInfoStr);
    return userInfo.rol === ROLES.ADMINISTRADOR;
  } catch {
    return false;
  }
};

/**
 * Verifica si el usuario puede editar ( o Administrador)
 * @returns {boolean}
 */
export const canEdit = () => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) return false;
  
  try {
    const userInfo = JSON.parse(userInfoStr);
    return userInfo.rol === ROLES.ADMINISTRADOR;
  } catch {
    return false;
  }
};

/**
 * Obtiene el rol del usuario actual
 * @returns {string|null}
 */
export const getUserRole = () => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) return null;
  
  try {
    const userInfo = JSON.parse(userInfoStr);
    return userInfo.rol || ROLES.USUARIO;
  } catch {
    return null;
  }
};
