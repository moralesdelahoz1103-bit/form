from typing import Dict, Any, List
from datetime import datetime
from db.cosmos_client import cosmos_db, get_cosmos_db


class AyudaService:
    """Servicio para gestionar el centro de ayuda del sistema"""
    
    def __init__(self):
        self.cosmos_db = get_cosmos_db()
        self.ayuda_id = "centro_ayuda"
        
    def obtener_ayuda(self) -> Dict[str, Any]:
        """
        Obtener el contenido del centro de ayuda.
        Si no existe en DB, crea el contenido por defecto.
        
        Returns:
            Diccionario con las categorías y tarjetas de ayuda
        """
        try:
            if not self.cosmos_db:
                return self._ayuda_por_defecto()
                
            ayuda_doc = self.cosmos_db.obtener_ayuda()
            
            if ayuda_doc:
                return ayuda_doc
            else:
                # Si no existe, crear con valores por defecto
                return self._crear_ayuda_inicial()
                
        except Exception as e:
            print(f"Error obteniendo centro de ayuda: {e}")
            return self._ayuda_por_defecto()
    
    def actualizar_ayuda(self, categorias: List[Dict[str, Any]], user_id: str) -> Dict[str, Any]:
        """
        Actualizar el contenido del centro de ayuda.
        
        Args:
            categorias: Nueva lista de categorías con sus tarjetas
            user_id: ID del usuario que realiza la modificación
            
        Returns:
            Documento actualizado
            
        Raises:
            Exception: Si la base de datos no está disponible
        """
        if not self.cosmos_db:
            raise Exception("Base de datos no disponible")
            
        ayuda_doc = {
            "id": self.ayuda_id,
            "tipo": "configuracion_ayuda",
            "categorias": categorias,
            "fecha_modificacion": datetime.utcnow().isoformat(),
            "modificado_por": user_id
        }
        
        return self.cosmos_db.actualizar_ayuda(ayuda_doc)
    
    def _crear_ayuda_inicial(self) -> Dict[str, Any]:
        """
        Crear contenido inicial del centro de ayuda en la base de datos.
        
        Returns:
            Contenido por defecto del centro de ayuda
        """
        ayuda_default = self._ayuda_por_defecto()
        
        if not self.cosmos_db:
            return ayuda_default
        
        try:
            self.cosmos_db.crear_ayuda(ayuda_default)
        except Exception as e:
            print(f"Error creando centro de ayuda inicial: {e}")
            
        return ayuda_default
    
    def _ayuda_por_defecto(self) -> Dict[str, Any]:
        """
        Definición del contenido por defecto del centro de ayuda.
        
        Returns:
            Diccionario con categorías y tarjetas de ayuda
        """
        return {
            "id": self.ayuda_id,
            "tipo": "configuracion_ayuda",
            "categorias": [
                {
                    "id": "crear_actividad",
                    "nombre": "Crear Actividad o Evento",
                    "icono": "calendar",
                    "orden": 1,
                    "tarjetas": [
                        {
                            "id": "acceso_crear",
                            "pregunta": "¿Quién puede crear actividades o eventos?",
                            "respuesta": "Solo los administradores pueden crear actividades o eventos.\n\nSi no ves el formulario de creación, contacta a un administrador para que te asigne los permisos necesarios.",
                            "orden": 1,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        },
                        {
                            "id": "crear_actividad",
                            "pregunta": "¿Cómo crear una nueva actividad o evento?",
                            "respuesta": "En la sección 'Crear actividad o evento':\n\n1. Completa el Tema (título de la actividad)\n2. Selecciona la Fecha\n3. Elige el Tipo de actividad: Capacitación, Inducción, Actividad u Otros (eventos)\n4. Si eliges 'Otros (eventos)', escribe el tipo personalizado\n5. Ingresa el Facilitador y Responsable\n6. Especifica el Cargo del responsable\n7. Describe el Contenido de la actividad\n8. Define la Hora inicio y Hora final\n9. Haz clic en 'Crear Actividad o Evento'\n\nSe generará automáticamente un link de registro para compartir con los asistentes.",
                            "orden": 2,
                            "visible": True,
                            "roles_permitidos": ["Administrador"]
                        },
                        {
                            "id": "link_registro",
                            "pregunta": "¿Cómo funciona el link de registro?",
                            "respuesta": "Al crear una actividad o evento, el sistema genera un link único que puedes:\n\n• Copiar haciendo clic en el botón 'Copiar Link'\n• Compartir por correo, WhatsApp o redes sociales\n• Enviar a los participantes para que se registren de forma autónoma\n\nCada link es único por actividad o evento y no expira.",
                            "orden": 3,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        }
                    ]
                },
                {
                    "id": "gestionar_actividades",
                    "nombre": "Actividades o Eventos Registrados",
                    "icono": "list",
                    "orden": 2,
                    "tarjetas": [
                        {
                            "id": "ver_actividades",
                            "pregunta": "¿Cómo consultar las actividades o eventos creados?",
                            "respuesta": "En 'Actividades o eventos registrados' verás:\n\n• Lista completa de todas las actividades creadas\n• Inactividad de cada una: Tema, Fecha, Tipo de actividad, Facilitador\n• Cantidad de asistentes registrados\n• Opciones para ver detalles, editar o eliminar\n\nUsa los filtros de búsqueda para encontrar actividades específicas.",
                            "orden": 1,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        },
                        {
                            "id": "editar_actividad",
                            "pregunta": "¿Puedo editar una actividad después de crearla?",
                            "respuesta": "Sí, si tienes permisos de Administrador:\n\n1. En la lista de actividades, haz clic en 'Ver detalles'\n2. Modifica los campos necesarios\n3. Haz clic en 'Guardar cambios'\n\nNota: Los cambios no afectan a los asistentes ya registrados, solo la inactividad de la actividad.",
                            "orden": 2,
                            "visible": True,
                            "roles_permitidos": ["Administrador"]
                        },
                        {
                            "id": "eliminar_actividad",
                            "pregunta": "¿Cómo eliminar una actividad o evento?",
                            "respuesta": "Solo usuarios con permiso pueden eliminar:\n\n1. En la lista, haz clic en el botón de eliminar (ícono de papelera)\n2. Confirma la acción\n\n⚠️ ADVERTENCIA: Al eliminar una actividad se borrarán TODOS los asistentes registrados y sus datos de forma PERMANENTE. Esta acción no se puede deshacer.",
                            "orden": 3,
                            "visible": True,
                            "roles_permitidos": ["Administrador"]
                        },
                        {
                            "id": "exportar_actividades",
                            "pregunta": "¿Cómo exportar el listado de actividades?",
                            "respuesta": "En 'Actividades o eventos registrados':\n\n1. Usa los filtros si deseas exportar solo algunas actividades\n2. Haz clic en 'Exportar a Excel'\n3. Se descargará un archivo .xlsx con:\n   - Tema\n   - Fecha\n   - Tipo de actividad\n   - Facilitador\n   - Hora inicio y final\n   - Cantidad de asistentes\n\nEl archivo está formateado como tabla nativa de Excel.",
                            "orden": 4,
                            "visible": True,
                            "roles_permitidos": ["Administrador"]
                        }
                    ]
                },
                {
                    "id": "asistentes",
                    "nombre": "Ver Asistentes",
                    "icono": "users",
                    "orden": 3,
                    "tarjetas": [
                        {
                            "id": "consultar_asistentes",
                            "pregunta": "¿Cómo ver los asistentes de una actividad?",
                            "respuesta": "En la sección 'Ver asistentes':\n\n1. Selecciona una actividad o evento del menú desplegable\n2. El sistema mostrará la inactividad de la actividad:\n   - Tema, Facilitador, Tipo de actividad\n   - Hora inicio y final\n   - Total de asistentes\n3. Verás la tabla completa con todos los participantes registrados",
                            "orden": 1,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        },
                        {
                            "id": "datos_asistente",
                            "pregunta": "¿Qué inactividad se registra de cada asistente?",
                            "respuesta": "El sistema almacena:\n\n• Cédula de identidad\n• Nombre completo\n• Cargo\n• Unidad organizacional\n• Correo electrónico\n• Fecha y hora de registro\n• Código QR único\n\nToda esta inactividad está disponible para exportación.",
                            "orden": 2,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        },

                        {
                            "id": "exportar_asistentes",
                            "pregunta": "¿Cómo exportar la lista de asistentes?",
                            "respuesta": "Con una actividad seleccionada:\n\n1. Haz clic en 'Exportar a Excel'\n2. Se descargará un archivo .xlsx que incluye:\n   - Inactividad de la actividad (encabezado)\n   - Tabla con todos los asistentes y sus datos\n   - Cédula, Nombre, Cargo, Unidad, Correo, Fecha\n\nEl formato es nativo de Excel y está listo para usar.",
                            "orden": 4,
                            "visible": True,
                            "roles_permitidos": ["Administrador"]
                        }
                    ]
                },
                {
                    "id": "registro_publico",
                    "nombre": "Registro Público de Asistencia",
                    "icono": "user-check",
                    "orden": 4,
                    "tarjetas": [
                        {
                            "id": "acceso_publico",
                            "pregunta": "¿Cómo se registran los asistentes?",
                            "respuesta": "Los participantes se registran a través del link de registro:\n\n1. Acceden al link compartido por el organizador\n2. Completan el formulario con sus datos:\n   - Cédula (formato automático: X.XXX.XXX)\n   - Nombre completo\n   - Cargo\n   - Unidad\n   - Correo electrónico\n3. Aceptan la autorización de datos\n4. Hacen clic en 'Registrar Asistencia'\n\nEl registro es instantáneo y genera un código QR único.",
                            "orden": 1,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        },

                        {
                            "id": "pantalla_exito",
                            "pregunta": "¿Qué pasa después de registrarse?",
                            "respuesta": "Al completar el registro exitosamente:\n\n1. Aparece una pantalla de confirmación\n2. Se muestra el código QR único del participante\n3. El código QR puede ser descargado o capturado\n4. El participante puede cerrar la ventana\n\nEl registro queda guardado permanentemente en el sistema.",
                            "orden": 3,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        }
                    ]
                },
                {
                    "id": "usuarios_permisos",
                    "nombre": "Usuarios y Permisos",
                    "icono": "shield",
                    "orden": 5,
                    "tarjetas": [
                        {
                            "id": "roles",
                            "pregunta": "¿Qué roles existen en el sistema?",
                            "respuesta": "Hay 2 roles con diferentes niveles de acceso:\n\n👤 Usuario: Solo puede consultar actividades y asistentes\n\n✏️ Editor: Puede crear, editar y exportar actividades. Puede consultar asistentes\n\n👑 Administrador: Acceso total, incluye gestión de usuarios y permisos\n\nLos roles son asignados por un Administrador.",
                            "orden": 1,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        },
                        {
                            "id": "gestion_usuarios",
                            "pregunta": "¿Cómo gestionar usuarios? (Solo Administradores)",
                            "respuesta": "En Configuración → Gestión de usuarios:\n\n1. Verás la lista de todos los usuarios registrados\n2. Cada usuario muestra: Nombre, Email, Rol actual\n3. Para cambiar el rol, selecciona uno nuevo del menú desplegable\n4. Haz clic en 'Guardar'\n\nLos cambios aplican inmediatamente. El usuario debe recargar la página para ver sus nuevos permisos.",
                            "orden": 2,
                            "visible": True,
                            "roles_permitidos": ["Administrador"]
                        },
                        {
                            "id": "permisos_personalizados",
                            "pregunta": "¿Cómo configurar permisos personalizados?",
                            "respuesta": "Solo Administradores en Configuración → Permisos de roles:\n\n1. Verás una tabla con todos los permisos disponibles\n2. Cada columna representa un rol\n3. Marca/desmarca los permisos para cada rol:\n   - Ver sesiones\n   - Crear sesiones\n   - Editar sesiones\n   - Eliminar sesiones\n   - Exportar sesiones\n   - Ver usuarios\n   - Modificar roles\n   - Eliminar usuarios\n   - Acceder a configuración\n   - Modificar permisos\n4. Haz clic en 'Guardar Cambios'\n\nLos cambios se aplican de inmediato a todos los usuarios del sistema.",
                            "orden": 3,
                            "visible": True,
                            "roles_permitidos": ["Administrador"]
                        },
                        {
                            "id": "primer_acceso",
                            "pregunta": "¿Cómo ingresa un nuevo usuario al sistema?",
                            "respuesta": "El acceso es mediante Microsoft Entra ID:\n\n1. El usuario debe tener una cuenta Microsoft de la organización\n2. Al iniciar sesión por primera vez, se crea automáticamente como 'Usuario'\n3. Un Administrador debe cambiar su rol si necesita más permisos\n\nNo hay registro manual, todo es automático con Microsoft.",
                            "orden": 4,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        }
                    ]
                },
                {
                    "id": "soporte",
                    "nombre": "Soporte y Ayuda Técnica",
                    "icono": "life-ring",
                    "orden": 6,
                    "tarjetas": [
                        {
                            "id": "problema_tecnico",
                            "pregunta": "¿Qué hacer si el sistema no funciona correctamente?",
                            "respuesta": "Pasos para solucionar problemas:\n\n1. Recarga la página (F5 o Ctrl+R)\n2. Verifica tu conexión a internet\n3. Cierra sesión y vuelve a iniciar\n4. Limpia el caché del navegador\n5. Intenta con otro navegador\n\nSi el problema persiste, contacta a Talento Humano con:\n- Descripción del problema\n- Qué estabas haciendo cuando ocurrió\n- Captura de pantalla del error (si hay)\n- Navegador y versión que usas",
                            "orden": 1,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        },
                        {
                            "id": "contacto",
                            "pregunta": "¿Cómo contactar al soporte?",
                            "respuesta": "Departamento de Talento Humano:\n\n📧 Email: talentohumano@fundacionsantodomingo.org\n⏰ Horario de atención: Lunes a Viernes, 8:00 AM - 5:00 PM\n📍 Tiempo de respuesta: Máximo 24 horas hábiles\n\nIncluye en tu mensaje:\n- Nombre completo y cargo\n- Descripción detallada del problema o consulta\n- Capturas de pantalla si aplica",
                            "orden": 2,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        },
                        {
                            "id": "navegadores",
                            "pregunta": "¿Qué navegadores son compatibles?",
                            "respuesta": "El sistema funciona en navegadores modernos:\n\n✅ Google Chrome (Recomendado) - Mejor rendimiento\n✅ Microsoft Edge - Totalmente compatible\n✅ Firefox - Compatible\n✅ Safari - Compatible (macOS/iOS)\n\nRequisitos:\n• Versión actualizada del navegador\n• JavaScript habilitado\n• Cookies habilitadas\n• Conexión estable a internet\n\nPara mejor experiencia, mantén tu navegador actualizado.",
                            "orden": 3,
                            "visible": True,
                            "roles_permitidos": ["Usuario", "Administrador"]
                        }
                    ]
                }
            ],
            "fecha_modificacion": datetime.utcnow().isoformat(),
            "modificado_por": "system"
        }


# Instancia global del servicio de ayuda
ayuda_service = AyudaService()
