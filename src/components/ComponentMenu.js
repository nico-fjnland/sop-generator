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
  // Respects 24px padding from viewport edges (same as ZoomBar)
  const getAdjustedPosition = () => {
    const EDGE_PADDING = 24; // Match page padding (same as ZoomBar)
    const menuWidth = 200;
    const menuHeight = components.length * 48; // Approximate height per item
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let adjustedTop = position.top;
    let adjustedLeft = position.left;
    
    // Adjust horizontal position to respect edge padding
    // Ensure menu doesn't exceed right boundary (with padding)
    const maxLeft = viewportWidth - menuWidth - EDGE_PADDING;
    // Ensure menu doesn't exceed left boundary (with padding)
    const minLeft = EDGE_PADDING;
    
    // Clamp horizontal position between min and max
    adjustedLeft = Math.max(minLeft, Math.min(adjustedLeft, maxLeft));
    
    // Adjust vertical position to respect edge padding
    // Ensure menu doesn't exceed bottom boundary (with padding)
    const maxTop = viewportHeight + window.scrollY - menuHeight - EDGE_PADDING;
    // Ensure menu doesn't exceed top boundary (with padding)
    const minTop = window.scrollY + EDGE_PADDING;
    
    // If menu would go off bottom, try to show it above the cursor instead
    if (adjustedTop > maxTop) {
      adjustedTop = position.top - menuHeight - 10;
      // Still ensure it respects top boundary
      adjustedTop = Math.max(minTop, adjustedTop);
    }
    
    // Clamp vertical position between min and max
    adjustedTop = Math.max(minTop, Math.min(adjustedTop, maxTop));
    
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

