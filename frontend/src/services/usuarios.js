import { config } from '../utils/constants';
import { getAuthToken } from '../utils/auth';

export const usuariosService = {
  // Obtener todos los usuarios
  async listar() {
    const token = getAuthToken();
    const response = await fetch(`${config.apiUrl}/api/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Error al obtener usuarios');
    return response.json();
  },

  // Cambiar el rol de un usuario
  async cambiarRol(usuarioId, nuevoRol) {
    const token = getAuthToken();
    const response = await fetch(`${config.apiUrl}/api/usuarios/${usuarioId}/rol?rol=${encodeURIComponent(nuevoRol)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al cambiar rol');
    }
    return response.json();
  },

  // Eliminar un usuario
  async eliminar(id) {
    const token = getAuthToken();
    const response = await fetch(`${config.apiUrl}/api/usuarios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al eliminar usuario');
    }
  }
};
