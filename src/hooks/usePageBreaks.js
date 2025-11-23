import { useEffect, useRef, useState, useCallback } from 'react';
import { PAGE, FOOTER, HEADER } from '../constants/layout';

/**
 * Custom hook for calculating page breaks using IntersectionObserver
 * 
 * This new implementation uses IntersectionObserver to detect when rows
 * cross page boundaries, eliminating re-render loops and maintaining
 * stable component state.
 * 
 * Key improvements:
 * - No ResizeObserver on container (no aggressive re-calculations)
 * - Stable ref callbacks with useCallback
 * - IntersectionObserver for precise boundary detection
 * - Rows never unmount/remount
 * - Content boxes maintain their state during typing
 * 
 * @param {Array} rows - Array of row objects containing blocks
 * @param {React.RefObject} containerRef - Reference to the main container
 * @param {string} footerVariant - Footer variant ('tiny', 'small', 'large', 'x-large')
 * @returns {Object} - { pageBreaks: Set<rowId>, setRowRef: Function }
 */
export const usePageBreaks = (rows, containerRef, footerVariant = 'tiny') => {
  const rowRefsMap = useRef(new Map());
  const [pageBreaks, setPageBreaks] = useState(new Set());
  const observerRef = useRef(null);
  const calculationTimeoutRef = useRef(null);
  
  // Stable ref callback - never changes
  const setRowRef = useCallback((rowId, element) => {
    if (element) {
      rowRefsMap.current.set(rowId, element);
    } else {
      rowRefsMap.current.delete(rowId);
    }
  }, []);

  /**
   * Calculate available heights for pages
   */
  const getPageHeights = useCallback(() => {
    if (!containerRef.current) {
      return null;
    }

    // Measure header height
    let headerHeight = 0;
    const headerElement = containerRef.current.querySelector('.sop-header');
    if (headerElement) {
      headerHeight = headerElement.offsetHeight;
    } else {
      // Fallback estimate
      headerHeight = HEADER.PADDING.TOP + HEADER.PADDING.BOTTOM + 60;
    }

    // Measure footer height
    let footerHeight = 0;
    const footerElement = containerRef.current.querySelector('.sop-footer');
    if (footerElement) {
      footerHeight = footerElement.offsetHeight;
    } else {
      // Fallback calculation
      const footerContentHeight = FOOTER.CONTENT_HEIGHTS[footerVariant] || FOOTER.CONTENT_HEIGHTS.tiny;
      footerHeight = FOOTER.PADDING.TOP + footerContentHeight + FOOTER.PADDING.BOTTOM;
    }

    const totalPageHeight = PAGE.HEIGHT_PX;
    
    // First page: includes header
    const firstPageAvailableHeight = 
      totalPageHeight - headerHeight - PAGE.TOP_PADDING - PAGE.BOTTOM_PADDING - footerHeight;
    
    // Subsequent pages: no header, but double top padding
    const subsequentPageAvailableHeight = 
      totalPageHeight - (PAGE.TOP_PADDING * 2) - PAGE.BOTTOM_PADDING - footerHeight;

    return {
      totalPageHeight,
      firstPageAvailableHeight,
      subsequentPageAvailableHeight,
      headerHeight,
      footerHeight
    };
  }, [containerRef, footerVariant]);

  /**
   * Calculate page breaks based on actual DOM measurements
   * This runs less frequently than the old ResizeObserver approach
   */
  const calculatePageBreaks = useCallback(() => {
    if (!containerRef.current || rows.length === 0) {
      setPageBreaks(new Set());
      return;
    }

    const pageHeights = getPageHeights();
    if (!pageHeights) {
      return;
    }

    const { firstPageAvailableHeight, subsequentPageAvailableHeight } = pageHeights;
    const newPageBreaks = new Set();
    
    let currentPageHeight = 0;
    let availableHeight = firstPageAvailableHeight;

    // Iterate through rows and calculate where page breaks should occur
    rows.forEach((row, index) => {
      const rowElement = rowRefsMap.current.get(row.id);
      
      if (!rowElement) {
        // Row not yet mounted, skip
        return;
      }

      // Measure the actual row height including margins
      const rowHeight = rowElement.offsetHeight;
      const rowStyle = window.getComputedStyle(rowElement);
      const marginBottom = parseInt(rowStyle.marginBottom) || 0;
      const marginTop = parseInt(rowStyle.marginTop) || 0;
      const totalRowHeight = rowHeight + marginBottom + marginTop;

      // Check if this row fits on the current page
      if (currentPageHeight + totalRowHeight > availableHeight) {
        // Row doesn't fit - insert page break BEFORE this row
        newPageBreaks.add(row.id);
        
        // Reset for new page
        currentPageHeight = totalRowHeight;
        availableHeight = subsequentPageAvailableHeight;

        // Warn if single row is larger than page height (no split allowed)
        if (totalRowHeight > subsequentPageAvailableHeight) {
          console.warn(
            `Row ${row.id} (height: ${totalRowHeight}px) exceeds available page height (${subsequentPageAvailableHeight}px). ` +
            `Content will be moved to next page but may overflow.`
          );
        }
      } else {
        // Row fits on current page
        currentPageHeight += totalRowHeight;
      }
    });

    setPageBreaks(newPageBreaks);
  }, [rows, containerRef, getPageHeights]);

  /**
   * Setup IntersectionObserver for intelligent recalculation
   * Only recalculates when rows are added, removed, or significantly change
   */
  useEffect(() => {
    // Initial calculation after mount
    calculationTimeoutRef.current = setTimeout(() => {
      calculatePageBreaks();
    }, 100);

    // Cleanup
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [calculatePageBreaks]);

  /**
   * Recalculate on window resize (viewport changes)
   * This is the only event-driven recalculation
   */
  useEffect(() => {
    const handleResize = () => {
      // Debounce resize events
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
      calculationTimeoutRef.current = setTimeout(() => {
        calculatePageBreaks();
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [calculatePageBreaks]);

  /**
   * Recalculate when rows change (added/removed)
   * This is intentionally triggered only on rows array changes,
   * NOT on content changes within rows
   */
  useEffect(() => {
    // Small delay to ensure DOM is ready
    calculationTimeoutRef.current = setTimeout(() => {
      calculatePageBreaks();
    }, 50);

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [rows.length, calculatePageBreaks]); // Only re-run when row count changes

  /**
   * Setup IntersectionObserver for each row to detect significant changes
   * This observes when rows cross into/out of view, which can indicate
   * major layout changes that require recalculation
   */
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer with generous thresholds
    const observer = new IntersectionObserver(
      (entries) => {
        // Check if any entry indicates a significant visibility change
        const hasSignificantChange = entries.some(
          entry => Math.abs(entry.intersectionRatio - (entry.isIntersecting ? 1 : 0)) > 0.1
        );

        // Only recalculate if there's a significant change
        if (hasSignificantChange) {
          if (calculationTimeoutRef.current) {
            clearTimeout(calculationTimeoutRef.current);
          }
          calculationTimeoutRef.current = setTimeout(() => {
            calculatePageBreaks();
          }, 100);
        }
      },
      {
        root: null,
        rootMargin: '100px', // Generous margin to catch nearby changes
        threshold: [0, 0.25, 0.5, 0.75, 1.0]
      }
    );

    observerRef.current = observer;

    // Observe all rows
    rowRefsMap.current.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, calculatePageBreaks, rows.length]);

  return { pageBreaks, setRowRef };
};
