import qrcode
from io import BytesIO
from datetime import datetime, timedelta, timezone
from core.config import settings

def get_colombia_now() -> datetime:
    """Retorna la fecha y hora actual en Colombia (UTC-5)"""
    return datetime.now(timezone(timedelta(hours=-5)))

def generar_qr_dinamico(link: str) -> bytes:
    """
    Genera un código QR dinámicamente y retorna los bytes de la imagen.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(link)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return buffered.getvalue()
