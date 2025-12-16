import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to determine if two side-by-side boxes should have equalized heights.
 * Uses ResizeObserver to track height changes and applies a threshold-based decision.
 * 
 * @param {React.RefObject} containerRef - Ref to the row container element
 * @param {boolean} isTwoColumn - Whether this row has two columns
 * @param {Object} options - Configuration options
 * @param {number} options.absoluteThreshold - Max pixel difference to trigger equalization (default: 40)
 * @param {number} options.relativeThreshold - Max percentage difference to trigger equalization (default: 0.15)
 * @returns {boolean} shouldEqualize - Whether the boxes should be height-equalized
 */
const useHeightEqualization = (
  containerRef,
  isTwoColumn,
  options = {}
) => {
  const {
    absoluteThreshold = 40,
    relativeThreshold = 0.15,
  } = options;

  const [shouldEqualize, setShouldEqualize] = useState(false);
  const observerRef = useRef(null);

  const calculateEqualization = useCallback(() => {
    if (!containerRef?.current || !isTwoColumn) {
      setShouldEqualize(false);
      return;
    }

    // Find the two content-box-block elements within this row
    const boxes = containerRef.current.querySelectorAll(':scope > .content-box-block, :scope > [class*="draggable"]');
    
    if (boxes.length !== 2) {
      setShouldEqualize(false);
      return;
    }

    // Get the actual content boxes (might be wrapped in draggable containers)
    const getBoxHeight = (element) => {
      const contentBox = element.classList.contains('content-box-block') 
        ? element 
        : element.querySelector('.content-box-block');
      return contentBox ? contentBox.getBoundingClientRect().height : 0;
    };

    const height1 = getBoxHeight(boxes[0]);
    const height2 = getBoxHeight(boxes[1]);

    // Skip if either box has no height (not yet rendered)
    if (height1 === 0 || height2 === 0) {
      return;
    }

    const heightDiff = Math.abs(height1 - height2);
    const maxHeight = Math.max(height1, height2);
    const relativeDiff = maxHeight > 0 ? heightDiff / maxHeight : 0;

    // Equalize if the difference is small (either absolute OR relative threshold)
    const shouldEq = heightDiff < absoluteThreshold || relativeDiff < relativeThreshold;
    
    setShouldEqualize(shouldEq);
  }, [containerRef, isTwoColumn, absoluteThreshold, relativeThreshold]);

  useEffect(() => {
    if (!containerRef?.current || !isTwoColumn) {
      setShouldEqualize(false);
      return;
    }

    // Initial calculation
    calculateEqualization();

    // Set up ResizeObserver to watch for height changes
    observerRef.current = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid layout thrashing
      requestAnimationFrame(calculateEqualization);
    });

    // Observe all direct children that might contain content boxes
    const children = containerRef.current.children;
    for (let i = 0; i < children.length; i++) {
      observerRef.current.observe(children[i]);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, isTwoColumn, calculateEqualization]);

  return shouldEqualize;
};

export default useHeightEqualization;

