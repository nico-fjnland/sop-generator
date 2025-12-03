import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDragDropState } from '../../contexts/DragDropContext';

/**
 * Drop zone component for between-row and column positioning
 */
const DropZone = ({ id, type, isActive, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const showIndicator = isOver || isActive;

  if (type === 'before' || type === 'after') {
    return (
      <div
        ref={setNodeRef}
        className={`drop-zone-row ${type} ${showIndicator ? 'active' : ''}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '16px',
          zIndex: 50,
          ...(type === 'before' ? { top: '-8px' } : { bottom: '-8px' }),
        }}
      >
        {showIndicator && (
          <div className="drop-indicator-line horizontal" />
        )}
        {children}
      </div>
    );
  }

  if (type === 'left' || type === 'right') {
    return (
      <div
        ref={setNodeRef}
        className={`drop-zone-column ${type} ${showIndicator ? 'active' : ''}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '60px', // Schmale Zone am Rand
          zIndex: 40,
          ...(type === 'left' ? { left: 0 } : { right: 0 }),
        }}
      >
        {showIndicator && (
          <div 
            className="drop-zone-highlight"
            style={{
              position: 'absolute',
              inset: '4px',
              borderRadius: '6px',
              border: '2px dashed #3399FF',
              backgroundColor: 'rgba(51, 153, 255, 0.08)',
              pointerEvents: 'none',
            }}
          />
        )}
        {children}
      </div>
    );
  }

  return null;
};

/**
 * SortableRow wraps each row with drag & drop functionality
 */
const SortableRow = ({ 
  row, 
  children, 
  rowRefCallback,
  resizingRowId,
  onResizeStart,
}) => {
  const { activeId, dropPosition, isDragging } = useDragDropState();
  
  // Get the block ID from this row for sortable
  const blockIds = useMemo(() => row.blocks.map(b => b.id), [row.blocks]);
  
  const {
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: row.id,
    data: {
      type: 'row',
      row,
    }
  });

  // Check if this row is being dragged (any of its blocks)
  const isBeingDragged = blockIds.includes(activeId);
  
  // Check if drop indicators should show
  const showBeforeIndicator = dropPosition?.rowId === row.id && dropPosition?.type === 'before';
  const showAfterIndicator = dropPosition?.rowId === row.id && dropPosition?.type === 'after';
  const showLeftZone = dropPosition?.rowId === row.id && dropPosition?.type === 'left';
  const showRightZone = dropPosition?.rowId === row.id && dropPosition?.type === 'right';
  
  // Only show column drop zones on single-column rows that aren't being dragged
  const canShowColumnZones = isDragging && row.blocks.length === 1 && !isBeingDragged;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isBeingDragged ? 0.4 : 1,
    position: 'relative',
  };

  return (
    <div
      ref={(element) => {
        setNodeRef(element);
        if (rowRefCallback) {
          rowRefCallback(row.id)(element);
        }
      }}
      style={style}
      className={`block-row ${row.blocks.length === 2 ? 'two-columns' : 'single-column'} ${isBeingDragged ? 'is-dragging' : ''}`}
      data-row-id={row.id}
    >
      {/* Before drop zone */}
      {isDragging && !isBeingDragged && (
        <DropZone 
          id={`${row.id}-drop-before`} 
          type="before"
          isActive={showBeforeIndicator}
        />
      )}
      
      {/* Column drop zones (only for single-column rows) */}
      {canShowColumnZones && (
        <>
          <DropZone 
            id={`${row.id}-left-zone`} 
            type="left"
            isActive={showLeftZone}
          />
          <DropZone 
            id={`${row.id}-right-zone`} 
            type="right"
            isActive={showRightZone}
          />
        </>
      )}
      
      {/* Row content */}
      {children}
      
      {/* Column resizer (for two-column layouts) */}
      {row.blocks.length === 2 && (
        <div 
          className={`column-resizer ${resizingRowId === row.id ? 'resizing' : ''}`}
          style={{ left: `${(row.columnRatio || 0.5) * 100}%` }}
          onMouseDown={(e) => onResizeStart && onResizeStart(e, row.id, row.columnRatio)}
        />
      )}
      
      {/* After drop zone */}
      {isDragging && !isBeingDragged && (
        <DropZone 
          id={`${row.id}-drop-after`} 
          type="after"
          isActive={showAfterIndicator}
        />
      )}
    </div>
  );
};

export default SortableRow;

