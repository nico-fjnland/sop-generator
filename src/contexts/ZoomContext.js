import React, { createContext, useContext, useState } from 'react';

const ZoomContext = createContext();

// Berechnet initiale Zoomstufe basierend auf Viewport-Breite
const getInitialZoom = () => {
  if (typeof window === 'undefined') return 100;
  
  const width = window.innerWidth;
  
  // Breakpoints für verschiedene Bildschirmgrößen
  if (width >= 1920) return 150;      // Große Monitore
  if (width >= 1536) return 125;      // Desktop
  if (width >= 1280) return 100;      // Kleine Desktop / große Laptops
  if (width >= 1024) return 90;       // Laptops / Tablets landscape
  if (width >= 768) return 75;        // Tablets
  return 50;                          // Mobile
};

export const useZoom = () => {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
};

export const ZoomProvider = ({ children }) => {
  const [zoom, setZoom] = useState(getInitialZoom);
  
  // Optional: Zoom bei Fenstergrößenänderung anpassen (auskommentiert)
  // useEffect(() => {
  //   const handleResize = () => {
  //     setZoom(getInitialZoom());
  //   };
  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  return (
    <ZoomContext.Provider value={{ zoom, setZoom }}>
      {children}
    </ZoomContext.Provider>
  );
};

