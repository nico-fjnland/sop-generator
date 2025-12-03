import React, { useState, useMemo } from 'react';
import { Plus, CaretDown, SortAscending, Infinity } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { CATEGORIES, ADDITIONAL_ELEMENTS } from './blocks/ContentBoxBlock';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const BoxTypeDropdown = ({ onSelect, onAddBlock, onSortBlocks, usedCategories = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Count how many times each category is used
  const categoryUsageCount = useMemo(() => {
    const counts = {};
    usedCategories.forEach(catId => {
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [usedCategories]);

  const handleSelect = (categoryId) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    const usageCount = categoryUsageCount[categoryId] || 0;
    const maxUsage = category?.maxUsage || 1;
    
    // Don't allow selecting if max usage reached
    if (usageCount >= maxUsage) {
      return;
    }
    onSelect(categoryId);
    setIsOpen(false);
  };

  const handleAddElement = (elementId) => {
    if (onAddBlock) {
      onAddBlock(elementId);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5 no-print h-7 px-2 text-xs"
        aria-label="Box-Typ hinzufügen"
      >
        <Plus className="h-3 w-3" />
        <span>Box hinzufügen</span>
        <CaretDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} weight="bold" />
      </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56" 
        align="start"
        collisionPadding={{ top: 24, right: 24, bottom: 24, left: 24 }}
        avoidCollisions={true}
        sideOffset={4}
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
                onClick={() => handleSelect(cat.id)}
              className="flex items-center gap-2 cursor-pointer"
              >
                <span
                className="flex items-center justify-center w-4 h-4"
                style={{ color: isMaxed ? 'var(--muted-foreground)' : cat.color }}
                >
                  {cat.iconComponent}
                </span>
              <span className="flex-1">{cat.label}</span>
                <span className="text-[10px] tabular-nums">
                  {usageCount}/{maxUsage}
                </span>
            </DropdownMenuItem>
            );
          })}
        
        {/* Additional Elements Section */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Weitere Elemente
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ADDITIONAL_ELEMENTS.map((element) => {
          const Icon = element.icon;
          return (
            <DropdownMenuItem
              key={element.id}
              onClick={() => handleAddElement(element.id)}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BoxTypeDropdown;
