import React, { useEffect, useRef, useState } from 'react';

const boxComponents = [
  { type: 'contentbox', label: 'Content-Box', icon: '📦' },
];

const textOnlyComponents = [
  { type: 'text', label: 'Text', icon: 'T' },
];

const ComponentMenu = ({ position, onSelect, onClose, figmaComponents = [], isInsideContentBox = false }) => {
  const [components, setComponents] = useState(isInsideContentBox ? textOnlyComponents : boxComponents);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  // Set components based on context
  useEffect(() => {
    if (isInsideContentBox) {
      setComponents(textOnlyComponents);
    } else {
      // Outside content boxes, only show box types
      if (figmaComponents && figmaComponents.length > 0) {
        // Add Figma components after box components
        setComponents([...boxComponents, ...figmaComponents]);
      } else {
        setComponents(boxComponents);
      }
    }
  }, [figmaComponents, isInsideContentBox]);

  // Reset selected index when menu opens
  useEffect(() => {
    setSelectedIndex(0);
  }, [components]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % components.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + components.length) % components.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(components[selectedIndex].type);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIndex, onSelect, onClose]);

  // Calculate position to prevent menu from going off-screen
  const getAdjustedPosition = () => {
    const menuWidth = 200;
    const menuHeight = components.length * 48; // Approximate height per item
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let adjustedTop = position.top;
    let adjustedLeft = position.left;
    
    // Adjust horizontal position if menu would go off-screen
    if (adjustedLeft + menuWidth > viewportWidth) {
      adjustedLeft = viewportWidth - menuWidth - 10;
    }
    if (adjustedLeft < 0) {
      adjustedLeft = 10;
    }
    
    // Adjust vertical position if menu would go off-screen
    if (adjustedTop + menuHeight > viewportHeight + window.scrollY) {
      adjustedTop = position.top - menuHeight - 10;
    }
    if (adjustedTop < window.scrollY) {
      adjustedTop = window.scrollY + 10;
    }
    
    return { top: adjustedTop, left: adjustedLeft };
  };

  const adjustedPosition = getAdjustedPosition();

  return (
    <div
      ref={menuRef}
      className="component-menu absolute z-50 bg-popover border border-border rounded-lg shadow-xl py-2 min-w-[200px] no-print"
      style={{
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`,
        position: 'fixed',
      }}
      role="menu"
      aria-label="Komponenten-Menü"
    >
      {components.map((component, index) => (
        <div
          key={component.type}
          className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${
            index === selectedIndex
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground text-foreground'
          }`}
          onClick={() => onSelect(component.type)}
          onMouseEnter={() => setSelectedIndex(index)}
          role="menuitem"
          aria-selected={index === selectedIndex}
        >
          <span className="w-8 h-8 flex items-center justify-center bg-muted rounded text-sm font-semibold">
            {component.icon}
          </span>
          <span className="font-medium">{component.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ComponentMenu;

