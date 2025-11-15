import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { Button } from './ui/button';
import { CATEGORIES } from './blocks/ContentBoxBlock';

const BoxTypeDropdown = ({ onSelect, usedCategories = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (categoryId) => {
    // Don't allow selecting already used categories
    if (usedCategories.includes(categoryId)) {
      return;
    }
    onSelect(categoryId);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5 no-print h-7 px-2 text-xs"
        aria-label="Box-Typ hinzufügen"
        aria-expanded={isOpen}
      >
        <Plus className="h-3 w-3" />
        <span>Box hinzufügen</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="notion-add-box-menu" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' }}>
          <div className="notion-add-box-menu__label">Box hinzufügen</div>
          {CATEGORIES.map((cat) => {
            const isUsed = usedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                disabled={isUsed}
                className={`notion-add-box-menu__item ${isUsed ? 'disabled' : ''}`}
                onClick={() => handleSelect(cat.id)}
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
  );
};

export default BoxTypeDropdown;

