import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { Trash, Upload, FileDoc, FileCode, FilePdf, CloudArrowUp, User } from '@phosphor-icons/react';
import StatusIndicator from './StatusIndicator';
import { CATEGORIES } from './blocks/ContentBoxBlock';
import { exportAsJson, importFromJson, exportAsWord, exportAsPdf } from '../utils/exportUtils';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStatus } from '../contexts/StatusContext';
import { saveDocument, getDocument, getDocuments } from '../services/documentService';
import AccountDropdown from './AccountDropdown';
import { getInitialState } from '../hooks/useEditorHistory';
import { supabase } from '../lib/supabase';
import { DragDropProvider } from '../contexts/DragDropContext';
import SortableRow from './dnd/SortableRow';
import DraggableBlock from './dnd/DraggableBlock';
import { DragGhost } from './dnd/DropIndicator';

const Editor = () => {
  const { user, signOut, organizationId, organization, profile } = useAuth();
  const { timeOfDay, toggleTime } = useTheme();
  const { showSuccess, showError, showSaving, showExporting, showSynced } = useStatus();
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
  const { state, undo, redo, canUndo, canRedo, setEditorState, reset, isSaving } = useEditorHistory({
    skipLocalStorage: !!documentId
  });
  const { rows, headerTitle, headerStand, headerLogo, footerVariant } = state;

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
  }, [user, organizationId]);

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
      if (!organizationId) return;
      const { data, error } = await getDocuments(organizationId);
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
        showError('Fehler beim Ausloggen', {
          description: error.message || 'Bitte versuchen Sie es erneut.',
        });
        return;
      }
      
      // Erfolgreicher Logout
      showSuccess('Erfolgreich abgemeldet');
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
              footerVariant: content.footerVariant || 'tiny'
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
      showError('Anmeldung erforderlich', {
        description: 'Bitte melde dich an, um Dokumente zu speichern.',
      });
      return;
    }

    if (!organizationId) {
      showError('Organisation nicht gefunden', {
        description: 'Bitte aktualisiere die Seite und versuche es erneut.',
      });
      return;
    }

    setIsCloudSaving(true);
    showSaving('Speichere in Cloud...');
    try {
      // Prepare content state to save
      const contentToSave = {
        rows: state.rows,
        headerLogo: state.headerLogo,
        footerVariant: state.footerVariant
      };

      const { error } = await saveDocument(
        organizationId,
        user.id,
        state.headerTitle,
        state.headerStand,
        contentToSave,
        documentId // Update existing if ID present
      );

      if (error) throw error;
      
      showSuccess('Dokument in Cloud gespeichert');
    } catch (error) {
      console.error('Cloud save failed:', error);
      showError('Fehler beim Speichern', {
        description: 'Das Dokument konnte nicht gespeichert werden.',
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
    showExporting('Exportiere JSON...');
    try {
      exportAsJson(state);
      showSuccess('JSON-Datei heruntergeladen');
    } catch (error) {
      console.error('JSON export failed:', error);
      showError('Fehler beim JSON-Export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleWordExport = async () => {
    setIsExporting(true);
    showExporting('Exportiere Word...');
    try {
      // Wait a small tick to ensure any pending renders are done
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportAsWord(containerRef.current, headerTitle, headerStand);
      showSuccess('Word-Dokument heruntergeladen');
    } catch (error) {
      console.error('Word export failed:', error);
      showError('Fehler beim Word-Export');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePdfExport = async () => {
    setIsExporting(true);
    showExporting('Exportiere PDF...');
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await exportAsPdf(containerRef.current, headerTitle, headerStand);
      showSuccess('PDF heruntergeladen');
    } catch (error) {
      console.error('PDF export failed:', error);
      showError('Fehler beim PDF-Export');
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
      showSuccess('JSON-Datei importiert');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      showError('Fehler beim Importieren', {
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
  const bottomToolbar = (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 no-print">
      <StatusIndicator>
        <div className="flex items-center gap-0.5 py-1.5 pl-1.5 pr-2 bg-popover rounded-xl border border-border shadow-lg">
          {/* History & Reset Controls */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={reset} 
            title="Reset"
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
    <div className="fixed top-6 right-6 z-50 no-print flex items-center gap-2">
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
                variant={footerVariant}
                onVariantChange={setFooterVariant}
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
