import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Block from './Block';
import SOPHeader from './SOPHeader';
import SOPFooter from './SOPFooter';
import Page from './Page';
import { usePageBreaks } from '../hooks/usePageBreaks';
import { useEditorHistory } from '../hooks/useEditorHistory';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { UndoRedoButton } from './ui/undo-redo-button';
import { Trash, Download, Upload, FileDoc, FileCode, FilePdf, Moon, Sun, Check, CloudArrowUp, Export, User, Globe, SignOut, ChatCircleDots, FileText, Layout } from '@phosphor-icons/react';
import { exportAsJson, importFromJson, exportAsWord, exportAsPdf } from '../utils/exportUtils';
import { useAuth } from '../contexts/AuthContext';
import { saveDocument, getDocument, getDocuments } from '../services/documentService';
import { toast } from 'sonner';
import { getInitialState } from '../hooks/useEditorHistory';
import { supabase } from '../lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from './ui/dropdown-menu';

// Wrapper component for blocks to handle refs
const BlockWrapper = memo(({ block, pageBreak, onUpdate, onDelete, onAddAfter, onMove, allBlocks, usedCategories = [], isRightColumn = false, iconOnRight = false }) => {
  const blockRef = useRef(null);
  const indicatorRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = useCallback((e) => {
    if (block.type !== 'contentbox' && block.type !== 'tiptaptable') return;
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
    if (block.type !== 'contentbox' && block.type !== 'tiptaptable') return;
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '' });
  const [documentsCount, setDocumentsCount] = useState(0);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const documentId = searchParams.get('id');
  const isNewDoc = searchParams.get('new') === 'true';
  
  // Use Unified History Hook
  const { state, undo, redo, canUndo, canRedo, setEditorState, reset, isSaving } = useEditorHistory();
  const { rows, headerTitle, headerStand, headerLogo, footerVariant } = state;

  // Load user profile data for Account Button
  useEffect(() => {
    if (user) {
      getProfile();
      loadDocumentsCount();
    } else {
      setAvatarUrl(null);
      setProfileData({ firstName: '', lastName: '' });
      setDocumentsCount(0);
    }
  }, [user]);

  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (data) {
        setAvatarUrl(data.avatar_url);
        setProfileData({
          firstName: data.first_name || '',
          lastName: data.last_name || ''
        });
      }
    } catch (error) {
      console.error('Error loading avatar for button:', error);
    }
  }

  async function loadDocumentsCount() {
    try {
      const { data, error } = await getDocuments(user.id);
      if (data) {
        const count = data.length;
        setDocumentsCount(count);
        localStorage.setItem('documentsCount', count.toString());
      }
    } catch (error) {
      console.error('Error loading documents count:', error);
    }
  }

  const handleAccountClick = () => {
    if (!user) {
      navigate('/login');
    }
  };

  const handleSignOut = async () => {
    try {
      // Lokale Daten löschen
      localStorage.removeItem('documentsCount');
      
      const { error } = await signOut();
      
      // Wenn die Session fehlt, ist der Benutzer bereits ausgeloggt
      // In diesem Fall einfach zur Startseite navigieren
      if (error && error.message === 'Auth session missing!') {
        console.log('Session already expired, redirecting to home...');
        // Erzwinge kompletten Reload um sicherzustellen, dass der State zurückgesetzt wird
        window.location.href = '/';
        return;
      }
      
      if (error) {
        console.error('Logout error:', error);
        toast.error('Fehler beim Ausloggen', {
          description: error.message || 'Bitte versuchen Sie es erneut.',
        });
        return;
      }
      
      // Erfolgreicher Logout
      toast.success('Erfolgreich abgemeldet');
      // Erzwinge kompletten Reload um sicherzustellen, dass der State zurückgesetzt wird
      window.location.href = '/';
    } catch (error) {
      console.error('Logout exception:', error);
      // Auch bei Exceptions zur Startseite navigieren
      window.location.href = '/';
    }
  };

  const getDisplayName = () => {
    if (profileData.firstName || profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`.trim();
    }
    return 'Benutzer';
  };

  // Reset state if new document requested
  useEffect(() => {
    if (isNewDoc) {
      const initialState = getInitialState();
      setEditorState(initialState, { history: 'replace' });
      
      // Clear the 'new' param from URL to avoid resetting on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('new');
      setSearchParams(newParams, { replace: true });
    }
  }, [isNewDoc, setEditorState, searchParams, setSearchParams]);

  // Load document if ID present
  useEffect(() => {
    if (documentId && user) {
      const loadDoc = async () => {
        try {
          const { data, error } = await getDocument(documentId);
          if (error) throw error;
          if (data) {
            // Ensure content has correct structure
            const content = data.content;
            setEditorState({
              rows: content.rows || [],
              headerTitle: data.title || 'SOP Überschrift',
              headerStand: data.version || 'STAND 12/22',
              headerLogo: content.headerLogo || null,
              footerVariant: content.footerVariant || 'default'
            }, { history: 'replace' }); // Don't add initial load to history
          }
        } catch (error) {
          console.error('Error loading document:', error);
          alert('Fehler beim Laden des Dokuments.');
        }
      };
      loadDoc();
    }
  }, [documentId, user, setEditorState]);

  // Save to Cloud
  const handleCloudSave = async () => {
    if (!user) {
      toast.error('Anmeldung erforderlich', {
        description: 'Bitte melde dich an, um Dokumente zu speichern.',
      });
      return;
    }

    setIsCloudSaving(true);
    try {
      // Prepare content state to save
      const contentToSave = {
        rows: state.rows,
        headerLogo: state.headerLogo,
        footerVariant: state.footerVariant
      };

      const { error } = await saveDocument(
        user.id,
        state.headerTitle,
        state.headerStand,
        contentToSave,
        documentId // Update existing if ID present
      );

      if (error) throw error;
      
      toast.success('Dokument erfolgreich in Cloud gespeichert', {
        description: 'Dein Dokument wurde gespeichert.',
        action: {
          label: 'Meine Leitfäden',
          onClick: () => window.location.href = '/account?tab=sops',
        },
      });
    } catch (error) {
      console.error('Cloud save failed:', error);
      toast.error('Fehler beim Speichern', {
        description: 'Das Dokument konnte nicht in der Cloud gespeichert werden.',
      });
    } finally {
      setIsCloudSaving(false);
    }
  };

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
    setIsExporting(true);
    try {
      exportAsJson(state);
      toast.success('JSON-Datei erfolgreich heruntergeladen', {
        description: 'Die JSON-Datei wurde erfolgreich gespeichert.',
      });
    } catch (error) {
      console.error('JSON export failed:', error);
      toast.error('Fehler beim JSON-Export', {
        description: 'Bitte versuchen Sie es erneut.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleWordExport = async () => {
    setIsExporting(true);
    try {
      // Wait a small tick to ensure any pending renders are done
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportAsWord(containerRef.current, headerTitle, headerStand);
      toast.success('Word-Dokument erfolgreich heruntergeladen', {
        description: 'Das Word-Dokument wurde erfolgreich gespeichert.',
      });
    } catch (error) {
      console.error('Word export failed:', error);
      toast.error('Fehler beim Word-Export', {
        description: 'Bitte versuchen Sie es erneut.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportAsPdf(containerRef.current, headerTitle, headerStand);
      toast.success('PDF erfolgreich heruntergeladen', {
        description: 'Das PDF wurde erfolgreich gespeichert.',
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Fehler beim PDF-Export', {
        description: 'Bitte versuchen Sie es erneut.',
      });
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
      toast.success('JSON-Datei erfolgreich importiert', {
        description: 'Die Datei wurde erfolgreich geladen.',
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Fehler beim Importieren', {
        description: 'Das Dateiformat ist ungültig.',
      });
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  // Column resizing state
  const [resizingRowId, setResizingRowId] = useState(null);
  const resizingStateRef = useRef({ startX: 0, startRatio: 0.5, rowWidth: 0 });

  // Use new page breaks hook with row-based measurements
  const { pageBreaks, setRowRef } = usePageBreaks(rows, containerRef, footerVariant);

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
    return rows
      .flatMap(row => row.blocks)
      .filter(block => block.type === 'contentbox' && block.content?.category)
      .map(block => block.content.category);
  }, [rows]);


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


  // Stable ref callback for rows - never recreated
  const rowRefCallback = useCallback((rowId) => {
    return (element) => {
      setRowRef(rowId, element);
    };
  }, [setRowRef]);

  // Group rows into pages based on pageBreaks
  const pages = useMemo(() => {
    const groupedPages = [];
    let currentPage = [];
    
    rows.forEach((row) => {
      // If this row should have a page break before it, start a new page
      if (pageBreaks.has(row.id) && currentPage.length > 0) {
        groupedPages.push(currentPage);
        currentPage = [];
      }
      
      currentPage.push(row);
    });
    
    // Add the last page if it has content
    if (currentPage.length > 0) {
      groupedPages.push(currentPage);
    }
    
    // If no pages, create one empty page
    if (groupedPages.length === 0) {
      groupedPages.push([]);
    }
    
    return groupedPages;
  }, [rows, pageBreaks]);

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

      {/* Toolbar - Aufgeteilt in zwei Teile */}
      <div className="no-print flex items-center gap-3 mt-6 mb-0 w-full max-w-[210mm]">
        {/* Linke Toolbar - Hauptfunktionen */}
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200 flex-1">
        {/* History & Reset Controls */}
        <div className="flex items-center gap-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={reset} 
            title="Reset"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash size={18} />
          </Button>
          <UndoRedoButton
            action="undo"
            onAction={undo}
            canExecute={canUndo}
          />
          <UndoRedoButton
            action="redo"
            onAction={redo}
            canExecute={canRedo}
          />
        </div>
        
        <div className="h-4 w-px bg-gray-200 mx-2" />
        
        {/* Export / Import Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={triggerImport}
            title="Gespeicherten Stand laden"
            className="h-8 text-xs px-2 text-[#003366]"
          >
            <Upload size={16} className="mr-1.5" />
            Import
          </Button>

            <div className="h-4 w-px bg-gray-200 mx-1" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePdfExport}
              disabled={isExporting}
              className="h-8 text-xs px-2 text-[#003366]"
              title="Als PDF exportieren"
            >
              <FilePdf size={16} className="mr-1.5" />
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWordExport}
              disabled={isExporting}
              className="h-8 text-xs px-2 text-[#003366]"
              title="Als Word exportieren"
            >
              <FileDoc size={16} className="mr-1.5" />
              Word
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleJsonExport}
              className="h-8 text-xs px-2 text-[#003366]"
              title="Als JSON exportieren"
            >
              <FileCode size={16} className="mr-1.5" />
              JSON
            </Button>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="ml-auto flex items-center gap-2">
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5 px-2 min-w-[120px]">
              {(isExporting || isSaving || isCloudSaving) ? (
                <>
                  <Spinner size="sm" className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Aktualisiere ...</span>
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" className="text-[#3399FF]" />
                  <span className="text-xs text-[#3399FF] font-medium">Synchronisiert</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rechte Toolbar - Cloud & Account */}
        {user ? (
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloudSave}
                disabled={isCloudSaving}
                title="In Cloud speichern"
                className="h-8 text-xs px-2 text-[#003366]"
              >
                {isCloudSaving ? <Spinner size="sm" className="mr-1.5" /> : <CloudArrowUp size={16} className="mr-1.5" />}
                In Cloud speichern
              </Button>

          <div className="h-4 w-px bg-gray-200" />
            
            {/* Account Button - Eingeloggt */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full p-0 transition-all bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center overflow-hidden"
                  title="Mein Konto"
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profil" 
                      className="w-full h-full object-cover"
                    />
            ) : (
                    <User size={16} weight="bold" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/account?tab=sops')} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Meine Leitfäden</span>
                    {documentsCount > 0 && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {documentsCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account?tab=templates')} className="cursor-pointer">
                    <Layout className="mr-2 h-4 w-4" />
                    <span>SOP Templates</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account?tab=profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil & Einstellungen</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => window.open('mailto:feedback@example.com', '_blank')} className="cursor-pointer">
                    <ChatCircleDots className="mr-2 h-4 w-4" />
                    <span>Feedback geben</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open('https://example.com', '_blank')} className="cursor-pointer">
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Webseite</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                  <SignOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        ) : (
          /* Anmelden CTA - Gesamter rechter Teil als Button */
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-4 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm border border-primary transition-colors cursor-pointer"
          >
            <User size={16} weight="bold" />
            <span className="text-xs font-medium">Anmelden</span>
          </button>
        )}
      </div>

      <div className="editor print:block" ref={containerRef}>
        {/* Render pages with A4 formatting */}
        {pages.map((pageRows, pageIndex) => (
          <Page 
            key={`page-${pageIndex}`}
            pageNumber={pageIndex + 1}
            isFirstPage={pageIndex === 0}
          >
            {/* Page content wrapper with padding */}
            <div 
              className="page-content"
              style={{
                height: '100%',
                width: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                padding: '32px 32px 0 32px', // Content gets padding, not page
                boxSizing: 'border-box',
              }}
            >
              {/* Header - only on first page */}
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
              
              {/* Content area for this page - with padding for footer */}
              <div style={{ 
                flex: 1, 
                position: 'relative',
                paddingBottom: '120px', // Space for footer (adjust based on footer variant)
                minHeight: 0,
                overflow: 'visible', // Allow hover buttons to extend outside
              }}>
                {pageRows.map((row) => (
                <div 
                  key={row.id}
                  ref={rowRefCallback(row.id)}
                  className={`block-row ${row.blocks.length === 2 ? 'two-columns' : 'single-column'}`}
                  style={{
                    display: 'flex',
                    gap: row.blocks.length === 2 ? '20px' : '0',
                    marginBottom: '0',
                    alignItems: 'flex-start',
                    position: 'relative'
                  }}
                >
                  {row.blocks.map((block, blockIndex) => {
                    const isRightColumn = row.blocks.length !== 2 || blockIndex === 1;
                    const iconOnRight = row.blocks.length === 2 && blockIndex === 1;
                    const ratio = row.columnRatio || 0.5;
                    const flexBasis = row.blocks.length === 2 
                      ? (blockIndex === 0 ? `${ratio * 100}%` : `${(1 - ratio) * 100}%`)
                      : '100%';

                    return (
                      <React.Fragment key={block.id}>
                        <div 
                          style={{ 
                            flex: row.blocks.length === 2 ? `0 0 calc(${flexBasis} - 10px)` : '1 1 100%',
                            maxWidth: row.blocks.length === 2 ? `calc(${flexBasis} - 10px)` : '100%',
                            minWidth: 0,
                            position: 'relative',
                            transition: resizingRowId === row.id ? 'none' : 'flex-basis 0.2s ease, max-width 0.2s ease'
                          }}
                        >
                          <BlockWrapper
                            block={block}
                            pageBreak={false}
                            onUpdate={updateBlock}
                            onDelete={deleteBlock}
                            onAddAfter={addBlock}
                            onMove={moveBlock}
                            allBlocks={rows.flatMap(r => r.blocks)}
                            usedCategories={usedCategories}
                            isRightColumn={isRightColumn}
                            iconOnRight={iconOnRight}
                          />
                        </div>
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
            </div>
            
            {/* Footer - fixed at bottom of every page, full width */}
            <div style={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
            }}>
              <SOPFooter 
                variant={footerVariant}
                onVariantChange={setFooterVariant}
              />
            </div>
          </Page>
        ))}
      </div>
    </div>
  );
};

export default Editor;
