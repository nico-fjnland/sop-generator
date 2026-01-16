import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Block from './Block';
import SOPHeader from './SOPHeader';
import SOPFooter from './SOPFooter';
import SOPPageHeader from './SOPPageHeader';
import Page from './Page';
import { usePageBreaks } from '../hooks/usePageBreaks';
import { useEditorHistory } from '../hooks/useEditorHistory';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { UndoRedoButton } from './ui/undo-redo-button';
import { Trash, Upload, FileDoc, FileCode, FilePdf, CloudArrowUp, User } from '@phosphor-icons/react';
import StatusIndicator from './StatusIndicator';
import { CATEGORIES } from './blocks/ContentBoxBlock';
import { exportAsJson, importFromJson, exportAsWord, exportAsPdf } from '../utils/exportUtils';
import { useAuth } from '../contexts/AuthContext';
import { useStatus } from '../contexts/StatusContext';
import { saveDocument, getDocument, getDocuments, saveDocumentHtml } from '../services/documentService';
import { serializeToHTML } from '../utils/htmlSerializer';
import AccountDropdown from './AccountDropdown';
import { getInitialState, loadDraft, clearDraft } from '../hooks/useEditorHistory';
import { supabase } from '../lib/supabase';
import { DragDropProvider } from '../contexts/DragDropContext';
import SortableRow from './dnd/SortableRow';
import DraggableBlock from './dnd/DraggableBlock';
import { DragGhost } from './dnd/DropIndicator';
import { logger } from '../utils/logger';

const Editor = () => {
  const { user, signOut, organizationId, organization, profile } = useAuth();
  const { showSuccess, showError, showSaving, showExporting, showConfirm } = useStatus();
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
  // Skip localStorage for DB documents to prevent state mixing
  // Pass documentId to enable draft saving for cloud documents
  const { state, undo, redo, canUndo, canRedo, setEditorState, reset } = useEditorHistory({
    skipLocalStorage: !!documentId,
    documentId: documentId
  });
  const { rows, headerTitle, headerStand, headerLogo, footerVariants = {}, signatureData = {} } = state;

  // Load user profile data for Account Button
  useEffect(() => {
    if (user) {
      getProfile();
      if (organizationId) {
        loadDocumentsCount();
      }
    } else {
      setAvatarUrl(null);
      setProfileData({ firstName: '', lastName: '' });
      setDocumentsCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, organizationId]);

  async function getProfile() {
    try {
      const { data } = await supabase
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
      logger.error('Error loading avatar for button:', error);
    }
  }

  async function loadDocumentsCount() {
    try {
      if (!organizationId) return;
      const { data } = await getDocuments(organizationId);
      if (data) {
        const count = data.length;
        setDocumentsCount(count);
        localStorage.setItem('documentsCount', count.toString());
      }
    } catch (error) {
      logger.error('Error loading documents count:', error);
    }
  }

  // eslint-disable-next-line no-unused-vars
  const handleAccountClick = () => {
    if (!user) {
      navigate('/login');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleSignOut = async () => {
    try {
      // Lokale Daten löschen
      localStorage.removeItem('documentsCount');
      
      const { error } = await signOut();
      
      // Wenn die Session fehlt, ist der Benutzer bereits ausgeloggt
      // In diesem Fall einfach zur Startseite navigieren
      if (error && error.message === 'Auth session missing!') {
        logger.log('Session already expired, redirecting to home...');
        // Erzwinge kompletten Reload um sicherzustellen, dass der State zurückgesetzt wird
        window.location.href = '/';
        return;
      }
      
      if (error) {
        logger.error('Logout error:', error);
        showError('Ausloggen fehlgeschlagen. Bitte versuche es erneut.');
        return;
      }
      
      // Erfolgreicher Logout
      showSuccess(`${getDisplayName()} erfolgreich abgemeldet.`);
      // Erzwinge kompletten Reload um sicherzustellen, dass der State zurückgesetzt wird
      window.location.href = '/';
    } catch (error) {
      logger.error('Logout exception:', error);
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
  // Also check for local draft (unsaved changes from previous session)
  useEffect(() => {
    if (documentId && user) {
      const loadDoc = async () => {
        try {
          const { data, error } = await getDocument(documentId);
          if (error) throw error;
          if (data) {
            // Ensure content has correct structure
            const cloudContent = data.content;
            const cloudUpdatedAt = new Date(data.updated_at).getTime();
            
            // Check if there's a local draft that's newer than the cloud version
            const draft = loadDraft(documentId);
            let useLocalDraft = false;
            
            if (draft && draft.savedAt > cloudUpdatedAt) {
              // Local draft is newer - ask user which version to use
              // For now, automatically use the newer draft (better UX for crash recovery)
              useLocalDraft = true;
              logger.info('Local draft found, using newer local version', { 
                draftTime: new Date(draft.savedAt).toISOString(),
                cloudTime: data.updated_at
              });
            }
            
            if (useLocalDraft && draft?.content) {
              // Use local draft
              setEditorState(draft.content, { history: 'replace' });
            } else {
              // Use cloud version
              setEditorState({
                rows: cloudContent.rows || [],
                headerTitle: data.title || 'SOP Überschrift',
                headerStand: data.version || 'STAND 12/22',
                headerLogo: cloudContent.headerLogo || null,
                // Support both legacy single footerVariant and new per-page footerVariants
                footerVariants: cloudContent.footerVariants || (cloudContent.footerVariant ? { 1: cloudContent.footerVariant } : {}),
                // Load signature data (per-page)
                signatureData: cloudContent.signatureData || {}
              }, { history: 'replace' }); // Don't add initial load to history
              
              // Clear any stale draft since we're using cloud version
              if (draft && draft.savedAt <= cloudUpdatedAt) {
                clearDraft(documentId);
              }
            }
          }
        } catch (error) {
          logger.error('Error loading document:', error);
          showError('Fehler beim Laden des Dokuments.');
        }
      };
      loadDoc();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, user, setEditorState]);

  // Save to Cloud (includes HTML caching for bulk export)
  const handleCloudSave = async () => {
    if (!user) {
      showError('Hierfür ist ein Account erforderlich. Bitte melde dich an.');
      return;
    }

    if (!organizationId) {
      showError('Die Organisation konnte nicht gefunden werden.');
      return;
    }

    setIsCloudSaving(true);
    showSaving(`Speichere „${state.headerTitle}" in die Cloud …`);
    try {
      // Prepare content state to save
      const contentToSave = {
        rows: state.rows,
        headerLogo: state.headerLogo,
        footerVariants: state.footerVariants || {},
        signatureData: state.signatureData || {}
      };

      const { data, error } = await saveDocument(
        organizationId,
        user.id,
        state.headerTitle,
        state.headerStand,
        contentToSave,
        documentId // Update existing if ID present
      );

      if (error) throw error;
      
      // Get the document ID (either from existing documentId or newly created)
      const savedDocId = data?.id || documentId;
      
      // Clear local draft after successful cloud save
      if (savedDocId) {
        clearDraft(savedDocId);
      }
      
      // Cache HTML for bulk export (non-blocking)
      // This enables PDF/Word export from "Meine Leitfäden" without opening each document
      if (savedDocId && containerRef.current) {
        try {
          const html = await serializeToHTML(containerRef.current);
          const { error: htmlError } = await saveDocumentHtml(savedDocId, html);
          if (htmlError) {
            logger.warn('HTML cache failed (non-critical):', htmlError);
            // Don't show error to user - main save succeeded
          }
        } catch (htmlErr) {
          logger.warn('HTML serialization failed (non-critical):', htmlErr);
          // Don't show error to user - main save succeeded
        }
      }
      
      showSuccess(`„${state.headerTitle}" unter Meine Leitfäden gespeichert.`);
    } catch (error) {
      logger.error('Cloud save failed:', error);
      showError('Speichern fehlgeschlagen. Bitte versuche es erneut.');
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

  // Update footer variant for a specific page
  const setFooterVariant = useCallback((pageNumber, variant) => {
    setEditorState(prev => ({
      ...prev,
      footerVariants: {
        ...(prev.footerVariants || {}),
        [pageNumber]: variant
      }
    }));
  }, [setEditorState]);

  // Update signature data for a specific page
  const setSignatureData = useCallback((pageNumber, data) => {
    setEditorState(prev => ({
      ...prev,
      signatureData: {
        ...(prev.signatureData || {}),
        [pageNumber]: data
      }
    }));
  }, [setEditorState]);

  // Handle Export
  const handleJsonExport = () => {
    setIsExporting(true);
    showExporting(`Exportiere „${headerTitle}" als JSON-Datei …`);
    try {
      exportAsJson(state);
      showSuccess('JSON-Datei erfolgreich an Browser übergeben.');
    } catch (error) {
      logger.error('JSON export failed:', error);
      showError('JSON-Export fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleWordExport = async () => {
    setIsExporting(true);
    showExporting(`Exportiere „${headerTitle}" als Word-Dokument …`);
    try {
      // Wait a small tick to ensure any pending renders are done
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportAsWord(containerRef.current, headerTitle, headerStand, documentId);
      showSuccess('Word-Dokument erfolgreich an Browser übergeben.');
    } catch (error) {
      logger.error('Word export failed:', error);
      // Use the specific error message (contains user-friendly context)
      showError(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePdfExport = async () => {
    setIsExporting(true);
    showExporting(`Exportiere „${headerTitle}" als PDF-Datei …`);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportAsPdf(containerRef.current, headerTitle, headerStand, documentId);
      showSuccess('PDF-Datei erfolgreich an Browser übergeben.');
    } catch (error) {
      logger.error('PDF export failed:', error);
      // Use the specific error message (contains user-friendly context)
      showError(error.message);
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
      showSuccess('JSON-Datei erfolgreich importiert.');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logger.error('Import failed:', error);
      showError('Import fehlgeschlagen. Bitte versuche es erneut.');
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  // Handle reset with confirmation
  const handleReset = async () => {
    const confirmed = await showConfirm('Möchtest du wirklich unwiderruflich löschen?', {
      confirmLabel: 'Zurücksetzen',
      cancelLabel: 'Abbrechen'
    });
    if (confirmed) {
      reset();
    }
  };

  // Column resizing state
  const [resizingRowId, setResizingRowId] = useState(null);
  const resizingStateRef = useRef({ startX: 0, startRatio: 0.5, rowWidth: 0 });

  // Use new page breaks hook with per-page footer variants
  const { pageBreaks, setRowRef } = usePageBreaks(rows, containerRef, footerVariants);

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

  // Auto-equalize column widths to match box heights (double-click on column resizer)
  // Automatically iterates up to 4 times for single-click convergence
  const autoEqualizeColumns = useCallback((rowId, rowElement, iteration = 0, lastAppliedRatio = null) => {
    if (!rowElement) return;
    const maxIterations = 4;
    
    // Find columns and sort by horizontal position (left to right)
    const columns = Array.from(rowElement.querySelectorAll(':scope > .draggable-block'));
    if (columns.length !== 2) return;
    
    columns.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    const [leftCol, rightCol] = columns;
    
    // Get the actual bordered boxes for accurate height measurement
    const leftBox = leftCol.querySelector('.notion-box-shell');
    const rightBox = rightCol.querySelector('.notion-box-shell');
    if (!leftBox || !rightBox) return;
    
    const leftHeight = leftBox.getBoundingClientRect().height;
    const rightHeight = rightBox.getBoundingClientRect().height;
    
    // Get current ratio - use lastAppliedRatio if available (for iterations), otherwise read from state
    const currentRow = rows.find(r => r.id === rowId);
    const currentRatio = lastAppliedRatio !== null ? lastAppliedRatio : (currentRow?.columnRatio || 0.5);
    
    // If heights are already very close, stop iterating
    if (Math.abs(leftHeight - rightHeight) < 15) {
      return;
    }
    
    // Height-based formula with 70% damping to prevent oscillation
    const targetRatio = leftHeight / (leftHeight + rightHeight);
    let newRatio = currentRatio + (targetRatio - currentRatio) * 0.7;
    newRatio = Math.max(0.33, Math.min(0.67, newRatio));
    newRatio = Math.round(newRatio * 100) / 100;
    
    // Apply the new ratio
    setRows(prevRows => 
      prevRows.map(row => row.id === rowId ? { ...row, columnRatio: newRatio } : row)
    );
    
    // Schedule next iteration after DOM updates (if not at max iterations)
    if (iteration < maxIterations - 1) {
      requestAnimationFrame(() => {
        // Wait one more frame to ensure layout is updated
        requestAnimationFrame(() => {
          // Pass newRatio as lastAppliedRatio to avoid stale state issue
          autoEqualizeColumns(rowId, rowElement, iteration + 1, newRatio);
        });
      });
    }
  }, [setRows, rows]);


  // Stable ref callback for rows - never recreated
  const rowRefCallback = useCallback((rowId) => {
    return (element) => {
      setRowRef(rowId, element);
    };
  }, [setRowRef]);

  // Render function for drag overlay ghost
  // Shows the actual block appearance without hover controls
  // Receives the measured width from the original element for accurate sizing
  const renderDragOverlay = useCallback((block, width) => {
    return (
      <DragGhost block={block} width={width}>
        <Block
          block={block}
          onUpdate={() => {}}
          onDelete={() => {}}
          onAddAfter={() => {}}
          usedCategories={usedCategories}
          isRightColumn={true}
          iconOnRight={false}
        />
      </DragGhost>
    );
  }, [usedCategories]);

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

  // Bottom Toolbar (zentriert am unteren Rand) - wrapped by StatusIndicator
  const mobileHint = (
    <div className="fixed bottom-6 left-4 right-4 z-50 no-print block xs:hidden">
      <div className="flex items-center justify-center py-2 px-4 rounded-xl shadow-lg text-sm font-medium text-white text-center" style={{ backgroundColor: '#3399FF' }}>
        <span style={{ textWrap: 'balance' }}>Mobile Bearbeitung nicht unterstützt. Bitte nutze ein größeres Endgerät.</span>
      </div>
    </div>
  );

  const bottomToolbar = (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 no-print hidden xs:block">
      <StatusIndicator>
        <div className="flex items-center gap-0.5 py-1.5 pl-1.5 pr-2 bg-popover rounded-xl border border-border shadow-lg">
          {/* History & Reset Controls */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleReset} 
            title="Zurücksetzen"
            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash size={20} />
          </Button>
          <UndoRedoButton
            action="undo"
            onAction={undo}
            canExecute={canUndo}
            size="lg"
          />
          <UndoRedoButton
            action="redo"
            onAction={redo}
            canExecute={canRedo}
            size="lg"
          />
          
          <div className="h-5 w-px bg-border mx-1" />
          
          {/* Export / Import Controls */}
          <Button
            variant="ghost"
            onClick={triggerImport}
            title="Import (JSON)"
            className="h-9 px-3 gap-1.5"
          >
            <Upload size={18} />
            <span className="text-sm">Import</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handlePdfExport}
            disabled={isExporting}
            title="Export als PDF"
            className="h-9 px-3 gap-1.5"
          >
            <FilePdf size={18} />
            <span className="text-sm">PDF</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleWordExport}
            disabled={isExporting}
            title="Export als Word"
            className="h-9 px-3 gap-1.5"
          >
            <FileDoc size={18} />
            <span className="text-sm">Word</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleJsonExport}
            title="Export als JSON"
            className="h-9 px-3 gap-1.5"
          >
            <FileCode size={18} />
            <span className="text-sm">JSON</span>
          </Button>
        </div>
      </StatusIndicator>
    </div>
  );

  // Top-Right Toolbar (Speichern & Account)
  const topRightToolbar = (
    <div className="fixed top-6 right-6 z-50 no-print hidden lg:flex items-center gap-2">
      {user ? (
        <>
          {/* Speichern Button - gleiche Höhe wie Zoombar, primary Farbe */}
          <Button
            onClick={handleCloudSave}
            disabled={isCloudSaving}
            title="In Cloud speichern"
            className="h-10 px-3 gap-1.5"
          >
            {isCloudSaving ? <Spinner size="sm" /> : <CloudArrowUp size={18} />}
            <span className="text-sm">Speichern</span>
          </Button>
          
          {/* Account Avatar - gleiche Höhe wie Button */}
          <AccountDropdown 
            user={user} 
            signOut={signOut}
            displayName={getDisplayName()}
            avatarUrl={avatarUrl}
            documentsCount={documentsCount}
            organization={organization}
            profile={profile}
            dropdownPosition="bottom"
            size="lg"
          />
        </>
      ) : (
        <Button
          onClick={() => { window.location.href = '/login'; }}
          className="h-10 px-3"
        >
          <User size={18} weight="bold" />
          <span className="ml-1.5">Anmelden</span>
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full pt-6">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".json"
      />

      {/* Toolbars als Portale zum body (außerhalb ZoomWrapper) */}
      {createPortal(bottomToolbar, document.body)}
      {createPortal(mobileHint, document.body)}
      {createPortal(topRightToolbar, document.body)}

      <DragDropProvider 
        rows={rows} 
        onRowsChange={setRows}
        renderDragOverlay={renderDragOverlay}
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
              
              {/* Page Header - on pages 2+ (shows SOP title and page number) */}
              {pageIndex > 0 && (
                <SOPPageHeader 
                  title={headerTitle}
                  pageNumber={pageIndex + 1}
                  totalPages={pages.length}
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
                {pageRows.map((row) => (
                    <SortableRow
                    key={row.id}
                      row={row}
                      rowRefCallback={rowRefCallback}
                      resizingRowId={resizingRowId}
                      onResizeStart={onResizeStart}
                      onAutoEqualizeColumns={autoEqualizeColumns}
                  >
                    {row.blocks.map((block, blockIndex) => {
                      const isRightColumn = row.blocks.length !== 2 || blockIndex === 1;
                      const iconOnRight = row.blocks.length === 2 && blockIndex === 1;
                      const ratio = row.columnRatio || 0.5;
                      const flexBasis = row.blocks.length === 2 
                        ? (blockIndex === 0 ? `${ratio * 100}%` : `${(1 - ratio) * 100}%`)
                        : '100%';

                      return (
                          <DraggableBlock 
                            key={block.id} 
                            block={block}
                            row={row}
                            style={{ 
                              flex: row.blocks.length === 2 ? `0 0 calc(${flexBasis} - 10px)` : '1 1 100%',
                              maxWidth: row.blocks.length === 2 ? `calc(${flexBasis} - 10px)` : '100%',
                              minWidth: 0,
                              position: 'relative',
                            }}
                          >
                            <Block
                              block={block}
                              onUpdate={updateBlock}
                              onDelete={deleteBlock}
                              onAddAfter={addBlock}
                              onSortBlocks={sortBlocksByCategory}
                              usedCategories={usedCategories}
                              isRightColumn={isRightColumn}
                              iconOnRight={iconOnRight}
                            />
                          </DraggableBlock>
                      );
                    })}
                    </SortableRow>
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
                variant={footerVariants[pageIndex + 1] || 'tiny'}
                pageNumber={pageIndex + 1}
                onVariantChange={setFooterVariant}
                signatureData={signatureData[pageIndex + 1] || {}}
                onSignatureChange={(data) => setSignatureData(pageIndex + 1, data)}
              />
            </div>
          </Page>
        ))}
      </div>
      </DragDropProvider>
    </div>
  );
};

export default Editor;
