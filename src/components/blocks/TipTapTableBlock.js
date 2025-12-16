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
import { NotePencil, X, Plus, Check, Table as TableIcon, SortAscending, Infinity, ArrowCounterClockwise } from '@phosphor-icons/react';
import { CategoryIconComponents } from '../icons/CategoryIcons';
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
import { useTipTapFocus } from '../../contexts/TipTapFocusContext';
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

// Helper function - keep original table content, CSS will handle width constraints
// TipTap needs the inline styles for resize calculations
const processTableContent = (html) => {
  return html;
};

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
  blockId,
  onAddBoxAfter,
  onAddBlockAfter,
  onSortBlocks,
  usedCategories = [],
  isRightColumn = false,
  dragHandleProps, // For drag & drop functionality
}, ref) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [tableTitle, setTableTitle] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const titleInputRef = useRef(null);
  
  // TipTap Focus Context für intelligentes Undo/Redo
  const { registerEditor, unregisterEditor } = useTipTapFocus();

  // Table color (dark blue to match design)
  const tableColor = '#003366';

  // Count how many times each category is used
  const categoryUsageCount = React.useMemo(() => {
    const counts = {};
    usedCategories.forEach(catId => {
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [usedCategories]);

  // Helper function to get icon component with colors
  const getIconWithColors = (categoryId, color, bgColor) => {
    const IconComponent = CategoryIconComponents[categoryId];
    if (IconComponent) {
      return IconComponent({ color, bgColor });
    }
    return null;
  };

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
      return processTableContent(content.table);
    }
    // Handle string format (old format or direct HTML)
    if (typeof content === 'string' && content.trim().length > 0) {
      return processTableContent(content);
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
        // Disable underline from StarterKit - we use explicit import to avoid duplicate
        underline: false,
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
        lang: 'de',
        spellcheck: 'true',
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
    onFocus: ({ editor }) => {
      // Registriere diesen Editor für intelligentes Undo/Redo
      registerEditor(editor);
    },
    onBlur: () => {
      // Deregistriere den Editor (mit kurzem Timeout für Button-Klicks)
      unregisterEditor();
    },
  }, [registerEditor, unregisterEditor]);

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
    const category = CATEGORIES.find(c => c.id === categoryId);
    const usageCount = categoryUsageCount[categoryId] || 0;
    const maxUsage = category?.maxUsage || 1;
    if (usageCount >= maxUsage) return;
    onAddBoxAfter(categoryId);
    setIsDropdownOpen(false);
  };

  const handleAddBlockType = (blockType) => {
    if (!onAddBlockAfter) return;
    onAddBlockAfter(blockType);
    setIsDropdownOpen(false);
  };

  // Force table to respect container width by scaling columns proportionally
  const tableWrapperRef = useRef(null);
  
  useEffect(() => {
    if (!editor || !tableWrapperRef.current) return;
    
    const enforceTableWidth = () => {
      const wrapper = tableWrapperRef.current;
      if (!wrapper) return;
      
      const table = wrapper.querySelector('table');
      if (!table) return;
      
      const wrapperWidth = wrapper.getBoundingClientRect().width;
      const cols = table.querySelectorAll('colgroup col');
      
      // Calculate total column width
      let totalColWidth = 0;
      cols.forEach(col => {
        totalColWidth += parseInt(col.style.width, 10) || 0;
      });
      
      // If columns are wider than container, scale them down proportionally
      if (totalColWidth > wrapperWidth && totalColWidth > 0) {
        const scale = (wrapperWidth - 2) / totalColWidth; // -2 for border
        
        cols.forEach(col => {
          const currentWidth = parseInt(col.style.width, 10) || 0;
          const newWidth = Math.floor(currentWidth * scale);
          col.style.width = `${newWidth}px`;
        });
        
        // Remove table inline width - let it be 100% via CSS
        table.style.removeProperty('width');
      }
    };
    
    // Run after initial render
    const timeoutId = setTimeout(enforceTableWidth, 300);
    
    // Observe DOM changes to re-enforce when TipTap updates
    const observer = new MutationObserver((mutations) => {
      const relevantMutation = mutations.some(m => 
        m.type === 'attributes' && 
        m.attributeName === 'style' &&
        (m.target.tagName === 'TABLE' || m.target.tagName === 'COL')
      );
      
      if (relevantMutation) {
        requestAnimationFrame(enforceTableWidth);
      }
    });
    
    observer.observe(tableWrapperRef.current, {
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
    
    // Also run on window resize
    const handleResize = () => {
      requestAnimationFrame(enforceTableWidth);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [editor, blockId]);

  if (!editor) {
    return <div className="tiptap-table-loading">Tabelle wird geladen...</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="tiptap-table-block-wrapper mb-6 relative group z-auto"
      style={{ 
        pageBreakInside: 'avoid', 
        breakInside: 'avoid',
        transition: 'opacity 0.2s ease, transform 0.1s ease',
      }}
    >
      {/* Hover controls similar to ContentBoxBlock */}
      <div 
        className={`notion-box-controls no-print ${!isRightColumn ? 'notion-box-controls-left' : ''} ${isDropdownOpen || isOptionsOpen ? 'dropdown-open' : ''}`}
      >
        {/* Settings Button with Table Options Dropdown */}
        <DropdownMenu open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="notion-control-button"
              style={{ backgroundColor: tableColor }}
              aria-label="Tabelleneinstellungen"
              title="Tabelleneinstellungen"
            >
              <NotePencil className="h-4 w-4 text-white" weight="bold" />
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
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Tabellenoptionen</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetTable();
                }}
                className="p-1 rounded hover:bg-muted transition-colors"
                title="Tabelle zurücksetzen"
              >
                <ArrowCounterClockwise className="h-4 w-4" weight="regular" />
              </button>
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
                    <X className="h-4 w-4 text-gray-500" weight="bold" />
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
          </DropdownMenuContent>
        </DropdownMenu>
        
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
                <Plus className="h-4 w-4 text-white" weight="bold" />
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
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Inhalt hinzufügen</span>
                {onSortBlocks && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSortBlocks();
                    }}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Content-Boxen nach Standard-Reihenfolge sortieren"
                  >
                    <SortAscending className="h-4 w-4" weight="regular" />
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CATEGORIES.map((cat) => {
                const usageCount = categoryUsageCount[cat.id] || 0;
                const maxUsage = cat.maxUsage || 1;
                const isMaxed = usageCount >= maxUsage;
                return (
                  <DropdownMenuItem
                    key={cat.id}
                    disabled={isMaxed}
                    onClick={() => handleAddBoxCategorySelect(cat.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className="flex items-center justify-center w-4 h-4"
                    >
                      {getIconWithColors(cat.id, isMaxed ? '#9CA3AF' : cat.color, isMaxed ? '#F3F4F6' : cat.bgColor)}
                    </span>
                    <span className="flex-1">{cat.shortLabel || cat.label}</span>
                    <span className="text-[10px] tabular-nums">
                      {usageCount}/{maxUsage}
                    </span>
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
                        <Infinity className="h-[10px] w-[10px] mr-1" weight="bold" />
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
          <X className="h-4 w-4 text-white" weight="bold" />
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
        {/* Table Icon - serves as drag handle */}
        <div
          className={`no-print flex items-center justify-center ${dragHandleProps ? 'drag-handle' : ''}`}
          style={{
            cursor: dragHandleProps ? 'grab' : undefined,
            flexShrink: 0,
          }}
          {...(dragHandleProps || {})}
        >
          <TableIcon 
            size={16} 
            weight="regular"
            style={{ color: '#003366' }}
          />
        </div>
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

      {/* Table */}
      <div className="flex items-start w-full" style={{ paddingLeft: '14px', paddingRight: '14px' }}>
        <div 
          ref={tableWrapperRef}
          className="tiptap-table-wrapper flex-1 relative"
          lang="de"
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
});

TipTapTableBlock.displayName = 'TipTapTableBlock';

export default TipTapTableBlock;

