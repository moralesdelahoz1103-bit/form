import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Loading from '../components/common/Loading';
import { config } from '../utils/constants';
import { getAuthToken, clearAuth, setUserInfo } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = verificando
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    const token = getAuthToken();
    
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      // Verificar token con el backend
      const response = await fetch(`${config.apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Usuario autenticado con Microsoft, permitir acceso
        setUserInfo(userData);
        setIsAuthenticated(true);
      } else {
        // Token inválido
        clearAuth();
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      clearAuth();
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading durante verificación
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading />
        <p style={{ marginLeft: '16px' }}>Verificando autenticación...</p>
      </div>
    );
  }

  // Si hay una redirección específica (acceso denegado)
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    console.log('Usuario no autenticado, redirigiendo al login');
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado, mostrar contenido protegido
  return children;
};

export default ProtectedRoute;
