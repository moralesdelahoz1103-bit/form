import React from 'react';
import BrandSpinner from '../BrandSpinner/BrandSpinner';
import './Loading.css';

const Loading = ({ size = 'md', fullScreen = false, text }) => {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <BrandSpinner size={size} />
        {text && <p className="loading-text">{text}</p>}
      </div>
    );
  }

  return (
    <div className="loading-container">
      <BrandSpinner size={size} />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default Loading;
