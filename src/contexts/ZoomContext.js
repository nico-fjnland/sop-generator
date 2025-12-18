import React, { createContext, useContext, useState, useEffect } from 'react';

const ZoomContext = createContext();

// A4-Breite in Pixel bei 100% Zoom
const A4_WIDTH_PX = 794;

// Berechnet Zoomstufe basierend auf Viewport-Breite
const calculateZoom = () => {
  if (typeof window === 'undefined') return 100;
  
  const width = window.innerWidth;
  
  // Bei < 768px: Dynamische Berechnung für bildschirmfüllende Darstellung
  if (width < 768) {
    const availableWidth = width - 32; // 16px Abstand links + rechts
    return Math.round((availableWidth / A4_WIDTH_PX) * 100);
  }
  
  // Breakpoints für größere Bildschirme
  if (width >= 1920) return 150;      // Große Monitore
  if (width >= 1536) return 125;      // Desktop
  if (width >= 1280) return 100;      // Kleine Desktop / große Laptops
  if (width >= 1024) return 90;       // Laptops / Tablets landscape
  return 75;                          // Tablets (768-1023px)
};

export const useZoom = () => {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
};

export const ZoomProvider = ({ children }) => {
  const [zoom, setZoom] = useState(calculateZoom);
  
  // Zoom bei Fenstergrößenänderung anpassen (nur unter 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setZoom(calculateZoom());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ZoomContext.Provider value={{ zoom, setZoom }}>
      {children}
    </ZoomContext.Provider>
  );
};

