# Centro de Ayuda - Sistema de Gestión de Formaciones

## 📚 Descripción

El Centro de Ayuda es un módulo integrado que proporciona documentación y guías interactivas para los usuarios del sistema. Toda la información se almacena en Azure Cosmos DB para facilitar su gestión y actualización.

## 🗄️ Estructura de Base de Datos

### Container: `configuracion`
El centro de ayuda se almacena en el container de configuración con el siguiente esquema:

```json
{
  "id": "centro_ayuda",
  "tipo": "configuracion_ayuda",
  "categorias": [
    {
      "id": "sesiones",
      "nombre": "Sesiones y Capacitaciones",
      "icono": "calendar",
      "orden": 1,
      "tarjetas": [
        {
          "id": "crear_sesion",
          "pregunta": "¿Cómo crear una nueva sesión?",
          "respuesta": "Pasos detallados...",
          "orden": 1,
          "visible": true
        }
      ]
    }
  ],
  "fecha_modificacion": "2026-01-15T10:00:00Z",
  "modificado_por": "admin@fundacion.org"
}
```

## 📁 Archivos Creados

### Backend

1. **`backend/app/services/ayuda.py`**
   - Servicio principal para gestión del centro de ayuda
   - Métodos: `obtener_ayuda()`, `actualizar_ayuda()`, `_ayuda_por_defecto()`
   - Contiene las 5 categorías predeterminadas con sus tarjetas

2. **`backend/app/api/endpoints/ayuda.py`**
   - Endpoints REST para el centro de ayuda
   - `GET /api/ayuda` - Obtener contenido (todos los usuarios)
   - `PUT /api/ayuda` - Actualizar contenido (solo administradores)

3. **`backend/app/db/cosmos_client.py`** (modificado)
   - Métodos agregados:
     - `obtener_ayuda()`
     - `crear_ayuda()`
     - `actualizar_ayuda()`

4. **`backend/app/main.py`** (modificado)
   - Router registrado en `/api/ayuda`

### Frontend

1. **`frontend/src/components/talento/TabAyuda.jsx`**
   - Componente React para visualizar el centro de ayuda
   - Búsqueda en tiempo real
   - Acordeones expandibles
   - Highlighting de resultados de búsqueda

2. **`frontend/src/components/talento/TabAyuda.css`**
   - Estilos modernos y responsivos
   - Animaciones suaves
   - Diseño consistente con el resto del sistema

3. **`frontend/src/components/talento/ConfiguracionModal.jsx`** (modificado)
   - Pestaña de ayuda agregada al sidebar
   - Disponible para todos los usuarios

## 🎨 Categorías Predeterminadas

1. **📅 Sesiones y Capacitaciones** (4 artículos)
   - Crear, editar, eliminar sesiones
   - Exportar datos

2. **👥 Registro de Asistentes** (3 artículos)
   - Registrar asistentes
   - Firma digital
   - Códigos QR

3. **⚙️ Gestión de Usuarios** (3 artículos)
   - Roles del sistema
   - Cambiar roles
   - Acceso al sistema

4. **🛡️ Permisos y Configuración** (2 artículos)
   - Configurar permisos
   - Permisos disponibles

5. **🆘 Soporte Técnico** (3 artículos)
   - Problemas técnicos
   - Contactar soporte
   - Navegadores compatibles

## 🔧 Funcionalidades

### Para Todos los Usuarios
- ✅ Ver todas las categorías y artículos
- ✅ Buscar en tiempo real por pregunta o respuesta
- ✅ Expandir/contraer tarjetas de ayuda
- ✅ Highlight de resultados de búsqueda
- ✅ Navegación por categorías

### Para Administradores (Futuro)
- 🔜 Editar contenido del centro de ayuda
- 🔜 Agregar/eliminar categorías
- 🔜 Agregar/eliminar tarjetas
- 🔜 Cambiar orden de visualización
- 🔜 Mostrar/ocultar tarjetas

## 🚀 Uso

### Acceder al Centro de Ayuda

1. Hacer clic en el botón de configuración (⚙️)
2. Seleccionar la pestaña "Centro de Ayuda"
3. Explorar las categorías o usar la búsqueda

### API Endpoints

**Obtener contenido:**
```bash
GET /api/ayuda
Authorization: Bearer {token}
```

**Actualizar contenido (solo admin):**
```bash
PUT /api/ayuda
Authorization: Bearer {token}
Content-Type: application/json

{
  "categorias": [...]
}
```

## 📝 Notas

- El contenido se carga automáticamente la primera vez que se accede
- Si no existe en la BD, se crea con contenido predeterminado
- La búsqueda es sensible a acentos pero no a mayúsculas/minúsculas
- Los cambios por administradores se reflejan inmediatamente

## 🔮 Mejoras Futuras

1. **Editor Visual para Administradores**
   - Interfaz drag & drop para reordenar
   - Editor WYSIWYG para respuestas
   - Gestión de categorías y tarjetas

2. **Multimedia**
   - Soporte para imágenes en respuestas
   - Videos tutoriales embebidos
   - Capturas de pantalla anotadas

3. **Análisis**
   - Tracking de artículos más visitados
   - Búsquedas sin resultados
   - Feedback de utilidad

4. **Exportación**
   - Generar PDF del manual completo
   - Versión imprimible
   - Exportar a otros formatos
