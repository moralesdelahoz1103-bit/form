import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.usuarios import usuario_service

def hacerme_admin():
    """Cambiar mi rol a Administrador"""
    
    print("\n" + "="*60)
    print("CAMBIAR ROL A ADMINISTRADOR")
    print("="*60 + "\n")
    
    # Primero listar todos los usuarios
    usuarios = usuario_service.listar_usuarios()
    
    if not usuarios:
        print("⚠️  No hay usuarios registrados. Primero debes iniciar sesión en el sistema.\n")
        return
    
    print("Usuarios actuales:\n")
    for i, usuario in enumerate(usuarios, 1):
        print(f"{i}. {usuario.get('nombre')}")
        print(f"   ID: {usuario.get('id')}")
        print(f"   Rol: {usuario.get('rol')}")
        print(f"   Fecha de ingreso: {usuario.get('fecha_ingreso', 'N/A')}")
        print()
    
    # Seleccionar usuario
    print("="*60)
    try:
        seleccion = int(input("\n¿Cuál usuario quieres hacer administrador? (número): "))
        
        if seleccion < 1 or seleccion > len(usuarios):
            print(f"\n❌ Selección inválida. Debe ser entre 1 y {len(usuarios)}\n")
            return
        
        usuario_seleccionado = usuarios[seleccion - 1]
        
        # Confirmar
        print(f"\n¿Estás seguro de cambiar el rol de '{usuario_seleccionado.get('nombre')}' a Administrador?")
        confirmacion = input("Escribe 'SI' para confirmar: ")
        
        if confirmacion.upper() != 'SI':
            print("\n❌ Operación cancelada\n")
            return
        
        # Cambiar rol
        usuario_service.actualizar_usuario(usuario_seleccionado.get('id'), rol='Administrador')
        
        print("\n✅ ¡Rol actualizado exitosamente!")
        print(f"   {usuario_seleccionado.get('nombre')} ahora es Administrador")
        print("\n💡 Recarga la página web para que los cambios se apliquen\n")
        
    except ValueError:
        print("\n❌ Debes ingresar un número válido\n")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")

if __name__ == "__main__":
    hacerme_admin()
