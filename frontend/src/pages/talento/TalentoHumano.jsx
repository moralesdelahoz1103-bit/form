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
  const [activeView, setActiveView] = useState('crear');

  // Prefetch de sesiones al cargar la app para que el módulo no tenga que esperar
  useEffect(() => {
    sesionesService.listar().catch(() => { }); // Popula el caché, ignorar errores silenciosamente
  }, []);

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
