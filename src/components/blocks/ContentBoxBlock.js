import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, X, Plus, Check, ChevronDown } from 'lucide-react';
import Block from '../Block';
import { CategoryIcons } from '../icons/CategoryIcons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Category configurations based on Figma design
export const CATEGORIES = [
  { 
    id: 'definition', 
    label: 'Definition', 
    color: '#EB5547', 
    bgColor: '#FCEAE8',
    iconComponent: CategoryIcons.definition
  },
  { 
    id: 'ursachen', 
    label: 'Ursachen', 
    color: '#003366', 
    bgColor: '#E5F2FF',
    iconComponent: CategoryIcons.ursachen
  },
  { 
    id: 'symptome', 
    label: 'Symptome', 
    color: '#004D99', 
    bgColor: '#E5F2FF',
    iconComponent: CategoryIcons.symptome
  },
  { 
    id: 'diagnostik', 
    label: 'Diagnostik', 
    color: '#3399FF', 
    bgColor: '#E5F2FF',
    iconComponent: CategoryIcons.diagnostik
  },
  { 
    id: 'therapie', 
    label: 'Therapie', 
    color: '#52C41A', 
    bgColor: '#ECF9EB',
    iconComponent: CategoryIcons.therapie
  },
  { 
    id: 'algorithmus', 
    label: 'Algorithmus', 
    color: '#47D1C6', 
    bgColor: '#E8FAF9',
    iconComponent: CategoryIcons.algorithmus
  },
  { 
    id: 'merke', 
    label: 'Merke', 
    color: '#FAAD14', 
    bgColor: '#FFF7E6',
    iconComponent: CategoryIcons.merke
  },
  { 
    id: 'disposition', 
    label: 'Disposition', 
    color: '#B27700', 
    bgColor: '#FFF7E6',
    iconComponent: CategoryIcons.disposition
  },
  { 
    id: 'ablaeufe', 
    label: 'Abläufe', 
    color: '#524714', 
    bgColor: '#FAF8EB',
    iconComponent: CategoryIcons.ablaeufe
  },
  { 
    id: 'differenzial', 
    label: 'Differenzial', 
    color: '#9254DE', 
    bgColor: '#F5ECFE',
    iconComponent: CategoryIcons.differenzial
  },
  { 
    id: 'studie', 
    label: 'Studie', 
    color: '#DB70C1', 
    bgColor: '#FCF0F9',
    iconComponent: CategoryIcons.studie
  },
  { 
    id: 'sonstiges', 
    label: 'Sonstiges', 
    color: '#B3B3B3', 
    bgColor: '#F5F5F5',
    iconComponent: CategoryIcons.sonstiges
  },
];

const ContentBoxBlock = ({ 
  content, 
  onChange, 
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
  blockId,
  usedCategories = [],
  onAddBoxAfter,
  isRightColumn = false,
  iconOnRight = false,
}) => {
  // Initialize content structure helper
  const getInitializedContent = (contentToInit) => {
    if (!contentToInit || typeof contentToInit === 'string' || !contentToInit.category) {
      return {
        category: 'definition',
        blocks: [{ id: Date.now().toString(), type: 'text', content: '' }]
      };
    }
    return contentToInit;
  };

  const initialContent = getInitializedContent(content);
  const [contentData, setContentData] = useState(initialContent);
  const [selectedCategory, setSelectedCategory] = useState(
    initialContent.category || 'definition'
  );
  const [innerBlocks, setInnerBlocks] = useState(
    initialContent.blocks || [{ id: Date.now().toString(), type: 'text', content: '' }]
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIconPressed, setIsIconPressed] = useState(false);
  const containerRef = useRef(null);
  
  // Use ref to track if we're updating from parent to prevent infinite loop
  const isUpdatingFromParent = useRef(false);
  const lastContentRef = useRef(JSON.stringify(content));

  // Sync with external content changes - only if content actually changed
  useEffect(() => {
    const currentContentStr = JSON.stringify(content);
    if (currentContentStr !== lastContentRef.current) {
      lastContentRef.current = currentContentStr;
      isUpdatingFromParent.current = true;
      const initialized = getInitializedContent(content);
      setContentData(initialized);
      setSelectedCategory(initialized.category || 'definition');
      setInnerBlocks(initialized.blocks || [{ id: Date.now().toString(), type: 'text', content: '' }]);
      // Reset flag after state updates
      setTimeout(() => {
        isUpdatingFromParent.current = false;
      }, 0);
    }
  }, [content]);

  const category = CATEGORIES.find(cat => cat.id === selectedCategory) || CATEGORIES[0];

  // Define updateContent first so other functions can reference it
  const updateContent = useCallback((category, blocks) => {
    // Don't call onChange if we're currently updating from parent
    if (isUpdatingFromParent.current) {
      return;
    }
    
    const newContent = {
      category,
      blocks,
    };
    
    // Only call onChange if content actually changed
    const newContentStr = JSON.stringify(newContent);
    if (newContentStr !== lastContentRef.current) {
      lastContentRef.current = newContentStr;
      onChange(newContent);
    }
  }, [onChange]);

  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    updateContent(categoryId, innerBlocks);
  }, [innerBlocks, updateContent]);

  const handleAddInnerBlock = useCallback((type, afterId = null) => {
    // Only allow text blocks inside content boxes
    const newBlock = {
      id: Date.now().toString(),
      type: 'text',
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
      updateContent(selectedCategory, updatedBlocks);
      return updatedBlocks;
    });

    return newBlock.id;
  }, [selectedCategory, updateContent]);

  const handleUpdateInnerBlock = useCallback((id, blockContent) => {
    setInnerBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks.map(block =>
        block.id === id ? { ...block, content: blockContent } : block
      );
      updateContent(selectedCategory, updatedBlocks);
      return updatedBlocks;
    });
  }, [selectedCategory, updateContent]);

  const handleDeleteInnerBlock = useCallback((id) => {
    setInnerBlocks(prevBlocks => {
      const filtered = prevBlocks.filter(block => block.id !== id);
      // Ensure at least one block remains
      const updatedBlocks = filtered.length === 0 
        ? [{ id: Date.now().toString(), type: 'text', content: '' }]
        : filtered;
      updateContent(selectedCategory, updatedBlocks);
      return updatedBlocks;
    });
  }, [selectedCategory, updateContent]);

  const handleCategorySelect = (categoryId) => {
    // Don't allow selecting already used categories (except the current one)
    if (usedCategories.includes(categoryId) && categoryId !== selectedCategory) {
      return;
    }
    handleCategoryChange(categoryId);
  };

  const handleAddBoxCategorySelect = (categoryId) => {
    if (!onAddBoxAfter) return;
    if (usedCategories.includes(categoryId)) {
      return;
    }
    onAddBoxAfter(categoryId);
    setIsDropdownOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`content-box-block mb-6 relative group z-auto ${isDragging ? 'dragging-box' : ''} ${isIconPressed ? 'scale-[0.995] opacity-90' : ''}`} 
      style={{ 
        pageBreakInside: 'avoid', 
        breakInside: 'avoid',
        transition: isDragging ? 'none' : 'opacity 0.2s ease, transform 0.1s ease',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      data-draggable="true"
    >
      {/* Hover controls similar to Notion */}
      <div 
        className={`notion-box-controls no-print ${!isRightColumn ? 'notion-box-controls-left' : ''} ${isDropdownOpen ? 'dropdown-open' : ''}`} 
      >
        <button
          type="button"
          className="notion-control-button"
          style={{ backgroundColor: category.color }}
          draggable
          aria-label="Box verschieben"
          title="Box verschieben"
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
                style={{ backgroundColor: category.color }}
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
              onPointerDownOutside={(e) => {
                // Prevent closing when clicking on the trigger
                if (e.target.closest('.notion-control-button')) {
                  e.preventDefault();
                }
              }}
              onInteractOutside={(e) => {
                // Keep buttons visible when interacting with menu
                if (e.target.closest('.notion-box-controls')) {
                  e.preventDefault();
                }
              }}
            >
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Box hinzufügen
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <button
          type="button"
          className="notion-control-button"
          style={{ backgroundColor: category.color }}
          aria-label="Content-Box löschen"
          title="Content-Box löschen"
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

      {/* Content Box - Figma Structure: Icon left (or right for right column in two-column layout), Box, Caption on top border */}
      <div className={`flex items-center mb-[-7px] relative w-full ${iconOnRight ? 'flex-row-reverse' : ''}`} style={{ overflow: 'visible' }}>
        {/* Icon - Oval - Draggable (Editor only) */}
        <div 
          className={`icon-container flex items-center justify-center ${iconOnRight ? 'ml-[-14px]' : 'mr-[-14px]'} relative shrink-0 z-10 no-print`} 
          style={{ overflow: 'visible', cursor: 'grab' }}
          draggable={true}
          onDragStart={(e) => {
            e.stopPropagation();
            
            // Set custom drag image to the whole box
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              e.dataTransfer.setDragImage(containerRef.current, x, y);
            }
            
            if (onDragStart) {
              onDragStart(e);
            }
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            setIsIconPressed(false);
            if (onDragEnd) {
              onDragEnd(e);
            }
          }}
          onMouseDown={(e) => {
            setIsIconPressed(true);
            e.currentTarget.style.cursor = 'grabbing';
            // Also change cursor on parent box
            const box = e.currentTarget.closest('.content-box-block');
            if (box) {
              box.style.cursor = 'grabbing';
            }
          }}
          onMouseUp={(e) => {
            setIsIconPressed(false);
            e.currentTarget.style.cursor = 'grab';
            const box = e.currentTarget.closest('.content-box-block');
            if (box) {
              box.style.cursor = '';
            }
          }}
          onMouseLeave={() => setIsIconPressed(false)}
        >
          <div 
            className={`h-[42px] w-[28px] rounded-[1000px] flex items-center justify-center transition-opacity ${isDragging ? 'opacity-50' : ''}`}
            style={{ backgroundColor: category.bgColor }}
          >
            <div 
              className="flex items-center justify-center"
              style={{ color: category.color }}
            >
              {category.iconComponent}
            </div>
          </div>
        </div>
        
        {/* Icon for print */}
        <div 
          className={`hidden print:flex items-center justify-center ${iconOnRight ? 'ml-[-14px]' : 'mr-[-14px]'} relative shrink-0 z-10`}
          style={{ overflow: 'visible' }}
        >
          <div 
            className="h-[42px] w-[28px] rounded-[1000px] flex items-center justify-center"
            style={{ backgroundColor: category.bgColor }}
          >
            <div 
              className="flex items-center justify-center"
              style={{ color: category.color }}
            >
              {category.iconComponent}
            </div>
          </div>
        </div>
        
        {/* Text container - Box with colored border */}
        <div className="relative flex-1 min-w-0">
          <div 
            className="bg-white border-[1.8px] border-solid relative rounded-[6px] min-h-[50px] w-full notion-box-shell"
            style={{
              borderColor: category.color,
            }}
          >
            {/* Caption on top border - left-aligned with text, vertically centered on border */}
            <div 
              className={`caption-container absolute left-[26px] z-20`} 
              style={{ top: '-10px' }}
            >
              <div className="relative">
                {/* Caption Box - clickable in editor, static in print */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div
                      className="border-2 border-solid border-white box-border flex items-center relative shrink-0 no-print cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: category.color,
                        borderRadius: '6px',
                        padding: '4px 8px',
                      }}
                    >
                      <p 
                        className="font-semibold italic text-[10px] text-white uppercase tracking-[1.05px] whitespace-nowrap leading-[10px]"
                        style={{ fontFamily: "'Roboto', sans-serif" }}
                      >
                        {category.label}
                      </p>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start" sideOffset={4} collisionPadding={{ top: 24, right: 24, bottom: 24, left: 24 }} avoidCollisions={true}>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Kategorie ändern
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {CATEGORIES.map((cat) => {
                      const isUsed = usedCategories.includes(cat.id) && cat.id !== selectedCategory;
                      return (
                        <DropdownMenuItem
                          key={cat.id}
                          disabled={isUsed}
                          onClick={() => handleCategorySelect(cat.id)}
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
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Static caption for print */}
                <div
                  className="caption-box-print border-2 border-solid border-white box-border flex items-center relative shrink-0 hidden print:block"
                  style={{
                    backgroundColor: category.color,
                    borderRadius: '6px',
                    padding: '4px 8px',
                  }}
                >
                  <p 
                    className="font-semibold italic text-[10px] text-white uppercase tracking-[1.05px] whitespace-nowrap leading-[10px]"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    {category.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Content area */}
            <div 
              className="content-box-content flex flex-col gap-[8px] pt-[24px] px-[26px]"
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: '12px',
                lineHeight: 1.5,
                fontWeight: 400
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
      </div>
    </div>
  );
};

export default ContentBoxBlock;
