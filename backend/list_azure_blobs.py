"""
Script para explorar el contenido de Azure Blob Storage
sin necesidad de acceder al Azure Portal.

Uso:
    python list_azure_blobs.py
"""

from azure.storage.blob import BlobServiceClient
from datetime import datetime
import os
from dotenv import load_dotenv
import pytz

# Cargar variables de entorno
load_dotenv()

# Timezone de Colombia
colombia_tz = pytz.timezone('America/Bogota')

def format_datetime_colombia(utc_datetime):
    """Convierte datetime UTC a hora colombiana"""
    if utc_datetime.tzinfo is None:
        utc_datetime = pytz.utc.localize(utc_datetime)
    colombia_time = utc_datetime.astimezone(colombia_tz)
    return colombia_time.strftime('%Y-%m-%d %H:%M:%S COT')

# Obtener connection string del .env
connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')

if not connection_string:
    print("❌ Error: AZURE_STORAGE_CONNECTION_STRING no está configurado en .env")
    exit(1)

# Conectar a Azure
blob_service_client = BlobServiceClient.from_connection_string(connection_string)
container_name = "formatoformacionesoeventos"

print("=" * 80)
print("📦 EXPLORADOR DE AZURE BLOB STORAGE")
print("=" * 80)
print(f"\nCuenta: {blob_service_client.account_name}")
print(f"Contenedor: {container_name}\n")

try:
    # Obtener el contenedor
    container_client = blob_service_client.get_container_client(container_name)
    
    # Listar todos los blobs
    blobs = list(container_client.list_blobs())
    
    if not blobs:
        print("⚠️  El contenedor está vacío. Aún no se han subido archivos.\n")
        exit(0)
    
    # Organizar por estructura nueva
    # Nueva estructura: Creator/Training/QR_Training.png o Creator/Training/Firmas/Firma_Person.png
    qr_blobs = []
    firma_blobs = []
    old_structure_blobs = []
    
    for blob in blobs:
        if blob.name.startswith('QRS/') or blob.name.startswith('firma/'):
            # Estructura antigua
            old_structure_blobs.append(blob)
        elif '/Firmas/' in blob.name:
            # Nueva estructura - Firma
            firma_blobs.append(blob)
        elif blob.name.endswith('.png') and '/QR_' in blob.name:
            # Nueva estructura - QR
            qr_blobs.append(blob)
        else:
            # Otros archivos
            old_structure_blobs.append(blob)
    
    print(f"📊 RESUMEN")
    print("-" * 80)
    print(f"Total de archivos: {len(blobs)}")
    print(f"  • Códigos QR: {len(qr_blobs)}")
    print(f"  • Firmas: {len(firma_blobs)}")
    if old_structure_blobs:
        print(f"  • Estructura antigua: {len(old_structure_blobs)}")
    print()
    
    # Organizar por creador y capacitación
    trainings = {}
    for blob in blobs:
        parts = blob.name.split('/')
        if len(parts) >= 2:
            creator = parts[0]
            training = parts[1]
            key = f"{creator}/{training}"
            
            if key not in trainings:
                trainings[key] = {
                    'creator': creator,
                    'training': training,
                    'qr': None,
                    'firmas': []
                }
            
            if '/Firmas/' in blob.name:
                trainings[key]['firmas'].append(blob)
            elif 'QR_' in blob.name:
                trainings[key]['qr'] = blob
    
    # Mostrar por capacitación
    if trainings:
        print("📚 CAPACITACIONES")
        print("-" * 80)
        for key, data in sorted(trainings.items()):
            print(f"\n👤 Creador: {data['creator']}")
            print(f"📖 Capacitación: {data['training']}")
            print(f"   └─ Carpeta: {key}/")
            
            if data['qr']:
                size_kb = data['qr'].size / 1024
                modified = format_datetime_colombia(data['qr'].last_modified)
                print(f"      🔲 QR: {data['qr'].name.split('/')[-1]}")
                print(f"         Tamaño: {size_kb:.2f} KB | Modificado: {modified}")
            
            if data['firmas']:
                print(f"      ✍️  Firmas ({len(data['firmas'])})")
                for firma in sorted(data['firmas'], key=lambda x: x.last_modified, reverse=True):
                    size_kb = firma.size / 1024
                    modified = format_datetime_colombia(firma.last_modified)
                    firma_name = firma.name.split('/')[-1]
                    print(f"         • {firma_name}")
                    print(f"           {size_kb:.2f} KB | {modified}")
        print()
    
    # Mostrar archivos de estructura antigua si existen
    if old_structure_blobs:
        print("⚠️  ARCHIVOS CON ESTRUCTURA ANTIGUA")
        print("-" * 80)
        for blob in sorted(old_structure_blobs, key=lambda x: x.last_modified, reverse=True):
            size_kb = blob.size / 1024
            modified = format_datetime_colombia(blob.last_modified)
            print(f"📄 {blob.name}")
            print(f"   Tamaño: {size_kb:.2f} KB | Modificado: {modified}")
        print()
    
    # Estadísticas adicionales
    total_size = sum(b.size for b in blobs) / (1024 * 1024)  # MB
    print("=" * 80)
    print(f"💾 Espacio total usado: {total_size:.2f} MB")
    print(f"📁 Capacitaciones: {len(trainings)}")
    print("=" * 80)
    
    # Mostrar listado completo de todos los archivos
    print("\n📋 LISTADO COMPLETO DE ARCHIVOS")
    print("=" * 80)
    for blob in sorted(blobs, key=lambda x: x.name):
        size_kb = blob.size / 1024
        modified = format_datetime_colombia(blob.last_modified)
        print(f"📄 {blob.name}")
        print(f"   {size_kb:.2f} KB | {modified}")
    print("=" * 80)
    
except Exception as e:
    print(f"❌ Error al conectar con Azure Storage: {str(e)}")
    print("\nVerifica que:")
    print("  1. El AZURE_STORAGE_CONNECTION_STRING sea correcto")
    print("  2. Tengas conexión a internet")
    print("  3. El contenedor 'formatoformacionesoeventos' exista")
