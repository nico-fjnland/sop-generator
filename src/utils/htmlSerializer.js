/**
 * HTML Serialization Utility
 * Converts React components to static HTML with inline styles for server-side rendering
 * 
 * This module prepares the editor content for Gotenberg PDF/Word export by:
 * 1. Cloning the DOM and removing interactive/editor-only elements
 * 2. Making print-only elements visible
 * 3. Converting images to base64
 * 4. Adding all necessary styles inline
 * 
 * WICHTIG: Text-Styles werden aus src/styles/editorStyles.js importiert,
 * um sicherzustellen, dass Editor und Export immer synchron sind.
 */

import { generateExportCSS, EDITOR_STYLES } from '../styles/editorStyles';

// Import font files - Webpack resolves these to hashed URLs in production
// e.g. /static/media/Inter.abc123.woff2
import InterFontUrl from '../fonts/Inter.woff2';
import RobotoFontUrl from '../fonts/Roboto.woff2';
import QuicksandFontUrl from '../fonts/Quicksand.woff2';

/**
 * Converts a font file to base64 data URL
 * @param {string} url - URL to the font file (Webpack-resolved)
 * @returns {Promise<string>} Base64 data URL
 */
const fontToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch font: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not convert font to base64:', error.message);
    return null;
  }
};

/**
 * Generates @font-face CSS with embedded base64 fonts (DSGVO-compliant, no Google Fonts)
 * Uses Webpack-resolved font URLs that work in both development and production
 * @returns {Promise<string>} Font CSS as string
 */
const fetchFontCSS = async () => {
  try {
    // Use Webpack-imported font URLs (resolved at build time)
    const [interBase64, robotoBase64, quicksandBase64] = await Promise.all([
      fontToBase64(InterFontUrl),
      fontToBase64(RobotoFontUrl),
      fontToBase64(QuicksandFontUrl)
    ]);

    // Generate @font-face rules with embedded fonts
    let css = '';
    
    if (interBase64) {
      css += `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 300 700;
  font-display: swap;
  src: url(${interBase64}) format('woff2');
}`;
    }
    
    if (robotoBase64) {
      css += `
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 300 700;
  font-display: swap;
  src: url(${robotoBase64}) format('woff2');
}`;
    }
    
    if (quicksandBase64) {
      css += `
@font-face {
  font-family: 'Quicksand';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url(${quicksandBase64}) format('woff2');
}`;
    }

    return css;
  } catch (error) {
    console.warn('Could not generate font CSS:', error.message);
    return '';
  }
};

/**
 * Converts images to base64 data URLs
 * @param {HTMLElement} element - Element to process
 * @returns {Promise<void>}
 */
const convertImagesToBase64 = async (element) => {
  const images = element.querySelectorAll('img');
  
  for (const img of images) {
    try {
      // Skip if already a data URL
      if (img.src.startsWith('data:')) continue;
      
      // Skip if cross-origin (will be handled by server)
      if (img.crossOrigin === 'anonymous' || img.src.startsWith('http')) {
        // Try to fetch and convert
        try {
          const response = await fetch(img.src, { mode: 'cors' });
          const blob = await response.blob();
          const reader = new FileReader();
          img.src = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('Could not convert image to base64:', img.src);
          // Keep original src, server will handle it
        }
      }
    } catch (error) {
      console.warn('Error converting image:', error);
    }
  }
};

/**
 * Removes elements that should not appear in print/export
 * This physically removes elements from the DOM clone
 * @param {HTMLElement} clone - The cloned element to clean
 */
const removeNoPrintElements = (clone) => {
  // First, handle special cases: elements with both no-print and specific classes
  // Remove icon-container elements (the draggable icons left of content boxes)
  const iconContainers = clone.querySelectorAll('.icon-container');
  iconContainers.forEach(el => el.remove());
  
  // Remove all elements with 'no-print' class
  const noPrintElements = clone.querySelectorAll('.no-print');
  noPrintElements.forEach(el => el.remove());
  
  // Remove all file inputs (like logo upload)
  const fileInputs = clone.querySelectorAll('input[type="file"]');
  fileInputs.forEach(el => el.remove());
  
  // Remove all buttons
  const buttons = clone.querySelectorAll('button');
  buttons.forEach(el => el.remove());
  
  // Remove control elements (dropdowns, toolbars, etc.)
  const controlSelectors = [
    '.notion-box-controls',
    '.flowchart-toolbar',
    '.flowchart-controls',
    '.flowchart-resize-handle',
    '.flowchart-preview-overlay',
    '.react-flow__controls',
    '.react-flow__minimap',
    // '.react-flow__background' - hidden via CSS, not removed (may affect layout)
    '.react-flow__handle',
    '.flowchart-custom-handle',
    '[data-radix-popper-content-wrapper]',
    '[role="menu"]',
    '[role="dialog"]',
    '.dropdown-menu',
    '.context-menu',
    '.drag-handle',
    '.table-title-input',
    '.sop-header-logo-editable', // Remove editor logo container
  ];
  
  controlSelectors.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
  
  // Remove SVGs marked as no-print
  const noPrintSvgs = clone.querySelectorAll('svg.no-print');
  noPrintSvgs.forEach(el => el.remove());
};

/**
 * Makes print-only elements visible
 * Elements with 'hidden print:block' etc. need to be shown
 * @param {HTMLElement} clone - The cloned element to process
 */
const showPrintOnlyElements = (clone) => {
  // Find all elements with 'hidden' class
  const hiddenElements = clone.querySelectorAll('.hidden');
  
  hiddenElements.forEach(el => {
    const classList = Array.from(el.classList);
    
    // Check for print: modifiers
    const hasPrintBlock = classList.some(cls => 
      cls === 'print:block' || cls.includes('print\\:block')
    );
    const hasPrintFlex = classList.some(cls => 
      cls === 'print:flex' || cls.includes('print\\:flex')
    );
    const hasPrintInline = classList.some(cls => 
      cls === 'print:inline' || cls.includes('print\\:inline')
    );
    
    if (hasPrintBlock || hasPrintFlex || hasPrintInline) {
      // Remove 'hidden' class
      el.classList.remove('hidden');
      
      // Apply appropriate display style
      if (hasPrintFlex) {
        el.style.display = 'flex';
      } else if (hasPrintInline) {
        el.style.display = 'inline';
      } else {
        el.style.display = 'block';
      }
      
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    }
  });
  
  // Also handle caption-box-print elements specifically
  const captionBoxes = clone.querySelectorAll('.caption-box-print');
  captionBoxes.forEach(el => {
    el.classList.remove('hidden');
    el.style.display = 'flex';
    el.style.visibility = 'visible';
    el.style.opacity = '1';
  });
};

/**
 * Cleans up input and textarea elements - replaces them with their values
 * @param {HTMLElement} clone - The cloned element to process
 */
const replaceInputsWithValues = (clone) => {
  // Replace text inputs with spans showing their value
  const textInputs = clone.querySelectorAll('input[type="text"], input:not([type])');
  textInputs.forEach(input => {
    const span = document.createElement('span');
    span.textContent = input.value || '';
    // Copy relevant styles
    span.style.cssText = input.style.cssText;
    if (input.parentNode) {
      input.parentNode.replaceChild(span, input);
    }
  });
  
  // Replace textareas with divs showing their value
  const textareas = clone.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    const div = document.createElement('div');
    div.textContent = textarea.value || '';
    // Copy relevant styles and preserve line breaks
    div.style.cssText = textarea.style.cssText;
    div.style.whiteSpace = 'pre-wrap';
    if (textarea.parentNode) {
      textarea.parentNode.replaceChild(div, textarea);
    }
  });
};

/**
 * Ensures all two-column rows have the height-equalized class
 * and applies inline styles to FORCE height equalization
 * @param {HTMLElement} clone - The cloned element to process
 */
const ensureHeightEqualization = (clone) => {
  // Find all two-column rows and ensure they have height-equalized class
  const twoColumnRows = clone.querySelectorAll('.block-row.two-columns');
  twoColumnRows.forEach((row, rowIndex) => {
    // Always add height-equalized class to two-column rows
    if (!row.classList.contains('height-equalized')) {
      row.classList.add('height-equalized');
    }
    
    // Apply inline styles to FORCE the flexbox stretching
    row.style.display = 'flex';
    row.style.alignItems = 'stretch';
    
    // Find draggable blocks and force them to stretch
    const draggableBlocks = row.querySelectorAll(':scope > .draggable-block');
    draggableBlocks.forEach(block => {
      block.style.display = 'flex';
      block.style.flexDirection = 'column';
      block.style.flex = '1 1 0%';
      block.style.alignSelf = 'stretch';
    });
    
    // Find content-box-block elements and force them to stretch
    const contentBoxBlocks = row.querySelectorAll('.content-box-block');
    contentBoxBlocks.forEach(block => {
      block.style.display = 'flex';
      block.style.flexDirection = 'column';
      block.style.flex = '1';
      block.style.height = '100%';
    });
    
    // Find content-box-wrapper elements and override items-center
    const wrappers = row.querySelectorAll('.content-box-wrapper');
    wrappers.forEach(wrapper => {
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'stretch';
      wrapper.style.flex = '1';
      wrapper.style.height = '100%';
    });
    
    // Find content-box-container elements
    const containers = row.querySelectorAll('.content-box-container');
    containers.forEach(container => {
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.flex = '1';
      container.style.height = '100%';
    });
    
    // Find notion-box-shell elements and PRESERVE their minHeight
    const shells = row.querySelectorAll('.notion-box-shell');
    shells.forEach(shell => {
      // Store the current minHeight before overriding
      const currentMinHeight = shell.style.minHeight;
      shell.style.display = 'flex';
      shell.style.flexDirection = 'column';
      shell.style.flex = '1';
      shell.style.height = '100%';
      // Preserve the minHeight if it was set by useHeightEqualization
      if (currentMinHeight && currentMinHeight !== '50px') {
        shell.style.minHeight = currentMinHeight;
      }
    });
    
    // Keep icons centered
    const icons = row.querySelectorAll('.icon-container');
    icons.forEach(icon => {
      icon.style.alignSelf = 'center';
    });
  });
  
};

/**
 * Creates a print-ready clone of the container with all styles inline
 * @param {HTMLElement} containerRef - The editor container element
 * @returns {Promise<string>} Complete HTML document as string
 */
export const serializeToHTML = async (containerRef) => {
  if (!containerRef) {
    throw new Error('Container reference is required');
  }

  // Clone the container
  const clone = containerRef.cloneNode(true);
  clone.classList.add('export-clone');

  // Make clone invisible
  clone.style.position = 'fixed';
  clone.style.top = '-9999px';
  clone.style.left = '-9999px';
  clone.style.zIndex = '-1';
  clone.style.pointerEvents = 'none';
  clone.style.transform = 'none';
  clone.style.zoom = '1';
  clone.style.width = '210mm';
  clone.style.minHeight = '297mm';

  // Add to document temporarily
  document.body.appendChild(clone);

  // Wait for clone to render
  await new Promise(resolve => setTimeout(resolve, 100));

  // IMPORTANT: Clean up the clone for print
  // 1. Remove no-print elements (must be done BEFORE showing print elements)
  removeNoPrintElements(clone);
  
  // 2. Show print-only elements
  showPrintOnlyElements(clone);
  
  // 3. Replace inputs with their values (for any remaining inputs)
  replaceInputsWithValues(clone);
  
  // 4. Ensure all two-column rows have height-equalized class
  ensureHeightEqualization(clone);

  // 5. Convert images to base64
  await convertImagesToBase64(clone);

  // Fetch font CSS
  const fontCSS = await fetchFontCSS();

  // Create comprehensive print styles - includes ALL necessary layout CSS
  // Text styles are generated from editorStyles.js for consistency
  const generatedTextStyles = generateExportCSS();
  
  const printStyles = `
    ${fontCSS}
    
    /* ============================================
       GENERATED TEXT STYLES (from editorStyles.js)
       ============================================ */
    ${generatedTextStyles}
    
    /* ============================================
       BASE STYLES
       ============================================ */
    * {
      box-sizing: border-box !important;
      -webkit-box-sizing: border-box !important;
      -moz-box-sizing: border-box !important;
    }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      font-family: 'Roboto', sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* ============================================
       LINK STYLES - Remove default browser underline
       ============================================ */
    a, a:link, a:visited, a:hover, a:active {
      text-decoration: none !important;
      color: inherit !important;
    }
    
    /* TipTap/ProseMirror links should match editor appearance */
    .ProseMirror a,
    .content-box-block a,
    .tiptap-table-block a,
    .tiptap-wrapper a {
      text-decoration: none !important;
      color: inherit !important;
    }
    
    /* ============================================
       A4 PAGE STYLES
       ============================================ */
    .a4-page {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      position: relative !important;
      overflow: hidden !important;
      box-shadow: none !important;
      page-break-after: always !important;
    }
    
    .a4-page:last-child {
      page-break-after: auto !important;
    }
    
    /* Page content wrapper - override inline padding */
    .page-content {
      padding: 16px 32px 0 32px !important; /* Same as screen, consistent margins */
    }
    
    /* ============================================
       ROW LAYOUT - CRITICAL FOR TWO-COLUMN
       ============================================ */
    .block-row {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      margin-bottom: 1.5rem !important;
      width: 100% !important;
    }
    
    .block-row.two-columns {
      gap: 16px !important;
      margin-bottom: 1rem !important;
      margin-left: 0 !important;
      margin-right: 0 !important; /* No margin - icon extends beyond */
      padding: 0 !important;
    }
    
    /* Height equalization - EXACTLY like App.css */
    .block-row.two-columns.height-equalized {
      display: flex !important;
      align-items: stretch !important;
    }
    
    /* Draggable wrapper must stretch and pass height to children */
    .block-row.two-columns.height-equalized > .draggable-block {
      display: flex !important;
      flex-direction: column !important;
      flex: 1 1 0% !important;
      height: auto !important;
      min-height: 0 !important;
      min-width: 0 !important;
    }
    
    /* Non-height-equalized two-column rows */
    .block-row.two-columns:not(.height-equalized) > .draggable-block {
      flex: 1 1 0% !important;
      min-width: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    
    /* ALL content boxes in two-column layout: NO margin (icon extends beyond) */
    .block-row.two-columns .content-box-block {
      margin-right: 0 !important;
      margin-left: 0 !important;
    }
    
    .block-row.single-column {
      gap: 0 !important;
    }
    
    /* Single column boxes: 14px right margin (same as editor) */
    .block-row.single-column .content-box-block {
      margin-right: 14px !important;
    }
    
    /* Draggable block wrapper */
    .draggable-block {
      display: flex !important;
      flex-direction: column !important;
    }
    
    /* ============================================
       SOP HEADER
       ============================================ */
    .sop-header {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      width: 100% !important;
      padding: 8px 14px !important;
      gap: 24px !important;
      margin-bottom: 1rem !important;
    }
    
    .sop-header > div.flex.flex-col {
      gap: 0 !important;
      flex: 1 !important;
      min-width: 0 !important;
    }
    
    /* Stand row with plus icon - proper vertical alignment */
    .sop-header .flex.items-center.gap-1 {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
    
    /* Plus icon container */
    .sop-header .flex.items-center.gap-1 > div:first-child {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 11px !important;
      height: 11px !important;
      flex-shrink: 0 !important;
    }
    
    .sop-header .flex.items-center.gap-1 svg {
      display: block !important;
      vertical-align: middle !important;
    }
    
    /* Stand text */
    .sop-header-editable,
    .sop-header span[style*="fontFamily: 'Quicksand'"],
    .sop-header span[style*="font-family: 'Quicksand'"] {
      font-family: 'Quicksand', sans-serif !important;
      font-weight: 600 !important;
      font-size: 12px !important;
      letter-spacing: 2px !important;
      text-transform: uppercase !important;
      line-height: 12px !important;
      color: #003366 !important;
      display: inline-flex !important;
      align-items: center !important;
    }
    
    /* Title */
    .sop-header div[style*="fontSize: 32px"],
    .sop-header div[style*="font-size: 32px"] {
      font-family: 'Roboto', sans-serif !important;
      font-weight: 600 !important;
      font-size: 32px !important;
      color: #003366 !important;
      letter-spacing: 1.04px !important;
      text-transform: uppercase !important;
      line-height: 1.2 !important;
      padding: 4px 8px !important;
    }
    
    /* Logo container */
    .sop-header > div.flex.items-center.justify-end {
      flex-shrink: 0 !important;
    }
    
    .sop-header img[alt="Logo"],
    .sop-header img[alt="Firmenlogo"] {
      max-width: 140px !important;
      height: 70px !important;
      width: auto !important;
      object-fit: contain !important;
      object-position: right top !important;
    }
    
    /* ============================================
       CONTENT BOX BLOCK
       ============================================ */
    .content-box-block {
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: visible !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .content-box-wrapper {
      display: flex !important;
      align-items: center !important;
      width: 100% !important;
      position: relative !important;
      overflow: visible !important;
    }
    
    .content-box-wrapper.flex-row-reverse {
      flex-direction: row-reverse !important;
    }
    
    /* Print icons - the oval icons left of content boxes */
    .content-box-wrapper > div[class*="print:flex"] {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      position: relative !important;
      z-index: 10 !important;
      overflow: visible !important;
    }
    
    /* Icon margins - important for proper positioning */
    /* LEFT icon (normal boxes) - overlaps box by 14px */
    .content-box-wrapper > div[class*="mr-[-14px]"] {
      margin-right: -14px !important;
    }
    
    /* RIGHT icon (right column in two-column layout) - ABSOLUTE positioning
       so it doesn't take up space in flex flow */
    .content-box-wrapper.flex-row-reverse > div[class*="ml-[-14px]"] {
      position: absolute !important;
      right: -16px !important; /* 30px icon - 14px overlap = 16px outside box */
      top: 50% !important;
      transform: translateY(-50%) !important;
      margin-left: 0 !important;
      z-index: 10 !important;
    }
    
    /* Ensure wrapper has relative positioning for absolute icon */
    .content-box-wrapper.flex-row-reverse {
      position: relative !important;
      overflow: visible !important;
    }
    
    .content-box-container {
      position: relative !important;
      flex: 1 !important;
      min-width: 0 !important;
    }
    
    /* The main box with colored border - preserve inline border-color AND minHeight! */
    .notion-box-shell {
      background: white !important;
      border-width: 1.8px !important;
      border-style: solid !important;
      /* border-color is set inline and must be preserved */
      border-radius: 6px !important;
      /* DO NOT set min-height here - inline minHeight from useHeightEqualization must be preserved */
      width: 100% !important;
      position: relative !important;
    }
    
    .content-box-content {
      padding: 24px 26px 20px 26px !important;
    }
    
    /* Caption container */
    .caption-container {
      position: absolute !important;
      left: 26px !important;
      top: -10px !important;
      z-index: 20 !important;
    }
    
    /* Caption box print version */
    .caption-box-print {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      align-items: center !important;
      justify-content: center !important;
      border: 2px solid white !important;
      border-radius: 6px !important;
      padding: 4px 8px !important;
    }
    
    .caption-box-print p {
      font-family: 'Roboto', sans-serif !important;
      font-weight: 600 !important;
      font-style: italic !important;
      font-size: 9px !important;
      line-height: 9px !important;
      letter-spacing: 1.05px !important;
      text-transform: uppercase !important;
      color: white !important;
      white-space: nowrap !important;
      margin: 0 !important;
    }
    
    /* Height equalization - inner containers (EXACTLY like App.css) */
    
    /* ContentBoxBlock fills available height */
    .block-row.two-columns.height-equalized .content-box-block {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      height: 100% !important;
      margin-bottom: 0 !important;
    }
    
    /* The icon+box wrapper - MUST use stretch instead of center */
    /* Override Tailwind items-center with attribute selector for maximum specificity */
    .block-row.two-columns.height-equalized .content-box-wrapper,
    .block-row.two-columns.height-equalized .content-box-wrapper[class*="items-center"],
    .block-row.two-columns.height-equalized div.content-box-wrapper.flex.items-center {
      flex: 1 1 auto !important;
      align-items: stretch !important;
      height: 100% !important;
      margin-bottom: 0 !important;
    }
    
    /* Icon container stays vertically centered even when wrapper stretches */
    .block-row.two-columns.height-equalized .icon-container {
      align-self: center !important;
    }
    
    /* The box container needs to fill height */
    .block-row.two-columns.height-equalized .content-box-container {
      display: flex !important;
      flex-direction: column !important;
      flex: 1 1 auto !important;
      height: 100% !important;
    }
    
    /* The bordered box shell fills height */
    .block-row.two-columns.height-equalized .notion-box-shell {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      height: 100% !important;
    }
    
    /* Content area fills remaining space */
    .block-row.two-columns.height-equalized .content-box-content {
      flex: 1 1 auto !important;
    }
    
    /* ============================================
       INTERNAL TWO/THREE COLUMN LAYOUT (inside content boxes)
       Used for Disposition and other boxes with internal columns
       ============================================ */
    .content-box-content.two-column,
    .source-box-content.two-column {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 16px !important;
    }
    
    .content-box-content.three-column {
      display: grid !important;
      grid-template-columns: 1fr 1fr 1fr !important;
      gap: 16px !important;
    }
    
    /* Inner blocks in multi-column layout */
    .content-box-content.two-column > .inner-block,
    .content-box-content.three-column > .inner-block,
    .source-box-content.two-column > .source-item {
      min-width: 0 !important;
    }
    
    /* ============================================
       SOURCE BLOCK - Align with table content (16px left, 14px right)
       ============================================ */
    .source-block {
      /* Same margins as tables: 16px left (icon width - overlap), 14px right */
      margin-left: 16px !important;
      margin-right: 14px !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Remove any border from source box container (hover state shouldn't show in print) */
    .source-box-container {
      border: none !important;
      background: transparent !important;
    }
    
    /* Source box content: Remove horizontal padding so text aligns with table headers */
    .source-box-content {
      padding-left: 14px !important;
      padding-right: 14px !important;
    }
    
    /* ============================================
       TABLE ADDITIONAL STYLES (not covered by generateExportCSS)
       ============================================ */
    
    /* Override inline padding from TipTapTableBlock.js for TABLE content (not title) */
    .tiptap-table-block-wrapper > .flex:not(.mb-2),
    .tiptap-table-block-wrapper > div[style*="padding"]:not(.mb-2) {
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    
    /* Table TITLE container (has mb-2 class) - indent 14px from each side */
    .tiptap-table-block-wrapper > .mb-2,
    .tiptap-table-block-wrapper > div.mb-2 {
      padding-left: 14px !important;
      padding-right: 14px !important;
    }
    
    /* Fix last row cells - same padding as other rows */
    .tiptap-table-block tr:last-child td,
    .tiptap-table-block tr:last-child th,
    .tiptap-table-wrapper tr:last-child td,
    .tiptap-table-wrapper tr:last-child th,
    .tiptap-table-editor tr:last-child td,
    .tiptap-table-editor tr:last-child th {
      padding: 6px 14px !important;
    }
    
    /* Hide empty paragraph after table in ProseMirror */
    .tiptap-table-wrapper .ProseMirror > p:empty,
    .tiptap-table-wrapper .ProseMirror > p:has(> br:only-child),
    .tiptap-table-editor > p:empty,
    .tiptap-table-editor > p:has(> br:only-child) {
      display: none !important;
    }
    
    /* Table title for print */
    .tiptap-table-block .print\\:flex,
    .tiptap-table-block-wrapper .print\\:flex {
      display: flex !important;
    }
    
    /* ============================================
       FLOWCHART STYLES
       ============================================ */
    .flowchart-block-container {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: visible !important;
    }
    
    /* Hide dynamic React Flow preview in print */
    .flowchart-block-container > .no-print,
    .flowchart-preview-container,
    .flowchart-preview-wrapper {
      display: none !important;
    }
    
    /* Show static SVG for print */
    .flowchart-static-print {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 100% !important;
      overflow: hidden !important;
    }
    
    .flowchart-static-print svg {
      width: 100% !important;
      height: auto !important;
      max-height: 100% !important;
    }
    
    /* Fallback message for print */
    .flowchart-no-svg {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* ============================================
       FOOTER STYLES
       ============================================ */
    .sop-footer {
      position: absolute !important;
      bottom: 0 !important;
      /* Footer is positioned relative to .page-content's padding-box (full A4 width).
         Boxes are in the content-area (after 32px padding).
         To align footer with boxes:
         - Left: 32px (padding) + 16px (icon offset) = 48px from A4 edge
         - Right: 32px (padding) + 14px (box margin-right) = 46px from A4 edge */
      left: 48px !important;
      right: 46px !important;
      width: auto !important;
      /* Reset any inline padding */
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    
    .sop-footer * {
      font-family: inherit !important;
    }
    
    /* Placeholder Footer - nur als Weißraum im Export */
    .placeholder-footer-box {
      background-color: transparent !important;
      border: none !important;
    }
    
    .placeholder-footer-content,
    .placeholder-footer-text {
      visibility: hidden !important;
    }
    
    /* ============================================
       UTILITY CLASSES
       ============================================ */
    .hidden {
      display: none !important;
    }
    
    /* Override hidden for print elements */
    [class*="print:block"] {
      display: block !important;
    }
    
    [class*="print:flex"] {
      display: flex !important;
    }
    
    [class*="print:inline"] {
      display: inline !important;
    }
    
    /* Hide placeholder text */
    ::placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    /* Flexbox utilities */
    .flex {
      display: flex !important;
    }
    
    .flex-col {
      flex-direction: column !important;
    }
    
    .flex-row-reverse {
      flex-direction: row-reverse !important;
    }
    
    .items-center {
      align-items: center !important;
    }
    
    .items-start {
      align-items: flex-start !important;
    }
    
    .justify-center {
      justify-content: center !important;
    }
    
    .justify-end {
      justify-content: flex-end !important;
    }
    
    .justify-between {
      justify-content: space-between !important;
    }
    
    .flex-1 {
      flex: 1 1 0% !important;
    }
    
    .shrink-0 {
      flex-shrink: 0 !important;
    }
    
    .min-w-0 {
      min-width: 0 !important;
    }
    
    .w-full {
      width: 100% !important;
    }
    
    .relative {
      position: relative !important;
    }
    
    .absolute {
      position: absolute !important;
    }
    
    .gap-1 { gap: 0.25rem !important; }
    .gap-2 { gap: 0.5rem !important; }
    .gap-4 { gap: 1rem !important; }
    
    .mb-2 { margin-bottom: 0.5rem !important; }
    .mb-4 { margin-bottom: 1rem !important; }
  `;

  // Wait for fonts to load
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await new Promise(resolve => setTimeout(resolve, 200));

  // Get HTML string
  const htmlString = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export</title>
  <style>
    ${printStyles}
  </style>
</head>
<body>
  ${clone.innerHTML}
</body>
</html>
  `.trim();

  // Clean up
  document.body.removeChild(clone);

  return htmlString;
};

/**
 * Generates a content hash for caching
 * @param {string} html - HTML content
 * @param {string} format - Export format
 * @returns {Promise<string>} Hash string
 */
export const generateContentHash = async (html, format) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${html}-${format}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16); // Use first 16 chars for shorter key
};
