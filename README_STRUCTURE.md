README — Estructura del proyecto

Raíz del repositorio
- `AZURE_CONFIG_GUIDE.md` : Guía para configurar Entra ID (Azure AD)
- `SETUP_QUICK_START.md` : Guía rápida de puesta en marcha
- `README.md` : README original del proyecto
- `README_PROJECT.md` : README (limpio) con instrucciones de ejecución
- `README_STRUCTURE.md` : (este archivo) descripción de la estructura

Carpetas principales
- `backend/`
  - `app/`
    - `api/endpoints/` : Rutas de la API (auth, sesiones, asistentes, etc.)
    - `core/` : Configuración, seguridad y utilidades
      - `config.py` : configuración centralizada (usa `.env`)
      - `security.py` : creación/decodificación de JWT y helper `get_current_user`
    - `db/` : adaptadores de persistencia
      - `cosmos_client.py` : cliente y operaciones para Azure Cosmos DB
    - `data/` : archivos JSON de fallback (ej. `sesiones.json`)
    - `schemas/` : modelos Pydantic para validación
    - `services/` : lógica de negocio (sesiones, asistentes)
    - `main.py` : punto de entrada de la app FastAPI
  - `requirements.txt` : dependencias Python
  - `scripts/` : scripts de mantenimiento/migración (por ejemplo `migrate_add_created_by.py`)

- `frontend/`
  - `src/`
    - `pages/` : vistas principales (Login, TalentoHumano, RegistroAsistencia)
    - `components/` : componentes React organizados por dominio
      - `common/` : botones, header, modal, toast
      - `talento/` : vistas y componentes de Talento Humano
      - `asistente/` : formulario de firma y pantalla de éxito
    - `services/` : wrappers para llamadas a la API (axios)
    - `auth/` : adaptadores de autenticación (ahora el flujo se maneja en backend)
    - `assets/` : imágenes y estilos globales
  - `package.json` : dependencias y scripts de frontend
  - `vite.config.js`

Archivos de datos y uploads
- `backend/app/data/sesiones.json` : almacenamiento local de sesiones (fallback)
- `backend/uploads/firmas/` : firmas guardadas en servidor

Notas sobre almacenamiento
- `STORAGE_MODE` en `backend/.env` controla si se usa `cosmosdb` o `json`.
- Para producción, usar `cosmosdb` y configurar `COSMOS_ENDPOINT` y `COSMOS_KEY`.

Siguientes pasos comunes
- Migrar sesiones existentes para añadir `created_by` (usa `scripts/migrate_add_created_by.py`).
- Cambiar sesiones a cookie `HttpOnly` si quieres mayor seguridad.

Si quieres que limpie archivos redundantes (ej. archivos temporales, backups de editores, `__pycache__`), confirmame y ejecutare una limpieza segura listando primero los ficheros que se eliminarán.
