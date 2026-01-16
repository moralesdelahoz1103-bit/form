import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import MenuLateral from '../components/talento/MenuLateral';
import CrearCapacitacion from '../components/talento/CrearCapacitacion';
import SesionesRegistradas from '../components/talento/SesionesRegistradas';
import VerAsistentes from '../components/talento/VerAsistentes';
import ConfiguracionModal from '../components/talento/ConfiguracionModal';
import CentroAyuda from './CentroAyuda';
import { tienePermiso } from '../utils/permisos';
import './TalentoHumano.css';

const TalentoHumano = () => {
  const [activeView, setActiveView] = useState('crear');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Protección: si intenta acceder a 'sesiones' sin permiso, redirigir
  useEffect(() => {
    const verificarAcceso = async () => {
      if (activeView === 'sesiones') {
        const puedeVer = await tienePermiso('ver_sesiones');
        if (!puedeVer) {
          setActiveView('crear'); // Redirigir a vista por defecto
        }
      }
    };
    verificarAcceso();
  }, [activeView]);

  const renderView = () => {
    switch (activeView) {
      case 'crear':
        return <CrearCapacitacion />;
      case 'sesiones':
        return <SesionesRegistradas />;
      case 'asistentes':
        return <VerAsistentes />;
      case 'ayuda':
        return <CentroAyuda />;
      default:
        return <CrearCapacitacion />;
    }
  };

  return (
    <div className="talento-page">
      <Header />
      
      <div className="talento-layout">
        <MenuLateral 
          activeView={activeView} 
          onViewChange={setActiveView}
          onConfigClick={() => setShowConfigModal(true)}
        />
        
        <main className="talento-content">
          {renderView()}
        </main>
      </div>

      <ConfiguracionModal 
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
};

export default TalentoHumano;
