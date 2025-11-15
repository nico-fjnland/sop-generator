import React, { useState, useEffect } from 'react';

const ListBlock = ({ content, onChange }) => {
  const [items, setItems] = useState(
    content && Array.isArray(content) ? content : ['']
  );

  // Sync state when content prop changes
  useEffect(() => {
    if (content && Array.isArray(content)) {
      setItems(content);
    }
  }, [content]);

  const updateItem = (index, value) => {
    const newItems = items.map((item, i) => (i === index ? value : item));
    setItems(newItems);
    onChange(newItems);
  };

  const addItem = () => {
    const newItems = [...items, ''];
    setItems(newItems);
    onChange(newItems);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      onChange(newItems);
    }
  };

  return (
    <div className="list-block my-4">
      <ul className="list-none pl-0">
        {items.map((item, index) => (
          <li key={`item-${index}`} className="flex items-start gap-2 mb-2">
            <span className="text-primary mt-1 print:text-black">•</span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                } else if (e.key === 'Backspace' && item === '' && items.length > 1) {
                  e.preventDefault();
                  removeItem(index);
                }
              }}
              className="flex-1 border-none outline-none bg-transparent text-foreground print:text-black"
              placeholder="Listeneintrag"
              aria-label={`Listeneintrag ${index + 1}`}
            />
          </li>
        ))}
      </ul>
      <button
        onClick={addItem}
        className="text-sm text-primary hover:underline mt-2 no-print"
        aria-label="Listeneintrag hinzufügen"
      >
        + Eintrag hinzufügen
      </button>
    </div>
  );
};

export default ListBlock;

