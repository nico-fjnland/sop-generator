import React from 'react';
import { Button } from './button';
import { ArrowCounterClockwise, ArrowClockwise } from '@phosphor-icons/react';

/**
 * UndoRedoButton component - works with both TipTap editor and custom history systems
 * Provides undo/redo functionality with proper disabled states
 * 
 * For TipTap editor:
 * @param {object} editor - TipTap editor instance
 * 
 * For custom history (e.g., useEditorHistory):
 * @param {function} onAction - Function to execute (undo/redo)
 * @param {boolean} canExecute - Whether the action can be executed
 * 
 * Common props:
 * @param {string} action - 'undo' or 'redo'
 * @param {string} text - Optional button text
 * @param {boolean} hideWhenUnavailable - Hide button when action is not available
 * @param {boolean} showShortcut - Show keyboard shortcut in title
 * @param {function} onExecuted - Callback after action is executed
 * @param {string} className - Additional CSS classes
 */
export const UndoRedoButton = ({
  editor,
  onAction,
  canExecute: canExecuteProp,
  action = 'undo',
  text,
  hideWhenUnavailable = false,
  showShortcut = true,
  onExecuted,
  className = '',
}) => {
  const isUndo = action === 'undo';
  
  // Determine if action can be executed
  let canExecute;
  if (editor) {
    // TipTap editor mode
    canExecute = isUndo ? editor.can().undo() : editor.can().redo();
  } else if (canExecuteProp !== undefined) {
    // Custom history mode
    canExecute = canExecuteProp;
  } else {
    return null;
  }

  // Hide button if action is not available and hideWhenUnavailable is true
  if (hideWhenUnavailable && !canExecute) {
    return null;
  }

  const handleClick = () => {
    if (!canExecute) return;
    
    if (editor) {
      // TipTap editor mode
      if (isUndo) {
        editor.chain().focus().undo().run();
      } else {
        editor.chain().focus().redo().run();
      }
    } else if (onAction) {
      // Custom history mode
      onAction();
    }
    
    onExecuted?.();
  };

  const defaultTitle = isUndo ? 'Rückgängig' : 'Wiederherstellen';
  const shortcut = isUndo ? 'Ctrl+Z' : 'Ctrl+Y';
  const title = showShortcut ? `${defaultTitle} (${shortcut})` : defaultTitle;

  const Icon = isUndo ? ArrowCounterClockwise : ArrowClockwise;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={!canExecute}
      title={title}
      className={`h-8 w-8 text-[#003366] ${className}`}
    >
      {text ? (
        <>
          <Icon size={18} className="mr-1" />
          {text}
        </>
      ) : (
        <Icon size={18} />
      )}
    </Button>
  );
};

