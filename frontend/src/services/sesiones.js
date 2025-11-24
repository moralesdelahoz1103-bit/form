import api from './api';

export const sesionesService = {
  // Crear nueva capacitación
  crear: async (sesionData) => {
    const response = await api.post('/api/sesiones', sesionData);
    return response.data;
  },

  // Listar todas las capacitaciones
  listar: async () => {
    const response = await api.get('/api/sesiones');
    return response.data;
  },

  // Obtener una capacitación por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/api/sesiones/${id}`);
    return response.data;
  },

  // Eliminar capacitación
  eliminar: async (id) => {
    await api.delete(`/api/sesiones/${id}`);
  },

  // Obtener asistentes de una capacitación
  obtenerAsistentes: async (id) => {
    const response = await api.get(`/api/sesiones/${id}/asistentes`);
    return response.data;
  }
};
