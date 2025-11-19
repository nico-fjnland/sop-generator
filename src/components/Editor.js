import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import Block from './Block';
import SOPHeader from './SOPHeader';
import SOPFooter from './SOPFooter';
import { usePageBreaks } from '../hooks/usePageBreaks';
import { useEditorHistory } from '../hooks/useEditorHistory';
import { Button } from './ui/button';
import { ArrowCounterClockwise, ArrowClockwise, Trash, Download, Upload, FileDoc, FileCode, FilePdf } from '@phosphor-icons/react';
import { exportAsJson, importFromJson, exportAsWord, exportAsPdf } from '../utils/exportUtils';

// Wrapper component for blocks to handle refs
const BlockWrapper = memo(({ block, pageBreak, onUpdate, onDelete, onAddAfter, setBlockRef, onMove, allBlocks, usedCategories = [], isRightColumn = false, iconOnRight = false }) => {
  const blockRef = useRef(null);
  const indicatorRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  useEffect(() => {
    if (blockRef.current) {
      setBlockRef(block.id, blockRef);
    }
  }, [block.id, setBlockRef]);

  const handleDragStart = useCallback((e) => {
    if (block.type !== 'contentbox') return;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.setData('blockId', block.id);
    
    // Store blockId for later use
    if (blockRef.current) {
      blockRef.current.setAttribute('data-dragged-block-id', block.id);
    }
    
    // Make the original box semi-transparent during drag
    if (blockRef.current) {
      blockRef.current.style.opacity = '0.4';
    }
  }, [block.id, block.type]);

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
      iconOnRight={iconOnRight}
    />
  </div>
  );
});

const Editor = () => {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Use Unified History Hook
  const { state, undo, redo, canUndo, canRedo, setEditorState, reset } = useEditorHistory();
  const { rows, headerTitle, headerStand, headerLogo, footerVariant } = state;

  // Helpers for updating specific parts of state
  const setRows = useCallback((rowsUpdate, options = { history: true }) => {
    setEditorState(prevState => ({
      ...prevState,
      rows: typeof rowsUpdate === 'function' ? rowsUpdate(prevState.rows) : rowsUpdate
    }), options);
  }, [setEditorState]);

  const setHeaderTitle = useCallback((title) => {
    setEditorState(prev => ({ ...prev, headerTitle: title }));
  }, [setEditorState]);

  const setHeaderStand = useCallback((stand) => {
    setEditorState(prev => ({ ...prev, headerStand: stand }));
  }, [setEditorState]);

  const setHeaderLogo = useCallback((logo) => {
    setEditorState(prev => ({ ...prev, headerLogo: logo }));
  }, [setEditorState]);

  const setFooterVariant = useCallback((variant) => {
    setEditorState(prev => ({ ...prev, footerVariant: variant }));
  }, [setEditorState]);

  // Handle Export
  const handleJsonExport = () => {
    exportAsJson(state);
  };

  const handleWordExport = async () => {
    setIsExporting(true);
    try {
      // Wait a small tick to ensure any pending renders are done
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportAsWord(containerRef.current, headerTitle, headerStand);
    } catch (error) {
      console.error('Word export failed:', error);
      alert('Fehler beim Word-Export. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportAsPdf(containerRef.current, headerTitle, headerStand);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Fehler beim PDF-Export. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Import
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const newState = await importFromJson(file);
      setEditorState(newState);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Fehler beim Importieren der Datei. Das Format ist ungültig.');
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  // Column resizing state
  const [resizingRowId, setResizingRowId] = useState(null);
  const resizingStateRef = useRef({ startX: 0, startRatio: 0.5, rowWidth: 0 });

  // Flatten rows into blocks array for pageBreaks calculation
  const blocks = useMemo(() => rows.flatMap(row => row.blocks), [rows]);
  
  const { setBlockRef, pageBreaks } = usePageBreaks(blocks, containerRef, footerVariant);

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
        return [...prevRows, { id: `row-${Date.now()}`, columnRatio: 0.5, blocks: [newBlock] }];
      }
      
      // Find the row containing the afterId block
      const rowIndex = prevRows.findIndex(row => 
        row.blocks.some(b => b.id === afterId)
      );
      
      if (rowIndex === -1) {
        return [...prevRows, { id: `row-${Date.now()}`, columnRatio: 0.5, blocks: [newBlock] }];
      }
      
      // Insert new row after the found row
      const newRow = { id: `row-${Date.now()}`, columnRatio: 0.5, blocks: [newBlock] };
      return [
        ...prevRows.slice(0, rowIndex + 1),
        newRow,
        ...prevRows.slice(rowIndex + 1),
      ];
    });

    return newBlock.id;
  }, [setRows]);

  // Get list of already used box categories - MEMOIZED for performance
  const usedCategories = useMemo(() => {
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
  }, [setRows]);

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
          columnRatio: 0.5,
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
  }, [setRows]);

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
          const newRow = { id: `row-${Date.now()}`, columnRatio: 0.5, blocks: [draggedBlock] };
          newRows.splice(targetRowIndex + 1, 0, newRow);
        } else {
          // Add to row at specified position
          // Reset ratio to 0.5 when creating a new two-column layout
          targetRow.columnRatio = 0.5;
          if (position === 'left') {
            targetRow.blocks.unshift(draggedBlock);
          } else {
            targetRow.blocks.push(draggedBlock);
          }
        }
      } else {
        // above or below - create new row
        const newRow = { id: `row-${Date.now()}`, columnRatio: 0.5, blocks: [draggedBlock] };
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
  }, [setRows]);

  // We need a stable reference for the move handler that has access to the current resizing row ID
  const resizingIdRef = useRef(null);

  const handleResizeMoveStable = useCallback((e) => {
    if (!resizingIdRef.current) return;

    const { startX, startRatio, rowWidth } = resizingStateRef.current;
    if (!rowWidth) return;

    const deltaX = e.clientX - startX;
    const deltaRatio = deltaX / rowWidth; // Convert px delta to percentage
    
    // Calculate new ratio
    let newRatio = startRatio + deltaRatio;
    
    // Clamp ratio between 1/3 (0.333) and 2/3 (0.666)
    newRatio = Math.max(0.3333, Math.min(0.6666, newRatio));
    
    // Use 'replace' option to avoid flooding history
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === resizingIdRef.current 
          ? { ...row, columnRatio: newRatio } 
          : row
      ),
      { history: 'replace' }
    );
  }, [setRows]);

  const handleResizeEnd = useCallback(() => {
    setResizingRowId(null);
    resizingIdRef.current = null;
    resizingStateRef.current = { startX: 0, startRatio: 0.5, rowWidth: 0 };
    
    document.removeEventListener('mousemove', handleResizeMoveStable);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleResizeMoveStable]);

  const onResizeStart = useCallback((e, rowId, currentRatio) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rowElement = e.currentTarget.closest('.block-row');
    if (!rowElement) return;

    setResizingRowId(rowId);
    resizingIdRef.current = rowId;
    resizingStateRef.current = {
      startX: e.clientX,
      startRatio: currentRatio || 0.5,
      rowWidth: rowElement.getBoundingClientRect().width
    };

    document.addEventListener('mousemove', handleResizeMoveStable);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [handleResizeMoveStable, handleResizeEnd]);


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
    <div className="flex flex-col items-center w-full">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".json"
      />

      {/* Toolbar */}
      <div className="no-print flex items-center gap-2 mb-6 p-2 bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-[210mm]">
        {/* History Controls */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={undo} 
            disabled={!canUndo}
            title="Rückgängig (Ctrl+Z)"
            className="h-8 w-8"
          >
            <ArrowCounterClockwise size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={redo} 
            disabled={!canRedo}
            title="Wiederholen (Ctrl+Y)"
            className="h-8 w-8"
          >
            <ArrowClockwise size={18} />
          </Button>
        </div>
        
        <div className="h-4 w-px bg-gray-200 mx-2" />
        
        {/* Export / Import Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleJsonExport}
            title="Als JSON Datei speichern"
            className="h-8 text-xs px-2"
          >
            <FileCode size={16} className="mr-1.5" />
            Backup
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={triggerImport}
            title="Gespeicherten Stand laden"
            className="h-8 text-xs px-2"
          >
            <Upload size={16} className="mr-1.5" />
            Laden
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWordExport}
            disabled={isExporting}
            title="Als Word Dokument exportieren"
            className="h-8 text-xs px-2"
          >
            <FileDoc size={16} className="mr-1.5" />
            Word
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePdfExport}
            disabled={isExporting}
            title="Als PDF exportieren"
            className="h-8 text-xs px-2"
          >
            <FilePdf size={16} className="mr-1.5" />
            PDF
          </Button>
        </div>

        <div className="h-4 w-px bg-gray-200 mx-2" />
        
        <span className="text-xs text-muted-foreground select-none flex-1 text-center">
          {isExporting ? 'Export wird erstellt...' : (canUndo ? 'Änderungen werden gespeichert...' : 'Bereit')}
        </span>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={reset} 
          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 text-xs"
        >
          <Trash size={14} className="mr-1.5" />
          Reset
        </Button>
      </div>

      <div className="editor print:block" ref={containerRef}>
        {pages.map((page, pageIndex) => (
          <div
            key={`page-${page.pageNumber}`}
            className="page-container"
            data-page-number={pageIndex === 0 ? '' : `Seite ${page.pageNumber}`}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '297mm'
            }}
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
            
            {/* Content area - flex grow to push footer down */}
            <div style={{ flex: '1 1 auto', paddingBottom: '100px', minHeight: 0 }}>
            {/* Render rows - each row can have 1 or 2 blocks */}
            {page.rows.map((row) => (
              <div 
                key={row.id} 
                className={`block-row ${row.blocks.length === 2 ? 'two-columns' : 'single-column'}`}
                style={{
                  display: 'flex',
                  gap: row.blocks.length === 2 ? '20px' : '0',
                  marginBottom: '0',
                  alignItems: 'flex-start',
                  position: 'relative' // Needed for resizer positioning if we used absolute, but flex is better
                }}
              >
                {row.blocks.map((block, blockIndex) => {
                  // Buttons should be on the right by default (single column + right column in two-column)
                  // Only show on left for left column in two-column layout
                  const isRightColumn = row.blocks.length !== 2 || blockIndex === 1;
                  
                  // Icon position: In two-column layout, right box has icon on right side
                  const iconOnRight = row.blocks.length === 2 && blockIndex === 1;
                  
                  // Calculate flex basis based on ratio
                  // Default is 0.5 (50%)
                  const ratio = row.columnRatio || 0.5;
                  const flexBasis = row.blocks.length === 2 
                    ? (blockIndex === 0 ? `${ratio * 100}%` : `${(1 - ratio) * 100}%`)
                    : '100%';

                  return (
                    <React.Fragment key={block.id}>
                      <div 
                        style={{ 
                          flex: row.blocks.length === 2 ? `0 0 calc(${flexBasis} - 10px)` : '1 1 100%', // Subtract half gap (10px)
                          maxWidth: row.blocks.length === 2 ? `calc(${flexBasis} - 10px)` : '100%',
                          minWidth: 0,
                          position: 'relative',
                          transition: resizingRowId === row.id ? 'none' : 'flex-basis 0.2s ease, max-width 0.2s ease' // Smooth transition unless resizing
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
                          usedCategories={usedCategories}
                          isRightColumn={isRightColumn}
                          iconOnRight={iconOnRight}
                        />
                      </div>
                      {/* Insert Resizer between blocks */}
                      {blockIndex === 0 && row.blocks.length === 2 && (
                        <div 
                          className={`column-resizer ${resizingRowId === row.id ? 'resizing' : ''}`}
                          style={{ left: `${(row.columnRatio || 0.5) * 100}%` }}
                          onMouseDown={(e) => onResizeStart(e, row.id, row.columnRatio)}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
            </div>
            
            {/* Footer on every page - positioned at bottom */}
            <SOPFooter 
              variant={footerVariant}
              onVariantChange={setFooterVariant}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;
