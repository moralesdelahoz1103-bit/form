import React from 'react';
import './Loading.css';

const Loading = ({ size = 'md', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className={`loading-spinner loading-${size}`}></div>
        <p className="loading-text">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className={`loading-spinner loading-${size}`}></div>
    </div>
  );
};

export default Loading;
