import { useEffect, useRef, useState, useCallback } from 'react';
import { PAGE, FOOTER, HEADER, PAGE_HEADER } from '../constants/layout';

/**
 * Get footer height for a specific page based on its variant
 * Uses predefined heights from constants (no DOM measurement needed)
 */
const getFooterHeightForPage = (pageNumber, footerVariants) => {
  const variant = footerVariants[pageNumber] || FOOTER.DEFAULT_VARIANT;
  return FOOTER.HEIGHTS[variant] || FOOTER.HEIGHTS[FOOTER.DEFAULT_VARIANT];
};

/**
 * Calculates page breaks based on row heights
 * Supports per-page footer variants for accurate height calculations
 * 
 * @param {Array} rows - Array of row objects with id
 * @param {React.RefObject} containerRef - Ref to the container element
 * @param {Object} footerVariants - Object mapping page numbers to footer variants { 1: 'signature', 2: 'tiny', ... }
 */
export const usePageBreaks = (rows, containerRef, footerVariants = {}) => {
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
   * Calculate available height for a specific page
   */
  const getAvailableHeightForPage = useCallback((pageNumber, headerHeight) => {
    const totalPageHeight = PAGE.HEIGHT_PX;
    const footerHeight = getFooterHeightForPage(pageNumber, footerVariants);
    
    if (pageNumber === 1) {
      // First page: includes full header
      return totalPageHeight - headerHeight - PAGE.TOP_PADDING - footerHeight;
    } else {
      // Subsequent pages: no main header, but have page header (title + page number)
      return totalPageHeight - (PAGE.TOP_PADDING * 2) - PAGE_HEADER.HEIGHT - footerHeight;
    }
  }, [footerVariants]);

  /**
   * Calculate page breaks based on actual DOM measurements and per-page footer heights
   */
  const calculatePageBreaks = useCallback(() => {
    if (!containerRef.current || rows.length === 0) {
      setPageBreaks(new Set());
      return;
    }

    // Measure header height (only exists on first page)
    let headerHeight = 0;
    const headerElement = containerRef.current.querySelector('.sop-header');
    if (headerElement) {
      headerHeight = headerElement.offsetHeight;
    } else {
      // Fallback estimate
      headerHeight = HEADER.PADDING.TOP + HEADER.PADDING.BOTTOM + 60;
    }

    const newPageBreaks = new Set();
    let currentPageNumber = 1;
    let currentPageHeight = 0;
    let availableHeight = getAvailableHeightForPage(1, headerHeight);

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
        
        // Move to next page
        currentPageNumber++;
        currentPageHeight = totalRowHeight;
        
        // Get available height for the NEW page (with its specific footer variant)
        availableHeight = getAvailableHeightForPage(currentPageNumber, headerHeight);

        // Warn if single row is larger than page height (no split allowed)
        if (totalRowHeight > availableHeight) {
          console.warn(
            `Row ${row.id} (height: ${totalRowHeight}px) exceeds available page height (${availableHeight}px). ` +
            `Content will be moved to next page but may overflow.`
          );
        }
      } else {
        // Row fits on current page
        currentPageHeight += totalRowHeight;
      }
    });

    setPageBreaks(newPageBreaks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, containerRef, getAvailableHeightForPage]);

  /**
   * Initial calculation after mount
   */
  useEffect(() => {
    calculationTimeoutRef.current = setTimeout(() => {
      calculatePageBreaks();
    }, 100);

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [calculatePageBreaks]);

  /**
   * Recalculate on window resize
   */
  useEffect(() => {
    const handleResize = () => {
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
   */
  useEffect(() => {
    calculationTimeoutRef.current = setTimeout(() => {
      calculatePageBreaks();
    }, 50);

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [rows.length, calculatePageBreaks]);

  /**
   * Setup IntersectionObserver for each row to detect significant changes
   */
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const hasSignificantChange = entries.some(
          entry => Math.abs(entry.intersectionRatio - (entry.isIntersecting ? 1 : 0)) > 0.1
        );

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
        rootMargin: '100px',
        threshold: [0, 0.25, 0.5, 0.75, 1.0]
      }
    );

    observerRef.current = observer;

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
