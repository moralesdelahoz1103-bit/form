import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.usuarios import usuario_service
from app.services.sesiones import get_all_sesiones

def corregir_contador_formularios(modo='verificar'):
    """
    Corregir el contador de formularios creados basándose en las sesiones reales
    
    Args:
        modo: 'verificar' para solo mostrar diferencias, 'corregir' para aplicar cambios
    """
    print("\n" + "="*70)
    print(f"{'VERIFICANDO' if modo == 'verificar' else 'CORRIGIENDO'} CONTADOR DE FORMULARIOS")
    print("="*70 + "\n")
    
    usuarios = usuario_service.listar_usuarios()
    
    if not usuarios:
        print("⚠️  No hay usuarios registrados")
        return
    
    # Obtener todas las sesiones
    todas_sesiones = get_all_sesiones()
    
    cambios_necesarios = False
    
    for usuario in usuarios:
        usuario_id = usuario.get('id')
        nombre = usuario.get('nombre', 'Sin nombre')
        contador_actual = usuario.get('formularios_creados', 0)
        
        # Contar sesiones reales creadas por este usuario
        # Buscar por created_by_id (nuevo) o por created_by (email, legacy)
        sesiones_reales = [
            s for s in todas_sesiones 
            if s.get('created_by_id') == usuario_id or 
               (not s.get('created_by_id') and s.get('created_by') == usuario.get('email'))
        ]
        contador_real = len(sesiones_reales)
        
        print(f"📋 Usuario: {nombre}")
        print(f"   ID: {usuario_id}")
        print(f"   Email: {usuario.get('email', 'N/A')}")
        print(f"   Contador en DB: {contador_actual}")
        print(f"   Sesiones reales: {contador_real}")
        
        if contador_actual != contador_real:
            cambios_necesarios = True
            print(f"   ⚠️  DIFERENCIA DETECTADA: {contador_actual} → {contador_real}")
            
            if modo == 'corregir':
                try:
                    usuario_service.actualizar_usuario(usuario_id, formularios_creados=contador_real)
                    print(f"   ✅ Contador actualizado correctamente")
                except Exception as e:
                    print(f"   ❌ Error al actualizar: {str(e)}")
            else:
                print(f"   ℹ️  Usar modo 'corregir' para aplicar cambios")
        else:
            print(f"   ✅ Contador correcto")
        print()
    
    if modo == 'verificar':
        if cambios_necesarios:
            print("\n⚠️  Se detectaron diferencias.")
            print("💡 Ejecuta el script con el parámetro 'corregir' para aplicar los cambios:")
            print("   python scripts/corregir_contador_formularios.py corregir\n")
        else:
            print("\n✅ Todos los contadores están correctos\n")
    else:
        print("\n✅ Corrección completada\n")

if __name__ == "__main__":
    import sys
    modo = sys.argv[1] if len(sys.argv) > 1 else 'verificar'
    
    if modo not in ['verificar', 'corregir']:
        print("❌ Modo inválido. Usa 'verificar' o 'corregir'")
        print("\nEjemplos:")
        print("  python scripts/corregir_contador_formularios.py          # Solo verificar")
        print("  python scripts/corregir_contador_formularios.py corregir # Aplicar correcciones")
        sys.exit(1)
    
    corregir_contador_formularios(modo)
