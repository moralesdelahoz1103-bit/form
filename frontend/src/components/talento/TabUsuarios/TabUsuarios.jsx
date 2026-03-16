import React from 'react';
import { Toast, Loading } from '../../common';
import { useTabUsuarios } from './hooks/useTabUsuarios';
import UsuariosFiltros from './components/UsuariosFiltros';
import UsuariosTabla from './components/UsuariosTabla';

const TabUsuarios = ({ cachedData, onDataUpdate, onAdminsCountUpdate }) => {
  const {
    usuarios, loading, refreshing, ultimaActualizacion, toast, setToast,
    changingRol, permisos, verificandoPermisos,
    searchNombre, setSearchNombre, filterRol, setFilterRol,
    usuariosFiltrados, hayFiltrosActivos, limpiarFiltros,
    rolesTemporales,
    handleRefresh, handleCambiarRol, handleGuardarRol, handleDelete,
    tieneChangiosPendientes, formatearHoraActualizacion, getRoleBadge,
  } = useTabUsuarios({ cachedData, onDataUpdate });

  // Informar al padre sobre el conteo de administradores para el header
  React.useEffect(() => {
    if (onAdminsCountUpdate && usuarios) {
      const count = usuarios.filter(u => u.rol === 'Administrador').length;
      onAdminsCountUpdate(count);
    }
  }, [usuarios, onAdminsCountUpdate]);

  if (verificandoPermisos || loading) {
    return (
      <div className="tab-usuarios-loading">
        <Loading size="md" text={verificandoPermisos ? 'Verificando permisos' : 'Cargando usuarios'} />
      </div>
    );
  }

  if (!permisos.ver) {
    return (
      <div className="permisos-denegados">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
          <line x1="9" y1="12" x2="15" y2="12" />
        </svg>
        <h3>Acceso Restringido</h3>
        <p>No tienes permisos para ver la lista de usuarios.</p>
      </div>
    );
  }

  return (
    <div className="usuarios-view-wrapper">
      <div className="registro-automatico-section-minimal">
        <div className="registro-info-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00bf61" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p><strong>Importante:</strong> Los usuarios que inicien sesión con Microsoft se registran automáticamente como "Usuario".</p>
        </div>
      </div>

      <div className="roles-minimal-display">
        <span className="display-label">Roles disponibles:</span>
        <div className="display-tags">
          <div className="tag-item">
            <span className="tag-dot user"></span>
            <span className="tag-text"><strong>Usuario</strong></span>
          </div>
          <div className="tag-item">
            <span className="tag-dot admin"></span>
            <span className="tag-text"><strong>Administrador</strong></span>
          </div>
        </div>
      </div>

      <div className="actions-toolbar">
        <UsuariosFiltros
          searchNombre={searchNombre}
          setSearchNombre={setSearchNombre}
          filterRol={filterRol}
          setFilterRol={setFilterRol}
          hayFiltrosActivos={hayFiltrosActivos}
          limpiarFiltros={limpiarFiltros}
        />

        <div className="refresh-toolbar">
          <span className="texto-actualización-mini">
            {ultimaActualizacion ? formatearHoraActualizacion(ultimaActualizacion) : 'Sin actualizar'}
          </span>
          <button
            className={`btn-refresh-icon-minimal ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="Sincronizar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>

      <UsuariosTabla
        usuariosFiltrados={usuariosFiltrados}
        hayFiltrosActivos={hayFiltrosActivos}
        users={usuarios}
        rolesTemporales={rolesTemporales}
        changingRol={changingRol}
        permisos={permisos}
        getRoleBadge={getRoleBadge}
        tieneChangiosPendientes={tieneChangiosPendientes}
        handleCambiarRol={handleCambiarRol}
        handleGuardarRol={handleGuardarRol}
        handleDelete={handleDelete}
      />

      {toast.show && (
        <div className="toast-container">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: '' })}
          />
        </div>
      )}
    </div>
  );
};

export default TabUsuarios;
