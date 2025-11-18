import React from 'react';
import { createPortal } from 'react-dom';
import { TextB, TextItalic, TextUnderline, TextTSlash, TextSuperscript, TextSubscript, TextAa } from '@phosphor-icons/react';

const TOOLBAR_BUTTONS = [
  { id: 'bold', icon: TextB, label: 'Fett', command: 'bold' },
  { id: 'italic', icon: TextItalic, label: 'Kursiv', command: 'italic' },
  { id: 'underline', icon: TextUnderline, label: 'Unterstreichen', command: 'underline' },
  { id: 'fontSize', icon: TextAa, label: 'Kleinere Schrift', command: 'fontSize' },
  { id: 'superscript', icon: TextSuperscript, label: 'Hochgestellt', command: 'superscript' },
  { id: 'subscript', icon: TextSubscript, label: 'Tiefgestellt', command: 'subscript' },
  { id: 'clear', icon: TextTSlash, label: 'Formatierung entfernen', command: 'removeFormat' },
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
            <Icon size={16} weight="bold" />
          </button>
        );
      })}
    </div>
  );

  return createPortal(toolbar, document.body);
};

export default InlineTextToolbar;


