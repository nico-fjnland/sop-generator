import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NotePencil, X, Plus, Table, Quotes, SortAscending, Infinity, Check } from '@phosphor-icons/react';
import Block from '../Block';
import { CategoryIconComponents } from '../icons/CategoryIcons';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Additional elements that can be added (not content box categories)
export const ADDITIONAL_ELEMENTS = [
  {
    id: 'tiptaptable',
    label: 'Tabelle',
    icon: Table,
    color: '#003366', // Dark blue color for tables
    isBlockType: true,
  },
  {
    id: 'source',
    label: 'Quellen',
    icon: Quotes,
    color: '#808080', // Gray color for sources
    isBlockType: true,
  },
];

// Category configurations based on Figma design
// Order: Definition, Ursachen, Symptome, Diagnostik, Differenzial, Therapie, Algorithmus, Merke, Disposition, Sonstiges, Abläufe, Studie
export const CATEGORIES = [
  { 
    id: 'definition', 
    label: 'Definition', 
    color: '#EB5547', 
    bgColor: '#FCEAE8',
    maxUsage: 1
  },
  { 
    id: 'ursachen', 
    label: 'Ursachen', 
    color: '#003366', 
    bgColor: '#E5F2FF',
    maxUsage: 1
  },
  { 
    id: 'symptome', 
    label: 'Symptome', 
    color: '#004D99', 
    bgColor: '#E5F2FF',
    maxUsage: 1
  },
  { 
    id: 'diagnostik', 
    label: 'Diagnostik', 
    color: '#3399FF', 
    bgColor: '#E5F2FF',
    maxUsage: 1
  },
  { 
    id: 'differenzial', 
    label: 'Differenzial', 
    color: '#9254DE', 
    bgColor: '#F5ECFE',
    maxUsage: 1
  },
  { 
    id: 'therapie', 
    label: 'Therapie', 
    color: '#52C41A', 
    bgColor: '#ECF9EB',
    maxUsage: 1
  },
  { 
    id: 'algorithmus', 
    label: 'Algorithmus', 
    color: '#47D1C6', 
    bgColor: '#E8FAF9',
    maxUsage: 1
  },
  { 
    id: 'merke', 
    label: 'Merke', 
    color: '#FAAD14', 
    bgColor: '#FFF7E6',
    maxUsage: 1
  },
  { 
    id: 'disposition', 
    label: 'Disposition', 
    color: '#B27700', 
    bgColor: '#FFF7E6',
    maxUsage: 1
  },
  { 
    id: 'sonstiges', 
    label: 'Sonstiges', 
    color: '#B3B3B3', 
    bgColor: '#F5F5F5',
    maxUsage: 3
  },
  { 
    id: 'ablaeufe', 
    label: 'Abläufe', 
    color: '#524714', 
    bgColor: '#FAF8EB',
    maxUsage: 1
  },
  { 
    id: 'studie', 
    label: 'Studie', 
    color: '#DB70C1', 
    bgColor: '#FCF0F9',
    maxUsage: 1
  },
];

// Helper function to get icon component with colors
const getIconWithColors = (categoryId, color, bgColor) => {
  const IconComponent = CategoryIconComponents[categoryId];
  if (IconComponent) {
    return IconComponent({ color, bgColor });
  }
  return null;
};

const ContentBoxBlock = ({ 
  content, 
  onChange, 
  onDelete,
  isDragging,
  blockId,
  usedCategories = [],
  onAddBoxAfter,
  onAddBlockAfter, // For adding block types (like tables)
  onSortBlocks, // For sorting content boxes to default order
  isRightColumn = false,
  iconOnRight = false,
  dragHandleProps = {}, // dnd-kit drag handle props
}) => {
  // Initialize content structure helper
  const getInitializedContent = (contentToInit) => {
    if (!contentToInit || typeof contentToInit === 'string' || !contentToInit.category) {
      return {
        category: 'definition',
        blocks: [{ id: Date.now().toString(), type: 'text', content: '' }],
        customLabel: null,
        isTwoColumn: false,
        customColor: null,
      };
    }
    // For algorithmus category, ensure it has a flowchart block
    if (contentToInit.category === 'algorithmus' && contentToInit.blocks) {
      const hasFlowchart = contentToInit.blocks.some(b => b.type === 'flowchart');
      if (!hasFlowchart) {
        return {
          ...contentToInit,
          customLabel: contentToInit.customLabel ?? null,
          isTwoColumn: contentToInit.isTwoColumn ?? false,
          customColor: contentToInit.customColor ?? null,
          blocks: [{ 
            id: Date.now().toString(), 
            type: 'flowchart', 
            content: { 
              nodes: [{ id: '1', type: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' } }], 
              edges: [], 
              nodeIdCounter: 2,
              height: 300 // Smallest size
            } 
          }]
        };
      }
    }
    return {
      ...contentToInit,
      customLabel: contentToInit.customLabel ?? null,
      isTwoColumn: contentToInit.isTwoColumn ?? false,
      customColor: contentToInit.customColor ?? null,
    };
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
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isIconPressed, setIsIconPressed] = useState(false);
  
  // Box settings state
  const [customLabel, setCustomLabel] = useState(initialContent.customLabel || '');
  const [isTwoColumn, setIsTwoColumn] = useState(initialContent.isTwoColumn || false);
  const [customColor, setCustomColor] = useState(initialContent.customColor || '');
  
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
      setCustomLabel(initialized.customLabel || '');
      setIsTwoColumn(initialized.isTwoColumn || false);
      setCustomColor(initialized.customColor || '');
      // Reset flag after state updates
      setTimeout(() => {
        isUpdatingFromParent.current = false;
      }, 0);
    }
  }, [content]);

  const category = CATEGORIES.find(cat => cat.id === selectedCategory) || CATEGORIES[0];

  // Count how many times each category is used
  const categoryUsageCount = useMemo(() => {
    const counts = {};
    usedCategories.forEach(catId => {
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [usedCategories]);

  // Define updateContent first so other functions can reference it
  const updateContent = useCallback((category, blocks, settings = {}) => {
    // Don't call onChange if we're currently updating from parent
    if (isUpdatingFromParent.current) {
      return;
    }
    
    const newContent = {
      category,
      blocks,
      customLabel: settings.customLabel !== undefined ? settings.customLabel : customLabel || null,
      isTwoColumn: settings.isTwoColumn !== undefined ? settings.isTwoColumn : isTwoColumn,
      customColor: settings.customColor !== undefined ? settings.customColor : customColor || null,
    };
    
    // Only call onChange if content actually changed
    const newContentStr = JSON.stringify(newContent);
    if (newContentStr !== lastContentRef.current) {
      lastContentRef.current = newContentStr;
      onChange(newContent);
    }
  }, [onChange, customLabel, isTwoColumn, customColor]);

  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    
    // If switching to algorithmus, replace blocks with a flowchart
    if (categoryId === 'algorithmus') {
      const hasFlowchart = innerBlocks.some(b => b.type === 'flowchart');
      if (!hasFlowchart) {
        const flowchartBlocks = [{ 
          id: Date.now().toString(), 
          type: 'flowchart', 
          content: { 
            nodes: [{ id: '1', type: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' } }], 
            edges: [], 
            nodeIdCounter: 2,
            height: 300 // Smallest size
          } 
        }];
        setInnerBlocks(flowchartBlocks);
        updateContent(categoryId, flowchartBlocks);
        return;
      }
    }
    
    updateContent(categoryId, innerBlocks);
  }, [innerBlocks, updateContent]);

  const handleAddInnerBlock = useCallback((type, afterId = null) => {
    // Allow text and flowchart blocks inside content boxes
    const newBlock = {
      id: Date.now().toString(),
      type: type || 'text',
      content: type === 'flowchart' ? { nodes: [{ id: '1', type: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' } }], edges: [], nodeIdCounter: 2 } : '',
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
      // Schedule updateContent after setState completes to avoid updating parent during render
      setTimeout(() => updateContent(selectedCategory, updatedBlocks), 0);
      return updatedBlocks;
    });

    return newBlock.id;
  }, [selectedCategory, updateContent]);

  const handleUpdateInnerBlock = useCallback((id, blockContent) => {
    setInnerBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks.map(block =>
        block.id === id ? { ...block, content: blockContent } : block
      );
      // Schedule updateContent after setState completes to avoid updating parent during render
      setTimeout(() => updateContent(selectedCategory, updatedBlocks), 0);
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
      // Schedule updateContent after setState completes to avoid updating parent during render
      setTimeout(() => updateContent(selectedCategory, updatedBlocks), 0);
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
    const category = CATEGORIES.find(c => c.id === categoryId);
    const usageCount = categoryUsageCount[categoryId] || 0;
    const maxUsage = category?.maxUsage || 1;
    if (usageCount >= maxUsage) {
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

  // Settings handlers
  const handleCustomLabelChange = useCallback((value) => {
    setCustomLabel(value);
    setTimeout(() => updateContent(selectedCategory, innerBlocks, { customLabel: value || null }), 0);
  }, [selectedCategory, innerBlocks, updateContent]);

  const handleTwoColumnToggle = useCallback((checked) => {
    setIsTwoColumn(checked);
    
    // When enabling two-column mode, ensure there's a second block for the right column
    if (checked && innerBlocks.length === 1) {
      const newBlock = {
        id: Date.now().toString(),
        type: 'text',
        content: '',
      };
      const updatedBlocks = [...innerBlocks, newBlock];
      setInnerBlocks(updatedBlocks);
      setTimeout(() => updateContent(selectedCategory, updatedBlocks, { isTwoColumn: checked }), 0);
    } else {
      setTimeout(() => updateContent(selectedCategory, innerBlocks, { isTwoColumn: checked }), 0);
    }
  }, [selectedCategory, innerBlocks, updateContent]);

  const handleColorSelect = useCallback((color) => {
    // If selecting the current category's default color, reset to null
    const newColor = color === category.color ? '' : color;
    setCustomColor(newColor);
    setTimeout(() => updateContent(selectedCategory, innerBlocks, { customColor: newColor || null }), 0);
  }, [selectedCategory, innerBlocks, updateContent, category.color]);

  // Compute the effective color (custom or category default)
  const effectiveColor = customColor || category.color;
  
  // Convert hex color to a light, opaque background color (mix with white)
  const hexToLightBg = (hex, lightness = 0.88) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Mix with white (255, 255, 255) based on lightness factor
    const lightR = Math.round(r + (255 - r) * lightness);
    const lightG = Math.round(g + (255 - g) * lightness);
    const lightB = Math.round(b + (255 - b) * lightness);
    return `rgb(${lightR}, ${lightG}, ${lightB})`;
  };
  
  const effectiveBgColor = customColor 
    ? hexToLightBg(customColor, 0.88) // Light, opaque version of the color
    : category.bgColor;

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
    >
      {/* Hover controls similar to Notion */}
      <div 
        className={`notion-box-controls no-print ${!isRightColumn ? 'notion-box-controls-left' : ''} ${isDropdownOpen || isSettingsDropdownOpen ? 'dropdown-open' : ''}`} 
      >
        {/* Settings Button with Dropdown */}
        <DropdownMenu open={isSettingsDropdownOpen} onOpenChange={setIsSettingsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="notion-control-button"
              style={{ backgroundColor: effectiveColor }}
              aria-label="Box-Einstellungen"
              title="Box-Einstellungen"
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
            onPointerDownOutside={(e) => {
              if (e.target.closest('.notion-control-button')) {
                e.preventDefault();
              }
            }}
            onInteractOutside={(e) => {
              if (e.target.closest('.notion-box-controls')) {
                e.preventDefault();
              }
            }}
          >
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Box-Einstellungen
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Custom Label Input */}
            <div className="px-2 py-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Name
              </label>
              <Input
                type="text"
                value={customLabel}
                onChange={(e) => handleCustomLabelChange(e.target.value)}
                placeholder={category.label}
                className="h-8 text-sm"
              />
            </div>
            
            <DropdownMenuSeparator />
            
            {/* Two Column Toggle */}
            <div 
              className="flex items-center justify-between px-2 py-2 cursor-pointer hover:bg-accent rounded-sm transition-colors"
              onClick={() => handleTwoColumnToggle(!isTwoColumn)}
            >
              <label className="text-xs font-medium text-muted-foreground cursor-pointer">
                Zweispaltigkeit
              </label>
              <Switch 
                checked={isTwoColumn} 
                onCheckedChange={handleTwoColumnToggle}
                className="data-[state=checked]:bg-primary scale-90"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <DropdownMenuSeparator />
            
            {/* Color Swatches */}
            <div className="px-2 py-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Farbe
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = effectiveColor === cat.color;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleColorSelect(cat.color)}
                      className={`w-7 h-7 rounded-md border-2 transition-all flex items-center justify-center ${
                        isSelected 
                          ? 'border-foreground scale-110' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: cat.color }}
                      title={cat.label}
                    >
                      {isSelected && (
                        <Check className="h-4 w-4 text-white" weight="bold" />
                      )}
                    </button>
                  );
                })}
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
                style={{ backgroundColor: effectiveColor }}
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
          style={{ backgroundColor: effectiveColor }}
          aria-label="Content-Box löschen"
          title="Content-Box löschen"
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

      {/* Content Box - Figma Structure: Icon left (or right for right column in two-column layout), Box, Caption on top border */}
      <div className={`flex items-center mb-[-7px] relative w-full ${iconOnRight ? 'flex-row-reverse' : ''}`} style={{ overflow: 'visible' }}>
        {/* Icon - Oval - Draggable (Editor only) */}
        <div 
          className={`icon-container flex items-center justify-center ${iconOnRight ? 'ml-[-14px]' : 'mr-[-14px]'} relative shrink-0 z-10 no-print touch-none`} 
          style={{ overflow: 'visible', cursor: isDragging ? 'grabbing' : 'grab' }}
          {...dragHandleProps}
          onMouseDown={(e) => {
            setIsIconPressed(true);
            // Call dnd-kit's onMouseDown if it exists
            if (dragHandleProps.onMouseDown) {
              dragHandleProps.onMouseDown(e);
            }
          }}
          onMouseUp={() => {
            setIsIconPressed(false);
          }}
          onMouseLeave={() => setIsIconPressed(false)}
        >
          <div 
            className={`flex items-center justify-center transition-opacity ${isDragging ? 'opacity-50' : ''}`}
          >
            {getIconWithColors(category.id, effectiveColor, effectiveBgColor)}
          </div>
        </div>
        
        {/* Icon for print */}
        <div 
          className={`hidden print:flex items-center justify-center ${iconOnRight ? 'ml-[-14px]' : 'mr-[-14px]'} relative shrink-0 z-10`}
          style={{ overflow: 'visible' }}
        >
          <div className="flex items-center justify-center">
            {getIconWithColors(category.id, effectiveColor, effectiveBgColor)}
          </div>
        </div>
        
        {/* Text container - Box with colored border */}
        <div className="relative flex-1 min-w-0">
          <div 
            className="bg-white border-[1.8px] border-solid relative rounded-[6px] min-h-[50px] w-full notion-box-shell"
            style={{
              borderColor: effectiveColor,
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
                      className="border-2 border-solid border-white box-border flex items-center relative shrink-0 no-print cursor-pointer"
                      style={{
                        backgroundColor: effectiveColor,
                        borderRadius: '6px',
                        padding: '4px 8px',
                      }}
                    >
                      <p 
                        className="font-semibold italic text-white uppercase tracking-[1.05px] whitespace-nowrap"
                        style={{ 
                          fontFamily: "'Roboto', sans-serif",
                          fontSize: '9px',
                          lineHeight: '9px'
                        }}
                      >
                        {customLabel || category.label}
                      </p>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start" sideOffset={4} collisionPadding={{ top: 24, right: 24, bottom: 24, left: 24 }} avoidCollisions={true}>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Kategorie ändern</span>
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
                      // For category change: allow selecting current category, but check max for others
                      const isCurrentCategory = cat.id === selectedCategory;
                      const isMaxed = !isCurrentCategory && usageCount >= maxUsage;
                      return (
                        <DropdownMenuItem
                          key={cat.id}
                          disabled={isMaxed}
                          onClick={() => handleCategorySelect(cat.id)}
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
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Static caption for print */}
                <div
                  className="caption-box-print border-2 border-solid border-white box-border flex items-center relative shrink-0 hidden print:block"
                  style={{
                    backgroundColor: effectiveColor,
                    borderRadius: '6px',
                    padding: '4px 8px',
                  }}
                >
                  <p 
                    className="font-semibold italic text-white uppercase tracking-[1.05px] whitespace-nowrap"
                    style={{ 
                      fontFamily: "'Roboto', sans-serif",
                      fontSize: '9px',
                      lineHeight: '9px'
                    }}
                  >
                    {customLabel || category.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Content area */}
            <div 
              className={`content-box-content ${
                selectedCategory === 'algorithmus' && innerBlocks.length === 1 && innerBlocks[0].type === 'flowchart'
                  ? 'pt-0 px-0'
                  : 'pt-[24px] px-[26px]'
              } ${isTwoColumn ? 'two-column' : 'flex flex-col gap-[8px]'}`}
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: '12px',
                lineHeight: 1.5,
                fontWeight: 400,
                '--content-box-color': effectiveColor,
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
