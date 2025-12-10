// Archivo mantenido por compatibilidad
// La autenticación ahora se maneja completamente en el backend

export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

export const logout = async () => {
  const token = getAuthToken();
  
  if (token) {
    try {
      // Notificar al backend del logout
      await fetch(`${window.location.origin.replace('5173', '8000')}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }
  
  // Limpiar almacenamiento local
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
  
  // Redirigir al login
  window.location.href = '/login';
};
