# Sistema de Registro de Capacitaciones

## 🚀 Migración a CosmosDB completada

### ✅ Cambios realizados:

1. **Eliminados archivos obsoletos:**
   - `services/firmas.py` (firmas ahora en base64)
   - Carpeta `uploads/` (ya no se usan archivos físicos)
   - Carpeta `models/` (vacía)
   - Archivos `.xlsx` antiguos
   - Configuraciones de Render

2. **Simplificado:**
   - Firmas guardadas como **base64** directamente en la base de datos
   - Modo dual: JSON local o CosmosDB
   - Estructura más limpia y simple

3. **Estructura actual:**
```
backend/
├── app/
│   ├── api/endpoints/     # Endpoints HTTP
│   ├── core/              # Configuración y excepciones
│   ├── db/                # Cliente CosmosDB
│   ├── schemas/           # Modelos Pydantic
│   ├── services/          # Lógica de negocio
│   └── data/              # Archivos JSON (fallback)
├── .env                   # Variables de entorno
└── requirements.txt
```

### 📝 Configuración

Edita `.env` con tus credenciales:

```env
# CosmosDB
COSMOS_ENDPOINT=https://tu-cuenta.documents.azure.com:443/
COSMOS_KEY=tu_key_aqui
COSMOS_DATABASE_NAME=formaciones_db
STORAGE_MODE=cosmosdb

# Otras configuraciones
BASE_URL=https://formulariosfsd.vercel.app
API_HOST=0.0.0.0
API_PORT=8000
TOKEN_EXPIRY_DAYS=30
```

### 🔄 Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

### ▶️ Ejecutar

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 🗄️ Estructura de datos en CosmosDB

**Sesiones:**
- Partition Key: `/id`
- Contiene: tema, fecha, tipo, facilitador, contenido, horarios, QR, token

**Asistentes:**
- Partition Key: `/sesion_id`
- Contiene: datos personales + **firma_base64** (firma como string base64)

### 🎯 Próximos pasos para Docker

1. Crear `Dockerfile` para backend
2. Crear `Dockerfile` para frontend
3. Crear `docker-compose.yml`
4. Desplegar en Azure Container Apps

¿Listo para continuar con Docker?
