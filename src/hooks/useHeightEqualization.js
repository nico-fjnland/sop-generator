import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to force equal heights for two-column layouts.
 * 
 * Measures the natural height of boxes (with minHeight temporarily reset)
 * and sets both boxes to the maximum height. Only reacts to WIDTH changes
 * to prevent infinite loops.
 */
const useHeightEqualization = (
  containerRef,
  isTwoColumn,
  options = {}
) => {
  const observerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastWidthsRef = useRef({ w1: 0, w2: 0 });
  const isProcessingRef = useRef(false);

  const equalizeHeights = useCallback(() => {
    if (!containerRef?.current || !isTwoColumn) {
      return;
    }

    // Find the notion-box-shell elements (the actual bordered boxes)
    const boxes = containerRef.current.querySelectorAll('.notion-box-shell');
    
    if (boxes.length !== 2) {
      return;
    }

    // Check if widths have changed (column resizer)
    const currentWidth1 = boxes[0].getBoundingClientRect().width;
    const currentWidth2 = boxes[1].getBoundingClientRect().width;
    
    const widthChanged = 
      Math.abs(currentWidth1 - lastWidthsRef.current.w1) > 1 ||
      Math.abs(currentWidth2 - lastWidthsRef.current.w2) > 1;
    
    // Only proceed if widths changed or this is the first run
    if (!widthChanged && lastWidthsRef.current.w1 !== 0) {
      return;
    }

    // Prevent re-entry
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;

    // Store current widths
    lastWidthsRef.current = { w1: currentWidth1, w2: currentWidth2 };

    // Reset heights to measure natural heights
    const savedH1 = boxes[0].style.minHeight;
    const savedH2 = boxes[1].style.minHeight;
    boxes[0].style.minHeight = '';
    boxes[1].style.minHeight = '';

    // Use requestAnimationFrame to get accurate measurements after reset
    requestAnimationFrame(() => {
      const height1 = boxes[0].getBoundingClientRect().height;
      const height2 = boxes[1].getBoundingClientRect().height;

      if (height1 === 0 || height2 === 0) {
        // Restore if measurement failed
        boxes[0].style.minHeight = savedH1;
        boxes[1].style.minHeight = savedH2;
        isProcessingRef.current = false;
        return;
      }

      const maxHeight = Math.max(height1, height2);
      boxes[0].style.minHeight = `${maxHeight}px`;
      boxes[1].style.minHeight = `${maxHeight}px`;

      // Allow new processing after a delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);
    });
  }, [containerRef, isTwoColumn]);

  useEffect(() => {
    if (!containerRef?.current) {
      return;
    }

    // If not two-column, reset minHeight to let boxes size naturally
    if (!isTwoColumn) {
      const boxes = containerRef.current.querySelectorAll('.notion-box-shell');
      boxes.forEach(box => {
        box.style.minHeight = '';
      });
      // Reset width tracking so next two-column switch works correctly
      lastWidthsRef.current = { w1: 0, w2: 0 };
      return;
    }

    // Initial equalization
    const initialTimeout = setTimeout(() => {
      equalizeHeights();
    }, 100);

    // Debounced version for ResizeObserver
    const debouncedEqualize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        equalizeHeights();
      }, 50);
    };

    // Set up ResizeObserver - only watch draggable blocks for WIDTH changes
    observerRef.current = new ResizeObserver((entries) => {
      // Check if any width actually changed
      for (const entry of entries) {
        const target = entry.target;
        if (target.classList.contains('draggable-block')) {
          debouncedEqualize();
          break;
        }
      }
    });

    // Only observe draggable blocks (for column resizer width changes)
    const draggableBlocks = containerRef.current.querySelectorAll('.draggable-block');
    draggableBlocks.forEach(block => {
      if (observerRef.current) {
        observerRef.current.observe(block);
      }
    });

    return () => {
      clearTimeout(initialTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, isTwoColumn, equalizeHeights]);

  // Return true for two-column layouts (still used for CSS class)
  return isTwoColumn;
};

export default useHeightEqualization;


/* =============================================================================
 * ARCHIVED CODE - Previous approaches that didn't work
 * =============================================================================
 * 
 * v0.7.1: CSS-based with threshold detection - didn't work with complex DOM
 * v0.8.6 attempt 1: Reset + measure with ResizeObserver on boxes - caused SKIPPED bug
 * v0.8.6 attempt 2: scrollHeight measurement - caused infinite growth loop
 * 
 * Current approach: Only react to WIDTH changes, measure natural height with reset
 * ============================================================================= */
