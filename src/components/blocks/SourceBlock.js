import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus, SortAscending, NotePencil, ArrowCounterClockwise, Infinity } from '@phosphor-icons/react';
import Block from '../Block';
import { CATEGORIES, ADDITIONAL_ELEMENTS } from './ContentBoxBlock';
import { CategoryIconComponents } from '../icons/CategoryIcons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const SourceBlock = ({
  content,
  onChange,
  onDelete,
  blockId,
  usedCategories = [],
  onAddBoxAfter,
  onAddBlockAfter,
  onSortBlocks,
  isRightColumn = false,
}) => {
  // Initialize content structure helper
  const getInitializedContent = (contentToInit) => {
    if (!contentToInit || typeof contentToInit === 'string' || !contentToInit.blocks) {
      return {
        blocks: [{ id: Date.now().toString(), type: 'text', content: '' }],
        columnCount: 1
      };
    }
    return {
      ...contentToInit,
      columnCount: contentToInit.columnCount || 1
    };
  };

  const initialContent = getInitializedContent(content);
  const [innerBlocks, setInnerBlocks] = useState(
    initialContent.blocks || [{ id: Date.now().toString(), type: 'text', content: '' }]
  );
  const [columnCount, setColumnCount] = useState(initialContent.columnCount || 1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

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

  // Use ref to track if we're updating from parent to prevent infinite loop
  const isUpdatingFromParent = useRef(false);
  const lastContentRef = useRef(JSON.stringify(content));

  // Sync with external content changes
  useEffect(() => {
    const currentContentStr = JSON.stringify(content);
    if (currentContentStr !== lastContentRef.current) {
      lastContentRef.current = currentContentStr;
      isUpdatingFromParent.current = true;
      const initialized = getInitializedContent(content);
      setInnerBlocks(initialized.blocks || [{ id: Date.now().toString(), type: 'text', content: '' }]);
      setColumnCount(initialized.columnCount || 1);
      setTimeout(() => {
        isUpdatingFromParent.current = false;
      }, 0);
    }
  }, [content]);

  const updateContent = useCallback((blocks, options = {}) => {
    if (isUpdatingFromParent.current) {
      return;
    }

    const newColumnCount = options.columnCount !== undefined ? options.columnCount : columnCount;
    const newContent = { blocks, columnCount: newColumnCount };
    const newContentStr = JSON.stringify(newContent);
    if (newContentStr !== lastContentRef.current) {
      lastContentRef.current = newContentStr;
      onChange(newContent);
    }
  }, [onChange, columnCount]);

  const handleAddInnerBlock = useCallback((type, afterId = null) => {
    const newBlock = {
      id: Date.now().toString(),
      type: type || 'text',
      content: '',
    };

    setInnerBlocks(prevBlocks => {
      const updatedBlocks = afterId === null
        ? [...prevBlocks, newBlock]
        : (() => {
            const index = prevBlocks.findIndex(b => b.id === afterId);
            return [
              ...prevBlocks.slice(0, index + 1),
              newBlock,
              ...prevBlocks.slice(index + 1),
            ];
          })();
      updateContent(updatedBlocks);
      return updatedBlocks;
    });

    return newBlock.id;
  }, [updateContent]);

  const handleUpdateInnerBlock = useCallback((id, blockContent) => {
    setInnerBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks.map(block =>
        block.id === id ? { ...block, content: blockContent } : block
      );
      updateContent(updatedBlocks);
      return updatedBlocks;
    });
  }, [updateContent]);

  const handleDeleteInnerBlock = useCallback((id) => {
    setInnerBlocks(prevBlocks => {
      const filtered = prevBlocks.filter(block => block.id !== id);
      const updatedBlocks = filtered.length === 0
        ? [{ id: Date.now().toString(), type: 'text', content: '' }]
        : filtered;
      updateContent(updatedBlocks);
      return updatedBlocks;
    });
  }, [updateContent]);

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

  // Handle column count change - same logic as ContentBoxBlock
  const handleColumnCountChange = useCallback((newColumnCount) => {
    setColumnCount(newColumnCount);
    
    // Helper to check if a block is empty (placeholder only)
    const isBlockEmpty = (block) => {
      if (block.type !== 'text') return false;
      if (!block.content) return true;
      if (typeof block.content === 'string') {
        // Check if content is empty or just whitespace/empty HTML tags
        const stripped = block.content.replace(/<[^>]*>/g, '').trim();
        return stripped === '';
      }
      return false;
    };
    
    // When enabling multi-column mode, ensure there are enough blocks
    if (newColumnCount > 1 && innerBlocks.length < newColumnCount) {
      const blocksToAdd = newColumnCount - innerBlocks.length;
      const newBlocks = Array.from({ length: blocksToAdd }, () => ({
        id: Date.now().toString() + Math.random(),
        type: 'text',
        content: '',
      }));
      const updatedBlocks = [...innerBlocks, ...newBlocks];
      setInnerBlocks(updatedBlocks);
      setTimeout(() => updateContent(updatedBlocks, { columnCount: newColumnCount }), 0);
    } else if (innerBlocks.length > newColumnCount) {
      // When reducing columns, remove trailing empty blocks but keep content
      let updatedBlocks = [...innerBlocks];
      
      // Remove trailing empty blocks until we reach the target column count
      // or until we hit a block with content
      while (updatedBlocks.length > newColumnCount && isBlockEmpty(updatedBlocks[updatedBlocks.length - 1])) {
        updatedBlocks.pop();
      }
      
      // Ensure at least one block remains
      if (updatedBlocks.length === 0) {
        updatedBlocks = [{ id: Date.now().toString(), type: 'text', content: '' }];
      }
      
      setInnerBlocks(updatedBlocks);
      setTimeout(() => updateContent(updatedBlocks, { columnCount: newColumnCount }), 0);
    } else {
      setTimeout(() => updateContent(innerBlocks, { columnCount: newColumnCount }), 0);
    }
  }, [innerBlocks, updateContent]);

  // Reset source block content
  const handleReset = useCallback(() => {
    const emptyBlocks = [{ id: Date.now().toString(), type: 'text', content: '' }];
    setInnerBlocks(emptyBlocks);
    setColumnCount(1);
    updateContent(emptyBlocks, { columnCount: 1 });
  }, [updateContent]);

  // Blue color for source block buttons (same as Diagnostik)
  const buttonColor = '#3399FF';

  return (
    <div
      ref={containerRef}
      className="source-block mb-6 relative group z-auto"
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        transition: 'opacity 0.2s ease, transform 0.1s ease',
        margin: '0 14px', // 14px indentation on each side
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover controls - always on right side */}
      <div
        className={`notion-box-controls no-print ${isDropdownOpen || isOptionsOpen ? 'dropdown-open' : ''}`}
      >
        {/* Settings Button - Box individualisieren */}
        <DropdownMenu open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="notion-control-button"
              style={{ backgroundColor: buttonColor }}
              aria-label="Box individualisieren"
              title="Box individualisieren"
            >
              <NotePencil className="h-4 w-4 text-white" weight="bold" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-64" 
            align="start" 
            side="right" 
            sideOffset={10}
            collisionPadding={{ top: 24, right: 24, bottom: 24, left: 24 }}
            avoidCollisions={true}
          >
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Box individualisieren</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="p-1 rounded hover:bg-muted transition-colors"
                title="Auf Standard zurücksetzen"
              >
                <ArrowCounterClockwise className="h-4 w-4" weight="regular" />
              </button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Column Count Selection */}
            <div className="px-2 py-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Spalten
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleColumnCountChange(1)}
                  className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-md border transition-all text-sm font-medium ${
                    columnCount === 1
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent text-muted-foreground'
                  }`}
                  title="Einspaltig"
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => handleColumnCountChange(2)}
                  className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-md border transition-all text-sm font-medium ${
                    columnCount === 2
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent text-muted-foreground'
                  }`}
                  title="Zweispaltig"
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  disabled={true}
                  className="flex-1 flex items-center justify-center px-3 py-1.5 rounded-md border transition-all text-sm font-medium border-border/50 text-muted-foreground/40 cursor-not-allowed"
                  title="Nicht verfügbar"
                >
                  3
                </button>
              </div>
            </div>
            
          </DropdownMenuContent>
        </DropdownMenu>

        {onAddBoxAfter && (
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="notion-control-button"
                style={{ backgroundColor: buttonColor }}
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
                    <span className="flex-1">{cat.label}</span>
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
          style={{ backgroundColor: buttonColor }}
          aria-label="Quellen-Box löschen"
          title="Quellen-Box löschen"
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

      {/* Source Box - Just text with same indentation as other boxes, blue border on hover */}
      <div
        className="source-box-container relative rounded-[6px] transition-all duration-200"
        style={{
          border: isHovered ? '1.5px solid #3399FF' : '1.5px solid transparent',
          backgroundColor: isHovered ? 'white' : 'transparent',
        }}
      >
        {/* Content area - same padding as ContentBoxBlock */}
        <div
          className={`source-box-content py-[16px] px-[26px] ${columnCount === 2 ? 'two-column' : 'flex flex-col gap-[8px]'}`}
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '12px',
            lineHeight: 1.5,
            fontWeight: 400,
          }}
        >
          {innerBlocks.map((block, index) => (
            <Block
              key={block.id}
              block={block}
              onUpdate={handleUpdateInnerBlock}
              onDelete={handleDeleteInnerBlock}
              onAddAfter={handleAddInnerBlock}
              isLast={index === innerBlocks.length - 1}
              isInsideContentBox={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SourceBlock;

