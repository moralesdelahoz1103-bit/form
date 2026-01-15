import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.usuarios import usuario_service

def agregar_admin():
    """Agregar usuario administrador a la base de datos"""
    
    email = "aprendizprocesos@fundacionsantodomingo.org"
    nombre = "Aprendiz de procesos"
    
    print("\n" + "="*60)
    print("AGREGANDO USUARIO ADMINISTRADOR")
    print("="*60 + "\n")
    
    # Verificar si el usuario ya existe
    usuario_existente = usuario_service.obtener_usuario_por_email(email)
    
    if usuario_existente:
        print(f"⚠️  El usuario {email} ya existe en el sistema")
        print(f"   Estado actual: {usuario_existente.get('estado')}")
        print(f"   Rol actual: {usuario_existente.get('rol')}")
        
        # Actualizar a activo si está inactivo
        if usuario_existente.get('estado') != 'activo':
            usuario_service.actualizar_usuario(
                usuario_existente.get('id'),
                estado='activo'
            )
            print(f"\n✅ Usuario actualizado a estado: activo")
        else:
            print(f"\n✅ Usuario ya está activo")
    else:
        # Crear nuevo usuario
        nuevo_usuario = usuario_service.crear_usuario(
            nombre=nombre,
            email=email,
            rol="Administrador",
            estado="activo"
        )
        print(f"✅ Usuario creado exitosamente")
        print(f"\n   Nombre: {nuevo_usuario.get('nombre')}")
        print(f"   Email: {nuevo_usuario.get('email')}")
        print(f"   Rol: {nuevo_usuario.get('rol')}")
        print(f"   Estado: {nuevo_usuario.get('estado')}")
        print(f"   ID: {nuevo_usuario.get('id')}")
    
    print("\n" + "="*60)
    print("Ahora puedes iniciar sesión con esta cuenta")
    print("="*60 + "\n")

if __name__ == "__main__":
    agregar_admin()
