# Sistema de Registro de Capacitaciones

Aplicación web moderna para registrar asistencia a capacitaciones empresariales de la Fundación Santo Domingo.

## ✨ Características

- ✅ Registro de asistencia con firma digital
- ✅ Gestión completa de capacitaciones
- ✅ Panel de administración para Talento Humano
- ✅ Validaciones exhaustivas en frontend y backend
- ✅ Diseño moderno y totalmente responsive
- 🔜 Autenticación con Microsoft Azure AD
- 🔜 Exportación a Excel con firmas
- 🔜 Base de datos PostgreSQL

## 🚀 Tecnologías

### Frontend
- React 18 con Vite
- React Router para navegación
- Axios para HTTP
- React Signature Canvas
- CSS moderno con variables

### Backend
- FastAPI (Python)
- Pydantic para validación
- Pillow para procesamiento de imágenes
- Sistema de archivos JSON (temporal)

## 📦 Instalación

### Prerequisites
- Node.js 18+
- Python 3.10+

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tus valores

# Ejecutar servidor
uvicorn app.main:app --reload
```

El backend estará en: http://localhost:8000

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tu URL del backend

# Ejecutar en desarrollo
npm run dev
```

El frontend estará en: http://localhost:3000

## 📖 Uso

### Para Talento Humano

1. Acceder a `/talento`
2. **Crear Capacitación:**
   - Completar formulario con datos de la capacitación
   - Se genera automáticamente un link único
   - Copiar y compartir el link con participantes

3. **Sesiones Registradas:**
   - Ver todas las capacitaciones creadas
   - Ver cantidad de asistentes
   - Eliminar capacitaciones (con confirmación)

4. **Ver Asistentes:**
   - Seleccionar una capacitación
   - Ver lista completa de participantes
   - Ver firmas digitales en detalle

### Para Asistentes

1. Recibir link de registro (formato: `/registro?token=ABC123`)
2. Ver información de la capacitación
3. Completar formulario:
   - Cédula (solo números)
   - Nombre completo
   - Cargo
   - Unidad/Departamento
   - Correo institucional (@fundacionsantodomingo.org)
   - Firma digital (dibujar con mouse/touch)
4. Enviar formulario
5. Ver pantalla de confirmación

## 🗂️ Estructura del Proyecto

```
capacitaciones/
├── backend/
│   ├── app/
│   │   ├── api/endpoints/    # Rutas de la API
│   │   ├── core/             # Configuración
│   │   ├── schemas/          # Modelos Pydantic
│   │   ├── services/         # Lógica de negocio
│   │   └── main.py          # App principal
│   ├── data/                # JSON temporal
│   └── uploads/firmas/      # Imágenes de firmas
│
└── frontend/
    └── src/
        ├── assets/          # CSS global
        ├── components/      # Componentes React
        ├── pages/           # Páginas principales
        ├── services/        # Servicios API
        ├── utils/           # Utilidades
        └── App.jsx         # Componente raíz
```

## 🌐 API Endpoints

### Públicos (con token)
- `GET /api/sesion/{token}` - Info de capacitación
- `POST /api/asistencia` - Registrar asistencia

### Autenticados
- `POST /api/sesiones` - Crear capacitación
- `GET /api/sesiones` - Listar capacitaciones
- `GET /api/sesiones/{id}` - Obtener capacitación
- `DELETE /api/sesiones/{id}` - Eliminar capacitación
- `GET /api/sesiones/{id}/asistentes` - Listar asistentes

### Utilidades
- `GET /api/health` - Health check
- `GET /docs` - Documentación Swagger

## 🎨 Diseño

La aplicación utiliza un sistema de diseño moderno con:
- Gradientes sutiles
- Sombras suaves y elevaciones
- Animaciones fluidas
- Paleta de colores verde esmeralda
- Totalmente responsive
- Accesible

## 🚀 Deploy

### Frontend (Vercel)
```bash
cd frontend
vercel
```

### Backend (Railway/Vercel)
```bash
cd backend
# Configurar en el dashboard
```

## 📝 Próximas Características

- [ ] Autenticación con Azure AD
- [ ] Migración a PostgreSQL
- [ ] Exportar asistentes a Excel
- [ ] Dashboard con estadísticas
- [ ] Notificaciones por email
- [ ] Editar capacitaciones
- [ ] Filtros y búsqueda avanzada
- [ ] PWA con soporte offline
- [ ] Tests automatizados

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Privado - Fundación Santo Domingo

## 👥 Contacto

Fundación Santo Domingo
- Web: fundacionsantodomingo.org

---

Hecho con ❤️ para la Fundación Santo Domingo
