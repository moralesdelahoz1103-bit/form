import React, { useState } from 'react';
import Header from '../components/common/Header';
import MenuLateral from '../components/talento/MenuLateral';
import CrearCapacitacion from '../components/talento/CrearCapacitacion';
import SesionesRegistradas from '../components/talento/SesionesRegistradas';
import VerAsistentes from '../components/talento/VerAsistentes';
import './TalentoHumano.css';

const TalentoHumano = () => {
  const [activeView, setActiveView] = useState('crear');

  const renderView = () => {
    switch (activeView) {
      case 'crear':
        return <CrearCapacitacion />;
      case 'sesiones':
        return <SesionesRegistradas />;
      case 'asistentes':
        return <VerAsistentes />;
      default:
        return <CrearCapacitacion />;
    }
  };

  return (
    <div className="talento-page">
      <Header />
      
      <div className="talento-layout">
        <MenuLateral activeView={activeView} onViewChange={setActiveView} />
        
        <main className="talento-content">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default TalentoHumano;
