import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loading from '../components/common/Loading';
import logo_fsdverde from '../assets/img/logo_fsdverde.png';
import { config } from '../utils/constants';
import { getAuthToken, setAuthToken, setUserInfo, clearAuth } from '../utils/auth';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);

  // Verificar si ya está autenticado
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Verificar si el token es válido
      verifyToken(token);
    }
  }, []);

  // Manejar el token recibido después del callback
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setAuthToken(token);
      // Obtener información del usuario
      fetchUserInfo(token);
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        navigate('/talento-humano', { replace: true });
      } else {
        // Token inválido, limpiar
        clearAuth();
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      clearAuth();
    }
  };

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Usuario autenticado por Microsoft y auto-registrado en el backend
        // El backend ya se encargó del registro en el callback
        setUserInfo(userData);
        navigate('/talento-humano', { replace: true });
      } else {
        setError({
          message: 'Error al obtener información del usuario',
          help: 'Por favor, intenta iniciar sesión nuevamente.'
        });
        clearAuth();
      }
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      setError({
        message: 'Error de conexión',
        help: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      });
      clearAuth();
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      // Redirigir al endpoint de autenticación del backend
      window.location.href = `${config.apiUrl}/api/auth/login`;
    } catch (error) {
      console.error('Error en login Microsoft:', error);
      setIsLoggingIn(false);
      setError({
        message: 'Error al iniciar sesión con Microsoft',
        help: 'Si persiste el problema, contacta al administrador.'
      });
    }
  };

  if (isLoggingIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading />
        <div style={{ marginLeft: '16px', textAlign: 'center' }}>
          <p>Conectando con Microsoft...</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>Redirigiendo a la página de inicio de sesión</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo_fsdverde} alt="Fundación Santo Domingo" className="login-logo" />
        <h1>FORMATO ASISTENCIA A FOMACIONES Y EVENTOS</h1>
        <p>Ingresa para digilenciar una formación o evento</p>
        
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fca5a5', 
            color: '#dc2626', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '16px',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>{error.message}</div>
            <div style={{ 
              fontSize: '12px', 
              marginTop: '12px', 
              color: '#7f1d1d',
              whiteSpace: 'pre-line',
              lineHeight: '1.6',
              background: '#fff',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #fecaca'
            }}>
              {error.help}
            </div>
          </div>
        )}
        
        <button 
          className="btn-microsoft" 
          onClick={handleMicrosoftLogin}
          disabled={isLoggingIn}
          style={{
            background: isLoggingIn ? '#ccc' : '#0078d4',
            borderColor: isLoggingIn ? '#ccc' : '#0078d4',
            opacity: isLoggingIn ? 0.7 : 1,
            cursor: isLoggingIn ? 'not-allowed' : 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden="true">
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          Iniciar sesión con Microsoft
        </button>
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          <p>Usa tu cuenta corporativa de Microsoft</p>
          <p style={{ marginTop: '4px' }}>@fundacionsantodomingo.org</p>
        </div>
        
        <p className="login-hint">Fundación Santo Domingo</p>
      </div>
    </div>
  );
};

export default Login;