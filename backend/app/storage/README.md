Storage adapters

- `LocalStorage`: guarda archivos en `backend/uploads/qr_codes` y `backend/uploads/firmas`.
- `AzureBlobStorage`: guarda archivos en contenedores de Azure Blob (`qr-codes`, `firmas`).

Para cambiar entre modos, ajustar en `backend/.env` la variable `BLOB_STORAGE_MODE=local|azure`.
