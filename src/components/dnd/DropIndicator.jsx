import React from 'react';

/**
 * DropIndicator shows visual feedback for where a block will be dropped
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
          position: 'absolute',
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: '#3399FF',
          borderRadius: '2px',
          zIndex: 100,
          pointerEvents: 'none',
          ...(position === 'before' 
            ? { top: '-1.5px' } 
            : { bottom: '-1.5px' }
          ),
          boxShadow: '0 0 8px rgba(51, 153, 255, 0.5)',
        }}
      >
        {/* Dot indicators at the ends */}
        <div 
          style={{
            position: 'absolute',
            left: '-4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#3399FF',
          }}
        />
        <div 
          style={{
            position: 'absolute',
            right: '-4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#3399FF',
          }}
        />
      </div>
    );
  }

  if (type === 'vertical') {
    return (
      <div 
        className={`drop-indicator drop-indicator-vertical drop-indicator-${position}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '3px',
          backgroundColor: '#3399FF',
          borderRadius: '2px',
          zIndex: 100,
          pointerEvents: 'none',
          ...(position === 'left' 
            ? { left: '50%', transform: 'translateX(-50%)' } 
            : { right: '50%', transform: 'translateX(50%)' }
          ),
          boxShadow: '0 0 8px rgba(51, 153, 255, 0.5)',
        }}
      >
        {/* Dot indicators at the ends */}
        <div 
          style={{
            position: 'absolute',
            top: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#3399FF',
          }}
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#3399FF',
          }}
        />
      </div>
    );
  }

  return null;
};

/**
 * Ghost overlay for the dragged block
 * No white background - shows the actual box appearance
 * Hides hover controls via CSS class
 */
export const DragGhost = ({ children, block }) => {
  return (
    <div 
      className="drag-ghost"
      style={{
        opacity: 0.9,
        transform: 'rotate(1.5deg) scale(1.02)',
        filter: 'drop-shadow(0 12px 24px rgba(0, 51, 102, 0.25))',
        cursor: 'grabbing',
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
};

export default DropIndicator;

