import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ListBullets, TextT, Image as ImageIcon, ArrowCircleRight } from '@phosphor-icons/react';

const SLASH_COMMANDS = [
  {
    id: 'paragraph',
    title: 'Text',
    icon: TextT,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('paragraph')
        .run();
    },
  },
  {
    id: 'bulletList',
    title: 'Aufzählung',
    icon: ListBullets,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleBulletList()
        .run();
    },
  },
  {
    id: 'highlightItem',
    title: 'Auszeichnung',
    icon: ArrowCircleRight,
    iconWeight: 'fill',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHighlightItem()
        .run();
    },
  },
  {
    id: 'image',
    title: 'Bild',
    icon: ImageIcon,
    command: ({ editor, range }) => {
      // Create a hidden file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageUrl = event.target.result;
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setImage({ src: imageUrl })
              .run();
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    },
  },
];

const SlashMenu = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = SLASH_COMMANDS[index];
    if (item) {
      item.command({ ...props, onAddFlowchart: props.onAddFlowchart });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + SLASH_COMMANDS.length - 1) % SLASH_COMMANDS.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % SLASH_COMMANDS.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), []);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="slash-menu">
      {SLASH_COMMANDS.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`slash-menu-item ${index === selectedIndex ? 'is-selected' : ''}`}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Icon 
              size={16} 
              weight={item.iconWeight || 'regular'} 
              className={`slash-menu-icon ${item.id === 'highlightItem' ? 'highlight-icon' : ''}`}
            />
            <span className="slash-menu-title">{item.title}</span>
          </button>
        );
      })}
    </div>
  );
});

SlashMenu.displayName = 'SlashMenu';

export default SlashMenu;

