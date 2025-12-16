import React, { useState } from 'react';
import { Button } from './button';
import { ArrowCounterClockwise, ArrowClockwise } from '@phosphor-icons/react';
import { useTipTapFocus } from '../../contexts/TipTapFocusContext';

/**
 * UndoRedoButton component - Intelligentes Undo/Redo für TipTap und globale History
 * 
 * Wählt automatisch zwischen:
 * - TipTap History: Wenn ein TipTap-Editor fokussiert ist (Text/Tabellen)
 * - Globale History: Wenn kein TipTap-Editor fokussiert ist (Struktur-Änderungen)
 * 
 * Props:
 * @param {function} onAction - Funktion für globale History (undo/redo)
 * @param {boolean} canExecute - Ob die globale Aktion ausgeführt werden kann
 * @param {string} action - 'undo' oder 'redo'
 * @param {string} text - Optionaler Button-Text
 * @param {boolean} hideWhenUnavailable - Button verstecken wenn nicht verfügbar
 * @param {boolean} showShortcut - Keyboard-Shortcut im Tooltip anzeigen
 * @param {function} onExecuted - Callback nach Ausführung
 * @param {string} className - Zusätzliche CSS-Klassen
 */
// Plattform-Erkennung für korrekte Tastenkürzel-Anzeige
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const UndoRedoButton = ({
  onAction,
  canExecute: canExecuteGlobal,
  action = 'undo',
  text,
  hideWhenUnavailable = false,
  showShortcut = true,
  onExecuted,
  className = '',
  size = 'default', // 'default' (h-8) oder 'lg' (h-9)
}) => {
  const isUndo = action === 'undo';
  const { getActiveEditor } = useTipTapFocus();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Prüfe, ob ein TipTap-Editor aktiv ist und ob er undo/redo kann
  const tipTapEditor = getActiveEditor();
  const canExecuteTipTap = tipTapEditor 
    ? (isUndo ? tipTapEditor.can().undo() : tipTapEditor.can().redo())
    : false;
  
  // Bestimme, ob die Aktion ausgeführt werden kann (TipTap ODER global)
  const canExecute = canExecuteTipTap || canExecuteGlobal;

  // Hide button if action is not available and hideWhenUnavailable is true
  if (hideWhenUnavailable && !canExecute) {
    return null;
  }

  /**
   * Verhindert, dass der Button den Fokus vom TipTap-Editor stiehlt
   */
  const handleMouseDown = (e) => {
    // Wenn ein TipTap-Editor aktiv ist, verhindern wir den Fokus-Wechsel
    if (tipTapEditor) {
      e.preventDefault();
    }
  };

  const handleClick = () => {
    if (!canExecute) return;
    
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
    
    // Intelligente Entscheidung: TipTap oder global?
    if (tipTapEditor && canExecuteTipTap) {
      // TipTap History verwenden
      if (isUndo) {
        tipTapEditor.chain().focus().undo().run();
      } else {
        tipTapEditor.chain().focus().redo().run();
      }
    } else if (onAction && canExecuteGlobal) {
      // Globale History verwenden
      onAction();
    }
    
    onExecuted?.();
  };

  const defaultTitle = isUndo ? 'Rückgängig' : 'Wiederherstellen';
  // Plattformabhängige Tastenkürzel: ⌘ für Mac, Ctrl für Windows/Linux
  const modifierKey = isMac ? '⌘' : 'Ctrl';
  const shortcut = isUndo ? `${modifierKey}+Z` : `${modifierKey}+Shift+Z`;
  const title = showShortcut ? `${defaultTitle} (${shortcut})` : defaultTitle;

  const Icon = isUndo ? ArrowCounterClockwise : ArrowClockwise;

  // Animation: Undo dreht gegen Uhrzeigersinn (-), Redo im Uhrzeigersinn (+)
  const animationStyle = isAnimating ? {
    transform: isUndo ? 'rotate(-25deg)' : 'rotate(25deg)',
    transition: 'transform 0.15s ease-out',
  } : {
    transform: 'rotate(0deg)',
    transition: 'transform 0.15s ease-out',
  };

  const buttonSize = size === 'lg' ? 'h-9 w-9' : 'h-8 w-8';
  const iconSize = size === 'lg' ? 20 : 18;

  return (
    <Button
      variant="ghost"
      size="icon"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      disabled={!canExecute}
      title={title}
      className={`${buttonSize} text-[#003366] ${className}`}
    >
      {text ? (
        <>
          <Icon size={iconSize} className="mr-1" style={animationStyle} />
          {text}
        </>
      ) : (
        <Icon size={iconSize} style={animationStyle} />
      )}
    </Button>
  );
};
