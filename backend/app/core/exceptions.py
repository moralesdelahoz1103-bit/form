from fastapi import HTTPException, status

class TokenNotFoundException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token no encontrado"
        )

class TokenExpiredException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_410_GONE,
            detail="El token ha expirado"
        )

class TokenInactiveException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El token está inactivo"
        )

class DuplicateRegistrationException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta cédula ya está registrada en esta capacitación"
        )

class InvalidEmailDomainException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo debe ser del dominio @fundacionsantodomingo.org"
        )

class InvalidFileException(HTTPException):
    def __init__(self, message: str = "Archivo inválido"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
