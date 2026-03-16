# estructura del proyecto

## raíz del repositorio
- `README.md`: descripción general del proyecto e instrucciones de inicio rápido.
- `docs/`: carpeta con documentación detallada sobre despliegue, estructura y módulos específicos.
- `docker-compose.yml`: configuración para orquestar los servicios de frontend y backend.

## carpetas principales

### backend
- `app/`: código fuente de la api.
  - `api/endpoints/`: rutas de la api organizadas por dominio (auth, asistentes, sesiones, etc.).
  - `core/`: configuración centralizada, manejo de excepciones y utilidades de seguridad.
  - `db/`: implementación del cliente para azure cosmos db.
  - `data/`: archivos json para almacenamiento local (respaldo si no hay base de datos).
  - `schemas/`: modelos de pydantic para validación de datos.
  - `services/`: lógica de negocio y procesamiento de datos.
  - `storage/`: adaptadores para almacenamiento de archivos (local o azure blob).
- `requirements.txt`: lista de dependencias de python.
- `scripts/`: herramientas de utilidad para mantenimiento de datos.

### frontend
- `src/`: código fuente de la aplicación react.
  - `pages/`: vistas principales del aplicativo.
  - `components/`: componentes reutilizables organizados por funcionalidad.
  - `services/`: integración con la api mediante axios.
  - `utils/`: constantes, validaciones y funciones de ayuda.
  - `assets/`: recursos estáticos como imágenes y estilos globales.
- `vite.config.js`: configuración de la herramienta de construcción vite.

## almacenamiento y persistencia
- el aplicativo permite alternar entre `json` local y `cosmosdb` mediante variables de entorno.
- los archivos físicos (qr, firmas) pueden guardarse localmente o en `azure blob storage`.

## seguridad
- el flujo de autenticación se gestiona mediante microsoft entra id.
- los secretos nunca se exponen al frontend y se manejan exclusivamente en el backend mediante variables de entorno protegidas.
