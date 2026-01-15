import { config } from './constants';

/**
 * Utilidades de autenticación
 * Maneja tokens y lógica de sesión del usuario
 */

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

export const setUserInfo = (userInfo) => {
  if (userInfo) {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  } else {
    localStorage.removeItem('userInfo');
  }
};

export const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
};

export const logout = async () => {
  const token = getAuthToken();
  let logoutUrl = '/login';
  
  if (token) {
    try {
      // Notificar al backend del logout y obtener URL de Microsoft
      const response = await fetch(`${config.apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        logoutUrl = data.logout_url || '/login';
      }
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }
  
  // Limpiar almacenamiento local
  clearAuth();
  
  // Redirigir a Microsoft logout (que luego redirige al login)
  window.location.href = logoutUrl;
};
