# centro de ayuda - sistema de gestión de actividades

## descripción

el centro de ayuda es un módulo integrado que proporciona guías interactivas sobre el funcionamiento del sistema. la información se almacena en azure cosmos db y se organiza en categorías lógicas.

## estructura de base de datos

### documento de configuración
el centro de ayuda reside en el contenedor de configuración con el siguiente esquema técnico:

```json
{
  "id": "centro_ayuda",
  "tipo": "configuracion_ayuda",
  "categorias": [
    {
      "id": "crear_actividad",
      "nombre": "crear actividad o evento",
      "icono": "calendar",
      "tarjetas": [
        {
          "id": "acceso_crear",
          "pregunta": "¿quién puede crear actividades o eventos?",
          "respuesta": "texto explicativo...",
          "orden": 1,
          "visible": true,
          "roles_permitidos": ["usuario", "administrador"]
        }
      ]
    }
  ]
}
```

## categorías reales del sistema

actualmente, el sistema incluye las siguientes categorías de ayuda predefinidas:

1. **crear actividad o evento**: guías sobre quién puede crear actividades, cómo completar el formulario y el funcionamiento del link de registro.
2. **actividades o eventos registrados**: información sobre consulta de listas, edición de detalles, eliminación segura y exportación a excel.
3. **ver asistentes**: detalles sobre los datos que se capturan de cada participante (cédula, nombre, cargo) y cómo exportar el listado completo.
4. **registro público de asistencia**: explicación del flujo que sigue el participante externo al usar el link de registro y la generación del código qr.
5. **usuarios y permisos**: descripción de los roles del sistema (usuario, administrador), gestión de acceso mediante microsoft entra id y configuración de permisos de rol.
6. **soporte y ayuda técnica**: pasos de solución de problemas comunes, navegadores compatibles y canales de contacto oficiales.

## arquitectura y archivos

### backend
- `backend/app/services/ayuda.py`: servicio central que gestiona la persistencia y los valores por defecto.
- `backend/app/api/endpoints/ayuda.py`: define los endpoints `get` (público) y `put` (administrativo).

### frontend
- `frontend/src/components/talento/tabayuda.jsx`: interfaz de usuario principal con búsqueda en tiempo real y componentes colapsables.
- `frontend/src/components/talento/tabayuda.css`: estilos visuales optimizados.

## notas de implementación
- la búsqueda es Case Insensitive y busca tanto en preguntas como en respuestas.
- si la base de datos no está disponible, el sistema utiliza un respaldo con valores por defecto integrados en el código.
- los administradores pueden actualizar el contenido dinámicamente mediante la api.
