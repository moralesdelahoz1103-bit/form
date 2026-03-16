import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistroMain from './pages/asistente/registro/RegistroMain';
import TalentoHumano from './pages/talento/TalentoHumano';
import Login from './pages/auth/Login';
import AccesoDenegado from './pages/auth/AccesoDenegado';
import ProtectedRoute from './auth/ProtectedRoute';
import './assets/styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registro" element={<RegistroMain />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth-success" element={<Login />} />
        <Route path="/acceso-denegado" element={<AccesoDenegado />} />
        <Route
          path="/talento-humano"
          element={
            <ProtectedRoute>
              <TalentoHumano />
            </ProtectedRoute>
          }
        />
        <Route path="/talento" element={<Navigate to="/talento-humano" replace />} />
        <Route path="/" element={<Navigate to="/talento-humano" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const NotFound = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '24px'
  }}>
    <h1 style={{ fontSize: '72px', margin: 0 }}>404</h1>
    <p style={{ fontSize: '24px', color: 'var(--text-light)' }}>Página no encontrada</p>
    <a href="/" style={{
      marginTop: '24px',
      padding: '12px 28px',
      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
      color: 'white',
      textDecoration: 'none',
      borderRadius: 'var(--radius-md)',
      fontWeight: 600
    }}>
      Volver al inicio
    </a>
  </div>
);

export default App;
