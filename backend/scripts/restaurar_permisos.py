#!/usr/bin/env python3
"""
Script de Recuperación de Permisos
====================================

Este script restaura los permisos del sistema a sus valores por defecto.
Útil cuando un administrador se ha quitado acceso a la configuración.

Uso:
    python backend/scripts/restaurar_permisos.py

Requisitos:
    - Acceso al servidor donde corre la aplicación
    - Python 3.7 o superior
    - Conexión a la base de datos configurada

Autor: Sistema de Gestión de Formaciones
Fecha: 2026-01-16
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.permisos import PermisosService
from datetime import datetime

def mostrar_banner():
    """Mostrar banner del script"""
    print("\n" + "="*70)
    print(" 🔧 SCRIPT DE RECUPERACIÓN DE PERMISOS")
    print("="*70 + "\n")

def mostrar_permisos_actuales(permisos_service):
    """Mostrar los permisos actuales del sistema"""
    try:
        permisos = permisos_service.obtener_permisos()
        
        print("📋 PERMISOS ACTUALES:")
        print("-" * 70)
        
        for rol, permisos_rol in permisos.items():
            print(f"\n🔸 {rol}:")
            for permiso, valor in permisos_rol.items():
                estado = "✅ Activado" if valor else "❌ Desactivado"
                print(f"   • {permiso:25} : {estado}")
        
        print("\n" + "-" * 70)
        
        # Verificar si hay permisos críticos desactivados
        admin_permisos = permisos.get('Administrador', {})
        permisos_criticos = {
            'acceder_config': 'Acceder a configuración',
            'modificar_permisos': 'Modificar permisos'
        }
        
        problemas = []
        for permiso, descripcion in permisos_criticos.items():
            if not admin_permisos.get(permiso, False):
                problemas.append(f"⚠️  {descripcion} está DESACTIVADO para Administradores")
        
        if problemas:
            print("\n🚨 PROBLEMAS DETECTADOS:\n")
            for problema in problemas:
                print(f"   {problema}")
            print("\n   Esto puede impedir el acceso a la configuración del sistema.")
            return True
        else:
            print("\n✅ Todos los permisos críticos están correctamente configurados.")
            return False
            
    except Exception as e:
        print(f"❌ Error al obtener permisos actuales: {e}")
        return False

def mostrar_permisos_defecto():
    """Mostrar los permisos por defecto que se restaurarán"""
    print("\n📋 PERMISOS POR DEFECTO (a restaurar):")
    print("-" * 70)
    
    permisos_defecto = {
        "Usuario": {
            "ver_sesiones": True,
            "crear_sesiones": True,
            "editar_sesiones": True,
            "eliminar_sesiones": True,
            "exportar_sesiones": True,
            "ver_usuarios": False,
            "cambiar_roles": False,
            "eliminar_usuarios": False,
            "acceder_config": False,
            "modificar_permisos": False,
        },
        "Administrador": {
            "ver_sesiones": True,
            "crear_sesiones": True,
            "editar_sesiones": True,
            "eliminar_sesiones": True,
            "exportar_sesiones": True,
            "ver_usuarios": True,
            "cambiar_roles": True,
            "eliminar_usuarios": True,
            "acceder_config": True,
            "modificar_permisos": True,
        }
    }
    
    for rol, permisos_rol in permisos_defecto.items():
        print(f"\n🔸 {rol}:")
        for permiso, valor in permisos_rol.items():
            estado = "✅ Activado" if valor else "❌ Desactivado"
            print(f"   • {permiso:25} : {estado}")
    
    print("\n" + "-" * 70)

def confirmar_restauracion():
    """Solicitar confirmación del usuario"""
    print("\n⚠️  ADVERTENCIA:")
    print("   Esta acción restaurará todos los permisos a sus valores por defecto.")
    print("   Cualquier configuración personalizada se perderá.")
    print()
    
    respuesta = input("¿Deseas continuar? Escribe 'SI' para confirmar: ")
    return respuesta.upper() == 'SI'

def restaurar_permisos():
    """Función principal para restaurar permisos"""
    mostrar_banner()
    
    try:
        permisos_service = PermisosService()
        
        # Mostrar permisos actuales
        hay_problemas = mostrar_permisos_actuales(permisos_service)
        
        # Si no hay problemas, preguntar si aún desea continuar
        if not hay_problemas:
            print("\n¿Deseas restaurar los permisos de todas formas?")
            respuesta = input("Escribe 'SI' para continuar o cualquier otra cosa para cancelar: ")
            if respuesta.upper() != 'SI':
                print("\n❌ Operación cancelada por el usuario.\n")
                return
        
        # Mostrar permisos por defecto
        mostrar_permisos_defecto()
        
        # Confirmar restauración
        if not confirmar_restauracion():
            print("\n❌ Operación cancelada por el usuario.\n")
            return
        
        # Realizar la restauración
        print("\n🔄 Restaurando permisos...")
        resultado = permisos_service.restablecer_permisos_defecto("system-recovery-script")
        
        if resultado:
            print("\n✅ ¡Permisos restaurados exitosamente!")
            print(f"   Fecha de restauración: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
            print("\n📝 Cambios aplicados:")
            print("   • Todos los permisos han sido restaurados a sus valores por defecto")
            print("   • Los administradores tienen acceso completo al sistema")
            print("   • Los usuarios tienen permisos estándar")
            print("\n💡 Próximos pasos:")
            print("   1. Accede al sistema con una cuenta de Administrador")
            print("   2. Ve a Configuración > Permisos")
            print("   3. Verifica que todo esté correcto")
            print("   4. Ajusta los permisos según tus necesidades")
            print()
        else:
            print("\n❌ Error al restaurar permisos. Revisa los logs del sistema.")
            
    except Exception as e:
        print(f"\n❌ Error crítico: {e}")
        print("   Por favor, contacta al soporte técnico.")
        print()
        return 1
    
    print("="*70 + "\n")
    return 0

if __name__ == "__main__":
    sys.exit(restaurar_permisos())
