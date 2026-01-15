export const config = {
  // Cambiar a la URL de producción después del deployment
  // Ejemplo: 'https://form-backend.eastus.azurecontainerapps.io'
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  allowedDomain: '@fundacionsantodomingo.org',
  tokenExpiry: 30,
  maxFileSize: 1024 * 1024
};
