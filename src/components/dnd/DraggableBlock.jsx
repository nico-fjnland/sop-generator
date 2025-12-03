import React, { forwardRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useDragDropState } from '../../contexts/DragDropContext';

/**
 * DraggableBlock wraps a block and provides drag handle functionality.
 * The drag is initiated from the icon-container element.
 */
const DraggableBlock = forwardRef(({ 
  block, 
  children, 
  row,
  style: externalStyle,
  className: externalClassName,
  ...props 
}, ref) => {
  const { activeId } = useDragDropState();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: block.id,
    data: {
      type: 'block',
      block,
      row,
    },
  });

  const isBeingDragged = activeId === block.id;

  // Combine refs
  const setRefs = (element) => {
    setNodeRef(element);
    if (ref) {
      if (typeof ref === 'function') {
        ref(element);
      } else {
        ref.current = element;
      }
    }
  };

  return (
    <div
      ref={setRefs}
      className={`draggable-block ${isBeingDragged ? 'is-dragging' : ''} ${externalClassName || ''}`}
      style={{
        ...externalStyle,
        cursor: isDragging ? 'grabbing' : undefined,
      }}
      {...props}
    >
      {/* Pass drag handle props to children via context or direct props */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            dragHandleProps: {
              ...attributes,
              ...listeners,
              style: { cursor: 'grab' },
            },
            isDragging: isBeingDragged,
          });
        }
        return child;
      })}
    </div>
  );
});

DraggableBlock.displayName = 'DraggableBlock';

/**
 * DragHandle component to be used inside the icon-container
 * This makes the icon the drag trigger
 */
export const DragHandle = ({ children, dragHandleProps, className, ...props }) => {
  return (
    <div 
      className={`drag-handle ${className || ''}`}
      {...dragHandleProps}
      {...props}
    >
      {children}
    </div>
  );
};

export default DraggableBlock;

