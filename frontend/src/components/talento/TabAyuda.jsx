import { useState, useEffect } from 'react';
import './TabAyuda.css';
import { config } from '../../utils/constants';

const TabAyuda = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState(new Set());

  useEffect(() => {
    cargarAyuda();
  }, []);

  const cargarAyuda = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${config.apiUrl}/api/ayuda`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategorias(data.categorias || []);
      }
    } catch (error) {
      console.error('Error cargando centro de ayuda:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (categoriaId, tarjetaId) => {
    const cardKey = `${categoriaId}-${tarjetaId}`;
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardKey)) {
        newSet.delete(cardKey);
      } else {
        newSet.add(cardKey);
      }
      return newSet;
    });
  };

  const isCardExpanded = (categoriaId, tarjetaId) => {
    return expandedCards.has(`${categoriaId}-${tarjetaId}`);
  };

  const highlightText = (text, search) => {
    if (!search.trim()) return text;
    
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={index} className="search-highlight">{part}</span>
      ) : (
        part
      )
    );
  };

  // Filtrar categorías y tarjetas según búsqueda
  const categoriasFiltradas = searchTerm.trim() === '' 
    ? categorias 
    : categorias.map(categoria => ({
        ...categoria,
        tarjetas: categoria.tarjetas.filter(tarjeta =>
          tarjeta.visible &&
          (tarjeta.pregunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tarjeta.respuesta.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      })).filter(categoria => categoria.tarjetas.length > 0);

  const totalResultados = categoriasFiltradas.reduce(
    (sum, cat) => sum + cat.tarjetas.length, 
    0
  );

  const getIcono = (iconName) => {
    const iconos = {
      calendar: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      users: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      'user-cog': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <path d="M20 8v6M23 11h-6"></path>
        </svg>
      ),
      shield: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      'life-ring': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="4"></circle>
          <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
          <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
          <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
          <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
          <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
        </svg>
      )
    };
    return iconos[iconName] || iconos.calendar;
  };

  if (loading) {
    return (
      <div className="ayuda-loading">
        <div className="ayuda-loading-spinner"></div>
        <p>Cargando centro de ayuda...</p>
      </div>
    );
  }

  return (
    <div className="tab-ayuda-container">
      <div className="tab-ayuda-header">
        <h3>Centro de ayuda</h3>
        <p>Encuentra respuestas a las preguntas más frecuentes</p>
      </div>

      {/* Búsqueda */}
      <div className="ayuda-search-box">
        <svg className="ayuda-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          placeholder="Buscar en el centro de ayuda..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className="ayuda-clear-search"
            onClick={() => setSearchTerm('')}
            title="Limpiar búsqueda"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {searchTerm.trim() && (
        <div className="ayuda-search-results">
          {totalResultados > 0 ? (
            <>Se encontraron <strong>{totalResultados}</strong> resultado{totalResultados !== 1 ? 's' : ''}</>
          ) : (
            'No se encontraron resultados'
          )}
        </div>
      )}

      {/* Categorías */}
      {categoriasFiltradas.length === 0 ? (
        <div className="ayuda-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <h3>No se encontraron resultados</h3>
          <p>Intenta con otros términos de búsqueda</p>
        </div>
      ) : (
        <div className="ayuda-categorias">
          {categoriasFiltradas.map((categoria) => (
            <div key={categoria.id} className="ayuda-categoria">
              <div className="ayuda-categoria-header">
                <div className="categoria-icono">
                  {getIcono(categoria.icono)}
                </div>
                <div className="categoria-info">
                  <h4>{categoria.nombre}</h4>
                  <span className="badge">
                    {categoria.tarjetas.length} {categoria.tarjetas.length === 1 ? 'artículo' : 'artículos'}
                  </span>
                </div>
              </div>

              <div className="ayuda-tarjetas">
                {categoria.tarjetas.map((tarjeta) => (
                  <div
                    key={tarjeta.id}
                    className={`ayuda-tarjeta ${isCardExpanded(categoria.id, tarjeta.id) ? 'expanded' : ''}`}
                  >
                    <div
                      className="tarjeta-pregunta"
                      onClick={() => toggleCard(categoria.id, tarjeta.id)}
                    >
                      <h5 className="pregunta-texto">
                        {highlightText(tarjeta.pregunta, searchTerm)}
                      </h5>
                      <div className="pregunta-icono">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </div>
                    <div className="tarjeta-respuesta">
                      <div className="respuesta-contenido">
                        {highlightText(tarjeta.respuesta, searchTerm)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabAyuda;
