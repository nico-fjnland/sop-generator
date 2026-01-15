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
  const lastZoomRef = useRef(window.devicePixelRatio || 1);
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
    
    // Check if zoom level changed (browser zoom)
    const currentZoom = window.devicePixelRatio || 1;
    const zoomChanged = Math.abs(currentZoom - lastZoomRef.current) > 0.01;
    
    const widthChanged = 
      Math.abs(currentWidth1 - lastWidthsRef.current.w1) > 1 ||
      Math.abs(currentWidth2 - lastWidthsRef.current.w2) > 1;
    
    // Only proceed if widths changed, zoom changed, or this is the first run
    if (!widthChanged && !zoomChanged && lastWidthsRef.current.w1 !== 0) {
      return;
    }
    
    // Update zoom tracking
    lastZoomRef.current = currentZoom;

    // Prevent re-entry
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;

    // Store current widths
    lastWidthsRef.current = { w1: currentWidth1, w2: currentWidth2 };

    // Reset heights to measure natural heights
    boxes[0].style.minHeight = '0';
    boxes[1].style.minHeight = '0';
    
    // Force layout reflow to ensure reset takes effect
    void boxes[0].offsetHeight;
    void boxes[1].offsetHeight;

    // Use double requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Measure the scrollHeight (content height) instead of getBoundingClientRect
        // scrollHeight gives the actual content height without minHeight inflation
        const height1 = boxes[0].scrollHeight;
        const height2 = boxes[1].scrollHeight;

        if (height1 === 0 || height2 === 0) {
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

    // Listen for window resize (triggered by browser zoom)
    window.addEventListener('resize', debouncedEqualize);

    return () => {
      clearTimeout(initialTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('resize', debouncedEqualize);
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
