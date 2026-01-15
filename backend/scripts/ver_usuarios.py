import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.usuarios import usuario_service

def listar_usuarios():
    """Ver todos los usuarios autorizados en la base de datos"""
    print("\n" + "="*60)
    print("USUARIOS AUTORIZADOS EN EL SISTEMA")
    print("="*60 + "\n")
    
    usuarios = usuario_service.listar_usuarios()
    
    if not usuarios:
        print("⚠️  No hay usuarios registrados en el sistema")
        print("\nEl primer usuario que inicie sesión será registrado automáticamente como administrador.\n")
        return
    
    for i, usuario in enumerate(usuarios, 1):
        print(f"{i}. {usuario.get('nombre', 'Sin nombre')}")
        print(f"   Email: {usuario.get('email')}")
        print(f"   Rol: {usuario.get('rol')}")
        print(f"   Estado: {usuario.get('estado')}")
        print(f"   ID: {usuario.get('id')}")
        print(f"   Creado: {usuario.get('created_at', 'N/A')}")
        print()
    
    print(f"Total: {len(usuarios)} usuario(s) registrado(s)\n")

if __name__ == "__main__":
    listar_usuarios()
