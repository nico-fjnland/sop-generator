import React from 'react';
import { useZoom } from '../contexts/ZoomContext';

const ZoomWrapper = ({ children }) => {
  const { zoom } = useZoom();
  const scale = zoom / 100;

  return (
    <div
      id="zoom-wrapper"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.2s ease-out',
        width: '100%',
        minHeight: '100%',
      }}
    >
      {children}
    </div>
  );
};

export default ZoomWrapper;

