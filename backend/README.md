# Sistema de Registro de Capacitaciones - Backend

API desarrollada con FastAPI para gestionar capacitaciones y registrar asistencia.

## Instalación

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo de configuración
copy .env.example .env
# Editar .env con tus valores
```

## Ejecutar

```bash
# Modo desarrollo
uvicorn app.main:app --reload

# O usando Python
python app/main.py
```

La API estará disponible en: http://localhost:8000

## Documentación

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints Principales

### Públicos (con token)
- `GET /api/sesion/{token}` - Obtener información de capacitación
- `POST /api/asistencia` - Registrar asistencia

### Autenticados (requieren auth en producción)
- `POST /api/sesiones` - Crear capacitación
- `GET /api/sesiones` - Listar capacitaciones
- `GET /api/sesiones/{id}` - Obtener capacitación
- `DELETE /api/sesiones/{id}` - Eliminar capacitación
- `GET /api/sesiones/{id}/asistentes` - Listar asistentes

## Estructura

```
backend/
├── app/
│   ├── api/endpoints/    # Rutas de la API
│   ├── core/            # Configuración y seguridad
│   ├── schemas/         # Modelos Pydantic
│   ├── services/        # Lógica de negocio
│   └── main.py         # Aplicación principal
├── data/               # Datos JSON (temporal)
├── uploads/firmas/     # Imágenes de firmas
└── requirements.txt
```

## Deploy en Vercel

1. Instalar Vercel CLI: `npm i -g vercel`
2. Ejecutar: `vercel`
3. Seguir instrucciones
4. Configurar variables de entorno en el dashboard

## Licencia

Privado - Fundación Santo Domingo
