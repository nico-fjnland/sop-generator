import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * TipTapFocusContext
 * 
 * Verwaltet den aktuell fokussierten TipTap-Editor, um intelligentes Undo/Redo zu ermöglichen.
 * 
 * Wenn ein TipTap-Editor (TextBlock oder TipTapTableBlock) fokussiert wird, registriert er sich hier.
 * Die Undo/Redo-Buttons können dann prüfen, ob sie die TipTap-History oder die globale History verwenden sollen.
 * 
 * Features:
 * - activeEditor: Der aktuell fokussierte Editor
 * - lastActiveEditor: Der zuletzt fokussierte Editor (bleibt für 150ms nach Blur erhalten)
 * - Dies erlaubt es, dass der Undo-Button den Editor noch "sieht", auch wenn er kurzzeitig den Fokus verliert
 */

const TipTapFocusContext = createContext(null);

// Timeout in ms, wie lange der "zuletzt aktive" Editor nach Blur noch als aktiv gilt
const BLUR_TIMEOUT = 150;

export const TipTapFocusProvider = ({ children }) => {
  const [activeEditor, setActiveEditor] = useState(null);
  const lastActiveEditorRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  /**
   * Registriert einen TipTap-Editor als aktiv (bei Focus)
   */
  const registerEditor = useCallback((editor) => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    setActiveEditor(editor);
    lastActiveEditorRef.current = editor;
  }, []);

  /**
   * Deregistriert den aktiven Editor (bei Blur)
   * Verwendet einen kurzen Timeout, damit der Undo-Button den Editor noch erreichen kann
   */
  const unregisterEditor = useCallback(() => {
    // Don't immediately clear - give a short window for button clicks
    blurTimeoutRef.current = setTimeout(() => {
      setActiveEditor(null);
      // Keep lastActiveEditorRef for a bit longer as fallback
      setTimeout(() => {
        lastActiveEditorRef.current = null;
      }, BLUR_TIMEOUT);
    }, BLUR_TIMEOUT);
  }, []);

  /**
   * Gibt den aktiven Editor zurück (oder den zuletzt aktiven als Fallback)
   * Prüft auch, ob der Editor noch valide ist (nicht destroyed)
   */
  const getActiveEditor = useCallback(() => {
    // First try the currently active editor
    if (activeEditor && !activeEditor.isDestroyed) {
      return activeEditor;
    }
    
    // Fallback to last active editor (within timeout window)
    if (lastActiveEditorRef.current && !lastActiveEditorRef.current.isDestroyed) {
      return lastActiveEditorRef.current;
    }
    
    return null;
  }, [activeEditor]);

  /**
   * Prüft, ob gerade ein TipTap-Editor aktiv ist
   */
  const hasActiveEditor = useCallback(() => {
    return getActiveEditor() !== null;
  }, [getActiveEditor]);

  const value = {
    activeEditor,
    registerEditor,
    unregisterEditor,
    getActiveEditor,
    hasActiveEditor,
  };

  return (
    <TipTapFocusContext.Provider value={value}>
      {children}
    </TipTapFocusContext.Provider>
  );
};

/**
 * Hook zum Verwenden des TipTapFocusContext
 */
export const useTipTapFocus = () => {
  const context = useContext(TipTapFocusContext);
  
  // Wenn außerhalb des Providers verwendet, gebe Dummy-Funktionen zurück
  // Dies erlaubt es, die Komponenten auch ohne Provider zu verwenden
  if (!context) {
    return {
      activeEditor: null,
      registerEditor: () => {},
      unregisterEditor: () => {},
      getActiveEditor: () => null,
      hasActiveEditor: () => false,
    };
  }
  
  return context;
};

export default TipTapFocusContext;

