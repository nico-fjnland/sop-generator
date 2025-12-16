import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { useZoom } from '../contexts/ZoomContext';

const ZoomControl = () => {
  const { zoom, setZoom } = useZoom();

  // Zoom-Stufen
  const zoomLevels = [50, 75, 90, 100, 110, 125, 150, 175, 200];

  const handleZoomIn = useCallback(() => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  }, [zoom, setZoom, zoomLevels]);

  const handleZoomOut = useCallback(() => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  }, [zoom, setZoom, zoomLevels]);

  const handleReset = useCallback(() => {
    setZoom(100);
  }, [setZoom]);

  // Keyboard Shortcuts für Zoom
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ⌘/Ctrl + Plus/Equal für Zoom In
      if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      }
      // ⌘/Ctrl + Minus für Zoom Out
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      // ⌘/Ctrl + 0 für Reset
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, handleZoomIn, handleZoomOut, handleReset]);

  const canZoomIn = zoom < zoomLevels[zoomLevels.length - 1];
  const canZoomOut = zoom > zoomLevels[0];

  const zoomBar = (
    <div 
      id="zoom-control-bar" 
      className="fixed bottom-6 right-6 z-50 no-print"
    >
      {/* Horizontal Zoom Bar */}
      <div className="bg-popover rounded-lg border border-border p-1 shadow-lg flex items-center gap-1">
        {/* Zoom Out (Minus) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
          title="Verkleinern (⌘-)"
        >
          <Minus size={16} weight="bold" />
        </Button>

        {/* Zoom Level Display (Center) */}
        <button
          onClick={handleReset}
          className="h-8 w-12 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors flex items-center justify-center"
          title="Zurücksetzen (⌘0)"
        >
          {zoom}%
        </button>

        {/* Zoom In (Plus) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          disabled={!canZoomIn}
          className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
          title="Vergrößern (⌘+)"
        >
          <Plus size={16} weight="bold" />
        </Button>
      </div>
    </div>
  );

  // Portal zum body - komplett außerhalb des ZoomWrapper
  return createPortal(zoomBar, document.body);
};

export default ZoomControl;
