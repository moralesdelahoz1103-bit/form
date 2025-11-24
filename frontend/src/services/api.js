import axios from 'axios';
import { config } from '../utils/constants';

const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // El servidor respondió con un error
      const { status, data } = error.response;
      
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      // Extraer el mensaje de error del backend
      let errorMessage = 'Error en la solicitud';
      if (data.detail) {
        errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      } else if (data.message) {
        errorMessage = data.message;
      }
      
      return Promise.reject({
        status,
        message: errorMessage,
        detail: data.detail,
        data
      });
    } else if (error.request) {
      // No hubo respuesta del servidor
      return Promise.reject({
        message: 'No se pudo conectar con el servidor. Verifique que el backend esté ejecutándose.',
        error
      });
    } else {
      // Error al configurar la solicitud
      return Promise.reject({
        message: error.message || 'Error al procesar la solicitud',
        error
      });
    }
  }
);

export default api;
