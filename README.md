# Formato de asistencia a actividades

sistema para gestionar Formaciones, Capacitaciones, Eventos y registro de asistencia con códigos qr.

## tecnologías

- **frontend**: react + vite
- **backend**: fastapi (python)
- **base de datos**: azure cosmos db (o json local)
- **almacenamiento**: azure blob storage (qr y firmas)
- **autenticación**: microsoft entra id (azure ad)
- **infraestructura**: docker & docker compose

---

## desarrollo local 

### prerrequisitos
- python 3.10+
- node.js 18+
- archivos `.env` configurados en las carpetas `backend/` y `frontend/`

### 1. configurar y encender el backend
desde la raíz del proyecto:

```powershell
cd backend
# crear entorno virtual (opcional pero recomendado)
python -m venv .venv
.\.venv\Scripts\activate

# instalar dependencias
pip install -r requirements.txt

# iniciar servidor
python -m uvicorn app.main:app --reload
```
el backend estará en: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. configurar y encender el frontend
desde la raíz del proyecto en otra terminal:

```powershell
cd frontend
# instalar dependencias
npm install --force

# iniciar servidor de desarrollo
npm run dev
```
la aplicación estará en: [http://localhost:3000](http://localhost:3000)

---

## almacenamiento (azure blob storage)

el sistema utiliza azure blob storage para guardar los códigos qr y las firmas de asistencia.

### estructura de carpetas
```
formatoactividadesoeventos/
└── {creador}/
    └── {actividad}/
        ├── qr_{actividad}.png
        └── firmas/
            ├── firma_{cedula1}.png
            └── firma_{cedula2}.png
```

### seguridad y proxy
- los archivos en azure son **privados**.
- el acceso se realiza a través de un **proxy en el backend**.
- el backend genera tokens sas temporales de forma interna para el acceso seguro.
- **nunca** se exponen las credenciales ni los tokens sas al frontend.

---

## seguridad y variables de entorno

**importante**: nunca subir el archivo `.env` al repositorio. el archivo `.gitignore` está configurado para proteger estos archivos.

### configuración .env
copia `.env.example` a `backend/.env` y completa los valores obligatorios:

- `entra_client_id`: id de la aplicación en azure
- `entra_client_secret`: secreto de la aplicación
- `entra_tenant_id`: id del inquilino de microsoft
- `session_secret`: clave secreta para jwt (debe ser una cadena aleatoria de mínimo 32 caracteres)
- `cosmos_endpoint`: url de la cuenta de cosmosdb
- `cosmos_key`: llave de acceso a cosmosdb
- `azure_storage_connection_string`: cadena de conexión para blobs

---

## scripts de utilidad (backend)

en la carpeta `backend/` hay scripts útiles para tareas específicas:

- `list_azure_blobs.py`: lista todos los archivos almacenados en azure storage para verificar la estructura.
- `inspect_routes.py`: permite visualizar todas las rutas registradas en la api de fastapi.

ejecutar:
```bash
cd backend
python list_azure_blobs.py
```

---
