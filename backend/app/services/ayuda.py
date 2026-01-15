from typing import Dict, Any, List
from datetime import datetime
from app.db.cosmos_client import get_cosmos_db


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
                    "id": "crear_formacion",
                    "nombre": "Crear Formación o Evento",
                    "icono": "calendar",
                    "orden": 1,
                    "tarjetas": [
                        {
                            "id": "acceso_crear",
                            "pregunta": "¿Quién puede crear formaciones o eventos?",
                            "respuesta": "Solo los usuarios con permisos de Editor o Administrador pueden crear formaciones o eventos.\n\nSi no ves el formulario de creación, contacta a un administrador para que te asigne los permisos necesarios.",
                            "orden": 1,
                            "visible": True
                        },
                        {
                            "id": "crear_formacion",
                            "pregunta": "¿Cómo crear una nueva formación o evento?",
                            "respuesta": "En la sección 'Crear formación o evento':\n\n1. Completa el Tema (título de la actividad)\n2. Selecciona la Fecha\n3. Elige el Tipo de actividad: Inducción, Formación, Evento u Otros\n4. Si eliges 'Otros', escribe el tipo personalizado\n5. Ingresa el Facilitador y Responsable\n6. Especifica el Cargo del responsable\n7. Describe el Contenido de la actividad\n8. Define la Hora inicio y Hora final\n9. Haz clic en 'Crear Formación o Evento'\n\nSe generará automáticamente un link de registro para compartir con los asistentes.",
                            "orden": 2,
                            "visible": True
                        },
                        {
                            "id": "link_registro",
                            "pregunta": "¿Cómo funciona el link de registro?",
                            "respuesta": "Al crear una formación o evento, el sistema genera un link único que puedes:\n\n• Copiar haciendo clic en el botón 'Copiar Link'\n• Compartir por correo, WhatsApp o redes sociales\n• Enviar a los participantes para que se registren de forma autónoma\n\nCada link es único por formación o evento y no expira.",
                            "orden": 3,
                            "visible": True
                        }
                    ]
                },
                {
                    "id": "gestionar_formaciones",
                    "nombre": "Formaciones o Eventos Registrados",
                    "icono": "list",
                    "orden": 2,
                    "tarjetas": [
                        {
                            "id": "ver_formaciones",
                            "pregunta": "¿Cómo consultar las formaciones o eventos creados?",
                            "respuesta": "En 'Formaciones o eventos registrados' verás:\n\n• Lista completa de todas las actividades creadas\n• Información de cada una: Tema, Fecha, Tipo de actividad, Facilitador\n• Cantidad de asistentes registrados\n• Opciones para ver detalles, editar o eliminar\n\nUsa los filtros de búsqueda para encontrar formaciones específicas.",
                            "orden": 1,
                            "visible": True
                        },
                        {
                            "id": "editar_formacion",
                            "pregunta": "¿Puedo editar una formación después de crearla?",
                            "respuesta": "Sí, si tienes permisos de Editor o Administrador:\n\n1. En la lista de formaciones, haz clic en 'Ver detalles'\n2. Modifica los campos necesarios\n3. Haz clic en 'Guardar cambios'\n\nNota: Los cambios no afectan a los asistentes ya registrados, solo la información de la formación.",
                            "orden": 2,
                            "visible": True
                        },
                        {
                            "id": "eliminar_formacion",
                            "pregunta": "¿Cómo eliminar una formación o evento?",
                            "respuesta": "Solo usuarios con permiso pueden eliminar:\n\n1. En la lista, haz clic en el botón de eliminar (ícono de papelera)\n2. Confirma la acción\n\n⚠️ ADVERTENCIA: Al eliminar una formación se borrarán TODOS los asistentes registrados y sus datos de forma PERMANENTE. Esta acción no se puede deshacer.",
                            "orden": 3,
                            "visible": True
                        },
                        {
                            "id": "exportar_formaciones",
                            "pregunta": "¿Cómo exportar el listado de formaciones?",
                            "respuesta": "En 'Formaciones o eventos registrados':\n\n1. Usa los filtros si deseas exportar solo algunas formaciones\n2. Haz clic en 'Exportar a Excel'\n3. Se descargará un archivo .xlsx con:\n   - Tema\n   - Fecha\n   - Tipo de actividad\n   - Facilitador\n   - Hora inicio y final\n   - Cantidad de asistentes\n\nEl archivo está formateado como tabla nativa de Excel.",
                            "orden": 4,
                            "visible": True
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
                            "pregunta": "¿Cómo ver los asistentes de una formación?",
                            "respuesta": "En la sección 'Ver asistentes':\n\n1. Selecciona una formación o evento del menú desplegable\n2. El sistema mostrará la información de la formación:\n   - Tema, Facilitador, Tipo de actividad\n   - Hora inicio y final\n   - Total de asistentes\n3. Verás la tabla completa con todos los participantes registrados",
                            "orden": 1,
                            "visible": True
                        },
                        {
                            "id": "datos_asistente",
                            "pregunta": "¿Qué información se registra de cada asistente?",
                            "respuesta": "El sistema almacena:\n\n• Cédula de identidad\n• Nombre completo\n• Cargo\n• Unidad organizacional\n• Correo electrónico\n• Fecha y hora de registro\n• Firma digital\n• Código QR único\n\nToda esta información está disponible para exportación.",
                            "orden": 2,
                            "visible": True
                        },
                        {
                            "id": "ver_firma",
                            "pregunta": "¿Cómo visualizar la firma de un asistente?",
                            "respuesta": "En la tabla de asistentes:\n\n1. Haz clic en el botón 'Ver firma' de cualquier participante\n2. Se abrirá una ventana emergente mostrando la firma digital capturada\n\nLas firmas también se incluyen en los archivos exportados.",
                            "orden": 3,
                            "visible": True
                        },
                        {
                            "id": "exportar_asistentes",
                            "pregunta": "¿Cómo exportar la lista de asistentes?",
                            "respuesta": "Con una formación seleccionada:\n\n1. Haz clic en 'Exportar a Excel'\n2. Se descargará un archivo .xlsx que incluye:\n   - Información de la formación (encabezado)\n   - Tabla con todos los asistentes y sus datos\n   - Cédula, Nombre, Cargo, Unidad, Correo, Fecha\n\nEl formato es nativo de Excel y está listo para usar.",
                            "orden": 4,
                            "visible": True
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
                            "respuesta": "Los participantes se registran a través del link de registro:\n\n1. Acceden al link compartido por el organizador\n2. Completan el formulario con sus datos:\n   - Cédula (formato automático: X.XXX.XXX)\n   - Nombre completo\n   - Cargo\n   - Unidad\n   - Correo electrónico\n3. Realizan su firma digital en el canvas\n4. Aceptan la autorización de datos\n5. Hacen clic en 'Registrar Asistencia'\n\nEl registro es instantáneo y genera un código QR único.",
                            "orden": 1,
                            "visible": True
                        },
                        {
                            "id": "firma_canvas",
                            "pregunta": "¿Cómo funciona la firma digital?",
                            "respuesta": "El canvas de firma permite:\n\n• Firmar con el mouse (computador)\n• Firmar con el dedo (pantalla táctil)\n• Firmar con stylus (tablets)\n\nControles disponibles:\n• Botón 'Limpiar' para borrar y firmar nuevamente\n• La firma se guarda automáticamente en el sistema\n\nRecomendación: Usa dispositivos táctiles para mejor calidad de firma.",
                            "orden": 2,
                            "visible": True
                        },
                        {
                            "id": "pantalla_exito",
                            "pregunta": "¿Qué pasa después de registrarse?",
                            "respuesta": "Al completar el registro exitosamente:\n\n1. Aparece una pantalla de confirmación\n2. Se muestra el código QR único del participante\n3. El código QR puede ser descargado o capturado\n4. El participante puede cerrar la ventana\n\nEl registro queda guardado permanentemente en el sistema.",
                            "orden": 3,
                            "visible": True
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
                            "respuesta": "Hay 3 roles con diferentes niveles de acceso:\n\n👤 Usuario: Solo puede consultar formaciones y asistentes\n\n✏️ Editor: Puede crear, editar y exportar formaciones. Puede consultar asistentes\n\n👑 Administrador: Acceso total, incluye gestión de usuarios y permisos\n\nLos roles son asignados por un Administrador.",
                            "orden": 1,
                            "visible": True
                        },
                        {
                            "id": "gestion_usuarios",
                            "pregunta": "¿Cómo gestionar usuarios? (Solo Administradores)",
                            "respuesta": "En Configuración → Gestión de usuarios:\n\n1. Verás la lista de todos los usuarios registrados\n2. Cada usuario muestra: Nombre, Email, Rol actual\n3. Para cambiar el rol, selecciona uno nuevo del menú desplegable\n4. Haz clic en 'Guardar'\n\nLos cambios aplican inmediatamente. El usuario debe recargar la página para ver sus nuevos permisos.",
                            "orden": 2,
                            "visible": True
                        },
                        {
                            "id": "permisos_personalizados",
                            "pregunta": "¿Cómo configurar permisos personalizados?",
                            "respuesta": "Solo Administradores en Configuración → Permisos de roles:\n\n1. Verás una tabla con todos los permisos disponibles\n2. Cada columna representa un rol\n3. Marca/desmarca los permisos para cada rol:\n   - Ver sesiones\n   - Crear sesiones\n   - Editar sesiones\n   - Eliminar sesiones\n   - Exportar sesiones\n   - Ver usuarios\n   - Modificar roles\n   - Eliminar usuarios\n   - Acceder a configuración\n   - Modificar permisos\n4. Haz clic en 'Guardar Cambios'\n\nLos cambios se aplican de inmediato a todos los usuarios del sistema.",
                            "orden": 3,
                            "visible": True
                        },
                        {
                            "id": "primer_acceso",
                            "pregunta": "¿Cómo ingresa un nuevo usuario al sistema?",
                            "respuesta": "El acceso es mediante Microsoft Entra ID:\n\n1. El usuario debe tener una cuenta Microsoft de la organización\n2. Al iniciar sesión por primera vez, se crea automáticamente como 'Usuario'\n3. Un Administrador debe cambiar su rol si necesita más permisos\n\nNo hay registro manual, todo es automático con Microsoft.",
                            "orden": 4,
                            "visible": True
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
                            "visible": True
                        },
                        {
                            "id": "contacto",
                            "pregunta": "¿Cómo contactar al soporte?",
                            "respuesta": "Departamento de Talento Humano:\n\n📧 Email: talentohumano@fundacionsantodomingo.org\n⏰ Horario de atención: Lunes a Viernes, 8:00 AM - 5:00 PM\n📍 Tiempo de respuesta: Máximo 24 horas hábiles\n\nIncluye en tu mensaje:\n- Nombre completo y cargo\n- Descripción detallada del problema o consulta\n- Capturas de pantalla si aplica",
                            "orden": 2,
                            "visible": True
                        },
                        {
                            "id": "navegadores",
                            "pregunta": "¿Qué navegadores son compatibles?",
                            "respuesta": "El sistema funciona en navegadores modernos:\n\n✅ Google Chrome (Recomendado) - Mejor rendimiento\n✅ Microsoft Edge - Totalmente compatible\n✅ Firefox - Compatible\n✅ Safari - Compatible (macOS/iOS)\n\nRequisitos:\n• Versión actualizada del navegador\n• JavaScript habilitado\n• Cookies habilitadas\n• Conexión estable a internet\n\nPara mejor experiencia, mantén tu navegador actualizado.",
                            "orden": 3,
                            "visible": True
                        }
                    ]
                }
            ],
            "fecha_modificacion": datetime.utcnow().isoformat(),
            "modificado_por": "system"
        }


# Instancia global del servicio de ayuda
ayuda_service = AyudaService()
