import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical, X, Plus } from 'lucide-react';
import Block from '../Block';
import { CATEGORIES, ADDITIONAL_ELEMENTS } from './ContentBoxBlock';
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
  isDragging,
  blockId,
  usedCategories = [],
  onAddBoxAfter,
  onAddBlockAfter,
  isRightColumn = false,
  dragHandleProps = {}, // dnd-kit drag handle props
}) => {
  // Initialize content structure helper
  const getInitializedContent = (contentToInit) => {
    if (!contentToInit || typeof contentToInit === 'string' || !contentToInit.blocks) {
      return {
        blocks: [{ id: Date.now().toString(), type: 'text', content: '' }]
      };
    }
    return contentToInit;
  };

  const initialContent = getInitializedContent(content);
  const [innerBlocks, setInnerBlocks] = useState(
    initialContent.blocks || [{ id: Date.now().toString(), type: 'text', content: '' }]
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

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
      setTimeout(() => {
        isUpdatingFromParent.current = false;
      }, 0);
    }
  }, [content]);

  const updateContent = useCallback((blocks) => {
    if (isUpdatingFromParent.current) {
      return;
    }

    const newContent = { blocks };
    const newContentStr = JSON.stringify(newContent);
    if (newContentStr !== lastContentRef.current) {
      lastContentRef.current = newContentStr;
      onChange(newContent);
    }
  }, [onChange]);

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
    if (usedCategories.includes(categoryId)) {
      return;
    }
    onAddBoxAfter(categoryId);
    setIsDropdownOpen(false);
  };

  const handleAddBlockType = (blockType) => {
    if (!onAddBlockAfter) return;
    onAddBlockAfter(blockType);
    setIsDropdownOpen(false);
  };

  // Blue color for source block buttons (same as Diagnostik)
  const buttonColor = '#3399FF';

  return (
    <div
      ref={containerRef}
      className={`source-block mb-6 relative group z-auto ${isDragging ? 'dragging-box' : ''}`}
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        transition: isDragging ? 'none' : 'opacity 0.2s ease, transform 0.1s ease',
        cursor: isDragging ? 'grabbing' : 'default',
        margin: '0 14px', // 14px indentation on each side
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover controls - always on right side */}
      <div
        className={`notion-box-controls no-print ${isDropdownOpen ? 'dropdown-open' : ''}`}
      >
        <button
          type="button"
          className="notion-control-button touch-none"
          style={{ backgroundColor: buttonColor, cursor: isDragging ? 'grabbing' : 'grab' }}
          aria-label="Box verschieben"
          title="Box verschieben"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4 text-white" strokeWidth={2} />
        </button>
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
          <X className="h-4 w-4 text-white" strokeWidth={2} />
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
          className="source-box-content flex flex-col gap-[8px] py-[16px] px-[26px]"
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

