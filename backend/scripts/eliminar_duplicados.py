import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.usuarios import usuario_service

def eliminar_duplicados():
    """Eliminar usuarios duplicados por nombre"""
    
    print("\n" + "="*60)
    print("ELIMINAR USUARIOS DUPLICADOS")
    print("="*60 + "\n")
    
    usuarios = usuario_service.listar_usuarios()
    
    # Agrupar por nombre
    usuarios_por_nombre = {}
    for usuario in usuarios:
        nombre = usuario.get('nombre')
        if nombre not in usuarios_por_nombre:
            usuarios_por_nombre[nombre] = []
        usuarios_por_nombre[nombre].append(usuario)
    
    # Encontrar duplicados
    duplicados = {nombre: users for nombre, users in usuarios_por_nombre.items() if len(users) > 1}
    
    if not duplicados:
        print("✅ No hay usuarios duplicados\n")
        return
    
    print(f"⚠️  Encontrados {len(duplicados)} nombre(s) duplicado(s):\n")
    
    for nombre, users in duplicados.items():
        print(f"📋 '{nombre}' aparece {len(users)} veces:")
        print()
        
        for i, usuario in enumerate(users, 1):
            print(f"   {i}. ID: {usuario.get('id')}")
            print(f"      Rol: {usuario.get('rol')}")
            print(f"      Fecha ingreso: {usuario.get('fecha_ingreso')}")
            print()
        
        print("   💡 El ID correcto es el que te da Microsoft al iniciar sesión")
        print("   💡 Generalmente es el usuario más antiguo (fecha de ingreso más vieja)")
        print()
        
        try:
            eliminar = input(f"¿Cuál usuario '{nombre}' quieres ELIMINAR? (número): ")
            eliminar_idx = int(eliminar) - 1
            
            if eliminar_idx < 0 or eliminar_idx >= len(users):
                print(f"❌ Selección inválida\n")
                continue
            
            usuario_a_eliminar = users[eliminar_idx]
            
            # Mostrar confirmación
            print(f"\n⚠️  VAS A ELIMINAR:")
            print(f"   Nombre: {usuario_a_eliminar.get('nombre')}")
            print(f"   ID: {usuario_a_eliminar.get('id')}")
            print(f"   Rol: {usuario_a_eliminar.get('rol')}")
            
            confirmacion = input("\n¿Estás seguro? Escribe 'ELIMINAR' para confirmar: ")
            
            if confirmacion.upper() != 'ELIMINAR':
                print("❌ Operación cancelada\n")
                continue
            
            # Eliminar usuario
            usuario_service.eliminar_usuario(usuario_a_eliminar.get('id'))
            print(f"\n✅ Usuario eliminado exitosamente\n")
            
        except ValueError:
            print("❌ Debes ingresar un número válido\n")
        except Exception as e:
            print(f"❌ Error: {str(e)}\n")
    
    print("="*60)
    print("Usuarios finales en el sistema:")
    print("="*60 + "\n")
    
    usuarios_finales = usuario_service.listar_usuarios()
    for usuario in usuarios_finales:
        print(f"• {usuario.get('nombre')}")
        print(f"  ID: {usuario.get('id')}")
        print(f"  Rol: {usuario.get('rol')}")
        print()

if __name__ == "__main__":
    eliminar_duplicados()
