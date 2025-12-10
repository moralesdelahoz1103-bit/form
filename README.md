README — Proyecto Form

Resumen
Este repositorio contiene una aplicación para gestionar formaciones/eventos y el registro de asistencia.
- Frontend: React (Vite)
- Backend: FastAPI
- Almacenamiento: Azure Cosmos DB (recomendado) o JSON local como fallback
- Autenticación: Microsoft Entra ID (Azure AD) gestionada en el backend

Cómo ejecutar (desarrollo)
1) Backend
- Ir a `backend/`
- Instalar dependencias: `python -m pip install -r requirements.txt`
- Configurar variables en `backend/.env` (ver `AZURE_CONFIG_GUIDE.md` para Entra ID)
- Ejecutar servidor:
  ```powershell
  cd backend
  python -m uvicorn main:app --app-dir app --host 0.0.0.0 --port 8000 --reload
  ```

2) Frontend
- Ir a `frontend/`
- Instalar dependencias: `npm install`
- Ejecutar en dev:
  ```powershell
  cd frontend
  npm run dev
  ```

Variables importantes (backend `.env`)
- `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `ENTRA_TENANT_ID`
- `FRONTEND_URL` (ej: `http://localhost:3000`)
- `STORAGE_MODE` = `cosmosdb` o `json`
- `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE_NAME` (si usas Cosmos)
- `SESSION_SECRET` (secreto para firmar JWT de sesión)

Notas importantes
- La lógica de redención de tokens MSAL se ejecuta en el backend para evitar errores CORS y mantener secreto el `client_secret`.
- Recomendación: migrar a cookies `HttpOnly` para sesiones en producción.

Migración de datos
- Hay un script `backend/scripts/migrate_add_created_by.py` que puede añadir el campo `created_by` a sesiones existentes.

Contacto
- Para cambios mayores (remoção de archivos, refactor), confirmar antes de ejecutar acciones destructivas.

