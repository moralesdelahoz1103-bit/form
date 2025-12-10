"""
Script de migración para añadir el campo `created_by` a sesiones existentes.
Uso:
  - Define la variable de entorno `MIGRATE_DEFAULT_OWNER` con el email a asignar a sesiones sin `created_by`.
  - Ejecuta desde la carpeta `backend`:
      python scripts/migrate_add_created_by.py

Si `STORAGE_MODE=cosmosdb`, intentará actualizar documentos en CosmosDB.
Si `STORAGE_MODE=json` (por defecto), actualizará `app/data/sesiones.json`.
"""
import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / 'app'))

from core.config import settings

DEFAULT_OWNER = os.getenv('MIGRATE_DEFAULT_OWNER', 'admin@fundacionsantodomingo.org')

print(f"Modo de almacenamiento: {settings.STORAGE_MODE}")
print(f"Default owner: {DEFAULT_OWNER}")

if settings.STORAGE_MODE == 'cosmosdb':
    try:
        from db.cosmos_client import cosmos_db
    except Exception as e:
        print(f"No se pudo importar CosmosDB client: {e}")
        sys.exit(1)

    sesiones = cosmos_db.listar_sesiones()
    count = 0
    for s in sesiones:
        if not s.get('created_by'):
            s['created_by'] = DEFAULT_OWNER
            try:
                cosmos_db.actualizar_sesion(s['id'], s)
                count += 1
            except Exception as e:
                print(f"Error actualizando sesion {s.get('id')}: {e}")
    print(f"Sesiones actualizadas en CosmosDB: {count}")
else:
    # JSON fallback
    DATA_FILE = Path(__file__).parent.parent / 'app' / 'data' / 'sesiones.json'
    if not DATA_FILE.exists():
        print(f"Archivo no encontrado: {DATA_FILE}")
        sys.exit(1)
    import json
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        sesiones = json.load(f)
    updated = 0
    for s in sesiones:
        if not s.get('created_by'):
            s['created_by'] = DEFAULT_OWNER
            updated += 1
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(sesiones, f, ensure_ascii=False, indent=2)
    print(f"Sesiones actualizadas en JSON: {updated}")
