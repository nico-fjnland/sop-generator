import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

const STORAGE_KEY = 'sop-editor-state-v1';
const HISTORY_LIMIT = 50;
const DEBOUNCE_SAVE_DELAY = 1000;

// Default initial state if nothing is in storage
export const getInitialState = () => ({
  rows: [
    { 
      id: 'row-1',
      columnRatio: 0.5, 
      blocks: [
        {
          id: '1', 
          type: 'contentbox',
          content: { 
            category: 'definition', 
            blocks: [{ id: Date.now().toString(), type: 'text', content: '' }] 
          } 
        }
      ]
    }
  ],
  headerTitle: 'SOP Überschrift',
  headerStand: 'STAND 12/22',
  headerLogo: null,
  footerVariant: 'tiny'
});

/**
 * @param {Object} options - Hook options
 * @param {boolean} options.skipLocalStorage - If true, don't load from or save to localStorage (for DB documents)
 */
export const useEditorHistory = ({ skipLocalStorage = false } = {}) => {
  // State to hold the history
  const [history, setHistory] = useState(() => {
    // Skip localStorage for DB documents
    if (skipLocalStorage) {
      return {
        past: [],
        present: getInitialState(),
        future: []
      };
    }
    
    // Try to load from local storage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate structure minimally
        if (parsed && Array.isArray(parsed.rows)) {
          return {
            past: [],
            present: parsed,
            future: []
          };
        }
      }
    } catch (e) {
      logger.error('Failed to load from local storage', e);
    }
    
    // Fallback to initial state
    return {
      past: [],
      present: getInitialState(),
      future: []
    };
  });

  // Ref for debounced saving
  const saveTimeoutRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const isFirstRender = useRef(true);

  // Save to local storage whenever present state changes (only for non-DB documents)
  useEffect(() => {
    // Skip localStorage saving for DB documents
    if (skipLocalStorage) {
      return;
    }
    
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history.present));
        setIsSaving(false);
      } catch (e) {
        logger.error('Failed to save to local storage', e);
        setIsSaving(false);
      }
    }, DEBOUNCE_SAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [history.present, skipLocalStorage]);

  // Undo function
  const undo = useCallback(() => {
    setHistory(curr => {
      if (curr.past.length === 0) return curr;

      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future]
      };
    });
  }, []);

  // Redo function
  const redo = useCallback(() => {
    setHistory(curr => {
      if (curr.future.length === 0) return curr;

      const next = curr.future[0];
      const newFuture = curr.future.slice(1);

      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  // Function to update state with history tracking
  // newStateOrUpdater can be a value or a function: (prevState) => newState
  // options: { history: boolean | 'replace' } - default is true (push to history)
  const setEditorState = useCallback((newStateOrUpdater, options = { history: true }) => {
    setHistory(curr => {
      const newState = typeof newStateOrUpdater === 'function' 
        ? newStateOrUpdater(curr.present)
        : newStateOrUpdater;
      
      if (newState === curr.present) return curr;

      // Handle history behavior
      let newPast = curr.past;
      let newFuture = []; // Clear future by default on change

      if (options.history === 'replace') {
        // Don't add to past, just update present (effectively replacing the tip of history)
        // If we want to be able to undo the *start* of the drag, we should have pushed one state before starting.
        // But typically 'replace' means "update current state without creating a NEW undo point".
        // However, if we just update present, the previous state is still in past.
        // So 'replace' effectively merges this change into the current "session".
        newPast = curr.past; 
      } else if (options.history === false) {
        // Do not touch history at all? This is risky if we change state.
        // Usually 'false' means "this is a transient state, don't record it".
        // But if we persist it to localStorage, it becomes permanent.
        // For this editor, 'replace' is probably what we want for resizing:
        // The initial state before resize is in 'past'. The dragging updates 'present'.
        // If we push on every move, we get many states.
        // If we 'replace', we keep updating 'present' while keeping 'past' as it was before the START of resizing.
        // So effectively, we are just modifying the "current" tip.
        newPast = curr.past;
      } else {
        // Default: push to history
        newPast = [...curr.past, curr.present];
        if (newPast.length > HISTORY_LIMIT) {
          newPast.shift();
        }
      }

      return {
        past: newPast,
        present: newState,
        future: newFuture
      };
    });
  }, []);

  // Reset function - no confirmation, caller should handle that
  const reset = useCallback(() => {
    const defaults = getInitialState();
    setHistory({
      past: [],
      present: defaults,
      future: []
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    state: history.present,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    setEditorState, // Full state setter
    reset,
    isSaving
  };
};

