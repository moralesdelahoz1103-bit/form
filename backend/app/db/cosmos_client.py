from azure.cosmos import CosmosClient, PartitionKey, exceptions
from typing import Optional, Dict, Any
import time

from core.config import settings
from .repositories.sesiones_repo import SesionesRepository
from .repositories.asistentes_repo import AsistentesRepository
from .repositories.usuarios_repo import UsuariosRepository, ConfiguracionRepository

class CosmosDBClient:
    def __init__(self):
        self.client = CosmosClient(settings.COSMOS_ENDPOINT, settings.COSMOS_KEY)
        self.database_name = settings.COSMOS_DATABASE_NAME
        self.database = None
        
        # Repositorios
        self.sesiones = None
        self.asistentes = None
        self.usuarios = None
        self.configuracion = None
        
        self._initialize_database()
    
    def _initialize_database(self):
        max_retries = 3
        retry_delay = 2
        for attempt in range(max_retries):
            try:
                self.database = self.client.create_database_if_not_exists(id=self.database_name)
                
                self.sesiones_container = self.database.create_container_if_not_exists(id="sesiones", partition_key=PartitionKey(path="/id"))
                self.sesiones = SesionesRepository(self.sesiones_container)
                
                self.asistentes_container = self.database.create_container_if_not_exists(id="asistentes", partition_key=PartitionKey(path="/id"))
                self.asistentes = AsistentesRepository(self.asistentes_container)
                
                self.usuarios_container = self.database.create_container_if_not_exists(id="usuarios", partition_key=PartitionKey(path="/id"))
                self.usuarios = UsuariosRepository(self.usuarios_container)
                
                self.config_container = self.database.create_container_if_not_exists(id="configuracion", partition_key=PartitionKey(path="/id"))
                self.configuracion = ConfiguracionRepository(self.config_container)
                
                print("✅ CosmosDB inicializado correctamente con repositorios")
                return
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    raise

    # Proxies para compatibilidad
    def crear_sesion(self, data): return self.sesiones.crear(data)
    def obtener_sesion(self, id): return self.sesiones.obtener_por_id(id)
    def listar_sesiones(self, owner=None, tipos=None): return self.sesiones.listar(owner, tipos)
    def listar_sesiones_admin(self, email): return self.sesiones.listar_admin(email)
    def obtener_sesion_por_token(self, token): return self.sesiones.obtener_por_token(token)
    def actualizar_sesion(self, id, data): return self.sesiones.actualizar(id, data)
    def eliminar_sesion(self, id): return self.sesiones.eliminar(id)
    
    def crear_o_actualizar_asistente(self, data, s_id): return self.asistentes.crear_o_actualizar(data, s_id)
    def obtener_asistente(self, id, s_id): return self.asistentes.obtener_por_id(id, s_id)
    def listar_asistentes_por_sesion(self, s_id): return self.asistentes.listar_por_sesion(s_id)
    def verificar_asistente_duplicado(self, c, s_id): return self.asistentes.verificar_duplicado(c, s_id)
    def eliminar_asistentes_por_sesion(self, s_id): return self.asistentes.eliminar_por_sesion(s_id)
    
    def crear_usuario(self, data): return self.usuarios.crear(data)
    def listar_usuarios(self): return self.usuarios.listar()
    def obtener_usuario_por_id(self, id): return self.usuarios.obtener_por_id(id)
    def obtener_usuario_por_email(self, e): return self.usuarios.obtener_por_email(e)
    def actualizar_usuario(self, id, data): return self.usuarios.actualizar(id, data)
    def eliminar_usuario(self, id): return self.usuarios.eliminar(id)
    
    def obtener_permisos(self): return self.configuracion.obtener_por_id("permisos_roles")
    def crear_permisos(self, d): return self.configuracion.crear("permisos_roles", d)
    def actualizar_permisos(self, d): return self.configuracion.actualizar("permisos_roles", d)
    
    def obtener_ayuda(self): return self.configuracion.obtener_por_id("centro_ayuda")
    def crear_ayuda(self, d): return self.configuracion.crear("centro_ayuda", d)
    def actualizar_ayuda(self, d): return self.configuracion.actualizar("centro_ayuda", d)

_cosmos_db_instance = None
def get_cosmos_db():
    global _cosmos_db_instance
    if _cosmos_db_instance is None:
        try:
            _cosmos_db_instance = CosmosDBClient()
        except Exception:
            _cosmos_db_instance = None
    return _cosmos_db_instance

cosmos_db = get_cosmos_db()
