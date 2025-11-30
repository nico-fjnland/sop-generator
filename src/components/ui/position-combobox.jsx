import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { 
  UserCircle, 
  MagnifyingGlass, 
  CaretUpDown,
  Check,
  X,
  Stethoscope
} from '@phosphor-icons/react';

// Static list of medical positions (highest to lowest)
const MEDICAL_POSITIONS = [
  { id: 'aerztlicher-direktor', label: 'Ärztlicher Direktor:in', description: 'Klinikleitung' },
  { id: 'chefarzt', label: 'Chefarzt:ärztin', description: 'Abteilungsleitung' },
  { id: 'leitender-oberarzt', label: 'Leitender Oberarzt:ärztin', description: 'Stellvertretende Leitung' },
  { id: 'oberarzt', label: 'Oberarzt:ärztin', description: 'Leitende Position' },
  { id: 'facharzt', label: 'Facharzt:ärztin', description: 'Abgeschlossene Facharztausbildung' },
  { id: 'assistenzarzt', label: 'Assistenzarzt:ärztin', description: 'Arzt:Ärztin in Weiterbildung' },
  { id: 'pj', label: 'PJ-Student:in', description: 'Praktisches Jahr' },
  { id: 'famulant', label: 'Famulant:in', description: 'Medizinstudent:in im Praktikum' },
];

/**
 * PositionCombobox - A searchable combobox for selecting medical positions
 * 
 * @param {Object} props
 * @param {string} props.value - Current position value
 * @param {function} props.onChange - Callback when position changes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the combobox is disabled
 */
export function PositionCombobox({
  value = '',
  onChange,
  placeholder = 'Position auswählen...',
  className,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter positions based on search term
  const filteredPositions = searchTerm.length > 0
    ? MEDICAL_POSITIONS.filter((pos) => 
        pos.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : MEDICAL_POSITIONS;

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedItem = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle position selection
  const handleSelect = useCallback((position) => {
    onChange?.(position.label);
    setSearchTerm('');
    setIsOpen(false);
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < filteredPositions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPositions[highlightedIndex]) {
          handleSelect(filteredPositions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  }, [isOpen, filteredPositions, highlightedIndex, handleSelect]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange?.(newValue);
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const displayValue = searchTerm || value;
  const selectedPosition = MEDICAL_POSITIONS.find(p => p.label === value);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input with trigger button */}
      <div className="relative">
        <MagnifyingGlass 
          size={18} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
        />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-16 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="position-listbox"
          aria-autocomplete="list"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {displayValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded transition-colors"
              tabIndex={-1}
              aria-label="Auswahl löschen"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
            tabIndex={-1}
            aria-label="Dropdown öffnen"
          >
            <CaretUpDown size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg"
          role="listbox"
          id="position-listbox"
        >
          <div ref={listRef} className="max-h-[300px] overflow-y-auto p-1">
            {filteredPositions.length > 0 ? (
              filteredPositions.map((position, index) => (
                <div
                  key={position.id}
                  data-index={index}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  onClick={() => handleSelect(position)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'relative flex cursor-pointer select-none items-start gap-3 rounded-sm px-3 py-2.5 text-sm outline-none transition-colors',
                    highlightedIndex === index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  )}
                >
                  <Stethoscope size={18} className="flex-shrink-0 mt-0.5 text-muted-foreground" weight="duotone" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{position.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {position.description}
                    </div>
                  </div>
                  {value === position.label && (
                    <Check size={16} className="flex-shrink-0 text-primary mt-0.5" weight="bold" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <div className="space-y-2">
                  <span>Keine Position gefunden</span>
                  <p className="text-xs">
                    Du kannst die Position auch manuell eingeben.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {MEDICAL_POSITIONS.length} Positionen verfügbar
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionCombobox;

