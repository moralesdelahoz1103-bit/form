import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import './FirmaCanvas.css';

const FirmaCanvas = ({ onChange, error }) => {
  const sigCanvas = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const setCanvasSize = () => {
      if (sigCanvas.current) {
        const wrapper = sigCanvas.current.getCanvas().parentElement;
        const canvas = sigCanvas.current.getCanvas();
        const width = wrapper.offsetWidth;
        const height = width * 0.4; // proporción 5:2
        // Ajustar tamaño real del canvas
        canvas.width = width;
        canvas.height = height;
        // Ajustar tamaño visual (CSS)
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
      }
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    return () => window.removeEventListener('resize', setCanvasSize);
  }, []);

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      onChange('');
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      const canvas = sigCanvas.current.getCanvas();
      
      // Verificar si el canvas realmente tiene contenido
      const context = canvas.getContext('2d');
      const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;
      
      // Buscar píxeles no blancos
      let hasContent = false;
      for (let i = 0; i < pixelData.length; i += 4) {
        if (pixelData[i] < 255 || pixelData[i+1] < 255 || pixelData[i+2] < 255) {
          hasContent = true;
          break;
        }
      }
      
      setIsEmpty(!hasContent);
      onChange(hasContent ? dataURL : '');
    }
  };

  return (
    <div className="firma-container">
      <label className="firma-label">
        Firma Digital <span className="required">*</span>
      </label>
      <div className={`firma-canvas-wrapper ${error ? 'firma-error' : ''}`}>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'firma-canvas'
          }}
          onEnd={handleEnd}
        />
        {isEmpty && (
          <div className="firma-placeholder">
            Dibuje su firma aquí
          </div>
        )}
      </div>
      <div className="firma-actions">
        <button type="button" onClick={clear} className="btn-clear-firma">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          Limpiar firma
        </button>
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FirmaCanvas;
