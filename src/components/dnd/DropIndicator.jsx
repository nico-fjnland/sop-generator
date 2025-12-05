import React from 'react';

/**
 * Einheitlicher Drop-Indikator Stil
 * Angepasst an Column Resizer Optik: 4px, border-radius 2px, #3399FF
 */
const INDICATOR_STYLE = {
  backgroundColor: '#3399FF',
  borderRadius: '2px',
  zIndex: 100,
  pointerEvents: 'none',
};

/**
 * DropIndicator shows visual feedback for where a block will be dropped
 * Styled to match Column Resizer appearance
 */
const DropIndicator = ({ 
  type = 'horizontal', // 'horizontal' for between rows, 'vertical' for column split
  position = 'before', // 'before', 'after', 'left', 'right'
  isVisible = false,
}) => {
  if (!isVisible) return null;

  if (type === 'horizontal') {
    return (
      <div 
        className={`drop-indicator drop-indicator-horizontal drop-indicator-${position}`}
        style={{
          ...INDICATOR_STYLE,
          position: 'absolute',
          left: '14px',
          right: '14px',
          height: '4px',
          ...(position === 'before' 
            ? { top: '-2px' } 
            : { bottom: '-2px' }
          ),
        }}
      />
    );
  }

  if (type === 'vertical') {
    return (
      <div 
        className={`drop-indicator drop-indicator-vertical drop-indicator-${position}`}
        style={{
          ...INDICATOR_STYLE,
          position: 'absolute',
          // Angepasst: 8px nach oben verschoben
          top: 'calc(0.75rem - 8px)',
          bottom: 'calc(0.75rem + 8px)',
          width: '4px',
          ...(position === 'left' 
            ? { left: 0 } 
            : { right: 0 }
          ),
        }}
      />
    );
  }

  return null;
};

/**
 * DropLine für Drop-Zonen in SortableRow
 * Angepasst an Column Resizer Optik
 */
export const DropLine = ({ type = 'horizontal', position }) => {
  if (type === 'horizontal') {
    return (
      <div 
        className="drop-line drop-line-horizontal"
        style={{
          ...INDICATOR_STYLE,
          position: 'absolute',
          left: '14px',
          right: '14px',
          height: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
    );
  }

  if (type === 'vertical') {
    return (
      <div 
        className="drop-line drop-line-vertical"
        style={{
          ...INDICATOR_STYLE,
          position: 'absolute',
          // Angepasst: 8px nach oben verschoben
          top: 'calc(0.75rem - 8px)',
          bottom: 'calc(0.75rem + 8px)',
          width: '4px',
          ...(position === 'left' 
            ? { left: 0 } 
            : { right: 0 }
          ),
        }}
      />
    );
  }

  return null;
};

/**
 * Ghost overlay for the dragged block
 * No white background - shows the actual box appearance
 * Hides hover controls via CSS class
 * 
 * The DragOverlay is rendered inside the ZoomWrapper (via container prop).
 * We also receive the measured width of the original element to ensure
 * the ghost has the exact same size (the inner Block component would otherwise
 * calculate its width based on the DragOverlay container).
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The block content to render
 * @param {Object} props.block - The block data
 * @param {number} [props.width] - The measured width of the original element
 */
export const DragGhost = ({ children, block, width }) => {
  return (
    <div 
      className="drag-ghost"
      style={{
        opacity: 0.9,
        transform: 'rotate(1.5deg) scale(1.02)',
        filter: 'drop-shadow(0 12px 24px rgba(0, 51, 102, 0.25))',
        cursor: 'grabbing',
        pointerEvents: 'none',
        // Force the exact width of the original element
        // This prevents the inner Block from expanding to the DragOverlay container width
        ...(width ? {
          width: `${width}px`,
          maxWidth: `${width}px`,
          minWidth: `${width}px`,
        } : {}),
      }}
    >
      {children}
    </div>
  );
};

export default DropIndicator;

