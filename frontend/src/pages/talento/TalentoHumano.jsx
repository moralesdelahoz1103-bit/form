import React, { useState, useEffect } from 'react';
import { Header } from '../../components/common';
import {
  MenuLateral,
  CrearCapacitacion,
  SesionesRegistradas,
  VerAsistentes,
  Seguimiento,
  Estadisticas,
  Configuracion
} from '../../components/talento';
import CentroAyuda from '../ayuda/CentroAyuda';
import { sesionesService } from '../../services/sesiones';
import './TalentoHumano.css';

const TalentoHumano = () => {
  // Inicializar vista activa desde localStorage para persistencia tras recarga
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('th_active_view') || 'crear';
  });

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.rol || 'Usuario';
  const restrictedViews = ['seguimiento', 'estadisticas'];

  // Guardar vista activa en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('th_active_view', activeView);
  }, [activeView]);

  // Prefetch de sesiones al cargar la app para que el módulo no tenga que esperar
  useEffect(() => {
    sesionesService.listar().catch(() => { }); // Popula el caché, ignorar errores silenciosamente
  }, []);

  // Validar acceso por rol a la vista actual
  useEffect(() => {
    if (userRole !== 'Administrador' && restrictedViews.includes(activeView)) {
      setActiveView('crear');
    }
  }, [activeView, userRole]);

  const renderView = () => {
    switch (activeView) {
      case 'crear':
        return <CrearCapacitacion />;
      case 'sesiones':
        return <SesionesRegistradas />;
      case 'asistentes':
        return <VerAsistentes />;
      case 'seguimiento':
        return <Seguimiento />;
      case 'estadisticas':
        return <Estadisticas />;
      case 'ayuda':
        return <CentroAyuda />;
      case 'configuracion':
        return <Configuracion />;
      default:
        return <CrearCapacitacion />;
    }
  };

  return (
    <div className="talento-page">
      <Header
        activeView={activeView}
        onModuleChange={setActiveView}
        onConfigClick={() => setActiveView('configuracion')}
      />

      <div className="talento-layout">
        <MenuLateral
          activeView={activeView}
          onViewChange={setActiveView}
          onConfigClick={() => setActiveView('configuracion')}
        />

        <main className="talento-content">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default TalentoHumano;
