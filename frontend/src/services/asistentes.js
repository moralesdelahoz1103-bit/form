import api from './api';

export const asistentesService = {
  // Obtener información pública de sesión por token
  obtenerSesionPorToken: async (token) => {
    const response = await api.get(`/api/sesion/${token}`);
    return response.data;
  },

  // Registrar asistencia (acepta FormData con archivo 'firma')
  registrar: async (asistenteData) => {
    const response = await api.post('/api/asistencia', asistenteData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
