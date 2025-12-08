import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { ListBullets, TextT, Image as ImageIcon, ArrowCircleRight } from '@phosphor-icons/react';

const SLASH_COMMANDS = [
  {
    id: 'paragraph',
    title: 'Text',
    keywords: ['text', 'paragraph', 'absatz'],
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
    keywords: ['liste', 'list', 'aufzählung', 'bullet', 'punkte'],
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
    keywords: ['auszeichnung', 'highlight', 'pfeil', 'arrow', 'wichtig'],
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
    keywords: ['bild', 'image', 'foto', 'photo', 'grafik'],
    icon: ImageIcon,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setImageUploadNode()
        .run();
    },
  },
];

const SlashMenu = forwardRef((props, ref) => {
  const { query } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return SLASH_COMMANDS;
    
    const lowerQuery = query.toLowerCase();
    return SLASH_COMMANDS.filter((item) => {
      // Match against title
      if (item.title.toLowerCase().includes(lowerQuery)) return true;
      // Match against keywords
      if (item.keywords?.some(keyword => keyword.includes(lowerQuery))) return true;
      return false;
    });
  }, [query]);

  const selectItem = (index) => {
    const item = filteredCommands[index];
    if (item) {
      item.command({ ...props, onAddFlowchart: props.onAddFlowchart });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + filteredCommands.length - 1) % filteredCommands.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % filteredCommands.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  // Reset selected index when query changes or when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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

  // Don't render if no matches
  if (filteredCommands.length === 0) {
    return (
      <div className="slash-menu">
        <div className="slash-menu-item" style={{ opacity: 0.5, cursor: 'default' }}>
          <span className="slash-menu-title">Keine Ergebnisse</span>
        </div>
      </div>
    );
  }

  return (
    <div className="slash-menu">
      {filteredCommands.map((item, index) => {
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

