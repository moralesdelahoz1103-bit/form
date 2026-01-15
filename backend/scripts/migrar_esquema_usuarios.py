import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.usuarios import usuario_service

def migrar_esquema():
    """Migrar usuarios del esquema antiguo al nuevo"""
    
    print("\n" + "="*60)
    print("MIGRACIÓN DE ESQUEMA DE USUARIOS")
    print("="*60 + "\n")
    
    # Obtener todos los usuarios actuales
    usuarios = usuario_service.listar_usuarios()
    
    if not usuarios:
        print("⚠️  No hay usuarios en la base de datos\n")
        return
    
    print(f"📊 Usuarios encontrados: {len(usuarios)}\n")
    
    for i, usuario in enumerate(usuarios, 1):
        print(f"{i}. Migrando: {usuario.get('nombre')}")
        print(f"   ID: {usuario.get('id')}")
        
        # Preparar datos del nuevo esquema
        nuevo_esquema = {
            "id": usuario.get("id"),
            "nombre": usuario.get("nombre"),
            "rol": usuario.get("rol", "Usuario"),
            "fecha_ingreso": usuario.get("created_at") or usuario.get("fecha_ingreso")
        }
        
        # Eliminar campos antiguos si existen
        campos_a_eliminar = ["email", "estado", "created_at"]
        
        try:
            # Reemplazar completamente el documento con solo los campos del nuevo esquema
            usuario_service.cosmos_db.usuarios_container.replace_item(
                item=usuario.get("id"),
                body=nuevo_esquema
            )
            print(f"   ✅ Migrado correctamente")
            print(f"   Rol: {nuevo_esquema['rol']}")
            print(f"   Fecha ingreso: {nuevo_esquema['fecha_ingreso']}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
    
    print("="*60)
    print("✅ MIGRACIÓN COMPLETADA")
    print("="*60 + "\n")
    
    # Verificar el resultado
    print("Verificando usuarios después de la migración:\n")
    usuarios_migrados = usuario_service.listar_usuarios()
    
    for usuario in usuarios_migrados:
        print(f"• {usuario.get('nombre')}")
        print(f"  ID: {usuario.get('id')}")
        print(f"  Rol: {usuario.get('rol')}")
        print(f"  Fecha ingreso: {usuario.get('fecha_ingreso')}")
        
        # Verificar si todavía existen campos antiguos
        campos_antiguos = []
        if "email" in usuario:
            campos_antiguos.append("email")
        if "estado" in usuario:
            campos_antiguos.append("estado")
        if "created_at" in usuario:
            campos_antiguos.append("created_at")
        
        if campos_antiguos:
            print(f"  ⚠️  Campos antiguos aún presentes: {', '.join(campos_antiguos)}")
        else:
            print(f"  ✅ Esquema limpio")
        print()

if __name__ == "__main__":
    migrar_esquema()
