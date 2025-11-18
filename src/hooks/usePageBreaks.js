import { useEffect, useRef, useState, useMemo } from 'react';
import { debounce } from '../utils/performance';
import { PAGE, FOOTER } from '../constants/layout';

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
      
      // Get footer height for current variant
      const footerHeight = FOOTER.HEIGHTS[footerVariant] || FOOTER.HEIGHTS.tiny;
      
      // Calculate available height per page (total height minus footer)
      const availablePageHeight = PAGE.HEIGHT_PX - footerHeight;
      
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

