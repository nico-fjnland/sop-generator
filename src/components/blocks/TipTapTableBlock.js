import React, { useEffect, useCallback, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Mark } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { GripVertical, X, Plus, Check, MoreHorizontal } from 'lucide-react';
import { Table as TableIcon } from '@phosphor-icons/react';
import InlineTextToolbar from '../InlineTextToolbar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../ui/dropdown-menu';
import { CATEGORIES, ADDITIONAL_ELEMENTS } from './ContentBoxBlock';
import './TipTapTableBlock.css';

// Custom TableCell that supports colspan/rowspan and background color
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colspan: {
        default: 1,
      },
      rowspan: {
        default: 1,
      },
      colwidth: {
        default: null,
        parseHTML: element => {
          const colwidth = element.getAttribute('colwidth');
          return colwidth ? colwidth.split(',').map(w => parseInt(w, 10)) : null;
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});

// Custom TableHeader that supports colspan/rowspan and background color
const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colspan: {
        default: 1,
      },
      rowspan: {
        default: 1,
      },
      colwidth: {
        default: null,
        parseHTML: element => {
          const colwidth = element.getAttribute('colwidth');
          return colwidth ? colwidth.split(',').map(w => parseInt(w, 10)) : null;
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});

// Custom mark for smaller font size
const SmallFont = Mark.create({
  name: 'smallFont',
  
  parseHTML() {
    return [
      {
        tag: 'span.small-font',
      },
    ];
  },
  
  renderHTML() {
    return ['span', { class: 'small-font' }, 0];
  },
  
  addCommands() {
    return {
      toggleSmallFont: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});

const TipTapTableBlock = forwardRef(({ 
  content, 
  onChange,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
  blockId,
  onAddBoxAfter,
  onAddBlockAfter,
  usedCategories = [],
  isRightColumn = false,
}, ref) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [tableTitle, setTableTitle] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const titleInputRef = useRef(null);

  // Table color (dark blue to match design)
  const tableColor = '#003366';

  // Parse content - handle both old string format and new object format
  const parseContent = useCallback(() => {
    // New format: object with table and title
    if (typeof content === 'object' && content !== null && content.table) {
      return content;
    }
    // Old format: plain HTML string
    if (typeof content === 'string' && content.trim().length > 0) {
      return { table: content, title: '' };
    }
    // Empty or invalid content
    return null;
  }, [content]);

  // Initialize with default table content if empty
  const getInitialContent = () => {
    // Handle object format with table property
    if (typeof content === 'object' && content !== null && content.table) {
      return content.table;
    }
    // Handle string format (old format or direct HTML)
    if (typeof content === 'string' && content.trim().length > 0) {
      return content;
    }
    // Default empty 5x4 table (1 header row + 4 data rows) for new tables
    return `
      <table>
        <tbody>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Superscript,
      Subscript,
      SmallFont,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      CustomTableCell,
      CustomTableHeader,
    ],
    content: getInitialContent(),
    editorProps: {
      attributes: {
        class: 'tiptap-table-editor',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only save as object if we have a title, otherwise save as string for backwards compatibility
      if (tableTitle || (typeof content === 'object' && content !== null)) {
        onChange({ table: html, title: tableTitle });
      } else {
        onChange(html);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { selection } = editor.state;
      const { from, to } = selection;
      
      // Check if this is a CellSelection (whole cells/rows selected)
      // CellSelection has $anchorCell and $headCell properties
      const isCellSelection = selection.$anchorCell !== undefined || 
                              selection.$headCell !== undefined ||
                              selection.isColSelection !== undefined ||
                              selection.isRowSelection !== undefined;
      
      // Show toolbar only if there's a text selection (not just cursor and not cell selection)
      if (from !== to && !isCellSelection) {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        
        // Calculate position (center of selection, close above it)
        setToolbarPosition({
          top: start.top - 10,
          left: (start.left + end.left) / 2,
        });
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    },
  }, []);

  // Initialize title from content - only once on mount
  useEffect(() => {
    const parsed = parseContent();
    if (parsed && parsed.title !== undefined) {
      setTableTitle(parsed.title || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync content from parent when content changes externally
  useEffect(() => {
    if (editor && content) {
      const parsed = parseContent();
      let tableContent;
      
      // Get the table HTML from either format
      if (parsed && parsed.table) {
        tableContent = parsed.table;
      } else if (typeof content === 'string') {
        tableContent = content;
      }
      
      const currentContent = editor.getHTML();
      
      // Only update if content is different and editor is not focused
      if (tableContent && tableContent !== currentContent && !editor.isFocused) {
        editor.commands.setContent(tableContent, false);
      }
    }
  }, [content, editor, parseContent]);

  // Hide toolbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showToolbar) {
        setShowToolbar(false);
      }
    };

    // Listen to scroll events on window and any scrollable parent
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showToolbar]);

  // Handle title change
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTableTitle(newTitle);
    if (editor) {
      // Always save as object when title exists or is being edited
      onChange({ table: editor.getHTML(), title: newTitle });
    }
  }, [editor, onChange]);

  // Expose ref for focus functionality
  useImperativeHandle(ref, () => ({
    focus: () => editor?.commands.focus(),
    blur: () => editor?.commands.blur(),
  }), [editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Table control functions
  const addRowBefore = () => editor?.chain().focus().addRowBefore().run();
  const addRowAfter = () => editor?.chain().focus().addRowAfter().run();
  const deleteRow = () => editor?.chain().focus().deleteRow().run();
  const addColumnBefore = () => editor?.chain().focus().addColumnBefore().run();
  const addColumnAfter = () => editor?.chain().focus().addColumnAfter().run();
  const deleteColumn = () => editor?.chain().focus().deleteColumn().run();
  const mergeCells = () => editor?.chain().focus().mergeCells().run();
  const splitCell = () => editor?.chain().focus().splitCell().run();
  const resetTable = () => {
    if (editor) {
      const initialContent = getInitialContent();
      editor.commands.setContent(initialContent);
      setTableTitle('');
      onChange({ table: initialContent, title: '' });
    }
  };
  const toggleHeaderRow = () => editor?.chain().focus().toggleHeaderRow().run();
  const toggleHeaderColumn = () => editor?.chain().focus().toggleHeaderColumn().run();
  
  // Set background color for selected cells
  const setCellBackgroundColor = (color) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('tableCell', { backgroundColor: color }).run();
    editor.chain().focus().updateAttributes('tableHeader', { backgroundColor: color }).run();
  };
  
  // Clear background color
  const clearCellBackgroundColor = () => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('tableCell', { backgroundColor: null }).run();
    editor.chain().focus().updateAttributes('tableHeader', { backgroundColor: null }).run();
  };

  // Handle inline text toolbar commands
  const handleToolbarCommand = useCallback((command) => {
    if (!editor) return;

    switch (command) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'superscript':
        editor.chain().focus().toggleSuperscript().run();
        break;
      case 'subscript':
        editor.chain().focus().toggleSubscript().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'fontSize':
        editor.chain().focus().toggleSmallFont().run();
        break;
      case 'removeFormat':
        editor.chain().focus().clearNodes().unsetAllMarks().run();
        break;
      default:
        break;
    }
  }, [editor]);

  // Get active states for toolbar
  const getActiveStates = useCallback(() => {
    if (!editor) return {};
    
    return {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      superscript: editor.isActive('superscript'),
      subscript: editor.isActive('subscript'),
      bulletList: editor.isActive('bulletList'),
      fontSize: editor.isActive('smallFont'),
    };
  }, [editor]);

  const handleAddBoxCategorySelect = (categoryId) => {
    if (!onAddBoxAfter) return;
    if (usedCategories.includes(categoryId)) return;
    onAddBoxAfter(categoryId);
    setIsDropdownOpen(false);
  };

  const handleAddBlockType = (blockType) => {
    if (!onAddBlockAfter) return;
    onAddBlockAfter(blockType);
    setIsDropdownOpen(false);
  };

  if (!editor) {
    return <div className="tiptap-table-loading">Tabelle wird geladen...</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={`tiptap-table-block-wrapper mb-6 relative group z-auto ${isDragging ? 'dragging-box' : ''}`}
      style={{ 
        pageBreakInside: 'avoid', 
        breakInside: 'avoid',
        transition: isDragging ? 'none' : 'opacity 0.2s ease, transform 0.1s ease',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      data-draggable="true"
    >
      {/* Hover controls similar to ContentBoxBlock */}
      <div 
        className={`notion-box-controls no-print ${!isRightColumn ? 'notion-box-controls-left' : ''} ${isDropdownOpen ? 'dropdown-open' : ''}`}
      >
        <button
          type="button"
          className="notion-control-button"
          style={{ backgroundColor: tableColor }}
          draggable
          aria-label="Tabelle verschieben"
          title="Tabelle verschieben"
          onDragStart={(e) => {
            e.stopPropagation();
            if (onDragStart) {
              onDragStart(e);
            }
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            if (onDragEnd) {
              onDragEnd(e);
            }
          }}
        >
          <GripVertical className="h-4 w-4 text-white" strokeWidth={2} />
        </button>
        
        {onAddBoxAfter && (
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="notion-control-button"
                style={{ backgroundColor: tableColor }}
                aria-label="Box hinzufügen"
                title="Box hinzufügen"
              >
                <Plus className="h-4 w-4 text-white" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56" 
              align="start" 
              side="right" 
              sideOffset={10}
              collisionPadding={{ top: 24, right: 24, bottom: 24, left: 24 }}
              avoidCollisions={true}
            >
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Content Boxen
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CATEGORIES.map((cat) => {
                const isUsed = usedCategories.includes(cat.id);
                return (
                  <DropdownMenuItem
                    key={cat.id}
                    disabled={isUsed}
                    onClick={() => handleAddBoxCategorySelect(cat.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className="flex items-center justify-center w-4 h-4"
                      style={{ color: isUsed ? 'var(--muted-foreground)' : cat.color }}
                    >
                      {cat.iconComponent}
                    </span>
                    <span className="flex-1">{cat.label}</span>
                    {isUsed && (
                      <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                    )}
                  </DropdownMenuItem>
                );
              })}
              
              {/* Additional Elements Section */}
              {onAddBlockAfter && (
                <>
                  <DropdownMenuSeparator />
                  {ADDITIONAL_ELEMENTS.map((element) => {
                    const Icon = element.icon;
                    return (
                      <DropdownMenuItem
                        key={element.id}
                        onClick={() => handleAddBlockType(element.id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span
                          className="flex items-center justify-center w-4 h-4"
                          style={{ color: element.color }}
                        >
                          <Icon className="h-4 w-4" weight="regular" />
                        </span>
                        <span className="flex-1">{element.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <button
          type="button"
          className="notion-control-button"
          style={{ backgroundColor: tableColor }}
          aria-label="Tabelle löschen"
          title="Tabelle löschen"
          onClick={(event) => {
            event.preventDefault();
            if (onDelete) {
              onDelete(blockId);
            }
          }}
        >
          <X className="h-4 w-4 text-white" strokeWidth={2} />
        </button>
      </div>

      {/* Table Title - Same style as ContentBox caption but without box */}
      <div className="w-full mb-2 flex items-center gap-2" style={{ paddingLeft: '28px', paddingRight: '28px' }}>
        <input
          ref={titleInputRef}
          type="text"
          value={tableTitle}
          onChange={handleTitleChange}
          placeholder="Tabellenüberschrift"
          className="table-title-input no-print flex-1"
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '9px',
            lineHeight: '9px',
            fontWeight: 600,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            letterSpacing: '1.05px',
            color: '#003366',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '4px 0',
          }}
        />
        <TableIcon 
          className="no-print" 
          size={16} 
          weight="regular"
          style={{ color: '#003366', flexShrink: 0 }}
        />
        {/* Print version of title */}
        <div
          className="hidden print:flex w-full items-center gap-2"
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '9px',
            lineHeight: '9px',
            fontWeight: 600,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            letterSpacing: '1.05px',
            color: '#003366',
            padding: '4px 0',
          }}
        >
          <span className="flex-1">{tableTitle}</span>
          <TableIcon 
            size={16} 
            weight="regular"
            style={{ color: '#003366', flexShrink: 0 }}
          />
        </div>
      </div>

      {/* Inline Text Toolbar */}
      {showToolbar && editor && (
        <InlineTextToolbar
          visible={showToolbar}
          position={toolbarPosition}
          activeStates={getActiveStates()}
          onCommand={handleToolbarCommand}
          usePortal={true}
        />
      )}

      {/* Table with Notion-like options menu */}
      <div className="flex items-start w-full" style={{ paddingLeft: '14px', paddingRight: '14px' }}>
        <div className="tiptap-table-wrapper flex-1 relative">
          <EditorContent editor={editor} />
          
          {/* Table options button (three dots) - appears on hover, Notion-style */}
          <div className={`table-options-button no-print ${isOptionsOpen ? 'visible' : ''}`}>
            <DropdownMenu open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-6 px-2 rounded flex items-center justify-center bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                  title="Tabellenoptionen"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" sideOffset={4}>
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tabellenoptionen
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Zeile</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={addRowBefore}>Zeile oben einfügen</DropdownMenuItem>
                    <DropdownMenuItem onClick={addRowAfter}>Zeile unten einfügen</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={deleteRow} className="text-destructive focus:text-destructive">
                      Zeile löschen
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Spalte</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={addColumnBefore}>Spalte links einfügen</DropdownMenuItem>
                    <DropdownMenuItem onClick={addColumnAfter}>Spalte rechts einfügen</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={deleteColumn} className="text-destructive focus:text-destructive">
                      Spalte löschen
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={toggleHeaderRow}>
                  Kopfzeile umschalten
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleHeaderColumn}>
                  Kopfspalte umschalten
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={mergeCells} 
                  disabled={!editor?.can().mergeCells()}
                >
                  Zellen verbinden
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={splitCell}
                  disabled={!editor?.can().splitCell()}
                >
                  Zelle teilen
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Hintergrundfarbe</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-2">
                    <div className="grid grid-cols-4 gap-2">
                      {/* Keine Farbe / Zurücksetzen */}
                      <div 
                        className="w-7 h-7 border-2 border-gray-300 rounded bg-white cursor-pointer hover:border-gray-400 transition-colors flex items-center justify-center"
                        title="Farbe zurücksetzen"
                        onClick={() => clearCellBackgroundColor()}
                      >
                        <X className="h-4 w-4 text-gray-500" strokeWidth={2} />
                      </div>
                      
                      {/* Dunkelblau (#036) - mit weißer Schrift */}
                      <div
                        className="w-7 h-7 rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform" 
                        style={{ backgroundColor: '#003366' }}
                        title="Dunkelblau"
                        onClick={() => setCellBackgroundColor('#003366')}
                      ></div>
                      
                      {/* Farbfelder - nur eine blaue und eine gelbe/orange Farbe */}
                      {CATEGORIES.filter(cat => 
                        !['ursachen', 'symptome', 'disposition'].includes(cat.id)
                      ).map((cat) => (
                        <div
                          key={cat.id}
                          className="w-7 h-7 rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform" 
                          style={{ backgroundColor: cat.bgColor }}
                          title={cat.label}
                          onClick={() => setCellBackgroundColor(cat.bgColor)}
                        ></div>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={resetTable} 
                  className="text-destructive focus:text-destructive"
                >
                  Tabelle zurücksetzen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
});

TipTapTableBlock.displayName = 'TipTapTableBlock';

export default TipTapTableBlock;

