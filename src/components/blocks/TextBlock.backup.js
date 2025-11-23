import React, { forwardRef, useEffect, useRef, useState, useCallback, useMemo, startTransition } from 'react';
import InlineTextToolbar from '../InlineTextToolbar';
import { debounce } from '../../utils/performance';

const TextBlock = forwardRef(({ content, onChange, onKeyDown, isInsideContentBox = false }, ref) => {
  const textareaRef = useRef(null);
  const editableRef = useRef(null);
  const skipNextCursorRestore = useRef(false);
  const isManualEdit = useRef(false);
  const isEditing = useRef(false); // NEW: Central flag to prevent external updates during editing
  const tempDivRef = useRef(null); // Reusable div for HTML conversion
  const [isFocused, setIsFocused] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: false,
    superscript: false,
    subscript: false,
  });
  
  // OPTIMIZED: Constants moved outside for better performance
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
    const minHeight = 18; // line-height: 12px × 1.5 = 18px
    e.target.style.height = 'auto';
    const newHeight = Math.max(e.target.scrollHeight, minHeight);
    e.target.style.height = newHeight + 'px';
  };

  // OPTIMIZED: Reuse temp div for better performance
  const sanitizeHtml = useCallback((dirtyHtml = '') => {
    if (typeof window === 'undefined') return dirtyHtml || '';
    
    // Reuse existing temp div instead of creating new one every time
    if (!tempDivRef.current) {
      tempDivRef.current = document.createElement('div');
    }
    const container = tempDivRef.current;
    container.innerHTML = dirtyHtml;
    
    const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'SUP', 'SUB', 'SPAN']);
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
        // For SPAN elements, allow font-size style attribute
        if (node.nodeName === 'SPAN') {
          [...node.attributes].forEach((attr) => {
            if (attr.name !== 'style') {
              node.removeAttribute(attr.name);
            } else {
              // Only keep font-size in style
              const style = node.getAttribute('style');
              if (style) {
                const fontSizeMatch = style.match(/font-size:\s*10px/i);
                if (fontSizeMatch) {
                  node.setAttribute('style', 'font-size: 10px');
                } else {
                  node.removeAttribute('style');
                }
              }
            }
          });
        } else {
          [...node.attributes].forEach((attr) => node.removeAttribute(attr.name));
        }
      }
    });
    const result = container.innerHTML;
    container.innerHTML = ''; // Clean up
    return result;
  }, []);

  const convertMarkdownListsToBullets = (html = '') => {
    if (!html) return html;
    // Convert markdown list markers (-, *) to bullets
    // Preserve line breaks before bullets
    return html.replace(LIST_MARKER_PATTERN, '$1' + BULLET_HTML);
  };

  const normalizeHtml = (html = '') => {
    if (!html) return '';
    
    let normalized = html
      // Convert div-based line breaks to <br>
      .replace(/<div><br><\/div>/gi, '<br>')
      .replace(/<div>/gi, '<br>')
      .replace(/<\/div>/gi, '')
      // Normalize whitespace but preserve intentional line breaks
      .replace(/&nbsp;/gi, '\u00a0') // Keep non-breaking spaces as Unicode
      // Remove excessive line breaks (3+ becomes 2)
      .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
      .trim();
    
    // CRITICAL: Preserve line breaks before bullets
    // Ensure at least one <br> before bullet if not at start
    normalized = normalized.replace(/([^\n>])(\u2022)/g, '$1<br>$2');
    
    return normalized;
  };

  const convertContentToHtml = useCallback((value = '') => {
    if (!value) {
      return '';
    }
    
    // Check if content is already HTML
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value);
    let result;
    
    if (looksLikeHtml) {
      // Already HTML - sanitize and normalize
      result = sanitizeHtml(value);
    } else {
      // Plain text - convert to HTML
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
    
    // Convert markdown list markers to bullets
    result = convertMarkdownListsToBullets(result);
    
    return result;
  }, [sanitizeHtml, convertMarkdownListsToBullets]);

  // OPTIMIZED: Debounced content sync - reduces onChange calls
  const syncContentFromDom = useMemo(
    () => debounce(() => {
      if (!editableRef.current) return;
      
      // Don't sync if manual edit is in progress
      if (isManualEdit.current || skipNextCursorRestore.current) {
        return;
      }
      
      const rawHtml = editableRef.current.innerHTML;
      const sanitized = sanitizeHtml(rawHtml);
      const normalized = normalizeHtml(sanitized);
      
      // Only trigger onChange if content actually changed
      const currentContent = content || '';
      const currentNormalized = normalizeHtml(sanitizeHtml(currentContent));
      
      if (normalized !== currentNormalized) {
        // Use startTransition for lower priority update
        startTransition(() => {
          onChange(normalized);
        });
      }
      
      // Clear empty content
      if (!normalized && editableRef.current.innerHTML) {
        editableRef.current.innerHTML = '';
      }
    }, 150), // 150ms debounce for stability
    [onChange, sanitizeHtml, content]
  );

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
    
    // Check for active formats
    let fontSizeActive = false;
    let superscriptActive = false;
    let subscriptActive = false;
    
    // Check if selection is within a SPAN with font-size: 10px
    const commonAncestor = range.commonAncestorContainer;
    let node = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : commonAncestor;
    while (node && node !== editableRef.current) {
      if (node.nodeName === 'SPAN' && node.style.fontSize === '10px') {
        fontSizeActive = true;
        break;
      }
      node = node.parentElement;
    }
    
    // Check for SUP and SUB tags
    node = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : commonAncestor;
    while (node && node !== editableRef.current) {
      if (node.nodeName === 'SUP') {
        superscriptActive = true;
        break;
      }
      if (node.nodeName === 'SUB') {
        subscriptActive = true;
        break;
      }
      node = node.parentElement;
    }
    
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        fontSize: fontSizeActive,
        superscript: superscriptActive,
        subscript: subscriptActive,
      });
    } catch {
      setActiveFormats({
        bold: false,
        italic: false,
        underline: false,
        fontSize: fontSizeActive,
        superscript: superscriptActive,
        subscript: subscriptActive,
      });
    }
  };

  useEffect(() => {
    if (!isInsideContentBox) return;
    if (!editableRef.current) return;
    
    // CRITICAL: Never update innerHTML while user is editing
    // This is the single most important guard to prevent cursor jumping
    if (isEditing.current) {
      return;
    }
    
    // Also don't update during manual edits (bullet conversion, etc.)
    if (isManualEdit.current || skipNextCursorRestore.current) {
      return;
    }
    
    // Only update if content actually changed from external source
    const html = convertContentToHtml(content || '');
    const currentHtml = editableRef.current.innerHTML;
    
    // Normalize both for comparison to avoid unnecessary updates
    const normalizedCurrent = normalizeHtml(sanitizeHtml(currentHtml));
    const normalizedNew = normalizeHtml(sanitizeHtml(html));
    
    // Only update if there's an actual difference
    if (normalizedCurrent !== normalizedNew) {
      editableRef.current.innerHTML = html;
    }
  }, [content, isInsideContentBox, convertContentToHtml, sanitizeHtml]);

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

  const handleEditableInput = useCallback(() => {
    if (!editableRef.current) return;
    
    // For manual edits (bullet conversion, etc.), skip this handler entirely
    // The manual edit function handles its own sync
    if (skipNextCursorRestore.current || isManualEdit.current) {
      return;
    }
    
    // For normal typing, use debounced sync (performance)
    syncContentFromDom();
  }, [syncContentFromDom]);

  const handleEditableKeyDown = (event) => {
    // Handle Enter key - respect list context
    if (event.key === 'Enter') {
      event.preventDefault();
      const handled = handleEnterKeyForLists();
      if (!handled) {
        const inserted = document.execCommand('insertLineBreak');
        if (!inserted) {
          document.execCommand('insertHTML', false, '<br>');
        }
        // Sync after line break
        syncContentFromDom();
      }
      return;
    }
    
    // Handle Space key - auto-convert markdown syntax
    if (event.key === ' ' && !event.shiftKey) {
      // Don't prevent default - let space be typed first
      // Then try to convert markdown formatting or bullets
      setTimeout(() => {
        const formatted = convertMarkdownFormatting();
        if (!formatted) {
          convertLineMarkerToBullet();
        }
      }, 0);
      return;
    }
    
    // Handle Backspace - special handling for bullets
    if (event.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection && selection.isCollapsed && editableRef.current) {
        const range = selection.getRangeAt(0);
        const offset = range.startOffset;
        
        // Check if we're at the start of a bullet line
        if (offset === 0) {
          const currentLine = getCurrentLineText();
          if (currentLine.trim().startsWith('\u2022')) {
            // Remove bullet and convert to normal line
            event.preventDefault();
            // Delete bullet and its space
            for (let i = 0; i < BULLET_LENGTH; i++) {
              document.execCommand('delete', false);
            }
            syncContentFromDom();
            return;
          }
        }
      }
    }
    
    // Handle Escape - hide toolbar
    if (event.key === 'Escape') {
      setShowToolbar(false);
      return;
    }
    
    // Pass other keys to parent handler
    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    
    // Get pasted content
    const text = event.clipboardData.getData('text/plain');
    const html = event.clipboardData.getData('text/html');
    
    if (html && isInsideContentBox) {
      // If HTML is available and we're in a content box, try to preserve some formatting
      // But sanitize it first
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Convert markdown-style bullets to actual bullets
      let processedHtml = tempDiv.innerHTML;
      processedHtml = processedHtml.replace(/^(\s*)([-*])\s+/gm, '$1\u2022\u00a0');
      
      // Sanitize and insert
      const sanitized = sanitizeHtml(processedHtml);
      document.execCommand('insertHTML', false, sanitized);
    } else {
      // Plain text - convert line breaks and markdown bullets
      let processedText = text;
      
      // Convert markdown-style bullets to Unicode bullets
      processedText = processedText.replace(/^(\s*)([-*])\s+/gm, '$1\u2022\u00a0');
      
      // Insert text (execCommand handles line breaks automatically)
      document.execCommand('insertText', false, processedText);
    }
    
    // Sync changes
    syncContentFromDom();
  };

  const toggleFontSize = () => {
    if (!editableRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    let node = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : commonAncestor;
    
    // Check if already has font-size: 10px
    let hasFontSize = false;
    let fontSizeSpan = null;
    while (node && node !== editableRef.current) {
      if (node.nodeName === 'SPAN' && node.style.fontSize === '10px') {
        hasFontSize = true;
        fontSizeSpan = node;
        break;
      }
      node = node.parentElement;
    }
    
    if (hasFontSize && fontSizeSpan) {
      // Remove font-size by unwrapping
      const parent = fontSizeSpan.parentNode;
      while (fontSizeSpan.firstChild) {
        parent.insertBefore(fontSizeSpan.firstChild, fontSizeSpan);
      }
      parent.removeChild(fontSizeSpan);
    } else {
      // Apply font-size: 10px by wrapping selection in SPAN
      const span = document.createElement('span');
      span.style.fontSize = '10px';
      try {
        range.surroundContents(span);
      } catch (e) {
        // If surroundContents fails (e.g., selection spans multiple elements), use extractContents
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      // Restore selection
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      newRange.collapse(false);
      selection.addRange(newRange);
    }
    syncContentFromDom();
    updateToolbarFromSelection();
  };

  const toggleSuperscript = () => {
    if (!editableRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    let node = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : commonAncestor;
    
    // Check if already in SUP tag
    let isSup = false;
    let supElement = null;
    while (node && node !== editableRef.current) {
      if (node.nodeName === 'SUP') {
        isSup = true;
        supElement = node;
        break;
      }
      node = node.parentElement;
    }
    
    if (isSup && supElement) {
      // Remove superscript by unwrapping
      const parent = supElement.parentNode;
      while (supElement.firstChild) {
        parent.insertBefore(supElement.firstChild, supElement);
      }
      parent.removeChild(supElement);
    } else {
      // Apply superscript
      document.execCommand('superscript', false);
    }
    syncContentFromDom();
    updateToolbarFromSelection();
  };

  const toggleSubscript = () => {
    if (!editableRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    let node = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : commonAncestor;
    
    // Check if already in SUB tag
    let isSub = false;
    let subElement = null;
    while (node && node !== editableRef.current) {
      if (node.nodeName === 'SUB') {
        isSub = true;
        subElement = node;
        break;
      }
      node = node.parentElement;
    }
    
    if (isSub && subElement) {
      // Remove subscript by unwrapping
      const parent = subElement.parentNode;
      while (subElement.firstChild) {
        parent.insertBefore(subElement.firstChild, subElement);
      }
      parent.removeChild(subElement);
    } else {
      // Apply subscript
      document.execCommand('subscript', false);
    }
    syncContentFromDom();
    updateToolbarFromSelection();
  };

  const handleFormatCommand = (command) => {
    if (!editableRef.current) return;
    editableRef.current.focus();
    
    if (command === 'fontSize') {
      toggleFontSize();
      return;
    }
    
    if (command === 'superscript') {
      toggleSuperscript();
      return;
    }
    
    if (command === 'subscript') {
      toggleSubscript();
      return;
    }
    
    document.execCommand(command, false);
    syncContentFromDom();
    updateToolbarFromSelection();
  };

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    isEditing.current = false; // End editing mode
    
    // Hide toolbar after short delay
    setTimeout(() => {
      setShowToolbar(false);
    }, 50);
    
    // Final sync on blur to ensure parent has latest content
    // This ensures all changes are properly saved
    if (editableRef.current) {
      const rawHtml = editableRef.current.innerHTML;
      const sanitized = sanitizeHtml(rawHtml);
      const normalized = normalizeHtml(sanitized);
      
      // Only call onChange if content actually differs
      const currentContent = content || '';
      const currentNormalized = normalizeHtml(sanitizeHtml(currentContent));
      
      if (normalized !== currentNormalized) {
        onChange(normalized);
      }
    }
  }, [sanitizeHtml, onChange, content]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    isEditing.current = true; // Start editing mode - blocks all external updates
  }, []);

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

  const convertMarkdownFormatting = useCallback(() => {
    if (!editableRef.current) return false;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
      return false;
    }

    // Get text before cursor - need to look at the actual content
    const range = selection.getRangeAt(0);
    let textNode = range.startContainer;
    let offset = range.startOffset;
    
    // If we're in an element node, get the text content
    if (textNode.nodeType === Node.ELEMENT_NODE) {
      textNode = textNode.childNodes[Math.max(0, offset - 1)] || textNode;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        return false;
      }
      offset = textNode.textContent.length;
    }
    
    if (textNode.nodeType !== Node.TEXT_NODE) {
      return false;
    }
    
    // Get all text content before cursor in the current line/block
    let textBeforeCursor = textNode.textContent.substring(0, offset);
    
    // Walk backwards to get text from previous sibling text nodes
    // Stop at line break to only consider current line
    let prevNode = textNode.previousSibling;
    while (prevNode) {
      if (prevNode.nodeType === Node.TEXT_NODE) {
        textBeforeCursor = prevNode.textContent + textBeforeCursor;
      } else if (prevNode.nodeName === 'BR') {
        break; // Stop at line break
      } else if (prevNode.nodeType === Node.ELEMENT_NODE) {
        const textContent = prevNode.textContent || '';
        textBeforeCursor = textContent + textBeforeCursor;
      }
      prevNode = prevNode.previousSibling;
    }
    
    // Normalize spaces for pattern matching
    textBeforeCursor = textBeforeCursor.replace(/\u00a0/g, ' ');
    
    // Patterns for inline formatting
    // **text** → Bold (at least one non-space character between **)
    const boldPattern = /\*\*(.+?)\*\*\s$/;
    // *text* → Italic (but not ** which is bold, at least one non-space character)
    const italicPattern = /(?<!\*)\*([^*\s][^*]*?)\*\s$/;
    
    let match = null;
    let formatType = null;
    
    if ((match = textBeforeCursor.match(boldPattern))) {
      formatType = 'bold';
    } else if ((match = textBeforeCursor.match(italicPattern))) {
      formatType = 'italic';
    }
    
    if (!match || !formatType) {
      return false;
    }
    
    // Set flags to prevent interference
    isManualEdit.current = true;
    skipNextCursorRestore.current = true;
    
    try {
      const fullMatch = match[0]; // Full match with markers and space
      const innerText = match[1]; // Text without markers
      const charsToDelete = fullMatch.length;
      
      // Delete the markdown text (including markers and trailing space)
      for (let i = 0; i < charsToDelete; i++) {
        document.execCommand('delete', false);
      }
      
      // Insert formatted text with a non-breaking space after
      document.execCommand('insertHTML', false, 
        `<${formatType === 'bold' ? 'strong' : 'em'}>${innerText}</${formatType === 'bold' ? 'strong' : 'em'}>\u00a0`
      );
      
      // Sync changes
      syncContentFromDom();
      
      // Reset flags
      setTimeout(() => {
        isManualEdit.current = false;
        skipNextCursorRestore.current = false;
      }, 150);
      
      return true;
    } catch (error) {
      console.error('Error converting markdown formatting:', error);
      isManualEdit.current = false;
      skipNextCursorRestore.current = false;
      return false;
    }
  }, [syncContentFromDom]);

  const convertLineMarkerToBullet = useCallback(() => {
    if (!editableRef.current) return false;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
      return false;
    }

    // Get text before cursor - same robust approach as markdown formatting
    const range = selection.getRangeAt(0);
    let textNode = range.startContainer;
    let offset = range.startOffset;
    
    // If we're in an element node, get the text content
    if (textNode.nodeType === Node.ELEMENT_NODE) {
      textNode = textNode.childNodes[Math.max(0, offset - 1)] || textNode;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        return false;
      }
      offset = textNode.textContent.length;
    }
    
    if (textNode.nodeType !== Node.TEXT_NODE) {
      return false;
    }
    
    // Get all text content before cursor in the current line/block
    let textBeforeCursor = textNode.textContent.substring(0, offset);
    
    // Walk backwards to get text from previous sibling text nodes
    // Stop at line break to only get current line
    let prevNode = textNode.previousSibling;
    while (prevNode) {
      if (prevNode.nodeType === Node.TEXT_NODE) {
        textBeforeCursor = prevNode.textContent + textBeforeCursor;
      } else if (prevNode.nodeName === 'BR') {
        break; // Stop at line break - we only want current line
      } else if (prevNode.nodeType === Node.ELEMENT_NODE) {
        const textContent = prevNode.textContent || '';
        textBeforeCursor = textContent + textBeforeCursor;
      }
      prevNode = prevNode.previousSibling;
    }
    
    // Normalize spaces for pattern matching
    textBeforeCursor = textBeforeCursor.replace(/\u00a0/g, ' ');
    
    // Extract only the current line (after last line break)
    const lines = textBeforeCursor.split(/\n/);
    const currentLine = lines[lines.length - 1];
    
    // Check if current line starts with "- " or "* " (at start or after only whitespace)
    // Pattern: optional whitespace, marker (- or *), space
    const bulletPattern = /^(\s*)([-*])\s$/;
    const match = currentLine.match(bulletPattern);
    
    if (!match) {
      return false;
    }
    
    // Set flags to prevent any external interference during conversion
    isManualEdit.current = true;
    skipNextCursorRestore.current = true;
    
    try {
      const fullMatch = match[0]; // Full match including whitespace and space after
      const charsToDelete = fullMatch.length;
      
      // Delete backwards to remove "- " or "* " (and any leading whitespace)
      for (let i = 0; i < charsToDelete; i++) {
        document.execCommand('delete', false);
      }
      
      // Insert bullet and non-breaking space - cursor will automatically be after it
      document.execCommand('insertText', false, '\u2022\u00a0');
      
      // Sync changes immediately
      syncContentFromDom();
      
      // Reset flags after a brief moment
      setTimeout(() => {
        isManualEdit.current = false;
        skipNextCursorRestore.current = false;
      }, 150);
      
      return true;
    } catch (error) {
      console.error('Error converting marker to bullet:', error);
      isManualEdit.current = false;
      skipNextCursorRestore.current = false;
      return false;
    }
  }, [syncContentFromDom]);

  const handleEnterKeyForLists = useCallback(() => {
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

    // Set flags to prevent interference
    isManualEdit.current = true;
    skipNextCursorRestore.current = true;

    // Check if there's text after the bullet
    const textAfterBullet = trimmed.slice(1).trim();
    const hasTextAfterBullet = textAfterBullet.length > 0;

    try {
      if (!hasTextAfterBullet) {
        // Empty bullet line - exit list mode
        // Delete the bullet and its space
        for (let i = 0; i < BULLET_LENGTH; i++) {
          document.execCommand('delete', false);
        }
        
        // Insert line break for normal paragraph
        const inserted = document.execCommand('insertLineBreak');
        if (!inserted) {
          document.execCommand('insertHTML', false, '<br>');
        }
        
        // Sync changes
        syncContentFromDom();
        
        // Reset flags
        setTimeout(() => {
          isManualEdit.current = false;
          skipNextCursorRestore.current = false;
        }, 150);
        
        return true;
      }
      
      // Has text after bullet - create new bullet point on next line
      const inserted = document.execCommand('insertLineBreak');
      if (!inserted) {
        document.execCommand('insertHTML', false, '<br>');
      }
      
      // Insert new bullet and space
      document.execCommand('insertText', false, '\u2022\u00a0');
      
      // Sync changes
      syncContentFromDom();
      
      // Reset flags
      setTimeout(() => {
        isManualEdit.current = false;
        skipNextCursorRestore.current = false;
      }, 150);
      
      return true;
    } catch (error) {
      console.error('Error handling Enter in list:', error);
      isManualEdit.current = false;
      skipNextCursorRestore.current = false;
      return false;
    }
  }, [syncContentFromDom]);

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
            overflow: 'visible',
            fontFamily: "'Roboto', sans-serif",
            fontSize: '12px',
            lineHeight: 1.5,
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

