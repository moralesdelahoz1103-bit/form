# guía de despliegue con docker y azure

## tabla de contenidos
1. [requisitos previos](#requisitos-previos)
2. [configuración local con docker](#configuración-local-con-docker)
3. [despliegue en azure](#despliegue-en-azure)
4. [solución de problemas](#solución-de-problemas)

---

## requisitos previos

### software necesario
- [docker desktop](https://www.docker.com/products/docker-desktop/) 20.10+
- [azure cli](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (para despliegue)
- cuenta de azure con suscripción activa

### variables de entorno
antes de comenzar, genera un `session_secret` seguro:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## configuración local con docker

### 1. configurar variables de entorno

crea un archivo `.env` en la raíz del proyecto (usa `.env.example` en el backend como referencia):

```bash
cp backend/.env.example .env
```

edita `.env` y configura las variables obligatorias:

```env
SESSION_SECRET=tu-secret-generado-minimo-32-caracteres
ENTRA_CLIENT_ID=tu-application-client-id
ENTRA_CLIENT_SECRET=tu-client-secret
ENTRA_TENANT_ID=tu-tenant-id
ENTRA_REDIRECT_URI=http://localhost:8000/api/auth/callback
```

### 2. construir y ejecutar con docker compose

```powershell
# construir las imágenes
docker-compose build

# iniciar los servicios
docker-compose up -d

# ver logs
docker-compose logs -f

# detener los servicios
docker-compose down
```

### 3. verificar funcionamiento

- **frontend**: http://localhost (puerto 80 en docker)
- **backend api**: http://localhost:8000
- **documentación api**: http://localhost:8000/docs

---

## despliegue en azure

### azure container apps (recomendado)

#### 1. login en azure
```powershell
az login
az account set --subscription "tu-subscription-id"
```

#### 2. construcción y push al registry
es recomendable usar azure container registry (acr) para gestionar las imágenes.

```powershell
$ACR_NAME="nombre-de-tu-acr"
az acr login --name $ACR_NAME

# backend
docker build -t "$ACR_NAME.azurecr.io/form-backend:latest" ./backend
docker push "$ACR_NAME.azurecr.io/form-backend:latest"

# frontend
docker build -t "$ACR_NAME.azurecr.io/form-frontend:latest" ./frontend
docker push "$ACR_NAME.azurecr.io/form-frontend:latest"
```

---

## solución de problemas

### ver logs de contenedores
```powershell
# logs de backend
docker-compose logs backend

# logs de frontend
docker-compose logs frontend
```

### problemas comunes

#### 1. error de autenticación microsoft
- verifica que `entra_redirect_uri` coincida con la url configurada en entra id.
- asegúrate de que el dominio esté en la lista de permitidos en el portal de azure.

#### 2. error de cors
- verifica que `frontend_url` en el backend apunte al dominio correcto del frontend.

#### 3. error de cosmos db
- verifica que `cosmos_endpoint` y `cosmos_key` sean correctos.
- asegúrate de que el modo de almacenamiento sea `cosmosdb` en las variables de entorno.

---

## checklist de seguridad para producción

- [ ] `session_secret` con mínimo 32 caracteres aleatorios.
- [ ] variables sensibles en azure key vault o secretos de container apps.
- [ ] https habilitado en todos los servicios.
- [ ] almacenamiento de blobs con acceso privado.
- [ ] cors configurado solo para dominios específicos.
- [ ] eliminar logs de depuración del código de producción.
