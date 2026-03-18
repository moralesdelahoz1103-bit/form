from typing import List, Optional, Dict, Any
from azure.cosmos import exceptions
from .base import BaseRepository

class AsistentesRepository(BaseRepository):
    def crear_o_actualizar(self, asistente_data: Dict[str, Any], sesion_id: str) -> Dict[str, Any]:
        cedula = asistente_data['cedula']
        id_especifico = asistente_data.get('ocurrencia_id') or sesion_id
        
        nueva_asistencia = {
            "actividad_id": sesion_id,
            "sesion_id": id_especifico,
            "fecha_registro": asistente_data['fecha_registro']
        }
        
        print(f"🔍 [Repo] Procesando registro para {cedula} en sesión {id_especifico}")
        
        # Intentar leer primero para actualizar
        try:
            print(f"DEBUG: [Repo] Intentando leer persona id='{cedula}' partition_key='{cedula}'")
            persona = self.container.read_item(item=cedula, partition_key=cedula)
            print(f"DEBUG: [Repo] Persona encontrada. Asistencias actuales: {len(persona.get('asistencias', []))}")
            
            # Verificar si ya tiene asistencia para esta sesión/ocurrencia específica
            if any(a.get('sesion_id') == id_especifico for a in persona.get('asistencias', [])):
                print(f"🔍 [Repo] Asistencia ya registrada para {cedula} en {id_especifico}")
                return persona
                
            # Agregar nueva asistencia
            if 'asistencias' not in persona:
                persona['asistencias'] = []
            persona['asistencias'].append(nueva_asistencia)
            
            # Actualizar datos de contacto si se proporcionan
            for campo in ['nombre', 'cargo', 'unidad', 'empresa', 'telefono', 'correo']:
                valor = asistente_data.get(campo)
                if valor:
                    persona[campo] = valor
                    
            print(f"🔍 [Repo] Actualizando asistencias de {cedula}...")
            return self.container.replace_item(item=cedula, body=persona)
            
        except (exceptions.CosmosResourceNotFoundError, exceptions.CosmosHttpResponseError) as e:
            # Capturar también CosmosHttpResponseError si el status_code es 404
            status_code = getattr(e, 'status_code', 0)
            if not isinstance(e, exceptions.CosmosResourceNotFoundError) and status_code != 404:
                print(f"❌ Error inesperado en read_item (persona={cedula}): {type(e).__name__}: {e}")
                raise
            
            # FALLBACK: Si no se encontró por read_item, intentar por consulta (cross-partition)
            # Esto ayuda si el partition_key no es exactamente la cédula/id
            print(f"⚠️ [Repo] Persona {cedula} no encontrada por read_item. Intentando búsqueda por consulta...")
            query = "SELECT * FROM c WHERE c.id = @cedula"
            parameters = [{"name": "@cedula", "value": cedula}]
            items = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
            
            if items:
                print(f"✅ [Repo] Persona {cedula} encontrada mediante consulta fallback!")
                persona = items[0]
                # Seguir con la lógica de actualización
                if any(a.get('sesion_id') == id_especifico for a in persona.get('asistencias', [])):
                    return persona
                if 'asistencias' not in persona:
                    persona['asistencias'] = []
                persona['asistencias'].append(nueva_asistencia)
                for campo in ['nombre', 'cargo', 'unidad', 'empresa', 'telefono', 'correo']:
                    valor = asistente_data.get(campo)
                    if valor: persona[campo] = valor
                return self.container.replace_item(item=persona['id'], body=persona)

            # Si realmente no existe en ninguna partición, intentar crear por primera vez
            print(f"🔍 [Repo] Persona {cedula} no existe en ninguna partición, creando registro base...")
            nueva_persona = {
                "id": cedula,
                "asistencias": [nueva_asistencia]
            }
            # Agregar campos base
            for campo in ['nombre', 'cargo', 'unidad', 'empresa', 'telefono', 'correo']:
                valor = asistente_data.get(campo)
                if valor:
                    nueva_persona[campo] = valor
            
            try:
                return self.container.create_item(body=nueva_persona)
            except exceptions.CosmosResourceExistsError:
                # Si falló porque se creó justo antes, reintentar lectura una vez
                print(f"⚠️ [Repo] Conflicto de creación (ya existe {cedula}). Reintentando actualización final...")
                try:
                    persona = self.container.read_item(item=cedula, partition_key=cedula)
                    if not any(a.get('sesion_id') == id_especifico for a in persona.get('asistencias', [])):
                        persona['asistencias'].append(nueva_asistencia)
                        return self.container.replace_item(item=cedula, body=persona)
                    return persona
                except Exception as ex_read:
                    print(f"❌ FALLO CRÍTICO: No se pudo leer documento que acabamos de decir que existe (id={cedula}): {ex_read}")
                    raise

    def obtener_por_cedula(self, cedula: str) -> Optional[Dict[str, Any]]:
        try:
            return self.container.read_item(item=cedula, partition_key=cedula)
        except (exceptions.CosmosResourceNotFoundError, exceptions.CosmosHttpResponseError) as e:
            if getattr(e, 'status_code', 0) == 404 or isinstance(e, exceptions.CosmosResourceNotFoundError):
                # Fallback a consulta
                query = "SELECT * FROM c WHERE c.id = @cedula"
                parameters = [{"name": "@cedula", "value": cedula}]
                items = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
                return items[0] if items else None
            raise
    
    def actualizar_campos(self, cedula: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        persona = self.obtener_por_cedula(cedula)
        if not persona:
            return None
            
        # Actualizar campos permitidos
        campos_permitidos = ['nombre', 'cargo', 'unidad', 'empresa', 'telefono', 'correo']
        for campo in campos_permitidos:
            if campo in data and data[campo] is not None:
                persona[campo] = data[campo]
                
        return self.container.replace_item(item=persona['id'], body=persona)
    
    def listar_por_sesion(self, sesion_id: str) -> List[Dict[str, Any]]:
        # sesion_id aquí puede ser el id de una ocurrencia o de una sesión única (maestra)
        query = """
        SELECT 
            c.id as id, c.id as cedula, c.nombre, c.cargo, c.unidad, c.empresa, c.telefono, c.correo,
            a.actividad_id, a.sesion_id, a.fecha_registro, a.sesion_id as ocurrencia_id
        FROM c
        JOIN a IN c.asistencias
        WHERE a.sesion_id = @sesion_id OR a.actividad_id = @sesion_id
        """
        parameters = [{"name": "@sesion_id", "value": sesion_id}]
        items = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        
        # ordenar en memoria por fecha_registro ya que cosmos db no soporta ORDER BY en colecciones correlacionadas (JOIN)
        return sorted(items, key=lambda x: x.get('fecha_registro', ''))
    
    def _get_persona(self, cedula: str) -> Optional[Dict[str, Any]]:
        """Busca una persona por su ID con fallback a consulta cross-partition."""
        try:
            return self.container.read_item(item=cedula, partition_key=cedula)
        except (exceptions.CosmosResourceNotFoundError, exceptions.CosmosHttpResponseError) as e:
            status_code = getattr(e, 'status_code', 0)
            if not isinstance(e, exceptions.CosmosResourceNotFoundError) and status_code != 404:
                raise
            
            # Fallback a consulta
            query = "SELECT * FROM c WHERE c.id = @cedula"
            parameters = [{"name": "@cedula", "value": cedula}]
            items = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
            return items[0] if items else None

    def verificar_duplicado(self, cedula: str, context_id: str) -> bool:
        # Optimización: Consultar solo el valor booleano o usar una consulta más ligera
        query = "SELECT TOP 1 VALUE 1 FROM c JOIN a IN c.asistencias WHERE c.id = @cedula AND a.sesion_id = @context_id"
        parameters = [{"name": "@cedula", "value": cedula}, {"name": "@context_id", "value": context_id}]
        items = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        return len(items) > 0
    
    def eliminar_asistencia_sesion(self, cedula: str, context_id: str) -> None:
        """
        Elimina la asistencia de una persona para una sesión o actividad específica.
        Si la persona se queda sin asistencias, devuelve el registro de la persona eliminado.
        """
        try:
            print(f"🔍 [Repo] Intentando leer persona {cedula} para limpiar context {context_id}")
            persona = self._get_persona(cedula)
            
            if not persona:
                print(f"⚠️ [Repo] Persona {cedula} no encontrada (fallback inclusive)")
                return

            asistencias_antes = len(persona.get('asistencias', []))
            # Filtrar por sesion_id (ocurrencia) o actividad_id (maestra)
            asistencias_restantes = [
                a for a in persona.get('asistencias', []) 
                if a.get('sesion_id') != context_id and a.get('actividad_id') != context_id
            ]
            
            asistencias_despues = len(asistencias_restantes)
            print(f"🔍 [Repo] Persona {cedula}: {asistencias_antes} -> {asistencias_despues} asistencias")

            if not asistencias_restantes:
                print(f"🗑️ [Repo] Persona {cedula} sin asistencias. Eliminando registro completo.")
                # Logs para diagnosticar la partition key real del contenedor
                print(f"🔬 [Repo] Campos del documento: { {k: v for k, v in persona.items() if k.startswith('_') or k == 'id'} }")
                eliminado = False
                # Intentar distintos formatos de partition key (simple, 1 nivel, 2 niveles)
                for pk_val in [cedula, [cedula], [cedula, cedula]]:
                    try:
                        self.container.delete_item(item=cedula, partition_key=pk_val)
                        print(f"✅ [Repo] Eliminado con partition_key={pk_val!r}")
                        eliminado = True
                        break
                    except exceptions.CosmosResourceNotFoundError:
                        print(f"⚠️ [Repo] No encontrado con pk={pk_val!r}, quizás ya fue eliminado")
                        eliminado = True
                        break
                    except Exception as e_pk:
                        print(f"⚠️ [Repo] pk={pk_val!r} falló: {type(e_pk).__name__}: {getattr(e_pk, 'status_code', '?')}")
                        continue
                if not eliminado:
                    raise RuntimeError(f"No se pudo eliminar el documento {cedula} con ningún formato de partition key")
            elif asistencias_antes != asistencias_despues:
                print(f"💾 [Repo] Actualizando persona {cedula} con asistencias filtradas.")
                persona['asistencias'] = asistencias_restantes
                # upsert_item toma la partition key directamente del cuerpo del documento
                self.container.upsert_item(body=persona)
            else:
                print(f"ℹ️ [Repo] No se encontró la asistencia {context_id} en el registro de {cedula}. Nada que eliminar.")
                
        except Exception as e:
            print(f"❌ [Repo] Error al eliminar asistencia de {cedula}: {type(e).__name__}: {str(e)}")
            raise

    def contar_por_sesion(self, sesion_id: str) -> int:
        """
        Cuenta el total de asistentes únicos para una sesión o actividad.
        """
        query = "SELECT VALUE COUNT(1) FROM c JOIN a IN c.asistencias WHERE a.sesion_id = @sesion_id OR a.actividad_id = @sesion_id"
        parameters = [{"name": "@sesion_id", "value": sesion_id}]
        items = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        return items[0] if items else 0

    def eliminar_por_sesion(self, context_id: str) -> None:
        """
        Elimina todas las asistencias vinculadas a un id de sesión o actividad.
        Limpia los registros de personas que queden huérfanos.
        """
        print(f"🚀 [Repo] Iniciando búsqueda de asistentes para eliminar en context: {context_id}")
        
        # Usar DISTINCT para evitar procesar la misma persona múltiples veces si tiene varias asistencias que matchean
        query = "SELECT DISTINCT VALUE c.id FROM c JOIN a IN c.asistencias WHERE a.sesion_id = @id OR a.actividad_id = @id"
        parameters = [{"name": "@id", "value": context_id}]
        
        try:
            cedulas = list(self.container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
            
            if not cedulas:
                print(f"ℹ️ [Repo] Sin asistentes encontrados para context_id={context_id}")
                return
                
            print(f"🔍 [Repo] Se encontraron {len(cedulas)} personas a procesar para context_id={context_id}")
            for cedula in cedulas:
                self.eliminar_asistencia_sesion(cedula, context_id)
        except Exception as e:
            print(f"❌ [Repo] Error fatal en eliminar_por_sesion (context_id={context_id}): {type(e).__name__}: {str(e)}")
            raise
