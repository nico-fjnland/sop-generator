import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import Block from './Block';
import SOPHeader from './SOPHeader';
import { usePageBreaks } from '../hooks/usePageBreaks';

// Wrapper component for blocks to handle refs
const BlockWrapper = memo(({ block, pageBreak, onUpdate, onDelete, onAddAfter, setBlockRef, onMove, allBlocks, getUsedCategories, isRightColumn = false }) => {
  const blockRef = useRef(null);
  const indicatorRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const usedCategories = getUsedCategories ? getUsedCategories() : [];
  
  useEffect(() => {
    if (blockRef.current) {
      setBlockRef(block.id, blockRef);
    }
  }, [block.id, setBlockRef]);

  const handleDragStart = (e) => {
    if (block.type !== 'contentbox') return;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.setData('blockId', block.id);
    e.dataTransfer.setData('application/react-dnd', block.id);
    
    // Store blockId for later use - store on the wrapper div
    if (blockRef.current) {
      blockRef.current.setAttribute('data-dragged-block-id', block.id);
    }
    
    // Create a custom drag image showing both icon and textbox, but shadow only on textbox
    if (blockRef.current) {
      // Find the content-box-block element inside the wrapper
      const contentBox = blockRef.current.querySelector('.content-box-block');
      if (!contentBox) return;
      
      // Find the flex container that holds both icon and textbox
      const flexContainer = contentBox.querySelector('div.flex.items-center');
      
      if (!flexContainer) return;
      
      // Clone the entire flex container (icon + textbox)
      const dragImage = flexContainer.cloneNode(true);
      dragImage.style.width = `${flexContainer.offsetWidth}px`;
      dragImage.style.maxWidth = `${flexContainer.offsetWidth}px`;
      dragImage.style.opacity = '0.95';
      dragImage.style.transform = 'rotate(1deg)';
      dragImage.style.pointerEvents = 'none';
      dragImage.style.position = 'fixed';
      dragImage.style.top = '-9999px';
      dragImage.style.left = '-9999px';
      dragImage.style.zIndex = '10001';
      dragImage.style.backgroundColor = 'transparent';
      dragImage.style.margin = '0';
      dragImage.style.padding = '0';
      dragImage.style.display = 'flex';
      dragImage.style.alignItems = 'center';
      
      // Find the textbox inside the cloned element and apply shadow only to it
      const clonedTextBox = dragImage.querySelector('div.relative.flex-1') ||
                           Array.from(dragImage.children).find(child => 
                             child.classList.contains('relative') && 
                             (child.classList.contains('flex-1') || child.querySelector('.bg-white'))
                           );
      
      if (clonedTextBox) {
        clonedTextBox.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'; // Subtle shadow only on textbox
      }
      
      // Remove no-print classes from clone so it's visible during drag
      dragImage.querySelectorAll('.no-print').forEach(el => {
        el.style.display = 'block';
      });
      
      document.body.appendChild(dragImage);
      
      // Calculate offset from icon click position
      const iconRect = e.currentTarget.getBoundingClientRect();
      const flexContainerRect = flexContainer.getBoundingClientRect();
      // Offset so the drag image appears centered on the cursor
      const offsetX = Math.min(iconRect.left - flexContainerRect.left + iconRect.width / 2, flexContainerRect.width / 2);
      const offsetY = Math.min(iconRect.top - flexContainerRect.top + iconRect.height / 2, 30);
      
      e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);
    }
    
    // Make the original box semi-transparent during drag
    if (blockRef.current) {
      blockRef.current.style.opacity = '0.4';
    }
  };

  const handleDragEnd = useCallback((e) => {
    setIsDragging(false);
    // Restore original box opacity
    if (blockRef.current) {
      blockRef.current.style.opacity = '1';
    }
    // Remove indicator using ref (more efficient)
    if (indicatorRef.current) {
      indicatorRef.current.remove();
      indicatorRef.current = null;
    }
    // Remove drop target styling (only needed once per document)
    const dropTargets = document.querySelectorAll('.drop-target');
    if (dropTargets.length > 0) {
      dropTargets.forEach(el => el.classList.remove('drop-target'));
    }
    // Clean up drag ghost
    const dragGhost = document.querySelector('[data-drag-ghost]');
    if (dragGhost) dragGhost.remove();
  }, []);

  const handleDragOver = (e) => {
    if (block.type !== 'contentbox') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Get dragged block ID from the drag start event - check wrapper div
    const draggedElement = document.querySelector('[data-dragged-block-id]');
    const draggedId = draggedElement?.getAttribute('data-dragged-block-id') || e.dataTransfer.getData('blockId');
    
    if (draggedId && draggedId !== block.id && blockRef.current) {
      setDragOver(true);
      const rect = blockRef.current.getBoundingClientRect();
      
      // Calculate mouse position relative to block
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Determine drop position based on mouse location
      // Divide block into zones: top 25%, bottom 25%, left 37.5%, right 37.5%
      const topZone = rect.height * 0.25;
      const bottomZone = rect.height * 0.75;
      const leftZone = rect.width * 0.375;
      const rightZone = rect.width * 0.625;
      
      let position = 'below'; // default
      let indicatorStyle = '';
      
      // Reuse or create indicator (more efficient than removing/recreating)
      if (!indicatorRef.current) {
        indicatorRef.current = document.createElement('div');
        indicatorRef.current.className = 'drop-indicator';
        indicatorRef.current.style.cssText = `
          background: #3b82f6;
          z-index: 10000;
          pointer-events: none;
          border-radius: 2px;
        `;
        document.body.appendChild(indicatorRef.current);
      }
      
      if (mouseY < topZone) {
        position = 'above';
        indicatorStyle = `
          position: fixed;
          left: ${rect.left}px;
          top: ${rect.top - 2}px;
          width: ${rect.width}px;
          height: 4px;
        `;
      } else if (mouseY > bottomZone) {
        position = 'below';
        indicatorStyle = `
          position: fixed;
          left: ${rect.left}px;
          top: ${rect.bottom - 2}px;
          width: ${rect.width}px;
          height: 4px;
        `;
      } else if (mouseX < leftZone) {
        position = 'left';
        indicatorStyle = `
          position: fixed;
          left: ${rect.left - 2}px;
          top: ${rect.top}px;
          width: 4px;
          height: ${rect.height}px;
        `;
      } else if (mouseX > rightZone) {
        position = 'right';
        indicatorStyle = `
          position: fixed;
          left: ${rect.right - 2}px;
          top: ${rect.top}px;
          width: 4px;
          height: ${rect.height}px;
        `;
      }
      
      // Update indicator position
      indicatorRef.current.setAttribute('data-drop-position', position);
      indicatorRef.current.style.cssText += indicatorStyle;
    }
  };

  const handleDragLeave = useCallback((e) => {
    // Only remove indicator if we're actually leaving the drop zone
    if (!blockRef.current?.contains(e.relatedTarget)) {
      setDragOver(false);
      if (indicatorRef.current) {
        indicatorRef.current.remove();
        indicatorRef.current = null;
      }
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    // Get drop position from indicator ref
    const position = indicatorRef.current?.getAttribute('data-drop-position') || 'below';
    
    // Clean up indicator using ref
    if (indicatorRef.current) {
      indicatorRef.current.remove();
      indicatorRef.current = null;
    }
    
    // Get dragged block ID - check wrapper div
    const draggedElement = document.querySelector('[data-dragged-block-id]');
    const draggedId = draggedElement?.getAttribute('data-dragged-block-id') || e.dataTransfer.getData('blockId');
    
    if (draggedId && draggedId !== block.id && onMove) {
      onMove(draggedId, block.id, position);
    }
    
    // Clean up
    if (draggedElement) {
      draggedElement.removeAttribute('data-dragged-block-id');
    }
  }, [block.id, onMove]);

  return (
    <div 
      ref={blockRef}
      style={pageBreak ? {
        pageBreakBefore: 'always',
        breakBefore: 'page'
      } : {}}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${dragOver ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
      data-block-id={block.id}
    >
      <Block
        block={block}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddAfter={onAddAfter}
        isLast={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      isDragging={isDragging}
      usedCategories={usedCategories}
      isRightColumn={isRightColumn}
    />
  </div>
  );
});

const Editor = () => {
  const containerRef = useRef(null);
  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const [headerTitle, setHeaderTitle] = useState('SOP Überschrift');
  const [headerStand, setHeaderStand] = useState('STAND 12/22');
  const [headerLogo, setHeaderLogo] = useState(null);
  // Blocks are organized in rows. Each row can contain 1 or 2 blocks.
  // Single block = full width, two blocks = side by side
  const [rows, setRows] = useState([
    { 
      id: 'row-1',
      blocks: [
        {
          id: '1', 
          type: 'contentbox',
          content: { 
            category: 'definition', 
            blocks: [{ id: Date.now().toString(), type: 'text', content: '' }] 
          } 
        }
      ]
    }
  ]);

  // Flatten rows into blocks array for pageBreaks calculation
  const blocks = rows.flatMap(row => row.blocks);
  
  const { setBlockRef, pageBreaks } = usePageBreaks(blocks, containerRef);

  const addBlock = useCallback((type, afterId = null, category = 'definition') => {
    const newBlock = type === 'contentbox' 
      ? {
          id: Date.now().toString(),
          type,
          content: {
            category: category,
            blocks: [{ id: Date.now().toString(), type: 'text', content: '' }]
          }
        }
      : {
          id: Date.now().toString(),
          type,
          content: '',
        };

    setRows(prevRows => {
      if (afterId === null) {
        // Add new row at the end
        return [...prevRows, { id: `row-${Date.now()}`, blocks: [newBlock] }];
      }
      
      // Find the row containing the afterId block
      const rowIndex = prevRows.findIndex(row => 
        row.blocks.some(b => b.id === afterId)
      );
      
      if (rowIndex === -1) {
        return [...prevRows, { id: `row-${Date.now()}`, blocks: [newBlock] }];
      }
      
      // Insert new row after the found row
      const newRow = { id: `row-${Date.now()}`, blocks: [newBlock] };
      return [
        ...prevRows.slice(0, rowIndex + 1),
        newRow,
        ...prevRows.slice(rowIndex + 1),
      ];
    });

    return newBlock.id;
  }, []);

  // Get list of already used box categories
  const getUsedCategories = useCallback(() => {
    return blocks
      .filter(block => block.type === 'contentbox' && block.content?.category)
      .map(block => block.content.category);
  }, [blocks]);

  const updateBlock = useCallback((id, content) => {
    setRows(prevRows =>
      prevRows.map(row => ({
        ...row,
        blocks: row.blocks.map(block =>
          block.id === id ? { ...block, content } : block
        )
      }))
    );
  }, []);

  const deleteBlock = useCallback((id) => {
    setRows(prevRows => {
      // Filter out the block from its row
      let newRows = prevRows.map(row => ({
        ...row,
        blocks: row.blocks.filter(block => block.id !== id)
      })).filter(row => row.blocks.length > 0); // Remove empty rows
      
      // If all blocks are deleted, add back a default contentbox
      if (newRows.length === 0) {
        return [{
          id: `row-${Date.now()}`,
          blocks: [{
            id: Date.now().toString(), 
            type: 'contentbox',
            content: {
              category: 'definition',
              blocks: [{ id: Date.now().toString(), type: 'text', content: '' }]
            }
          }]
        }];
      }
      
      return newRows;
    });
  }, []);

  // Move block to a new position
  // position: 'above' | 'below' | 'left' | 'right'
  const moveBlock = useCallback((draggedId, targetId, position = 'below') => {
    setRows(prevRows => {
      // Find source row and block
      let sourceRowIndex = -1;
      let sourceBlockIndex = -1;
      let draggedBlock = null;
      
      for (let i = 0; i < prevRows.length; i++) {
        const blockIdx = prevRows[i].blocks.findIndex(b => b.id === draggedId);
        if (blockIdx !== -1) {
          sourceRowIndex = i;
          sourceBlockIndex = blockIdx;
          draggedBlock = prevRows[i].blocks[blockIdx];
          break;
        }
      }
      
      if (!draggedBlock || sourceRowIndex === -1) return prevRows;
      
      // Find target row and block
      let targetRowIndex = -1;
      let targetBlockIndex = -1;
      
      for (let i = 0; i < prevRows.length; i++) {
        const blockIdx = prevRows[i].blocks.findIndex(b => b.id === targetId);
        if (blockIdx !== -1) {
          targetRowIndex = i;
          targetBlockIndex = blockIdx;
          break;
        }
      }
      
      if (targetRowIndex === -1) return prevRows;
      
      // Clone rows for manipulation
      let newRows = JSON.parse(JSON.stringify(prevRows));
      
      // Remove block from source row
      newRows[sourceRowIndex].blocks.splice(sourceBlockIndex, 1);
      
      // Handle different drop positions
      if (position === 'left' || position === 'right') {
        // Add to target row side-by-side (max 2 blocks per row)
        const targetRow = newRows[targetRowIndex];
        
        if (targetRow.blocks.length >= 2) {
          // Row is full, create new row
          const newRow = { id: `row-${Date.now()}`, blocks: [draggedBlock] };
          newRows.splice(targetRowIndex + 1, 0, newRow);
        } else {
          // Add to row at specified position
          if (position === 'left') {
            targetRow.blocks.unshift(draggedBlock);
          } else {
            targetRow.blocks.push(draggedBlock);
          }
        }
      } else {
        // above or below - create new row
        const newRow = { id: `row-${Date.now()}`, blocks: [draggedBlock] };
        if (position === 'above') {
          newRows.splice(targetRowIndex, 0, newRow);
        } else {
          newRows.splice(targetRowIndex + 1, 0, newRow);
        }
      }
      
      // Clean up empty rows
      newRows = newRows.filter(row => row.blocks.length > 0);
      
      return newRows;
    });
  }, []);

  // Calculate page numbers for visual display
  let currentPageNumber = 1;
  const blockPageNumbers = {};
  
  blocks.forEach((block, index) => {
    if (index > 0 && pageBreaks[block.id]) {
      currentPageNumber++;
    }
    blockPageNumbers[block.id] = currentPageNumber;
  });

  // Group rows by page for visual page containers
  const pages = [];
  let currentPageRows = [];
  let pageNum = 1;

  rows.forEach((row, index) => {
    // Check if any block in this row triggers a page break
    const hasPageBreak = row.blocks.some((block, blockIdx) => 
      blockIdx === 0 && pageBreaks[block.id]
    );
    
    if (index > 0 && hasPageBreak && currentPageRows.length > 0) {
      pages.push({ rows: currentPageRows, pageNumber: pageNum++ });
      currentPageRows = [row];
    } else {
      currentPageRows.push(row);
    }
  });
  
  if (currentPageRows.length > 0) {
    pages.push({ rows: currentPageRows, pageNumber: pageNum });
  }

  return (
    <div className="editor print:block" ref={containerRef}>
      {pages.map((page, pageIndex) => (
        <div
          key={`page-${page.pageNumber}`}
          className="page-container"
          data-page-number={pageIndex === 0 ? '' : `Seite ${page.pageNumber}`}
        >
          {pageIndex > 0 && (
            <div className="page-break-indicator no-print" />
          )}
          {/* Header only on first page */}
          {pageIndex === 0 && (
            <SOPHeader 
              title={headerTitle}
              stand={headerStand}
              logo={headerLogo}
              onTitleChange={setHeaderTitle}
              onStandChange={setHeaderStand}
              onLogoChange={setHeaderLogo}
            />
          )}
          
          {/* Render rows - each row can have 1 or 2 blocks */}
          {page.rows.map((row) => (
            <div 
              key={row.id} 
              className={`block-row ${row.blocks.length === 2 ? 'two-columns' : 'single-column'}`}
              style={{
                display: 'flex',
                gap: row.blocks.length === 2 ? '20px' : '0',
                marginBottom: '0',
                alignItems: 'flex-start'
              }}
            >
              {row.blocks.map((block, blockIndex) => {
                const isRightColumn = row.blocks.length === 2 && blockIndex === 1;
                return (
                  <div 
                    key={block.id}
                    style={{ 
                      flex: row.blocks.length === 2 ? '1' : '1',
                      minWidth: 0
                    }}
                  >
                    <BlockWrapper
                      block={block}
                      pageBreak={pageBreaks[block.id]}
                      onUpdate={updateBlock}
                      onDelete={deleteBlock}
                      onAddAfter={addBlock}
                      setBlockRef={setBlockRef}
                      onMove={moveBlock}
                      allBlocks={blocks}
                      getUsedCategories={getUsedCategories}
                      isRightColumn={isRightColumn}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Editor;

