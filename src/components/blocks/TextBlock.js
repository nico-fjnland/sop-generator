import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Mark, mergeAttributes } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import InlineTextToolbar from '../InlineTextToolbar';
import SlashMenu from '../SlashMenu';
import { SlashCommand } from '../extensions/SlashCommand';
import './TextBlock.css';

// Custom extension for smaller font size (10px)
const SmallFont = Mark.create({
  name: 'smallFont',
  
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: node => node.style.fontSize === '10px' && null,
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { style: 'font-size: 10px' }), 0];
  },
  
  addCommands() {
    return {
      toggleSmallFont: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});

const TextBlock = forwardRef(({ content, onChange, onKeyDown, isInsideContentBox = false, onAddAfter, blockId }, ref) => {
  // For non-content-box blocks, use simple textarea
  const textareaRef = React.useRef(null);
  
  // State for toolbar
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  
  // Callback for adding flowchart blocks
  const handleAddFlowchart = React.useCallback(() => {
    if (onAddAfter && blockId) {
      onAddAfter('flowchart', blockId);
    }
  }, [onAddAfter, blockId]);
  
  // TipTap editor for content boxes
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure what we need from StarterKit
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list',
          },
        },
        listItem: {},
        bold: {},
        italic: {},
        // Disable heading, code blocks, etc. (not needed in content boxes)
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
        strike: false,
        hardBreak: true,
        paragraph: {
          HTMLAttributes: {
            class: 'tiptap-paragraph',
          },
        },
      }),
      Underline,
      Subscript,
      Superscript,
      SmallFont,
      Placeholder.configure({
        placeholder: 'Schreibe oder gib "/" für Befehle ein',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'tiptap-image',
        },
        inline: true,
        allowBase64: true,
      }),
      SlashCommand.configure({
        suggestion: {
          items: () => {
            return [];
          },
          render: () => {
            let component;
            let popup;

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashMenu, {
                  props: {
                    ...props,
                    onAddFlowchart: handleAddFlowchart,
                  },
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                  arrow: false,
                });
              },

              onUpdate(props) {
                component.updateProps({
                  ...props,
                  onAddFlowchart: handleAddFlowchart,
                });

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }

                return component.ref?.onKeyDown(props);
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Convert empty paragraph to empty string
      const cleanHtml = html === '<p></p>' ? '' : html;
      onChange(cleanHtml);
    },
  }, [isInsideContentBox]); // Removed onChange from dependencies - it causes re-creation!

  // Sync content from parent
  useEffect(() => {
    if (editor && isInsideContentBox) {
      const currentContent = editor.getHTML();
      const newContent = content || '';
      
      // Normalize for comparison
      const normalizedCurrent = currentContent === '<p></p>' ? '' : currentContent;
      const normalizedNew = newContent === '<p></p>' ? '' : newContent;
      
      // Only update if content actually changed and editor is not focused
      if (normalizedCurrent !== normalizedNew && !editor.isFocused) {
        editor.commands.setContent(newContent, false);
      }
    }
  }, [content, editor, isInsideContentBox]);

  // Handle selection changes and toolbar positioning
  useEffect(() => {
    if (!editor || !isInsideContentBox) return;

    const updateToolbar = () => {
      const { state } = editor;
      const { from, to } = state.selection;
      
      // Only show toolbar if there's a selection
      if (from === to) {
        setShowToolbar(false);
        return;
      }
      
      // Get selection coordinates
      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      
      // Calculate toolbar position (centered above selection)
      const left = (start.left + end.right) / 2;
      const top = start.top - 8; // 8px above selection
      
      setToolbarPosition({ top, left });
      setShowToolbar(true);
    };

    const handleSelectionUpdate = () => {
      updateToolbar();
    };

    const handleBlur = () => {
      setTimeout(() => {
        setShowToolbar(false);
      }, 200);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('focus', handleSelectionUpdate);
    editor.on('blur', handleBlur);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('focus', handleSelectionUpdate);
      editor.off('blur', handleBlur);
    };
  }, [editor, isInsideContentBox]);

  // Expose ref for focus functionality
  useImperativeHandle(ref, () => {
    if (isInsideContentBox && editor) {
      return {
        focus: () => editor.commands.focus(),
        blur: () => editor.commands.blur(),
      };
    } else if (!isInsideContentBox && textareaRef.current) {
      return textareaRef.current;
    }
    return null;
  }, [editor, isInsideContentBox]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const handleInput = (e) => {
    const minHeight = 18;
    e.target.style.height = 'auto';
    const newHeight = Math.max(e.target.scrollHeight, minHeight);
    e.target.style.height = newHeight + 'px';
  };

  // Get active formatting states for toolbar
  const getActiveFormats = () => {
    if (!editor) return {};
    return {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      fontSize: editor.isActive('smallFont'),
      superscript: editor.isActive('superscript'),
      subscript: editor.isActive('subscript'),
      bulletList: editor.isActive('bulletList'),
    };
  };

  // Handle toolbar commands
  const handleFormatCommand = (command) => {
    if (!editor) return;
    
    switch (command) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'fontSize':
        editor.chain().focus().toggleSmallFont().run();
        break;
      case 'superscript':
        editor.chain().focus().toggleSuperscript().run();
        break;
      case 'subscript':
        editor.chain().focus().toggleSubscript().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'removeFormat':
        editor.chain().focus().clearNodes().unsetAllMarks().run();
        break;
      default:
        break;
    }
  };

  // Inside content boxes: use TipTap rich-text editor
  if (isInsideContentBox) {
    if (!editor) {
      return null;
    }

    return (
      <>
        <div className="tiptap-wrapper relative w-full">
          <EditorContent editor={editor} />
        </div>
        <InlineTextToolbar
          visible={showToolbar}
          position={toolbarPosition}
          activeStates={getActiveFormats()}
          onCommand={handleFormatCommand}
          usePortal={true}
        />
      </>
    );
  }

  // Outside content boxes: always show textarea (original behavior)
  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onInput={handleInput}
      placeholder="Text eingeben..."
      className="w-full text-base text-foreground border-none outline-none bg-transparent resize-none min-h-[1.5rem] mb-2 print:text-black"
      rows={1}
      style={{
        height: 'auto',
        overflow: 'hidden',
      }}
      aria-label="Text-Block"
    />
  );
});

TextBlock.displayName = 'TextBlock';

export default TextBlock;
