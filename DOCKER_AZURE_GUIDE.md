# 🐳 Guía de Despliegue con Docker y Azure

## 📋 Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Local con Docker](#configuración-local-con-docker)
3. [Despliegue en Azure](#despliegue-en-azure)
4. [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos Previos

### Software Necesario
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 20.10+
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (para despliegue)
- Cuenta de Azure con suscripción activa

### Variables de Entorno
Antes de comenzar, genera un `SESSION_SECRET` seguro:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🚀 Configuración Local con Docker

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (usa `.env.example` como plantilla):

```bash
cp .env.example .env
```

Edita `.env` y configura al menos estas variables **OBLIGATORIAS**:

```env
SESSION_SECRET=tu-secret-generado-minimo-32-caracteres
AZURE_CLIENT_ID=tu-application-client-id
AZURE_CLIENT_SECRET=tu-client-secret
AZURE_TENANT_ID=tu-tenant-id
AZURE_REDIRECT_URI=http://localhost:8000/api/auth/callback
```

### 2. Construir y Ejecutar con Docker Compose

```powershell
# Construir las imágenes
docker-compose build

# Iniciar los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener los servicios
docker-compose down
```

### 3. Verificar que todo funciona

- **Frontend**: http://localhost (puerto 80)
- **Backend API**: http://localhost:8000
- **Health check**: http://localhost:8000/api/health
- **Docs API**: http://localhost:8000/docs

---

## ☁️ Despliegue en Azure

### Opción 1: Azure Container Instances (ACI) - Más Simple

#### 1. Login en Azure
```powershell
az login
az account set --subscription "tu-subscription-id"
```

#### 2. Crear Resource Group
```powershell
$RESOURCE_GROUP="form-capacitaciones-rg"
$LOCATION="eastus"

az group create --name $RESOURCE_GROUP --location $LOCATION
```

#### 3. Crear Azure Container Registry (ACR)
```powershell
$ACR_NAME="formcapacitaciones"  # debe ser único globalmente

az acr create `
  --resource-group $RESOURCE_GROUP `
  --name $ACR_NAME `
  --sku Basic `
  --admin-enabled true
```

#### 4. Build y Push de Imágenes al ACR
```powershell
# Login al registry
az acr login --name $ACR_NAME

# Tag y push backend
docker build -t "$ACR_NAME.azurecr.io/form-backend:latest" ./backend
docker push "$ACR_NAME.azurecr.io/form-backend:latest"

# Tag y push frontend
docker build -t "$ACR_NAME.azurecr.io/form-frontend:latest" ./frontend
docker push "$ACR_NAME.azurecr.io/form-frontend:latest"
```

#### 5. Crear Azure Cosmos DB (Recomendado para producción)
```powershell
$COSMOS_ACCOUNT="form-cosmos-db"

az cosmosdb create `
  --name $COSMOS_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --default-consistency-level Session `
  --locations regionName=$LOCATION failoverPriority=0

# Obtener connection string
$COSMOS_ENDPOINT = az cosmosdb show `
  --name $COSMOS_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --query documentEndpoint -o tsv

$COSMOS_KEY = az cosmosdb keys list `
  --name $COSMOS_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --query primaryMasterKey -o tsv

Write-Host "COSMOS_ENDPOINT=$COSMOS_ENDPOINT"
Write-Host "COSMOS_KEY=$COSMOS_KEY"
```

#### 6. Crear Azure Storage para Uploads (Opcional)
```powershell
$STORAGE_ACCOUNT="formstorageacct"  # debe ser único

az storage account create `
  --name $STORAGE_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --sku Standard_LRS

# Crear container para uploads
$STORAGE_CONNECTION = az storage account show-connection-string `
  --name $STORAGE_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --query connectionString -o tsv

az storage container create `
  --name uploads `
  --connection-string $STORAGE_CONNECTION `
  --public-access blob

Write-Host "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION"
```

#### 7. Desplegar Backend con Container Instance
```powershell
$ACR_PASSWORD = az acr credential show `
  --name $ACR_NAME `
  --query "passwords[0].value" -o tsv

az container create `
  --resource-group $RESOURCE_GROUP `
  --name form-backend `
  --image "$ACR_NAME.azurecr.io/form-backend:latest" `
  --registry-login-server "$ACR_NAME.azurecr.io" `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --dns-name-label "form-backend-$RANDOM" `
  --ports 8000 `
  --cpu 1 `
  --memory 1.5 `
  --environment-variables `
    SESSION_SECRET="TU_SESSION_SECRET_AQUI" `
    STORAGE_MODE="cosmosdb" `
    COSMOS_ENDPOINT="$COSMOS_ENDPOINT" `
    COSMOS_KEY="$COSMOS_KEY" `
    COSMOS_DATABASE_NAME="capacitaciones_db" `
    AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION" `
    AZURE_CLIENT_ID="TU_CLIENT_ID" `
    AZURE_CLIENT_SECRET="TU_CLIENT_SECRET" `
    AZURE_TENANT_ID="TU_TENANT_ID" `
    AZURE_REDIRECT_URI="https://form-backend-XXXXX.eastus.azurecontainer.io/api/auth/callback" `
    FRONTEND_URL="https://form-frontend-XXXXX.eastus.azurecontainer.io" `
    ALLOWED_DOMAIN="@fundacionsantodomingo.org" `
    TIMEZONE="America/Bogota"

# Obtener la URL pública del backend
$BACKEND_FQDN = az container show `
  --resource-group $RESOURCE_GROUP `
  --name form-backend `
  --query ipAddress.fqdn -o tsv

Write-Host "Backend URL: https://$BACKEND_FQDN"
```

#### 8. Actualizar Frontend con la URL del Backend

Primero, reconstruye el frontend con la URL correcta del backend:

```powershell
# En frontend/src/utils/constants.js o .env
$env:VITE_API_URL="https://$BACKEND_FQDN"
docker build --build-arg VITE_API_URL="https://$BACKEND_FQDN" -t "$ACR_NAME.azurecr.io/form-frontend:latest" ./frontend
docker push "$ACR_NAME.azurecr.io/form-frontend:latest"
```

#### 9. Desplegar Frontend
```powershell
az container create `
  --resource-group $RESOURCE_GROUP `
  --name form-frontend `
  --image "$ACR_NAME.azurecr.io/form-frontend:latest" `
  --registry-login-server "$ACR_NAME.azurecr.io" `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --dns-name-label "form-frontend-$RANDOM" `
  --ports 80 443 `
  --cpu 0.5 `
  --memory 1

# Obtener la URL pública del frontend
$FRONTEND_FQDN = az container show `
  --resource-group $RESOURCE_GROUP `
  --name form-frontend `
  --query ipAddress.fqdn -o tsv

Write-Host "Frontend URL: http://$FRONTEND_FQDN"
```

#### 10. Actualizar Microsoft Entra ID Redirect URIs

En Azure Portal → Azure Active Directory → App Registrations → Tu App:
- Agregar: `https://$BACKEND_FQDN/api/auth/callback`
- Agregar: `https://$FRONTEND_FQDN` como origen permitido

---

### Opción 2: Azure App Service (Recomendado para Producción)

#### 1. Crear App Service Plan
```powershell
az appservice plan create `
  --name form-app-service-plan `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --is-linux `
  --sku B1
```

#### 2. Crear Web Apps
```powershell
# Backend Web App
az webapp create `
  --resource-group $RESOURCE_GROUP `
  --plan form-app-service-plan `
  --name form-backend-app `
  --deployment-container-image-name "$ACR_NAME.azurecr.io/form-backend:latest"

# Configurar variables de entorno
az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name form-backend-app `
  --settings `
    SESSION_SECRET="TU_SESSION_SECRET" `
    STORAGE_MODE="cosmosdb" `
    COSMOS_ENDPOINT="$COSMOS_ENDPOINT" `
    COSMOS_KEY="$COSMOS_KEY" `
    # ... resto de variables

# Frontend Web App
az webapp create `
  --resource-group $RESOURCE_GROUP `
  --plan form-app-service-plan `
  --name form-frontend-app `
  --deployment-container-image-name "$ACR_NAME.azurecr.io/form-frontend:latest"
```

#### 3. Configurar Custom Domain y SSL (Opcional)
```powershell
# Agregar dominio personalizado
az webapp config hostname add `
  --webapp-name form-frontend-app `
  --resource-group $RESOURCE_GROUP `
  --hostname www.tudominio.com

# Habilitar HTTPS
az webapp update `
  --name form-frontend-app `
  --resource-group $RESOURCE_GROUP `
  --https-only true
```

---

## 🔍 Troubleshooting

### Ver logs de contenedores
```powershell
# Logs de backend
docker-compose logs backend

# Logs de frontend
docker-compose logs frontend

# Logs en Azure Container Instances
az container logs --resource-group $RESOURCE_GROUP --name form-backend
az container logs --resource-group $RESOURCE_GROUP --name form-frontend
```

### Verificar health checks
```powershell
# Local
curl http://localhost:8000/api/health

# Azure
curl https://TU-BACKEND-FQDN/api/health
```

### Problemas comunes

#### 1. Error de autenticación Microsoft
- Verifica que `AZURE_REDIRECT_URI` coincida con la URL configurada en Entra ID
- Asegúrate de que el dominio esté en la whitelist de Redirect URIs

#### 2. Error de CORS
- Verifica que `FRONTEND_URL` en backend apunte al dominio correcto del frontend
- Revisa los logs del backend para ver qué origen está siendo rechazado

#### 3. Error de Cosmos DB
- Verifica que `COSMOS_ENDPOINT` y `COSMOS_KEY` sean correctos
- Asegúrate de que el firewall de Cosmos DB permita conexiones desde Azure Services

#### 4. Contenedor no inicia
- Revisa logs: `az container logs --resource-group RG --name NOMBRE`
- Verifica variables de entorno
- Confirma que SESSION_SECRET tiene mínimo 32 caracteres

---

## 📊 Monitoreo y Mantenimiento

### Actualizar imágenes
```powershell
# Rebuild y push
docker-compose build
docker tag form-backend:latest "$ACR_NAME.azurecr.io/form-backend:latest"
docker push "$ACR_NAME.azurecr.io/form-backend:latest"

# Reiniciar contenedor en Azure
az container restart --resource-group $RESOURCE_GROUP --name form-backend
```

### Escalado
```powershell
# Cambiar recursos de Container Instance
az container create ... --cpu 2 --memory 4

# Escalar App Service Plan
az appservice plan update `
  --name form-app-service-plan `
  --resource-group $RESOURCE_GROUP `
  --sku P1V2
```

### Backup de datos
```powershell
# Backup de Cosmos DB (automático por defecto)
# Backup manual:
az cosmosdb backup create `
  --resource-group $RESOURCE_GROUP `
  --account-name $COSMOS_ACCOUNT `
  --backup-name backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')
```

---

## 💰 Estimación de Costos Azure (USD/mes)

| Servicio | SKU | Costo Aprox. |
|----------|-----|--------------|
| Container Instance (Backend) | 1 vCPU, 1.5GB RAM | ~$35 |
| Container Instance (Frontend) | 0.5 vCPU, 1GB RAM | ~$18 |
| Cosmos DB | Serverless | ~$5-20* |
| Blob Storage | Standard LRS | ~$1-5* |
| Container Registry | Basic | ~$5 |
| **TOTAL** | | **~$64-83/mes** |

*Varía según uso

---

## 🔒 Checklist de Seguridad para Producción

- [ ] `SESSION_SECRET` con mínimo 32 caracteres aleatorios
- [ ] Variables sensibles en Azure Key Vault (no hardcoded)
- [ ] HTTPS habilitado en ambos servicios
- [ ] Firewall de Cosmos DB configurado (permitir solo IPs necesarias)
- [ ] Blob Storage con acceso privado (no público)
- [ ] Rate limiting habilitado en backend
- [ ] Logs y Application Insights configurados
- [ ] Backup automático de Cosmos DB verificado
- [ ] CORS configurado solo con dominios específicos
- [ ] Remover `console.log` del código de producción

---

## 📚 Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Azure Container Instances](https://learn.microsoft.com/en-us/azure/container-instances/)
- [Azure Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/)
- [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/)

---

¿Necesitas ayuda? Revisa los logs o contacta al equipo de desarrollo.
