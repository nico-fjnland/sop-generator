import React from 'react';
import { useZoom } from '../contexts/ZoomContext';

/**
 * ZoomWrapper - Zoomt den Inhalt mit der CSS zoom-Property
 * 
 * Verwendet CSS zoom statt transform: scale(), weil:
 * - zoom beeinflusst das tatsächliche Layout (nicht nur visuelle Darstellung)
 * - Bei zoom < 100% schrumpft der Container automatisch mit
 * - Bei zoom > 100% wächst der Container automatisch mit
 * - Kein manuelles Kompensieren von Breite/Höhe nötig
 * 
 * Die zoom-Property wird von allen modernen Browsern unterstützt
 * (inkl. Firefox ab Version 126, Juni 2024).
 * 
 * Print-Styles setzen zoom auf 1 zurück (in App.css).
 */
const ZoomWrapper = ({ children }) => {
  const { zoom } = useZoom();
  const scale = zoom / 100;

  return (
    <div
      id="zoom-wrapper-outer"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowX: 'hidden', // Verhindert horizontales Scrolling
      }}
    >
      <div
        id="zoom-wrapper"
        style={{
          zoom: scale,
          // Fallback für ältere Browser (wird von modernen Browsern ignoriert wenn zoom funktioniert)
          // transform: `scale(${scale})`,
          // transformOrigin: 'top center',
          transition: 'zoom 0.2s ease-out',
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ZoomWrapper;
