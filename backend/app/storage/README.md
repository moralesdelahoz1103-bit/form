# adaptadores de almacenamiento

el sistema permite gestionar archivos mediante dos adaptadores principales:

- `localstorage`: guarda los archivos en el servidor local dentro de las carpetas `backend/uploads/qr_codes` y `backend/uploads/firmas`.
- `azureblobstorage`: gestiona los archivos en contenedores de azure blob storage (`qr-codes` y `firmas`).

para cambiar entre modos, se debe ajustar en el archivo `backend/.env` la variable `blob_storage_mode` con los valores `local` o `azure`.
