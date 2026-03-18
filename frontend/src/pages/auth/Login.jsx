import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loading } from '../../components/common';
import logo_fsd from '../../assets/img/logo_fsd.png';
import { config } from '../../utils/constants';
import { getAuthToken, setAuthToken, setUserInfo, clearAuth } from '../../utils/auth';
import './Login.css';

/* ── Microsoft logo SVG (official squares) ──────────────────────────── */
const MicrosoftLogo = () => (
  <svg
    className="ms-logo"
    width="20"
    height="20"
    viewBox="0 0 23 23"
    aria-hidden="true"
  >
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
);

/* ── Shield icon ─────────────────────────────────────────────────────── */
const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* ── Lock icon ───────────────────────────────────────────────────────── */
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ── Users icon ──────────────────────────────────────────────────────── */
const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/* ── Info icon ───────────────────────────────────────────────────────── */
const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/* ── Alert icon ──────────────────────────────────────────────────────── */
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="login-error-icon">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════
   LOGIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [checkingInitialAuth, setCheckingInitialAuth] = useState(!!getAuthToken());
  const [error, setError] = useState(null);

  /* ── Auto-login if token exists ─── */
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      verifyToken(token);
    } else {
      setCheckingInitialAuth(false);
    }
  }, []);

  /* ── Handle callback token ─── */
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setAuthToken(token);
      fetchUserInfo(token);
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    try {
      const res = await fetch(`${config.apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        navigate('/talento-humano', { replace: true });
        // No quitamos el loading para evitar flash antes de que el router cambie
      } else {
        clearAuth();
        setCheckingInitialAuth(false);
      }
    } catch {
      clearAuth();
      setCheckingInitialAuth(false);
    }
  };

  const fetchUserInfo = async (token) => {
    try {
      setIsLoggingIn(true);
      const res = await fetch(`${config.apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUserInfo(userData);
        navigate('/talento-humano', { replace: true });
      } else {
        setError({
          message: 'Error al obtener información del usuario',
          help: 'Por favor, intenta iniciar sesión nuevamente.',
        });
        clearAuth();
        setIsLoggingIn(false);
      }
    } catch {
      setError({
        message: 'Error de conexión',
        help: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      });
      clearAuth();
      setIsLoggingIn(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      window.location.href = `${config.apiUrl}/api/auth/login`;
    } catch {
      setIsLoggingIn(false);
      setError({
        message: 'Error al iniciar sesión con Microsoft',
        help: 'Si persiste el problema, contacta al administrador.',
      });
    }
  };

  /* ── Full-screen loading while authenticating or checking initial session ─── */
  if (isLoggingIn || checkingInitialAuth) {
    return <Loading size="lg" fullScreen text={checkingInitialAuth ? "Verificando sesión" : "Conectando con Microsoft"} />;
  }

  return (
    <div className="login-page">
      <div className="login-card-horizontal">
        {/* Left Side: Branding / Visual */}
        <aside className="login-card-sidebar">
          <div className="login-sidebar-content">
            <img
              src={logo_fsd}
              alt="Fundación Santo Domingo"
              className="login-sidebar-logo"
            />
            <div className="login-sidebar-divider" />
            <h2 className="login-sidebar-title">Asistencias a <br />actividades</h2>
            <p className="login-sidebar-subtitle">
              Administra formaciones, capacitaciones y registros de asistencia de manera eficiente desde un solo lugar
            </p>

            <div className="login-sidebar-badges">
              <span className="login-badge-glass"><ShieldIcon /> SEGURO</span>
              <span className="login-badge-glass"><UsersIcon /> INTERNO</span>

            </div>
          </div>
        </aside>

        {/* Right Side: Form */}
        <main className="login-card-content">
          <div className="login-content-inner">
            <div className="login-greeting">
              <h1>Bienvenido</h1>
              <p>Inicia sesión con tu cuenta corporativa de Microsoft.</p>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <AlertIcon />
                <div className="login-error-body">
                  <span>{error.message}</span>
                  {error.help}
                </div>
              </div>
            )}

            <div className="login-action-container">
              <button
                id="btn-microsoft-login"
                className="btn-microsoft"
                onClick={handleMicrosoftLogin}
                disabled={isLoggingIn}
                aria-label="Iniciar sesión con Microsoft"
              >
                <MicrosoftLogo />
                <span>Continuar con Microsoft</span>
              </button>
            </div>

            <footer className="login-content-footer">
              © {new Date().getFullYear()} Fundación Santo Domingo
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;