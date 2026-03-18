import React, { useEffect, useRef, useState } from 'react';
import './HelpTooltip.css';

const HelpTooltip = ({ title = 'Ayuda', items = [], icon = '?' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState('top-right');
  const wrapperRef = useRef(null);
  const bubbleRef = useRef(null);

  const updatePlacement = () => {
    if (!wrapperRef.current || !bubbleRef.current) return;

    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const bubbleRect = bubbleRef.current.getBoundingClientRect();

    const bubbleWidth = bubbleRect.width || 380;
    const bubbleHeight = bubbleRect.height || 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceTop = triggerRect.top;
    const spaceBottom = viewportHeight - triggerRect.bottom;

    const vertical = (spaceTop >= bubbleHeight + 20 || spaceTop > spaceBottom) ? 'top' : 'bottom';

    // Para decidir si alinear a la izquierda o derecha del trigger
    // canAlignRight: el bubble cabe a la IZQUIERDA del botón (estando pegado a su derecha)
    const canAlignRight = triggerRect.right >= bubbleWidth + 10;
    // canAlignLeft: el bubble cabe a la DERECHA del botón (estando pegado a su izquierda)
    const canAlignLeft = (viewportWidth - triggerRect.left) >= bubbleWidth + 10;

    let horizontal = 'left'; // Preferimos crecer a la derecha por defecto en LTR
    if (canAlignLeft) {
      horizontal = 'left';
    } else if (canAlignRight) {
      horizontal = 'right';
    } else {
      horizontal = 'center';
    }

    setPlacement(`${vertical}-${horizontal}`);
  };

  useEffect(() => {
    if (!isOpen) return;

    const frameId = window.requestAnimationFrame(updatePlacement);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  const openTooltip = () => setIsOpen(true);
  const closeTooltip = () => setIsOpen(false);

  const handleBlur = (event) => {
    if (!wrapperRef.current?.contains(event.relatedTarget)) {
      closeTooltip();
    }
  };

  const handleToggle = (event) => {
    event.preventDefault();
    setIsOpen(prev => !prev);
  };

  return (
    <span
      ref={wrapperRef}
      className={`help-tooltip ${isOpen ? 'is-open' : ''}`}
      onMouseEnter={openTooltip}
      onMouseLeave={closeTooltip}
    >
      <button
        type="button"
        className="help-tooltip-icon"
        aria-label={`Ver ayuda de ${title}`}
        aria-expanded={isOpen}
        onFocus={openTooltip}
        onBlur={handleBlur}
        onClick={handleToggle}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </button>
      <span ref={bubbleRef} className={`help-tooltip-bubble ${placement}`} role="tooltip">
        <strong className="help-tooltip-title">{title}</strong>
        <ul className="help-tooltip-list">
          {items.map((item) => (
            <li key={item.term}>
              <span className="help-tooltip-term">{item.term}:</span> {item.description}
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
};

export default HelpTooltip;
