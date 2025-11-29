import { Node, mergeAttributes } from '@tiptap/core';

// Custom TipTap extension for "Auszeichnung" - a highlight item with arrow icon
export const HighlightItem = Node.create({
  name: 'highlightItem',
  
  group: 'block',
  
  content: 'inline*',
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="highlight-item"]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'highlight-item',
        class: 'highlight-item',
      }),
      // Icon span (not editable)
      ['span', { class: 'highlight-item-icon', contenteditable: 'false' }],
      // Content span (editable)
      ['span', { class: 'highlight-item-content' }, 0],
    ];
  },
  
  addCommands() {
    return {
      setHighlightItem: () => ({ commands }) => {
        return commands.setNode(this.name);
      },
      toggleHighlightItem: () => ({ commands, state }) => {
        const { selection } = state;
        const node = selection.$head.parent;
        
        if (node.type.name === this.name) {
          return commands.setNode('paragraph');
        }
        
        return commands.setNode(this.name);
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      // Enter at end of highlight item creates new paragraph
      'Enter': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const node = selection.$head.parent;
        
        if (node.type.name === this.name) {
          // If the highlight item is empty, convert to paragraph
          if (node.textContent === '') {
            return editor.commands.setNode('paragraph');
          }
          
          // Otherwise, insert a new paragraph after
          return editor.chain()
            .splitBlock()
            .setNode('paragraph')
            .run();
        }
        
        return false;
      },
      // Backspace at start of empty highlight item converts to paragraph
      'Backspace': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const node = selection.$head.parent;
        
        if (node.type.name === this.name) {
          // Check if cursor is at start and item is empty
          const pos = selection.$head.parentOffset;
          if (pos === 0 && node.textContent === '') {
            return editor.commands.setNode('paragraph');
          }
        }
        
        return false;
      },
    };
  },
});

export default HighlightItem;

