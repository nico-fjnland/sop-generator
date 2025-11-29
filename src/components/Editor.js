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
import { Trash, Upload, FileDoc, FileCode, FilePdf, Check, CloudArrowUp, User } from '@phosphor-icons/react';
import { CATEGORIES } from './blocks/ContentBoxBlock';
import { exportAsJson, importFromJson, exportAsWord, exportAsPdf } from '../utils/exportUtils';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
// Switch import removed - not currently used
import { saveDocument, getDocument, getDocuments } from '../services/documentService';
import AccountDropdown from './AccountDropdown';
import { toast } from 'sonner';
import { getInitialState } from '../hooks/useEditorHistory';
import { supabase } from '../lib/supabase';
// Dropdown imports removed - not currently used in Editor

// dnd-kit imports
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  pointerWithin,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Single Dropzone component - expands only on hover
const DropZone = memo(({ id, position }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { position }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`dropzone dropzone-${position} ${isOver ? 'dropzone-hover' : ''}`}
    />
  );
});

// Wrapper component for blocks with dnd-kit sortable + dropzones
const SortableBlockWrapper = memo(({ 
  block, 
  pageBreak, 
  onUpdate, 
  onDelete, 
  onAddAfter, 
  onMove,
  onSortBlocks, 
  allBlocks, 
  usedCategories = [], 
  isRightColumn = false, 
  iconOnRight = false,
  activeDragId,
  isOverlay = false,
  // Neighbor info: which block is the dragged block's neighbor in each direction
  neighborAbove,
  neighborBelow,
  neighborLeft,
  neighborRight
}) => {
  const isDraggable = block.type === 'contentbox' || block.type === 'tiptaptable' || block.type === 'source';
  const isBeingDragged = activeDragId === block.id;
  const showDropzones = activeDragId && !isBeingDragged && !isOverlay;
  
  // Hide dropzones that would place the block back at its original position
  const hideAbove = neighborAbove === activeDragId;
  const hideBelow = neighborBelow === activeDragId;
  const hideLeft = neighborLeft === activeDragId;
  const hideRight = neighborRight === activeDragId;
  
  // Use useSortable for smoother animations
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { block, type: block.type },
    disabled: !isDraggable || isOverlay
  });

  // Smooth transform with spring-like transition
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative',
    ...(pageBreak ? {
      pageBreakBefore: 'always',
      breakBefore: 'page'
    } : {})
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`block-wrapper-dnd ${isDragging ? 'dragging' : ''} ${isBeingDragged ? 'is-being-dragged' : ''}`}
      data-block-id={block.id}
    >
      {/* Top dropzone - hide if dragged block is directly above */}
      {showDropzones && !hideAbove && (
        <DropZone id={`drop-above-${block.id}`} position="above" />
      )}
      
      {/* Main content row with side dropzones */}
      <div className="block-content-row">
        {/* Left dropzone - hide if dragged block is directly to the left */}
        {showDropzones && !hideLeft && (
          <DropZone id={`drop-left-${block.id}`} position="left" />
        )}
        
        {/* Block content */}
        <div className="block-content">
          <Block
            block={block}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAddAfter={onAddAfter}
            onSortBlocks={onSortBlocks}
            isLast={false}
            isDragging={isDragging}
            usedCategories={usedCategories}
            isRightColumn={isRightColumn}
            iconOnRight={iconOnRight}
            dragHandleProps={{ ...listeners, ...attributes }}
          />
        </div>
        
        {/* Right dropzone - hide if dragged block is directly to the right */}
        {showDropzones && !hideRight && (
          <DropZone id={`drop-right-${block.id}`} position="right" />
        )}
      </div>
      
      {/* Bottom dropzone - hide if dragged block is directly below */}
      {showDropzones && !hideBelow && (
        <DropZone id={`drop-below-${block.id}`} position="below" />
      )}
    </div>
  );
});

const Editor = () => {
  const { user, signOut } = useAuth();
  const { timeOfDay, toggleTime } = useTheme();
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

  // dnd-kit state
  const [activeDragId, setActiveDragId] = useState(null);
  const [activeBlock, setActiveBlock] = useState(null);

  // dnd-kit sensors - with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts (reduced for snappier feel)
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Custom collision detection that prioritizes dropzones over sortable items
  const customCollisionDetection = useCallback((args) => {
    // First check for dropzone collisions (for two-column layout creation)
    const pointerCollisions = pointerWithin(args);
    const dropzoneCollision = pointerCollisions.find(c => 
      c.id.toString().startsWith('drop-')
    );
    
    if (dropzoneCollision) {
      return [dropzoneCollision];
    }
    
    // Fall back to closest center for sortable items
    return closestCenter(args);
  }, []);

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

  // Sort content boxes according to CATEGORIES default order
  const sortBlocksByCategory = useCallback(() => {
    // Get the order map from CATEGORIES
    const categoryOrder = CATEGORIES.reduce((acc, cat, index) => {
      acc[cat.id] = index;
      return acc;
    }, {});

    setRows(prevRows => {
      // Flatten all blocks while keeping track of their row info
      const allBlocksWithRowInfo = prevRows.flatMap((row, rowIndex) => 
        row.blocks.map((block, blockIndex) => ({
          block,
          rowId: row.id,
          columnRatio: row.columnRatio,
          originalRowIndex: rowIndex,
          originalBlockIndex: blockIndex,
          // For two-column rows, mark position
          isTwoColumn: row.blocks.length === 2,
          columnPosition: blockIndex // 0 = left, 1 = right
        }))
      );

      // Separate content boxes from non-content boxes
      const contentBoxes = allBlocksWithRowInfo.filter(
        item => item.block.type === 'contentbox'
      );
      const nonContentBoxes = allBlocksWithRowInfo.filter(
        item => item.block.type !== 'contentbox'
      );

      // Sort content boxes by category order
      contentBoxes.sort((a, b) => {
        const categoryA = a.block.content?.category || 'sonstiges';
        const categoryB = b.block.content?.category || 'sonstiges';
        const orderA = categoryOrder[categoryA] ?? 999;
        const orderB = categoryOrder[categoryB] ?? 999;
        return orderA - orderB;
      });

      // Rebuild rows - each content box gets its own row (single column)
      // Non-content boxes (tables, sources) stay at their relative positions
      const newRows = [];
      
      // First, add sorted content boxes as single-column rows
      contentBoxes.forEach((item) => {
        newRows.push({
          id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          columnRatio: 0.5,
          blocks: [item.block]
        });
      });

      // Then add non-content boxes at the end
      nonContentBoxes.forEach((item) => {
        newRows.push({
          id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          columnRatio: 0.5,
          blocks: [item.block]
        });
      });

      return newRows;
    });
  }, [setRows]);

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
      
      // Find target row
      let targetRowIndex = -1;
      
      for (let i = 0; i < prevRows.length; i++) {
        const blockIdx = prevRows[i].blocks.findIndex(b => b.id === targetId);
        if (blockIdx !== -1) {
          targetRowIndex = i;
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

  // Helper to find block location in rows
  const findBlockLocation = useCallback((rowsData, blockId) => {
    for (let rowIndex = 0; rowIndex < rowsData.length; rowIndex++) {
      const blockIndex = rowsData[rowIndex].blocks.findIndex(b => b.id === blockId);
      if (blockIndex !== -1) {
        return { rowIndex, blockIndex, row: rowsData[rowIndex] };
      }
    }
    return null;
  }, []);

  // dnd-kit handlers
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveDragId(active.id);
    
    // Find the active block
    for (const row of rows) {
      const block = row.blocks.find(b => b.id === active.id);
      if (block) {
        setActiveBlock(block);
        break;
      }
    }
    
    // Add dragging class to body for global cursor
    document.body.classList.add('is-dragging');
  }, [rows]);

  // Parse dropzone ID to extract position and block ID
  // Format: "drop-{position}-{blockId}" e.g. "drop-above-123"
  const parseDropzoneId = useCallback((dropzoneId) => {
    if (!dropzoneId) return null;
    const str = dropzoneId.toString();
    const match = str.match(/^drop-(above|below|left|right)-(.+)$/);
    if (match) {
      return { position: match[1], blockId: match[2] };
    }
    return null;
  }, []);

  // onDragOver for real-time feedback during drag
  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || !active || active.id === over.id) return;
    
    // Check if over a dropzone (for column creation)
    const dropInfo = parseDropzoneId(over.id);
    if (dropInfo) {
      // Dropzone hover is handled by CSS, no action needed here
      return;
    }
    
    // For sortable reordering within the same row
    const activeLocation = findBlockLocation(rows, active.id);
    const overLocation = findBlockLocation(rows, over.id);
    
    if (!activeLocation || !overLocation) return;
    
    // Only handle same-row reordering here (different rows handled by dropzones)
    if (activeLocation.rowIndex === overLocation.rowIndex) {
      if (activeLocation.blockIndex !== overLocation.blockIndex) {
        // Reorder within the same row using arrayMove
        setRows(prevRows => {
          const newRows = [...prevRows];
          const newBlocks = arrayMove(
            [...newRows[activeLocation.rowIndex].blocks],
            activeLocation.blockIndex,
            overLocation.blockIndex
          );
          newRows[activeLocation.rowIndex] = {
            ...newRows[activeLocation.rowIndex],
            blocks: newBlocks
          };
          return newRows;
        }, { history: 'replace' }); // Use replace to avoid flooding history
      }
    }
  }, [rows, parseDropzoneId, findBlockLocation, setRows]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    // Reset drag state
    setActiveDragId(null);
    setActiveBlock(null);
    document.body.classList.remove('is-dragging');
    
    if (!over || !active) return;
    
    // Check if dropped on a dropzone (for creating two-column layouts or moving between rows)
    const dropInfo = parseDropzoneId(over.id);
    if (dropInfo) {
      const { position, blockId: targetId } = dropInfo;
      
      // Don't do anything if dropping on itself
      if (active.id === targetId) return;
      
      // Execute the move with the position from the dropzone
      moveBlock(active.id, targetId, position);
      return;
    }
    
    // For sortable drops on other blocks (same row reordering already handled in onDragOver)
    // No additional action needed here as arrayMove was already applied
  }, [moveBlock, parseDropzoneId]);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
    setActiveBlock(null);
  }, []);

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
            <AccountDropdown 
              user={user} 
              signOut={signOut}
              displayName={getDisplayName()}
              avatarUrl={avatarUrl}
              documentsCount={documentsCount}
            />
        </div>
        ) : (
          /* Anmelden CTA - Gesamter rechter Teil als Button */
          <button
            type="button"
            onClick={() => { window.location.href = '/login'; }}
            className="flex items-center justify-center gap-2 px-4 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm border border-primary transition-colors cursor-pointer"
          >
            <User size={16} weight="bold" />
            <span className="text-xs font-medium">Anmelden</span>
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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
              
              {/* Content area for this page */}
              <div style={{ 
                flex: 1, 
                position: 'relative',
                // No paddingBottom needed - footer is absolutely positioned and 
                // page break calculation already accounts for footer height
                minHeight: 0,
                overflow: 'visible', // Allow hover buttons to extend outside
              }}>
                {pageRows.map((row, rowIndexInPage) => {
                  // Find the absolute row index across all pages
                  const absoluteRowIndex = rows.findIndex(r => r.id === row.id);
                  const prevRow = absoluteRowIndex > 0 ? rows[absoluteRowIndex - 1] : null;
                  const nextRow = absoluteRowIndex < rows.length - 1 ? rows[absoluteRowIndex + 1] : null;
                  
                  // Get block IDs for this row's SortableContext
                  const rowBlockIds = row.blocks.map(b => b.id);
                  
                  return (
                <SortableContext
                  key={row.id}
                  items={rowBlockIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div 
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

                      // Calculate neighbors for this block
                      // Above: last block in previous row (or same position if 2-column)
                      let neighborAbove = null;
                      if (prevRow) {
                        if (prevRow.blocks.length === 2 && row.blocks.length === 2) {
                          // Both rows have 2 columns - match position
                          neighborAbove = prevRow.blocks[blockIndex]?.id || null;
                        } else {
                          // Previous row has different column count - use last block
                          neighborAbove = prevRow.blocks[prevRow.blocks.length - 1]?.id || null;
                        }
                      }
                      
                      // Below: first block in next row (or same position if 2-column)
                      let neighborBelow = null;
                      if (nextRow) {
                        if (nextRow.blocks.length === 2 && row.blocks.length === 2) {
                          // Both rows have 2 columns - match position
                          neighborBelow = nextRow.blocks[blockIndex]?.id || null;
                        } else {
                          // Next row has different column count - use first block
                          neighborBelow = nextRow.blocks[0]?.id || null;
                        }
                      }
                      
                      // Left: block to the left in same row
                      const neighborLeft = blockIndex > 0 ? row.blocks[blockIndex - 1]?.id : null;
                      
                      // Right: block to the right in same row
                      const neighborRight = blockIndex < row.blocks.length - 1 ? row.blocks[blockIndex + 1]?.id : null;

                      return (
                        <React.Fragment key={block.id}>
                          <div 
                            style={{ 
                              flex: row.blocks.length === 2 ? `0 0 calc(${flexBasis} - 10px)` : '1 1 100%',
                              maxWidth: row.blocks.length === 2 ? `calc(${flexBasis} - 10px)` : '100%',
                              minWidth: 0,
                              position: 'relative',
                            }}
                          >
                            <SortableBlockWrapper
                              block={block}
                              pageBreak={false}
                              onUpdate={updateBlock}
                              onDelete={deleteBlock}
                              onAddAfter={addBlock}
                              onMove={moveBlock}
                              onSortBlocks={sortBlocksByCategory}
                              allBlocks={rows.flatMap(r => r.blocks)}
                              usedCategories={usedCategories}
                              isRightColumn={isRightColumn}
                              iconOnRight={iconOnRight}
                              activeDragId={activeDragId}
                              neighborAbove={neighborAbove}
                              neighborBelow={neighborBelow}
                              neighborLeft={neighborLeft}
                              neighborRight={neighborRight}
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
                </SortableContext>
                  );
              })}
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
        
        {/* Drag Overlay - shows a preview of the dragged item */}
        {/* Custom drop animation for smooth feeling */}
        <DragOverlay 
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          style={{
            cursor: 'grabbing',
          }}
        >
          {activeDragId && activeBlock ? (
            <div 
              className="drag-overlay-content" 
              style={{ 
                opacity: 0.95,
                transform: 'scale(1.02)',
                filter: 'drop-shadow(0 12px 24px rgba(0,51,102,0.2))',
                pointerEvents: 'none',
              }}
            >
              <Block
                block={activeBlock}
                onUpdate={() => {}}
                onDelete={() => {}}
                onAddAfter={() => {}}
                isLast={false}
                isDragging={true}
                usedCategories={[]}
                dragHandleProps={{}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Editor;
