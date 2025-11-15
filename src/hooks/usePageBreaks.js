import { useEffect, useRef, useState } from 'react';

// A4 page height in pixels (297mm at 96 DPI ≈ 1123px)
// Account for margins and padding: 297mm - 40mm (top/bottom padding) = 257mm
// At 96 DPI: 257mm ≈ 970px
const A4_PAGE_HEIGHT_PX = 970; // Printable height for one A4 page with padding

export const usePageBreaks = (blocks, containerRef) => {
  const blockRefs = useRef({});
  const [pageBreaks, setPageBreaks] = useState({});

  useEffect(() => {
    if (!containerRef.current || blocks.length === 0) return;

    // Function to calculate and set page breaks
    const calculatePageBreaks = () => {
      const newPageBreaks = {};
      let currentPageHeight = 0;
      let isNewPage = true; // Track if we're starting a new page
      
      // Account for page container padding (20mm top + 20mm bottom = 40mm ≈ 151px at 96 DPI)
      // But we only need to account for top padding when starting a new page
      const PAGE_TOP_PADDING = 20; // Top padding in pixels (20mm)
      
      blocks.forEach((block, index) => {
        const blockRef = blockRefs.current[block.id];
        if (!blockRef || !blockRef.current) {
          // If block ref is not ready, skip but continue with next block
          return;
        }

        // Get the actual rendered height of the block including margins
        const blockElement = blockRef.current;
        const blockHeight = blockElement.offsetHeight;
        const blockMarginBottom = parseInt(window.getComputedStyle(blockElement).marginBottom) || 0;
        const totalBlockHeight = blockHeight + blockMarginBottom;
        
        // If starting a new page, add top padding
        if (isNewPage) {
          currentPageHeight = PAGE_TOP_PADDING;
          isNewPage = false;
        }
        
        // Check if adding this block would exceed page height
        if (index > 0 && currentPageHeight + totalBlockHeight > A4_PAGE_HEIGHT_PX) {
          // Add page break before this block
          newPageBreaks[block.id] = true;
          isNewPage = true; // Mark that we're starting a new page
          currentPageHeight = PAGE_TOP_PADDING + totalBlockHeight; // Start new page with this block
        } else {
          // Add block to current page
          currentPageHeight += totalBlockHeight;
        }
      });

      setPageBreaks(newPageBreaks);
    };

    // Initial calculation with delay to ensure DOM is rendered
    const timeoutId = setTimeout(calculatePageBreaks, 100);

    // Also recalculate when window is resized or content changes
    window.addEventListener('resize', calculatePageBreaks);
    
    // Use MutationObserver to detect content changes
    const observer = new MutationObserver(() => {
      setTimeout(calculatePageBreaks, 50);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculatePageBreaks);
      observer.disconnect();
    };
  }, [blocks, containerRef]);

  const setBlockRef = (blockId, ref) => {
    if (ref) {
      blockRefs.current[blockId] = ref;
    }
  };

  return { setBlockRef, pageBreaks };
};

