import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

// Context for drag state
const DragDropStateContext = createContext(null);

export const useDragDropState = () => {
  const context = useContext(DragDropStateContext);
  if (!context) {
    throw new Error('useDragDropState must be used within a DragDropProvider');
  }
  return context;
};

/**
 * Custom collision detection that handles:
 * 1. Vertical sorting (drop between rows)
 * 2. Horizontal merging (drop on left/right half of a row to create two-column)
 */
const customCollisionDetection = (args) => {
  const { active, collisionRect } = args;
  
  if (!collisionRect || !active) {
    return closestCenter(args);
  }

  // First check for pointer within droppables (more precise)
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    // Check if we're in a left/right drop zone
    const columnDropZone = pointerCollisions.find(
      collision => collision.id.toString().includes('-left-zone') || 
                   collision.id.toString().includes('-right-zone')
    );
    
    if (columnDropZone) {
      return [columnDropZone];
    }
    
    // Check for row drop zones (between rows)
    const rowDropZone = pointerCollisions.find(
      collision => collision.id.toString().includes('-drop-')
    );
    
    if (rowDropZone) {
      return [rowDropZone];
    }
  }
  
  // Fall back to rect intersection for general collision
  const rectCollisions = rectIntersection(args);
  
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }
  
  // Last resort: closest center
  return closestCenter(args);
};

/**
 * Determines the drop position based on collision ID
 * @param {string} collisionId - The ID of the drop zone
 * @returns {object} Drop position info { type: 'before'|'after'|'left'|'right', rowId, blockId }
 */
export const parseDropPosition = (collisionId) => {
  if (!collisionId) return null;
  
  const idStr = collisionId.toString();
  
  // Left/right column drop zones: "row-123-left-zone" or "row-123-right-zone"
  if (idStr.includes('-left-zone')) {
    const rowId = idStr.replace('-left-zone', '');
    return { type: 'left', rowId };
  }
  if (idStr.includes('-right-zone')) {
    const rowId = idStr.replace('-right-zone', '');
    return { type: 'right', rowId };
  }
  
  // Before/after row drop zones: "row-123-drop-before" or "row-123-drop-after"
  if (idStr.includes('-drop-before')) {
    const rowId = idStr.replace('-drop-before', '');
    return { type: 'before', rowId };
  }
  if (idStr.includes('-drop-after')) {
    const rowId = idStr.replace('-drop-after', '');
    return { type: 'after', rowId };
  }
  
  // Direct row ID (for sortable)
  return { type: 'on', rowId: idStr };
};

/**
 * Provider component that wraps the editor with DnD functionality
 */
export const DragDropProvider = ({ 
  children, 
  rows, 
  onRowsChange,
  renderDragOverlay
}) => {
  const [activeId, setActiveId] = useState(null);
  const [activeBlock, setActiveBlock] = useState(null);
  const [overId, setOverId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get all row IDs for sortable context
  const rowIds = useMemo(() => rows.map(row => row.id), [rows]);

  // Find block by ID across all rows
  const findBlockById = useCallback((blockId) => {
    for (const row of rows) {
      for (const block of row.blocks) {
        if (block.id === blockId) {
          return { block, row };
        }
      }
    }
    return null;
  }, [rows]);

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the block being dragged
    const found = findBlockById(active.id);
    if (found) {
      setActiveBlock(found.block);
    }
  }, [findBlockById]);

  // Handle drag over (for live feedback)
  const handleDragOver = useCallback((event) => {
    const { over } = event;
    
    if (over) {
      setOverId(over.id);
      setDropPosition(parseDropPosition(over.id));
    } else {
      setOverId(null);
      setDropPosition(null);
    }
  }, []);

  // Handle drag end - main reordering logic
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    // Reset state
    setActiveId(null);
    setActiveBlock(null);
    setOverId(null);
    setDropPosition(null);
    
    if (!over || !active || active.id === over.id) {
      return;
    }

    const dropPos = parseDropPosition(over.id);
    if (!dropPos) return;

    // Find the dragged block
    const draggedResult = findBlockById(active.id);
    if (!draggedResult) return;

    const { block: draggedBlock, row: sourceRow } = draggedResult;
    
    onRowsChange(prevRows => {
      let newRows = [...prevRows];
      
      // Remove block from source row
      const sourceRowIndex = newRows.findIndex(r => r.id === sourceRow.id);
      if (sourceRowIndex === -1) return prevRows;
      
      const sourceRowCopy = { ...newRows[sourceRowIndex] };
      sourceRowCopy.blocks = sourceRowCopy.blocks.filter(b => b.id !== draggedBlock.id);
      
      // If source row is now empty, remove it
      if (sourceRowCopy.blocks.length === 0) {
        newRows = newRows.filter(r => r.id !== sourceRow.id);
      } else {
        newRows[sourceRowIndex] = sourceRowCopy;
      }
      
      // Handle different drop types
      if (dropPos.type === 'before' || dropPos.type === 'after') {
        // Insert as new row before/after target row
        const targetRowIndex = newRows.findIndex(r => r.id === dropPos.rowId);
        if (targetRowIndex === -1) return prevRows;
        
        const newRow = {
          id: `row-${Date.now()}`,
          columnRatio: 0.5,
          blocks: [draggedBlock]
        };
        
        const insertIndex = dropPos.type === 'before' ? targetRowIndex : targetRowIndex + 1;
        newRows.splice(insertIndex, 0, newRow);
        
      } else if (dropPos.type === 'left' || dropPos.type === 'right') {
        // Merge into target row as two-column layout
        const targetRowIndex = newRows.findIndex(r => r.id === dropPos.rowId);
        if (targetRowIndex === -1) return prevRows;
        
        const targetRow = newRows[targetRowIndex];
        
        // Only allow merge if target row has exactly 1 block
        if (targetRow.blocks.length !== 1) {
          // Can't merge into a row that already has 2 blocks
          // Instead, insert as new row before/after
          const newRow = {
            id: `row-${Date.now()}`,
            columnRatio: 0.5,
            blocks: [draggedBlock]
          };
          const insertIndex = dropPos.type === 'left' ? targetRowIndex : targetRowIndex + 1;
          newRows.splice(insertIndex, 0, newRow);
        } else {
          // Merge into two-column layout
          const targetRowCopy = { ...targetRow };
          if (dropPos.type === 'left') {
            // Insert dragged block on the left
            targetRowCopy.blocks = [draggedBlock, ...targetRowCopy.blocks];
          } else {
            // Insert dragged block on the right
            targetRowCopy.blocks = [...targetRowCopy.blocks, draggedBlock];
          }
          newRows[targetRowIndex] = targetRowCopy;
        }
        
      } else if (dropPos.type === 'on') {
        // Direct drop on a sortable item - use standard reordering
        const targetRowIndex = newRows.findIndex(r => r.id === dropPos.rowId);
        if (targetRowIndex === -1) return prevRows;
        
        // Insert as new row after the target
        const newRow = {
          id: `row-${Date.now()}`,
          columnRatio: 0.5,
          blocks: [draggedBlock]
        };
        newRows.splice(targetRowIndex + 1, 0, newRow);
      }
      
      return newRows;
    });
  }, [findBlockById, onRowsChange]);

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveBlock(null);
    setOverId(null);
    setDropPosition(null);
  }, []);

  const contextValue = useMemo(() => ({
    activeId,
    activeBlock,
    overId,
    dropPosition,
    isDragging: activeId !== null,
  }), [activeId, activeBlock, overId, dropPosition]);

  return (
    <DragDropStateContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        
        <DragOverlay 
          modifiers={[snapCenterToCursor]}
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeBlock && renderDragOverlay ? renderDragOverlay(activeBlock) : null}
        </DragOverlay>
      </DndContext>
    </DragDropStateContext.Provider>
  );
};

export default DragDropProvider;

