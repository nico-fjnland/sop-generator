import React from 'react';
import { createPortal } from 'react-dom';
import { TextB, TextItalic, TextUnderline, TextTSlash, TextSuperscript, TextSubscript, TextAa, ListBullets } from '@phosphor-icons/react';
import { Toggle } from './ui/toggle';

const TOOLBAR_BUTTONS = [
  { id: 'bold', icon: TextB, label: 'Fett', command: 'bold' },
  { id: 'italic', icon: TextItalic, label: 'Kursiv', command: 'italic' },
  { id: 'underline', icon: TextUnderline, label: 'Unterstreichen', command: 'underline' },
  { id: 'fontSize', icon: TextAa, label: 'Kleinere Schrift', command: 'fontSize' },
  { id: 'superscript', icon: TextSuperscript, label: 'Hochgestellt', command: 'superscript' },
  { id: 'subscript', icon: TextSubscript, label: 'Tiefgestellt', command: 'subscript' },
  { id: 'bulletList', icon: ListBullets, label: 'Aufzählungsliste', command: 'bulletList' },
  { id: 'clear', icon: TextTSlash, label: 'Formatierung entfernen', command: 'removeFormat' },
];

const InlineTextToolbar = ({
  visible,
  position = { top: 0, left: 0 },
  activeStates = {},
  onCommand,
  usePortal = true, // Set to false when used with TipTap's BubbleMenu
}) => {
  if (!visible) {
    return null;
  }

  const toolbar = (
    <div
      className="inline-text-toolbar pointer-events-auto flex items-center gap-0.5 p-1 bg-popover rounded-lg border border-border"
      style={usePortal ? {
        top: Math.max(position.top, 8),
        left: position.left,
      } : {}}
    >
      {TOOLBAR_BUTTONS.map((button) => {
        const Icon = button.icon;
        const isActive = activeStates[button.id];
        const isClearButton = button.id === 'clear';
        return (
          <Toggle
            key={button.id}
            size="sm"
            pressed={isActive}
            aria-label={button.label}
            onMouseDown={(event) => {
              event.preventDefault();
              onCommand(button.command);
            }}
            className={`h-8 w-8 p-1 ${isClearButton ? 'hover:bg-red-50 [&_svg]:text-red-500 hover:[&_svg]:!text-red-600' : ''}`}
          >
            <Icon 
              size={16} 
              weight="bold" 
              style={{ width: '16px', height: '16px', flexShrink: 0 }} 
            />
          </Toggle>
        );
      })}
    </div>
  );

  // When used with TipTap's BubbleMenu, don't use portal (BubbleMenu handles it)
  return usePortal ? createPortal(toolbar, document.body) : toolbar;
};

export default InlineTextToolbar;


