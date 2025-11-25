import React, { useState } from 'react';
import { Plus, ChevronDown, Check, Table } from 'lucide-react';
import { Button } from './ui/button';
import { CATEGORIES } from './blocks/ContentBoxBlock';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

// Additional elements that can be added (not content box categories)
const ADDITIONAL_ELEMENTS = [
  {
    id: 'tiptaptable',
    label: 'Tabelle',
    icon: Table,
    color: '#6366F1', // Indigo color for tables
    isBlockType: true, // Flag to indicate this is a block type, not a category
  },
];

const BoxTypeDropdown = ({ onSelect, onAddBlock, usedCategories = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (categoryId) => {
    // Don't allow selecting already used categories
    if (usedCategories.includes(categoryId)) {
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
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56" 
        align="start"
        collisionPadding={{ top: 24, right: 24, bottom: 24, left: 24 }}
        avoidCollisions={true}
        sideOffset={4}
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
                onClick={() => handleSelect(cat.id)}
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
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{element.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BoxTypeDropdown;
