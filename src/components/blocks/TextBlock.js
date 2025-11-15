import React, { forwardRef, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import InlineTextToolbar from '../InlineTextToolbar';

const TextBlock = forwardRef(({ content, onChange, onKeyDown, isInsideContentBox = false }, ref) => {
  const textareaRef = useRef(null);
  const editableRef = useRef(null);
  const skipNextCursorRestore = useRef(false);
  const isManualEdit = useRef(false);
  const tempDivRef = useRef(null); // Reusable div for HTML conversion
  const [isFocused, setIsFocused] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const BULLET_HTML = '&#8226;&nbsp;';
  const BULLET_TEXT = '\u2022\u00a0';
  const BULLET_LENGTH = BULLET_TEXT.length;
  const LIST_MARKER_PATTERN = /(^|<br\s*\/?>)(?:&nbsp;|\s)*([-*])\s+/gi;

  const assignRef = (node) => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(node);
    } else {
      ref.current = node;
    }
  };

  useEffect(() => {
    assignRef(isInsideContentBox ? editableRef.current : textareaRef.current);
  }, [isInsideContentBox]);

  const handleInput = (e) => {
    const minHeight = 18; // line-height
    e.target.style.height = 'auto';
    const newHeight = Math.max(e.target.scrollHeight, minHeight);
    e.target.style.height = newHeight + 'px';
  };

  const sanitizeHtml = (dirtyHtml = '') => {
    if (typeof window === 'undefined') return dirtyHtml || '';
    const container = document.createElement('div');
    container.innerHTML = dirtyHtml;
    const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR']);
    const elements = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, null);
    while (walker.nextNode()) {
      elements.push(walker.currentNode);
    }
    elements.forEach((node) => {
      if (!allowed.has(node.nodeName)) {
        const parent = node.parentNode;
        if (!parent) {
          node.remove();
          return;
        }
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
      } else {
        [...node.attributes].forEach((attr) => node.removeAttribute(attr.name));
      }
    });
    return container.innerHTML;
  };

  const convertMarkdownListsToBullets = (html = '') => {
    if (!html) return html;
    return html.replace(LIST_MARKER_PATTERN, '$1' + BULLET_HTML);
  };

  const normalizeHtml = (html = '') => {
    return html
      .replace(/<div><br><\/div>/gi, '<br>')
      .replace(/<div>/gi, '<br>')
      .replace(/<\/div>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<br><br><br>/gi, '<br><br>')
      .trim();
  };

  const convertContentToHtml = useCallback((value = '') => {
    if (!value) {
      return '';
    }
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value);
    let result;
    if (looksLikeHtml) {
      result = sanitizeHtml(value);
    } else {
      if (typeof window === 'undefined') {
        result = value.replace(/\n/g, '<br>');
      } else {
        // Reuse temp div instead of creating new one each time
        if (!tempDivRef.current) {
          tempDivRef.current = document.createElement('div');
        }
        tempDivRef.current.textContent = value;
        result = tempDivRef.current.innerHTML.replace(/\n/g, '<br>');
      }
    }
    return convertMarkdownListsToBullets(result);
  }, []);

  const syncContentFromDom = useCallback(() => {
    if (!editableRef.current) return;
    const sanitized = sanitizeHtml(editableRef.current.innerHTML);
    const normalized = normalizeHtml(sanitized);
    onChange(normalized);
    if (!normalized && editableRef.current.innerHTML) {
      editableRef.current.innerHTML = '';
    }
  }, [onChange]);

  const updateToolbarFromSelection = () => {
    if (!editableRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setShowToolbar(false);
      return;
    }
    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if (
      !editableRef.current.contains(anchorNode) ||
      !editableRef.current.contains(focusNode)
    ) {
      setShowToolbar(false);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setShowToolbar(false);
      return;
    }
    setToolbarPosition({
      top: rect.top - 16,
      left: rect.left + rect.width / 2,
    });
    setShowToolbar(true);
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        clear: false,
      });
    } catch {
      setActiveFormats({
        bold: false,
        italic: false,
        underline: false,
        clear: false,
      });
    }
  };

  useEffect(() => {
    if (!isInsideContentBox) return;
    if (!editableRef.current) return;
    
    // Don't update HTML if we're in the middle of a manual edit
    if (isManualEdit.current) {
      return;
    }
    
    const html = convertContentToHtml(content || '');
    if (editableRef.current.innerHTML !== html) {
      editableRef.current.innerHTML = html;
    }
  }, [content, isInsideContentBox]);

  useEffect(() => {
    if (!isInsideContentBox) return;
    const handleSelectionChange = () => {
      requestAnimationFrame(() => updateToolbarFromSelection());
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isInsideContentBox]);

  const handleEditableInput = () => {
    // Save cursor position before sync
    const caretOffset = getCaretCharacterOffset();
    syncContentFromDom();
    
    // Reset manual edit flag after sync completes
    setTimeout(() => {
      isManualEdit.current = false;
    }, 0);
    
    // Skip cursor restore if we just manually positioned it
    if (skipNextCursorRestore.current) {
      skipNextCursorRestore.current = false;
      return;
    }
    
    // Restore cursor position after sync
    if (caretOffset !== null) {
      requestAnimationFrame(() => {
        setCaretCharacterOffset(caretOffset);
      });
    }
  };

  const handleEditableKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const handled = handleEnterKeyForLists();
      if (!handled) {
        const inserted = document.execCommand('insertLineBreak');
        if (!inserted) {
          document.execCommand('insertHTML', false, '<br>');
        }
      }
      return;
    }
    if (event.key === ' ' && !event.shiftKey) {
      const converted = convertLineMarkerToBullet();
      if (converted) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === 'Escape') {
      setShowToolbar(false);
    }
    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    syncContentFromDom();
  };

  const handleFormatCommand = (command) => {
    if (!editableRef.current) return;
    editableRef.current.focus();
    document.execCommand(command, false);
    syncContentFromDom();
    updateToolbarFromSelection();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      setShowToolbar(false);
    }, 50);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const getNodeLength = (node) => {
    if (!node) return 0;
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.length;
    }
    if (node.nodeName === 'BR') {
      return 1;
    }
    return 0;
  };

  const getCaretCharacterOffset = () => {
    if (!editableRef.current) return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const walker = document.createTreeWalker(
      editableRef.current,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );
    let node = walker.currentNode;
    let offset = 0;

    while (node) {
      if (node === range.startContainer) {
        return offset + range.startOffset;
      }
      if (node !== editableRef.current) {
        offset += getNodeLength(node);
      }
      node = walker.nextNode();
    }
    return offset;
  };

  const setCaretCharacterOffset = (targetOffset) => {
    if (!editableRef.current || targetOffset === null) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    const walker = document.createTreeWalker(
      editableRef.current,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );
    let node = walker.currentNode;
    let offset = 0;

    while (node) {
      if (node !== editableRef.current) {
        const nodeLength = getNodeLength(node);
        if (offset + nodeLength >= targetOffset) {
          if (node.nodeType === Node.TEXT_NODE) {
            range.setStart(node, targetOffset - offset);
          } else {
            range.setStartAfter(node);
          }
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }
        offset += nodeLength;
      }
      node = walker.nextNode();
    }

    range.selectNodeContents(editableRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const getCurrentLineText = () => {
    if (!editableRef.current) return '';
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return '';
    
    let node = selection.anchorNode;
    if (!node) return '';
    
    // If we're in the editable div itself, return empty (no line content)
    if (node === editableRef.current) {
      return '';
    }
    
    // Get the text content of the current line
    // Walk backwards to find the start of the line (either start of editor or a BR)
    let lineText = '';
    let currentNode = node;
    let foundLineStart = false;
    
    // First, get text from current node up to cursor
    if (currentNode.nodeType === Node.TEXT_NODE) {
      lineText = currentNode.textContent.substring(0, selection.anchorOffset);
    }
    
    // Walk backwards through siblings to find line start
    while (currentNode && !foundLineStart) {
      const prev = currentNode.previousSibling;
      if (!prev) {
        // No more siblings, check if we're at the editor root
        if (currentNode.parentNode === editableRef.current) {
          foundLineStart = true;
          break;
        }
        currentNode = currentNode.parentNode;
        continue;
      }
      
      if (prev.nodeName === 'BR') {
        // Found line break - this is the start of our current line
        foundLineStart = true;
        break;
      }
      
      // Add text from previous nodes
      if (prev.nodeType === Node.TEXT_NODE) {
        lineText = prev.textContent + lineText;
      } else if (prev.nodeType === Node.ELEMENT_NODE && prev.nodeName !== 'BR') {
        lineText = prev.textContent + lineText;
      }
      
      currentNode = prev;
    }
    
    return lineText;
  };

  const getPreviousTextOrBreakNode = (node) => {
    if (!editableRef.current) return null;
    if (node.previousSibling) {
      node = node.previousSibling;
      while (node && node.lastChild) {
        node = node.lastChild;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        return { node, offset: node.textContent.length };
      }
      if (node.nodeName === 'BR') {
        return { node, offset: 0 };
      }
    } else if (node.parentNode && node.parentNode !== editableRef.current) {
      return getPreviousTextOrBreakNode(node.parentNode);
    }
    return null;
  };

  const removeCharactersBeforeCaret = (count) => {
    if (count <= 0) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    let remaining = count;
    let node = selection.anchorNode;
    let offset = selection.anchorOffset;

    while (node && remaining > 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        const take = Math.min(offset, remaining);
        if (take > 0) {
          const deleteRange = document.createRange();
          deleteRange.setStart(node, offset - take);
          deleteRange.setEnd(node, offset);
          deleteRange.deleteContents();
          remaining -= take;
          offset -= take;
          continue;
        }
      }
      const previous = getPreviousTextOrBreakNode(node);
      if (!previous) break;
      node = previous.node;
      offset = previous.offset;
    }
  };

  const convertLineMarkerToBullet = () => {
    if (!editableRef.current) return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
      return false;
    }

    const currentLine = getCurrentLineText().replace(/\u00a0/g, ' ');
    const trimmed = currentLine.trim();
    
    // Check if line is exactly "- " or "* "
    if (!/^[-*]$/.test(trimmed)) {
      return false;
    }
    
    // Set flag to prevent useEffect from overwriting our changes
    isManualEdit.current = true;
    
    // Create a range and extend it backwards to select the marker
    const range = selection.getRangeAt(0).cloneRange();
    const lineLength = currentLine.length;
    
    try {
      // Move range start back by the number of characters in the line
      range.setStart(range.startContainer, range.startOffset - lineLength);
      range.deleteContents();
      
      // Insert the bullet HTML
      const bulletNode = document.createTextNode('\u2022\u00a0');
      range.insertNode(bulletNode);
      
      // Move cursor after the bullet
      range.setStartAfter(bulletNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Set flag to skip cursor restore in next input event
      skipNextCursorRestore.current = true;
      
      return true;
    } catch (e) {
      console.error('Error converting marker to bullet:', e);
      isManualEdit.current = false;
      return false;
    }
  };

  const handleEnterKeyForLists = () => {
    if (!editableRef.current) return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    
    const currentLine = getCurrentLineText();
    const normalizedLine = currentLine.replace(/\u00a0/g, ' ');
    const trimmed = normalizedLine.trim();
    const isBulletLine = trimmed.startsWith('\u2022');

    if (!isBulletLine) {
      return false;
    }

    // Set flag to prevent useEffect from overwriting our changes
    isManualEdit.current = true;

    // Check if there's text after the bullet (beyond just the bullet and spaces)
    const textAfterBullet = trimmed.slice(1).trim();
    const hasTextAfterBullet = textAfterBullet.length > 0;

    const range = selection.getRangeAt(0);

    if (!hasTextAfterBullet) {
      // Empty bullet line - remove bullet and create normal paragraph
      try {
        // Delete the entire current line including the bullet
        const lineStart = range.cloneRange();
        
        // Find the start of the line (after previous BR or at the beginning)
        let startNode = range.startContainer;
        let startOffset = 0;
        
        // Walk backwards to find BR or start
        let tempNode = range.startContainer;
        while (tempNode) {
          const prev = tempNode.previousSibling;
          if (!prev) {
            if (tempNode.parentNode === editableRef.current) {
              startNode = tempNode;
              startOffset = 0;
              break;
            }
            tempNode = tempNode.parentNode;
            continue;
          }
          if (prev.nodeName === 'BR') {
            // Start right after the BR
            startNode = prev;
            startOffset = 0;
            break;
          }
          tempNode = prev;
        }
        
        // Delete from start of line to cursor
        if (startNode.nodeName === 'BR') {
          // Remove the BR and the line content
          const deleteRange = document.createRange();
          deleteRange.setStartAfter(startNode);
          deleteRange.setEnd(range.startContainer, range.startOffset);
          deleteRange.deleteContents();
          // Also remove the BR itself
          startNode.remove();
        } else {
          // Delete from start to cursor
          const deleteRange = document.createRange();
          if (startNode.nodeType === Node.TEXT_NODE) {
            deleteRange.setStart(startNode, startOffset);
          } else {
            deleteRange.setStartBefore(startNode);
          }
          deleteRange.setEnd(range.startContainer, range.startOffset);
          deleteRange.deleteContents();
        }
        
        // Insert line break for new paragraph
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Set flag to skip cursor restore in next input event
        skipNextCursorRestore.current = true;
        
        return true;
      } catch (e) {
        console.error('Error removing bullet:', e);
        isManualEdit.current = false;
        return false;
      }
    }

    // Has text - create new bullet on next line
    try {
      const br = document.createElement('br');
      const bulletText = document.createTextNode('\u2022\u00a0');
      
      range.insertNode(br);
      range.setStartAfter(br);
      range.insertNode(bulletText);
      range.setStartAfter(bulletText);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Set flag to skip cursor restore in next input event
      skipNextCursorRestore.current = true;
      
      return true;
    } catch (e) {
      console.error('Error creating new bullet:', e);
      isManualEdit.current = false;
      return false;
    }
  };

  // Inside content boxes: use inline rich-text editor
  if (isInsideContentBox) {
    return (
      <>
        <div
          ref={editableRef}
          className="content-editable relative w-full text-foreground mb-2 print:text-black"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Text eingeben..."
          style={{
            minHeight: '18px',
            overflow: 'hidden',
            fontFamily: "'Roboto', sans-serif",
            fontSize: '12px',
            lineHeight: '18px',
            fontWeight: 400,
            color: '#003366',
            margin: 0,
            padding: 0,
            outline: 'none',
          }}
          onInput={handleEditableInput}
          onKeyDown={handleEditableKeyDown}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label="Text-Block"
        />
        <InlineTextToolbar
          visible={showToolbar && isFocused}
          position={toolbarPosition}
          activeStates={activeFormats}
          onCommand={handleFormatCommand}
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

