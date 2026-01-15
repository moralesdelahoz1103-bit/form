# Sistema de Gestión de Usuarios y Roles

## 📋 Descripción

Sistema automatizado de registro y gestión de usuarios basado en roles. Los usuarios se registran automáticamente al iniciar sesión con Microsoft y los administradores pueden gestionar sus permisos.

## 🎭 Roles Disponibles

### 👤 Usuario (Por defecto)
- **Asignación**: Automática al primer ingreso
- **Permisos**:
  - Ver sesiones de capacitación
  - Ver listado de asistentes
  - Ver estadísticas generales
- **Restricciones**: Solo lectura, no puede crear ni modificar

### ✏️ Editor
- **Asignación**: Manual por administrador
- **Permisos**:
  - Todos los permisos de Usuario +
  - Crear nuevas sesiones de capacitación
  - Editar sesiones existentes
  - Eliminar sesiones
  - Gestionar asistentes
  - Generar códigos QR
- **Restricciones**: No puede gestionar usuarios ni cambiar roles

### 👑 Administrador
- **Asignación**: Manual por otro administrador
- **Permisos**:
  - Todos los permisos de Editor +
  - Gestionar usuarios del sistema
  - Cambiar roles de otros usuarios
  - Eliminar usuarios
  - Acceso total al sistema
- **Protección**: No se puede eliminar ni degradar el último administrador

## 🔄 Flujo de Registro Automático

1. **Usuario inicia sesión** con Microsoft Entra ID
2. **Sistema verifica** si el usuario existe en la base de datos
3. **Si es nuevo**:
   - Se crea automáticamente con rol "Usuario"
   - Se registra ID de Azure (oid)
   - Se almacena nombre y fecha de ingreso
4. **Si existe**:
   - Se carga su perfil con el rol asignado
   - Se actualiza la sesión

## 🗄️ Esquema de Base de Datos

```json
{
  "id": "azure_oid",           // ID del usuario de Azure
  "nombre": "Juan Pérez",      // Nombre completo
  "rol": "Usuario",            // Usuario | Editor | Administrador
  "fecha_ingreso": "2026-01-14T10:30:00Z"
}
```

## 🛠️ Implementación Técnica

### Backend

#### Servicios
- `services/usuarios.py`: Lógica de negocio
  - `registrar_o_actualizar_usuario()`: Registro automático
  - `obtener_rol_usuario()`: Consulta de rol
  - `actualizar_usuario()`: Cambio de rol

#### Endpoints
```python
GET  /api/usuarios              # Listar todos los usuarios
PUT  /api/usuarios/{id}/rol     # Cambiar rol (solo admin)
DEL  /api/usuarios/{id}         # Eliminar usuario (solo admin)
```

#### Auth Flow
```python
# En auth.py callback
user_id = user_info.get("oid")
usuario_service.registrar_o_actualizar_usuario(user_id, user_name)
```

### Frontend

#### Componentes
- `TabUsuarios.jsx`: Interfaz de gestión
  - Lista de usuarios registrados
  - Cambio de roles en tiempo real
  - Estadísticas de roles

#### Utilidades
```javascript
// utils/permissions.js
canUser('crear_sesion')     // Verificar permiso específico
isAdmin()                    // Verificar si es admin
canEdit()                    // Verificar si puede editar
getUserRole()                // Obtener rol actual
```

#### Uso en Componentes
```jsx
import { canUser, PERMISSIONS } from '../utils/permissions';

// Mostrar botón solo si tiene permiso
{canUser(PERMISSIONS.CREAR_SESION) && (
  <button onClick={crearSesion}>Crear Sesión</button>
)}
```

## 🎨 Interfaz de Usuario

### Gestión de Usuarios (Configuración → Usuarios)

**Elementos visuales:**
- 📊 Estadísticas: Total de usuarios y administradores
- ℹ️ Banner informativo sobre registro automático
- 📖 Leyenda de roles con descripción de permisos
- 📋 Tabla con:
  - Avatar con inicial del nombre
  - Selector de rol (dropdown)
  - Fecha de primer ingreso
  - Botón de eliminación

**Acciones:**
- Cambiar rol de usuario (actualización inmediata)
- Eliminar usuario (con confirmación)
- Protección contra eliminar último admin

## 🔐 Seguridad

### Validaciones Backend
- ✅ Solo administradores pueden cambiar roles
- ✅ No se puede eliminar el último administrador
- ✅ No se puede degradar el último administrador
- ✅ Validación de roles permitidos
- ✅ Autenticación requerida para todos los endpoints

### Validaciones Frontend
- ✅ Permisos verificados antes de mostrar opciones
- ✅ Confirmación para acciones destructivas
- ✅ Feedback visual inmediato
- ✅ Manejo de errores con mensajes claros

## 📝 Casos de Uso

### Caso 1: Nuevo Empleado
1. RH configura cuenta de Microsoft
2. Empleado inicia sesión → registrado automáticamente como "Usuario"
3. Puede ver sesiones y estadísticas
4. Admin lo promociona a "Editor" si necesita crear sesiones

### Caso 2: Rotación de Personal
1. Admin va a Configuración → Usuarios
2. Cambia rol de empleado saliente a "Usuario" (downgrade)
3. Promociona a nuevo responsable a "Editor" o "Admin"

### Caso 3: Usuario Temporal
1. Usuario externo inicia sesión → registrado como "Usuario"
2. Ve solo información de consulta
3. Admin puede eliminarlo cuando termine su acceso

## 🚀 Mejoras Futuras (Opcional)

- [ ] Roles personalizados con permisos granulares
- [ ] Historial de cambios de roles
- [ ] Notificaciones por email al cambiar rol
- [ ] Expiración automática de roles temporales
- [ ] Dashboard de auditoría de accesos
- [ ] Permisos por departamento/área

## 🐛 Troubleshooting

**Problema**: Usuario no se registra automáticamente
- Verificar que el endpoint `/api/auth/callback` registra correctamente
- Revisar logs del backend para errores en `registrar_o_actualizar_usuario()`

**Problema**: No puedo cambiar roles
- Verificar que eres administrador
- Revisar permisos en la respuesta de `/api/auth/me`

**Problema**: Error al eliminar último admin
- Es intencional, debe haber al menos un administrador activo
- Promociona otro usuario a admin primero

## 📚 Referencias

- [Microsoft Entra ID Authentication](https://learn.microsoft.com/en-us/azure/active-directory/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Role-Based Access Control (RBAC)](https://en.wikipedia.org/wiki/Role-based_access_control)
