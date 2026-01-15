import { useNavigate, useSearchParams } from 'react-router-dom';
import './AccesoDenegado.css';
import logo from '../assets/img/logo_fsdverde.png';
import { clearAuth } from '../utils/auth';

function AccesoDenegado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const motivo = searchParams.get('motivo') || 'no_autorizado';

  const handleCerrarSesion = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const messages = {
    no_autorizado: {
      titulo: 'Acceso no autorizado',
      subtitulo: 'Su cuenta no está registrada en el sistema',
      mensaje: 'El acceso al sistema de creacion de formulario de formacion o evento está restringido a usuarios autorizados por Talento Humano.'
    },
    inactivo: {
      titulo: 'Cuenta Inactiva',
      subtitulo: 'Su cuenta ha sido desactivada',
      mensaje: 'Su acceso al sistema ha sido suspendido temporalmente. Por favor, contacte con el administrador para más información.'
    }
  };

  const currentMessage = messages[motivo] || messages.no_autorizado;

  return (
    <div className="acceso-denegado-page">
      <div className="acceso-denegado-container">
        <div className="acceso-header">
          <img src={logo} alt="Fundación Santo Domingo" className="acceso-logo" />
        </div>

        <div className="acceso-content">
          <h1 className="acceso-titulo">{currentMessage.titulo}</h1>
          <p className="acceso-subtitulo">{currentMessage.subtitulo}</p>
          <p className="acceso-mensaje">{currentMessage.mensaje}</p>

          <div className="acceso-info-card">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Información
            </h3>
            <ul>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                El acceso al sistema de creacion de formulario de formacion o evento está restringido a usuarios autorizados por de Talento Humano.
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Para solicitar acceso, por favor contacte con el administrador del sistema.
              </li>
            </ul>
          </div>

          <div className="acceso-actions">
            <button onClick={handleCerrarSesion} className="acceso-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="acceso-footer">
          <p>¿Necesita asistencia?</p>
          <p>Departamento de Talento Humano</p>
          <p>
            <a href="mailto:talentohumano@fundacionsantodomingo.org">
              talentohumano@fundacionsantodomingo.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AccesoDenegado;
