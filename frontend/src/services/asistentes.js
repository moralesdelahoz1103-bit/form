import api from './api';

export const asistentesService = {
  // Obtener información pública de sesión por token
  obtenerSesionPorToken: async (token) => {
    const response = await api.get(`/api/sesion/${token}`);
    return response.data;
  },

  // Registrar asistencia
  registrar: async (asistenteData) => {
    const response = await api.post('/api/asistencia', asistenteData);
    return response.data;
  }
};
