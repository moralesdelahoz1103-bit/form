# Azure AD Authentication - Guía de Configuración

## Modo Desarrollo (AUTH_MODE=dev)

En modo desarrollo, no se requiere configurar Azure AD. El sistema usa un bypass que permite:
- Login directo sin credenciales
- Usuario simulado: dev@fundacionsantodomingo.org
- Ideal para desarrollo local

## Configuración para Producción (AUTH_MODE=production)

### 1. Registrar aplicación en Azure AD

1. Ir a [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → App registrations → New registration
3. Configurar:
   - Name: Sistema Capacitaciones FSD
   - Supported account types: Single tenant
   - Redirect URI: Web → https://tu-dominio.com/auth/callback

### 2. Obtener credenciales

En la aplicación registrada:
- **Application (client) ID** → AZURE_CLIENT_ID
- **Directory (tenant) ID** → AZURE_TENANT_ID
- Certificates & secrets → New client secret → Copiar value → AZURE_CLIENT_SECRET

### 3. Configurar permisos

API permissions → Add permission → Microsoft Graph → Delegated:
- User.Read (leer perfil básico del usuario)

Click "Grant admin consent"

### 4. Configurar variables de entorno

Crear archivo `.env` en `backend/` con:

```env
AUTH_MODE=production
AZURE_TENANT_ID=tu-tenant-id-aqui
AZURE_CLIENT_ID=tu-client-id-aqui
AZURE_CLIENT_SECRET=tu-client-secret-aqui
AZURE_REDIRECT_URI=https://tu-dominio.com/auth/callback
AZURE_AUTHORITY=https://login.microsoftonline.com/tu-tenant-id-aqui
AZURE_SCOPE=User.Read
ALLOWED_DOMAIN=@fundacionsantodomingo.org
```

### 5. Actualizar frontend

En `frontend/src/context/AuthContext.jsx`, actualizar URLs de API para producción.

### 6. Testing en producción

1. Cambiar AUTH_MODE=production
2. Reiniciar backend
3. Acceder a /login
4. Click "Iniciar sesión con Microsoft"
5. Redirige a Microsoft login
6. Tras autenticarse, regresa a /auth/callback
7. Sistema valida y crea sesión

## Troubleshooting

### Error: "AADSTS50011: The reply URL specified in the request does not match"
→ Verificar que AZURE_REDIRECT_URI coincida exactamente con la URI configurada en Azure Portal

### Error: "AADSTS700016: Application not found in the directory"
→ Verificar AZURE_TENANT_ID y AZURE_CLIENT_ID

### Usuario no puede acceder - "Dominio no autorizado"
→ Verificar que el email del usuario termine con el dominio en ALLOWED_DOMAIN

### Modo dev no funciona
→ Verificar AUTH_MODE=dev en .env y reiniciar backend
