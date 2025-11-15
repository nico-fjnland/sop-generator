import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, X, Plus, Check } from 'lucide-react';
import Block from '../Block';
import { CategoryIcons } from '../icons/CategoryIcons';

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
    color: '#003366', 
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
    id: 'merke', 
    label: 'Merke', 
    color: '#FAAD14', 
    bgColor: '#FFF7E6',
    iconComponent: CategoryIcons.merke
  },
  { 
    id: 'disposition', 
    label: 'Disposition', 
    color: '#FAAD14', 
    bgColor: '#FFF7E6',
    iconComponent: CategoryIcons.disposition
  },
  { 
    id: 'differenzial', 
    label: 'Differenzial', 
    color: '#9254DE', 
    bgColor: '#F5ECFE',
    iconComponent: CategoryIcons.differenzial
  },
  { 
    id: 'sonstiges', 
    label: 'Sonstiges', 
    color: '#8C8C8C', 
    bgColor: '#F5F5F5',
    iconComponent: CategoryIcons.sonstiges
  },
  { 
    id: 'ablaeufe', 
    label: 'Organisationsabläufe', 
    color: '#FADB14', 
    bgColor: '#FAF8EB',
    iconComponent: CategoryIcons.ablaeufe
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
  const [isAddBoxMenuOpen, setIsAddBoxMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const captionRef = useRef(null);
  const addBoxButtonRef = useRef(null);
  const addBoxMenuRef = useRef(null);
  
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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        captionRef.current &&
        !captionRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const handleCaptionClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCategorySelect = (categoryId) => {
    // Don't allow selecting already used categories (except the current one)
    if (usedCategories.includes(categoryId) && categoryId !== selectedCategory) {
      return;
    }
    handleCategoryChange(categoryId);
    setIsDropdownOpen(false);
  };

  const handleAddBoxCategorySelect = (categoryId) => {
    if (!onAddBoxAfter) return;
    if (usedCategories.includes(categoryId)) {
      return;
    }
    onAddBoxAfter(categoryId);
    setIsAddBoxMenuOpen(false);
  };

  useEffect(() => {
    if (!isAddBoxMenuOpen) {
      return;
    }
    const handleClickOutside = (event) => {
      if (
        addBoxMenuRef.current &&
        !addBoxMenuRef.current.contains(event.target) &&
        addBoxButtonRef.current &&
        !addBoxButtonRef.current.contains(event.target)
      ) {
        setIsAddBoxMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddBoxMenuOpen]);

  return (
    <div 
      className={`content-box-block mb-6 relative group ${(isDropdownOpen || isAddBoxMenuOpen) ? 'z-[9997]' : ''} ${isDragging ? 'dragging-box' : ''}`} 
      style={{ 
        pageBreakInside: 'avoid', 
        breakInside: 'avoid',
        transition: isDragging ? 'none' : 'opacity 0.2s ease',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      data-draggable="true"
    >
      {/* Hover controls similar to Notion */}
      <div 
        className={`notion-box-controls no-print ${isRightColumn ? 'notion-box-controls-right' : ''}`} 
        style={{ zIndex: isAddBoxMenuOpen ? 10001 : undefined }}
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
        <div className="notion-control-with-menu">
          <button
            type="button"
            className="notion-control-button"
            style={{ backgroundColor: category.color }}
            aria-label="Box hinzufügen"
            title="Box hinzufügen"
            ref={addBoxButtonRef}
            onClick={(event) => {
              event.preventDefault();
              if (!onAddBoxAfter) {
                return;
              }
              setIsAddBoxMenuOpen((prev) => !prev);
            }}
          >
            <Plus className="h-4 w-4 text-white" strokeWidth={2} />
          </button>
          {isAddBoxMenuOpen && (
            <div className="notion-add-box-menu" ref={addBoxMenuRef}>
              <div className="notion-add-box-menu__label">Box hinzufügen</div>
              {CATEGORIES.map((cat) => {
                const isUsed = usedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isUsed}
                    className={`notion-add-box-menu__item ${isUsed ? 'disabled' : ''}`}
                    onClick={() => handleAddBoxCategorySelect(cat.id)}
                  >
                    <span
                      className="notion-add-box-menu__icon"
                      style={{ color: isUsed ? '#94a3b8' : cat.color }}
                    >
                      {cat.iconComponent}
                    </span>
                    <span className="notion-add-box-menu__text">{cat.label}</span>
                    {isUsed && (
                      <span className="notion-add-box-menu__check">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
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

      {/* Content Box - Figma Structure: Icon left, Box right, Caption on top border */}
      <div className={`flex items-center mb-[-7px] relative w-full ${isRightColumn ? 'flex-row-reverse' : ''}`} style={{ overflow: 'visible' }}>
        {/* Icon on the left (or right if isRightColumn) - Oval - Draggable (Editor only) */}
        <div 
          className={`icon-container flex items-center justify-center ${isRightColumn ? 'ml-[-14px]' : 'mr-[-14px]'} relative shrink-0 z-10 no-print`} 
          style={{ overflow: 'visible', cursor: 'grab' }}
          draggable={true}
          onDragStart={(e) => {
            // Prevent default drag image
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
          onMouseDown={(e) => {
            e.currentTarget.style.cursor = 'grabbing';
            // Also change cursor on parent box
            const box = e.currentTarget.closest('.content-box-block');
            if (box) {
              box.style.cursor = 'grabbing';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.cursor = 'grab';
            const box = e.currentTarget.closest('.content-box-block');
            if (box) {
              box.style.cursor = '';
            }
          }}
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
          className={`hidden print:flex items-center justify-center ${isRightColumn ? 'ml-[-14px]' : 'mr-[-14px]'} relative shrink-0 z-10`}
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
            className="bg-white border-[1.5px] border-solid relative rounded-[6px] min-h-[50px] w-full notion-box-shell"
            style={{
              borderColor: category.color,
            }}
          >
            {/* Caption on top border - left-aligned with text, vertically centered on border */}
            {/* Caption box height: 4px (top padding) + 12px (line-height) + 4px (bottom padding) = 20px */}
            {/* To center on border: move up by half the height = 10px */}
            <div 
              className={`caption-container absolute left-[26px] ${isDropdownOpen ? 'z-[9998]' : 'z-20'}`} 
              style={{ top: '-10px' }}
            >
              <div className="relative">
                {/* Caption Box - clickable in editor, static in print */}
                <div
                  ref={captionRef}
                  onClick={handleCaptionClick}
                  className="border-2 border-solid border-white box-border flex items-center relative shrink-0 no-print cursor-pointer hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: category.color,
                    borderRadius: '6px',
                    padding: '4px 8px',
                  }}
                >
                  <p 
                    className="font-semibold italic text-[8px] text-white uppercase tracking-[1.05px] whitespace-nowrap leading-[12px]"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    {category.label}
                  </p>
                </div>
                {/* Static caption for print */}
                <div
                  className="caption-box-print box-border flex items-center relative shrink-0 hidden print:block"
                  style={{
                    backgroundColor: category.color,
                    borderRadius: '6px',
                    padding: '4px 8px',
                  }}
                >
                  <p 
                    className="font-semibold italic text-[8px] text-white uppercase tracking-[1.05px] whitespace-nowrap leading-[12px]"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    {category.label}
                  </p>
                </div>
                
                {/* Dropdown Menu - only in editor */}
                {isDropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="notion-add-box-menu no-print"
                    style={{ position: 'absolute', top: '100%', left: '0', marginTop: '4px', zIndex: 10000 }}
                  >
                    <div className="notion-add-box-menu__label">Box hinzufügen</div>
                    {CATEGORIES.map((cat) => {
                      const isUsed = usedCategories.includes(cat.id) && cat.id !== selectedCategory;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          disabled={isUsed}
                          className={`notion-add-box-menu__item ${isUsed ? 'disabled' : ''}`}
                          onClick={() => handleCategorySelect(cat.id)}
                        >
                          <span
                            className="notion-add-box-menu__icon"
                            style={{ color: isUsed ? '#94a3b8' : cat.color }}
                          >
                            {cat.iconComponent}
                          </span>
                          <span className="notion-add-box-menu__text">{cat.label}</span>
                          {isUsed && (
                            <span className="notion-add-box-menu__check">
                              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Content area */}
            <div 
              className="content-box-content flex flex-col gap-[8px] pb-[20px] pt-[24px] px-[26px]"
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: '12px',
                lineHeight: '18px',
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
