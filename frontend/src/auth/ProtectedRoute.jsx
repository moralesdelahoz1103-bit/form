import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Loading from '../components/common/Loading';
import { config } from '../utils/constants';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = verificando
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    const token = localStorage.getItem('authToken');
    
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
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setIsAuthenticated(true);
      } else {
        // Token inválido
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
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

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    console.log('Usuario no autenticado, redirigiendo al login');
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado, mostrar contenido protegido
  return children;
};

export default ProtectedRoute;
