import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../utils/constants';
import { tienePermiso } from '../utils/permisos';
import { getAuthToken } from '../utils/auth';
import Loading from '../components/common/Loading';
import Toast from '../components/common/Toast';
import Button from '../components/common/Button';
import './CentroAyuda.css';

const CentroAyuda = () => {
  const navigate = useNavigate();
  const [contenido, setContenido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaExpandida, setCategoriaExpandida] = useState({});
  const [tarjetaExpandida, setTarjetaExpandida] = useState({});
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [contenidoEditado, setContenidoEditado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const manejarErrorAuth = (response) => {
    if (response.status === 401) {
      setToast({ message: 'Sesión expirada. Por favor inicia sesión nuevamente.', type: 'error' });
      setTimeout(() => navigate('/login'), 2000);
      return true;
    }
    return false;
  };

  useEffect(() => {
    cargarContenido();
    verificarPermisos();
  }, []);

  const verificarPermisos = async () => {
    const puede = await tienePermiso('modificar_permisos');
    setPuedeEditar(puede);
  };

  const cargarContenido = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setToast({ message: 'No se encontró token de autenticación', type: 'error' });
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await fetch(`${config.apiUrl}/api/ayuda`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (manejarErrorAuth(response)) return;
      
      if (!response.ok) throw new Error('Error al cargar el contenido');
      
      const data = await response.json();
      setContenido(data);
      setContenidoEditado(JSON.parse(JSON.stringify(data)));
      
      if (data.categorias?.length > 0) {
        setCategoriaExpandida({ [data.categorias[0].id]: true });
      }
    } catch (error) {
      console.error('Error cargando centro de ayuda:', error);
      setToast({ message: 'Error al cargar el centro de ayuda', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = () => {
    setContenidoEditado(JSON.parse(JSON.stringify(contenido)));
    setModoEdicion(true);
  };

  const cancelarEdicion = () => {
    setContenidoEditado(JSON.parse(JSON.stringify(contenido)));
    setModoEdicion(false);
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setToast({ message: 'No se encontró token de autenticación', type: 'error' });
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await fetch(`${config.apiUrl}/api/ayuda`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contenidoEditado.categorias)
      });

      if (manejarErrorAuth(response)) return;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errorData);
        throw new Error(errorData.detail || 'Error al guardar');
      }
      
      const data = await response.json();
      setContenido(data);
      setContenidoEditado(JSON.parse(JSON.stringify(data)));
      setModoEdicion(false);
      setToast({ message: 'Cambios guardados exitosamente', type: 'success' });
    } catch (error) {
      console.error('Error guardando cambios:', error);
      setToast({ message: error.message || 'Error al guardar los cambios', type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const agregarCategoria = () => {
    const nuevaCategoria = {
      id: `cat_${Date.now()}`,
      nombre: 'Nueva Categoría',
      icono: 'folder',
      orden: contenidoEditado.categorias.length + 1,
      tarjetas: []
    };
    setContenidoEditado({
      ...contenidoEditado,
      categorias: [...contenidoEditado.categorias, nuevaCategoria]
    });
  };

  const eliminarCategoria = (categoriaId) => {
    if (!window.confirm('¿Eliminar esta categoría y todas sus tarjetas?')) return;
    setContenidoEditado({
      ...contenidoEditado,
      categorias: contenidoEditado.categorias.filter(c => c.id !== categoriaId)
    });
  };

  const agregarTarjeta = (categoriaId) => {
    const nuevaTarjeta = {
      id: `tar_${Date.now()}`,
      pregunta: '¿Nueva pregunta?',
      respuesta: 'Nueva respuesta',
      orden: 1,
      visible: true
    };
    setContenidoEditado({
      ...contenidoEditado,
      categorias: contenidoEditado.categorias.map(cat => 
        cat.id === categoriaId 
          ? { ...cat, tarjetas: [...cat.tarjetas, nuevaTarjeta] }
          : cat
      )
    });
  };

  const eliminarTarjeta = (categoriaId, tarjetaId) => {
    if (!window.confirm('¿Eliminar esta tarjeta de ayuda?')) return;
    setContenidoEditado({
      ...contenidoEditado,
      categorias: contenidoEditado.categorias.map(cat => 
        cat.id === categoriaId 
          ? { ...cat, tarjetas: cat.tarjetas.filter(t => t.id !== tarjetaId) }
          : cat
      )
    });
  };

  const actualizarCategoria = (categoriaId, campo, valor) => {
    setContenidoEditado({
      ...contenidoEditado,
      categorias: contenidoEditado.categorias.map(cat => 
        cat.id === categoriaId ? { ...cat, [campo]: valor } : cat
      )
    });
  };

  const actualizarTarjeta = (categoriaId, tarjetaId, campo, valor) => {
    setContenidoEditado({
      ...contenidoEditado,
      categorias: contenidoEditado.categorias.map(cat => 
        cat.id === categoriaId 
          ? {
              ...cat,
              tarjetas: cat.tarjetas.map(tar => 
                tar.id === tarjetaId ? { ...tar, [campo]: valor } : tar
              )
            }
          : cat
      )
    });
  };

  const toggleCategoria = (categoriaId) => {
    setCategoriaExpandida(prev => ({
      ...prev,
      [categoriaId]: !prev[categoriaId]
    }));
  };

  const toggleTarjeta = (tarjetaId) => {
    setTarjetaExpandida(prev => ({
      ...prev,
      [tarjetaId]: !prev[tarjetaId]
    }));
  };

  const resaltarTexto = (texto, termino) => {
    if (!termino.trim()) return texto;
    
    const regex = new RegExp(`(${termino})`, 'gi');
    const partes = texto.split(regex);
    
    return partes.map((parte, i) => 
      regex.test(parte) ? <mark key={i}>{parte}</mark> : parte
    );
  };

  const filtrarTarjetas = () => {
    const datos = modoEdicion ? contenidoEditado : contenido;
    if (!datos?.categorias) return [];
    if (!busqueda.trim()) return datos.categorias;

    const terminoBusqueda = busqueda.toLowerCase();
    
    return datos.categorias
      .map(categoria => ({
        ...categoria,
        tarjetas: categoria.tarjetas.filter(tarjeta => 
          (modoEdicion || tarjeta.visible) &&
          (tarjeta.pregunta.toLowerCase().includes(terminoBusqueda) ||
           tarjeta.respuesta.toLowerCase().includes(terminoBusqueda))
        )
      }))
      .filter(categoria => categoria.tarjetas.length > 0);
  };

  if (loading) {
    return (
      <div className="centro-ayuda">
        <Loading />
      </div>
    );
  }

  const categoriasFiltradas = filtrarTarjetas();

  return (
    <div className="centro-ayuda">
      <div className="page-header">
        <div>
          <h1 className="page-title">Centro de Ayuda</h1>
          <p className="page-subtitle">
            Encuentra respuestas a tus preguntas sobre el sistema de registro de asistencia
          </p>
        </div>
        {puedeEditar && (
          <div className="header-actions">
            {!modoEdicion ? (
              <Button onClick={iniciarEdicion} variant="secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar Contenido
              </Button>
            ) : (
              <div className="edit-actions">
                <Button onClick={agregarCategoria} variant="primary">
                  + Agregar Categoría
                </Button>
                <Button onClick={guardarCambios} variant="primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Guardar Cambios
                    </>
                  )}
                </Button>
                <Button onClick={cancelarEdicion} variant="secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="search-box">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Buscar en el centro de ayuda..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
          {busqueda && (
            <button 
              className="clear-search"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {categoriasFiltradas.length === 0 ? (
          <div className="no-results">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <div className="categorias-list">
            {categoriasFiltradas.map(categoria => (
              <div key={categoria.id} className="categoria-section">
                <div className="categoria-header-wrapper">
                  {modoEdicion ? (
                    <div className="categoria-edit-mode">
                      <input
                        type="text"
                        value={categoria.nombre}
                        onChange={(e) => actualizarCategoria(categoria.id, 'nombre', e.target.value)}
                        className="edit-input-title"
                      />
                      <div className="categoria-actions">
                        <button
                          onClick={() => agregarTarjeta(categoria.id)}
                          className="btn-icon-success"
                          title="Agregar tarjeta"
                        >
                          + Tarjeta
                        </button>
                        <button
                          onClick={() => eliminarCategoria(categoria.id)}
                          className="btn-icon-danger"
                          title="Eliminar categoría"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                        <button
                          className="btn-icon-toggle"
                          onClick={() => toggleCategoria(categoria.id)}
                        >
                          <svg
                            className={`chevron ${categoriaExpandida[categoria.id] ? 'expanded' : ''}`}
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="categoria-header"
                      onClick={() => toggleCategoria(categoria.id)}
                    >
                      <div className="categoria-title">
                        <h2>{categoria.nombre}</h2>
                        <span className="tarjetas-count">
                          {categoria.tarjetas.length} {categoria.tarjetas.length === 1 ? 'artículo' : 'artículos'}
                        </span>
                      </div>
                      <svg
                        className={`chevron ${categoriaExpandida[categoria.id] ? 'expanded' : ''}`}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  )}
                </div>

                {categoriaExpandida[categoria.id] && (
                  <div className="tarjetas-list">
                    {categoria.tarjetas.map(tarjeta => (
                      <div key={tarjeta.id} className="tarjeta-item">
                        {modoEdicion ? (
                          <div className="tarjeta-edit-mode">
                            <div className="tarjeta-edit-header">
                              <input
                                type="text"
                                value={tarjeta.pregunta}
                                onChange={(e) => actualizarTarjeta(categoria.id, tarjeta.id, 'pregunta', e.target.value)}
                                className="edit-input-question"
                                placeholder="Pregunta"
                              />
                              <button
                                onClick={() => eliminarTarjeta(categoria.id, tarjeta.id)}
                                className="btn-icon-danger-small"
                                title="Eliminar tarjeta"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              </button>
                            </div>
                            <textarea
                              value={tarjeta.respuesta}
                              onChange={(e) => actualizarTarjeta(categoria.id, tarjeta.id, 'respuesta', e.target.value)}
                              className="edit-textarea"
                              placeholder="Respuesta"
                              rows="5"
                            />
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={tarjeta.visible}
                                onChange={(e) => actualizarTarjeta(categoria.id, tarjeta.id, 'visible', e.target.checked)}
                              />
                              <span>Visible para usuarios</span>
                            </label>
                          </div>
                        ) : (
                          <>
                            <button
                              className="tarjeta-header"
                              onClick={() => toggleTarjeta(tarjeta.id)}
                            >
                              <h3 className="tarjeta-pregunta">
                                {resaltarTexto(tarjeta.pregunta, busqueda)}
                              </h3>
                              <svg
                                className={`chevron-tarjeta ${tarjetaExpandida[tarjeta.id] ? 'expanded' : ''}`}
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                            {tarjetaExpandida[tarjeta.id] && (
                              <div className="tarjeta-respuesta">
                                {resaltarTexto(tarjeta.respuesta, busqueda)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default CentroAyuda;
