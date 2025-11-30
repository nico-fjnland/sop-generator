import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { useKlinikAtlas } from '../../hooks/useKlinikAtlas';
import { 
  Buildings, 
  MagnifyingGlass, 
  MapPin, 
  CaretUpDown,
  Check,
  Spinner,
  X,
  Warning
} from '@phosphor-icons/react';

/**
 * HospitalCombobox - A searchable combobox for selecting hospitals from the Bundes-Klinik-Atlas
 * 
 * @param {Object} props
 * @param {string} props.value - Current hospital name value
 * @param {function} props.onChange - Callback when hospital name changes
 * @param {function} props.onSelect - Callback when a hospital is selected (receives full hospital object)
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the combobox is disabled
 */
export function HospitalCombobox({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Krankenhaus suchen...',
  className,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  
  const { 
    loading, 
    error, 
    isInitialized, 
    loadData, 
    filterHospitals, 
    totalCount 
  } = useKlinikAtlas();

  // Load data when combobox is first opened
  useEffect(() => {
    if (isOpen && !isInitialized) {
      loadData();
    }
  }, [isOpen, isInitialized, loadData]);

  // Filter hospitals based on search term
  const filteredHospitals = filterHospitals(searchTerm || value, 15);

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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle hospital selection
  const handleSelect = useCallback((hospital) => {
    onChange?.(hospital.name);
    onSelect?.(hospital);
    setSearchTerm('');
    setIsOpen(false);
  }, [onChange, onSelect]);

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
          prev < filteredHospitals.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredHospitals[highlightedIndex]) {
          handleSelect(filteredHospitals[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  }, [isOpen, filteredHospitals, highlightedIndex, handleSelect]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange?.(newValue);
    
    if (!isOpen && newValue.length >= 2) {
      setIsOpen(true);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (!isInitialized) {
      loadData();
    }
    setIsOpen(true);
  };

  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    onSelect?.(null);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && (searchTerm.length >= 2 || value.length >= 2 || loading);
  const displayValue = searchTerm || value;

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
          aria-controls="hospital-listbox"
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
      {showDropdown && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg"
          role="listbox"
          id="hospital-listbox"
        >
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Spinner size={16} className="animate-spin" />
              <span>Lade Krankenhausdaten...</span>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex items-center gap-2 p-4 text-sm text-destructive">
              <Warning size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Results list */}
          {!loading && !error && (
            <div ref={listRef} className="max-h-[300px] overflow-y-auto p-1">
              {filteredHospitals.length > 0 ? (
                filteredHospitals.map((hospital, index) => (
                  <div
                    key={hospital.id}
                    data-index={index}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    onClick={() => handleSelect(hospital)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'relative flex cursor-pointer select-none items-start gap-3 rounded-sm px-3 py-2.5 text-sm outline-none transition-colors',
                      highlightedIndex === index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    )}
                  >
                    <Buildings size={18} className="flex-shrink-0 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{hospital.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <MapPin size={12} />
                        <span className="truncate">
                          {hospital.zip} {hospital.city}
                          {hospital.beds > 0 && ` • ${hospital.beds} Betten`}
                        </span>
                      </div>
                    </div>
                    {value === hospital.name && (
                      <Check size={16} className="flex-shrink-0 text-primary mt-0.5" weight="bold" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchTerm.length < 2 ? (
                    <span>Mindestens 2 Zeichen eingeben...</span>
                  ) : (
                    <div className="space-y-2">
                      <span>Kein Krankenhaus gefunden</span>
                      <p className="text-xs">
                        Du kannst den Namen auch manuell eingeben.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer with info */}
          {!loading && !error && isInitialized && filteredHospitals.length > 0 && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              {totalCount.toLocaleString('de-DE')} Krankenhäuser im Verzeichnis
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HospitalCombobox;

