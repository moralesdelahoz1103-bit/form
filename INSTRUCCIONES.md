# 🚀 Guía de Instalación y Ejecución

## Paso 1: Instalar Backend

```powershell
# Navegar a la carpeta backend
cd backend

# Crear entorno virtual de Python
python -m venv venv

# Activar entorno virtual (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Si da error de permisos, ejecutar primero:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Instalar dependencias
pip install -r requirements.txt

# El archivo .env ya está configurado para desarrollo local

# Ejecutar el servidor backend
python -m uvicorn app.main:app --reload
```

El backend estará corriendo en: **http://localhost:8000**
Documentación API: **http://localhost:8000/docs**

---

## Paso 2: Instalar Frontend

**ABRIR UNA NUEVA TERMINAL** (dejar el backend corriendo)

```powershell
# Navegar a la carpeta frontend
cd frontend

# Instalar Node.js dependencies
npm install

# El archivo .env ya está configurado para desarrollo local

# Ejecutar el servidor de desarrollo
npm run dev
```

El frontend estará corriendo en: **http://localhost:3000**

---

## 📋 Probar la Aplicación

### Opción 1: Panel de Talento Humano

1. Abrir navegador en: **http://localhost:3000/talento**
2. Crear una nueva capacitación
3. Copiar el link generado
4. Pegar el link en una nueva pestaña para registrar asistencia

### Opción 2: Registro Directo

1. Primero crear una capacitación en `/talento`
2. Copiar el link (será algo como: `http://localhost:3000/registro?token=abc-123...`)
3. Abrir ese link para llenar el formulario de asistencia

---

## 🛠️ Comandos Útiles

### Backend

```powershell
# Ver logs del servidor
python -m uvicorn app.main:app --reload --log-level debug

# Reinstalar dependencias
pip install -r requirements.txt --force-reinstall

# Desactivar entorno virtual
deactivate
```

### Frontend

```powershell
# Construir para producción
npm run build

# Vista previa del build
npm run preview

# Limpiar node_modules y reinstalar
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📂 Estructura de Datos

Los datos se guardan temporalmente en:
- **Backend/data/sesiones.json** - Capacitaciones creadas
- **Backend/data/asistentes.json** - Registros de asistencia
- **Backend/uploads/firmas/** - Imágenes de firmas digitales

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'fastapi'"
```powershell
# Asegúrate de tener el entorno virtual activado
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Error: "Port 8000 already in use"
```powershell
# Encontrar y matar el proceso usando el puerto
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
```

### Error: "Port 3000 already in use"
```powershell
# Cambiar puerto en vite.config.js o matar el proceso
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Error: CORS en producción
- Verificar que `BASE_URL` en backend/.env coincida con la URL del frontend
- Verificar que `VITE_API_URL` en frontend/.env apunte al backend correcto

---

## 📱 URLs Importantes

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **Panel Talento Humano:** http://localhost:3000/talento
- **Registro (con token):** http://localhost:3000/registro?token=xxx

---

## 🎯 Próximos Pasos

1. ✅ Probar crear capacitación
2. ✅ Probar registrar asistencia
3. ✅ Ver lista de asistentes
4. ✅ Verificar firmas digitales
5. 🔜 Configurar Azure AD para autenticación
6. 🔜 Migrar a base de datos PostgreSQL
7. 🔜 Implementar exportación a Excel
8. 🔜 Deploy en Vercel/Railway

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que ambos servidores estén corriendo
2. Revisa los logs en la terminal
3. Abre la consola del navegador (F12) para ver errores
4. Verifica los archivos .env

---

¡Listo! 🎉 La aplicación está configurada y lista para usar.
