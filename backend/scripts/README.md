# Scripts de Administración del Sistema

Esta carpeta contiene scripts de utilidad para tareas administrativas y de mantenimiento del sistema.

## 📋 Scripts Disponibles

### 1. `restaurar_permisos.py` 🔧
**Propósito**: Restaurar los permisos del sistema a sus valores por defecto.

**Cuándo usar**:
- Un administrador se quitó acceso a la configuración
- Los permisos están configurados incorrectamente
- Necesitas restablecer la configuración de seguridad

**Uso**:
```bash
cd backend
python scripts/restaurar_permisos.py
```

**Características**:
- ✅ Muestra permisos actuales antes de restaurar
- ✅ Detecta automáticamente problemas de configuración
- ✅ Solicita confirmación antes de realizar cambios
- ✅ Muestra registro detallado de las operaciones

---

### 2. `hacerme_admin.py` 👤
**Propósito**: Cambiar el rol de un usuario a Administrador.

**Cuándo usar**:
- Necesitas otorgar acceso administrativo a un usuario
- Perdiste el acceso administrativo al sistema

**Uso**:
```bash
cd backend
python scripts/hacerme_admin.py
```

---

### 3. `ver_usuarios.py` 📊
**Propósito**: Listar todos los usuarios registrados en el sistema.

**Cuándo usar**:
- Necesitas verificar qué usuarios existen
- Quieres ver información de usuarios y sus roles

**Uso**:
```bash
cd backend
python scripts/ver_usuarios.py
```

---

### 4. `agregar_admin.py` ➕
**Propósito**: Agregar un nuevo usuario administrador al sistema.

**Uso**:
```bash
cd backend
python scripts/agregar_admin.py
```

---

### 5. `eliminar_duplicados.py` 🧹
**Propósito**: Limpiar usuarios duplicados en la base de datos.

**Uso**:
```bash
cd backend
python scripts/eliminar_duplicados.py
```

---

## 🚨 Escenarios de Emergencia

### Problema: "Necesito restablecer permisos a valores por defecto"

**Síntoma**: Los permisos están configurados de manera extraña o se perdió una configuración personalizada.

**Solución**:
1. Accede al servidor donde corre la aplicación
2. Ejecuta el script de restauración:
   ```bash
   cd backend
   python scripts/restaurar_permisos.py
   ```
3. El script mostrará los permisos actuales y detectará problemas
4. Confirma la restauración escribiendo "SI"
5. Recarga la página en el navegador
6. Los permisos estarán restaurados a valores seguros

**Nota**: Gracias a la protección automática, los permisos críticos de Administrador siempre están activados y no se pueden desactivar accidentalmente.

---

### Problema: "Necesito acceso administrativo urgente"

**Síntoma**: No tienes cuenta de administrador o perdiste el acceso.

**Solución**:
1. Si ya tienes cuenta, conviértela en administrador:
   ```bash
   cd backend
   python scripts/hacerme_admin.py
   ```
2. Si necesitas crear una nueva cuenta de administrador:
   ```bash
   cd backend
   python scripts/agregar_admin.py
   ```

---

## ⚠️ Precauciones

1. **Siempre haz backup** antes de ejecutar scripts que modifiquen datos
2. **Verifica los cambios** después de ejecutar cualquier script
3. **No ejecutes múltiples scripts** simultáneamente
4. **Lee las advertencias** que muestra cada script
5. **Confirma** siempre antes de aplicar cambios irreversibles

---

## 🔐 Permisos Críticos

Los siguientes permisos son críticos para el funcionamiento del sistema:

- **`acceder_config`**: Permite entrar al panel de configuración
- **`modificar_permisos`**: Permite cambiar permisos de los roles

Estos permisos **NO se pueden desactivar** para el rol "Administrador". El sistema los mantiene siempre activados automáticamente para garantizar que siempre haya acceso a la configuración del sistema.

### 🛡️ Protección Automática

El sistema tiene **protección en múltiples capas**:

1. **Frontend**: Los switches de permisos críticos aparecen bloqueados (con 🔒) y no se pueden desactivar
2. **Backend**: Si alguien intenta desactivarlos mediante la API, el servidor rechaza la petición con un error
3. **Base de datos**: Los valores se validan antes de guardarse

Esto evita que un administrador se quede accidentalmente sin acceso al sistema.

---

## 📞 Soporte

Si encuentras problemas al ejecutar estos scripts:

1. Verifica que estés en la carpeta correcta (`backend/`)
2. Asegúrate de tener las dependencias instaladas (`pip install -r requirements.txt`)
3. Verifica la conexión a la base de datos
4. Revisa los logs de la aplicación

---

## 🛡️ Mejores Prácticas

1. **No desactives** los permisos `acceder_config` o `modificar_permisos` para Administradores a menos que sea absolutamente necesario
2. **Mantén al menos un usuario** con rol de Administrador activo
3. **Documenta** cualquier cambio en la configuración de permisos
4. **Prueba** los cambios en un entorno de desarrollo antes de aplicarlos en producción

---

*Última actualización: 16 de enero de 2026*
