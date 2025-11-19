import { useEffect, useRef, useState, useMemo } from 'react';
import { debounce } from '../utils/performance';
import { PAGE, FOOTER, CONTENT_BOX } from '../constants/layout';

export const usePageBreaks = (blocks, containerRef, footerVariant = 'tiny') => {
  const blockRefs = useRef({});
  const [pageBreaks, setPageBreaks] = useState({});

  // Memoize the debounced calculation function
  const debouncedCalculate = useMemo(
    () => debounce(() => {
      if (!containerRef.current || blocks.length === 0) return;

      const newPageBreaks = {};
      let currentPageHeight = 0;
      let isNewPage = true;
      
      // Dynamic measurement of footer height
      let footerHeight = 0;
      
      // Try to find the rendered footer in the DOM
      const footerElement = containerRef.current.querySelector('.sop-footer');
      if (footerElement) {
        footerHeight = footerElement.offsetHeight;
      } else {
        // Fallback to calculated height if not found yet
        const footerBaseHeight = FOOTER.CONTENT_HEIGHTS[footerVariant] || FOOTER.CONTENT_HEIGHTS.tiny;
        footerHeight = FOOTER.PADDING.TOP + footerBaseHeight + FOOTER.PADDING.BOTTOM;
      }
      
      // Calculate protected area (Schutzbereich):
      // Lower inner padding + Individual size of respective footer + Distance of boxes to each other
      const protectedArea = PAGE.BOTTOM_PADDING + footerHeight + CONTENT_BOX.MARGIN.BOTTOM;
      
      // Calculate available height per page
      const availablePageHeight = PAGE.HEIGHT_PX - protectedArea;
      
      blocks.forEach((block, index) => {
        const blockRef = blockRefs.current[block.id];
        if (!blockRef || !blockRef.current) {
          return;
        }

        const blockElement = blockRef.current;
        const blockHeight = blockElement.offsetHeight;
        const blockMarginBottom = parseInt(window.getComputedStyle(blockElement).marginBottom) || 0;
        const totalBlockHeight = blockHeight + blockMarginBottom;
        
        // If starting a new page, add top padding
        if (isNewPage) {
          currentPageHeight = PAGE.TOP_PADDING;
          isNewPage = false;
        }
        
        // Check if adding this block would exceed available page height
        if (index > 0 && currentPageHeight + totalBlockHeight > availablePageHeight) {
          newPageBreaks[block.id] = true;
          isNewPage = true;
          currentPageHeight = PAGE.TOP_PADDING + totalBlockHeight;
        } else {
          currentPageHeight += totalBlockHeight;
        }
      });

      setPageBreaks(newPageBreaks);
    }, 150), // 150ms debounce
    [blocks, footerVariant]
  );

  useEffect(() => {
    if (!containerRef.current || blocks.length === 0) return;

    // Initial calculation with small delay to ensure DOM is rendered
    const timeoutId = setTimeout(() => debouncedCalculate(), 100);

    // Resize handler - use the debounced function
    window.addEventListener('resize', debouncedCalculate);
    
    // MutationObserver with debounced callback - much more performant
    const observer = new MutationObserver(debouncedCalculate);

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        // Remove 'attributes' to reduce triggers - we mainly care about structure changes
        attributeFilter: ['style'] // Only watch style changes
      });
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedCalculate);
      observer.disconnect();
    };
  }, [blocks, containerRef, footerVariant, debouncedCalculate]);

  const setBlockRef = (blockId, ref) => {
    if (ref) {
      blockRefs.current[blockId] = ref;
    }
  };

  return { setBlockRef, pageBreaks };
};

