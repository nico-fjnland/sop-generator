import React from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Underline, Pilcrow } from 'lucide-react';

const TOOLBAR_BUTTONS = [
  { id: 'bold', icon: Bold, label: 'Fett', command: 'bold' },
  { id: 'italic', icon: Italic, label: 'Kursiv', command: 'italic' },
  { id: 'underline', icon: Underline, label: 'Unterstreichen', command: 'underline' },
  { id: 'clear', icon: Pilcrow, label: 'Formatierung entfernen', command: 'removeFormat' },
];

const InlineTextToolbar = ({
  visible,
  position,
  activeStates = {},
  onCommand,
}) => {
  if (!visible) {
    return null;
  }

  const toolbar = (
    <div
      className="inline-text-toolbar pointer-events-auto"
      style={{
        top: Math.max(position.top, 8),
        left: position.left,
      }}
    >
      {TOOLBAR_BUTTONS.map((button) => {
        const Icon = button.icon;
        const isActive = activeStates[button.id];
        return (
          <button
            key={button.id}
            type="button"
            className={`inline-toolbar-button ${isActive ? 'active' : ''}`}
            aria-label={button.label}
            onMouseDown={(event) => {
              event.preventDefault();
              onCommand(button.command);
            }}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );

  return createPortal(toolbar, document.body);
};

export default InlineTextToolbar;


