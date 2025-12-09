export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  azureClientId: import.meta.env.VITE_AZURE_CLIENT_ID,
  azureTenantId: import.meta.env.VITE_AZURE_TENANT_ID,
  allowedDomain: '@fundacionsantodomingo.org',
  tokenExpiry: 30,
  maxFileSize: 1024 * 1024
};
