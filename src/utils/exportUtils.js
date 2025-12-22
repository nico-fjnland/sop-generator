import { Document, Packer, Paragraph, ImageRun } from 'docx';
import jsPDF from 'jspdf';
import { toPng, toJpeg } from 'html-to-image';
import { getDocument } from '../services/documentService';
import JSZip from 'jszip';
import { exportDocumentServerSide, downloadBlob as downloadBlobService } from '../services/exportService';

/**
 * Waits for all fonts to be fully loaded before proceeding with export.
 * This ensures consistent font rendering across browsers.
 * @returns {Promise<void>}
 */
const waitForFonts = async () => {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  // Additional wait time for font rendering to stabilize
  await new Promise(resolve => setTimeout(resolve, 200));
};

/**
 * Fetches and prepares font CSS for html-to-image.
 * This is needed because Firefox blocks access to cross-origin stylesheet CSS rules.
 * By fetching the CSS as text and passing it via fontEmbedCSS option, we bypass this issue.
 * @returns {Promise<string>} - The font CSS as a string
 */
let cachedFontCSS = null;
const fetchFontCSS = async () => {
  if (cachedFontCSS) return cachedFontCSS;
  
  try {
    // Fetch Google Fonts CSS directly as text with all required weights
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap';
    const response = await fetch(fontUrl);
    
    if (!response.ok) {
      throw new Error(`Font fetch failed: ${response.status}`);
    }
    
    cachedFontCSS = await response.text();
    return cachedFontCSS;
  } catch (error) {
    console.warn('Could not fetch Google Fonts CSS, using fallback:', error.message);
    // Return fallback font-face rules for system fonts with all weights
    return `
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 300;
        src: local('Roboto Light'), local('Roboto-Light'), local('Arial');
      }
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 400;
        src: local('Roboto'), local('Roboto-Regular'), local('Arial');
      }
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 500;
        src: local('Roboto Medium'), local('Roboto-Medium'), local('Arial');
      }
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 600;
        src: local('Roboto SemiBold'), local('Roboto-SemiBold'), local('Arial');
      }
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 700;
        src: local('Roboto Bold'), local('Roboto-Bold'), local('Arial');
      }
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 300;
        src: local('Inter Light'), local('Inter-Light'), local('-apple-system'), local('BlinkMacSystemFont'), local('Arial');
      }
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 400;
        src: local('Inter'), local('Inter-Regular'), local('-apple-system'), local('BlinkMacSystemFont'), local('Arial');
      }
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 500;
        src: local('Inter Medium'), local('Inter-Medium'), local('-apple-system'), local('BlinkMacSystemFont'), local('Arial');
      }
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 600;
        src: local('Inter SemiBold'), local('Inter-SemiBold'), local('-apple-system'), local('BlinkMacSystemFont'), local('Arial');
      }
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 700;
        src: local('Inter Bold'), local('Inter-Bold'), local('-apple-system'), local('BlinkMacSystemFont'), local('Arial');
      }
      @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 400;
        src: local('Quicksand'), local('Quicksand-Regular'), local('Arial');
      }
      @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 500;
        src: local('Quicksand Medium'), local('Quicksand-Medium'), local('Arial');
      }
      @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 600;
        src: local('Quicksand SemiBold'), local('Quicksand-SemiBold'), local('Arial');
      }
      @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 700;
        src: local('Quicksand Bold'), local('Quicksand-Bold'), local('Arial');
      }
    `;
  }
};

/**
 * Common options for html-to-image to fix Firefox cross-origin issues
 * @param {string} fontEmbedCSS - Pre-fetched font CSS
 * @param {boolean} skipFonts - Whether to skip font processing entirely (fallback mode)
 * @returns {Object} - html-to-image options
 */
const getHtmlToImageOptions = (fontEmbedCSS, skipFonts = false) => ({
  quality: 0.98,
  pixelRatio: 6,
  backgroundColor: '#ffffff',
  cacheBust: true,
  // Pass the font CSS directly to avoid cross-origin issues in Firefox
  fontEmbedCSS: skipFonts ? undefined : fontEmbedCSS,
  // Skip automatic font embedding if fallback mode or we provide it manually
  skipFonts: skipFonts,
  // Use 'woff2' for better compression and compatibility
  preferredFontFormat: 'woff2',
  // Custom filter to skip problematic elements
  filter: (node) => {
    // Skip script tags and hidden elements that might cause issues
    if (node.tagName === 'SCRIPT' || node.tagName === 'NOSCRIPT') {
      return false;
    }
    return true;
  },
});

/**
 * Captures a page to image with automatic fallback for Firefox cross-origin issues.
 * First tries with font embedding, then falls back to skipFonts if that fails.
 * @param {HTMLElement} page - The page element to capture
 * @param {Function} captureFunc - The capture function (toPng or toJpeg)
 * @param {string} fontEmbedCSS - Pre-fetched font CSS
 * @param {Object} extraOptions - Additional options to merge
 * @returns {Promise<string>} - Data URL of the captured image
 */
const captureWithFallback = async (page, captureFunc, fontEmbedCSS, extraOptions = {}) => {
  // First attempt: with font embedding
  try {
    const options = {
      ...getHtmlToImageOptions(fontEmbedCSS, false),
      ...extraOptions,
    };
    return await captureFunc(page, options);
  } catch (firstError) {
    // Check if it's a cross-origin stylesheet error (common in Firefox)
    const errorMessage = firstError.message || firstError.toString();
    const isCrossOriginError = errorMessage.includes('cssRules') || 
                               errorMessage.includes('cross-origin') ||
                               errorMessage.includes('SecurityError') ||
                               errorMessage.includes("can't access property");
    
    if (isCrossOriginError) {
      console.warn('Cross-origin stylesheet error detected, retrying with skipFonts=true...');
      
      // Second attempt: skip fonts entirely (uses browser-cached fonts)
      try {
        const fallbackOptions = {
          ...getHtmlToImageOptions(fontEmbedCSS, true),
          ...extraOptions,
        };
        return await captureFunc(page, fallbackOptions);
      } catch (secondError) {
        console.error('Fallback capture also failed:', secondError);
        throw secondError;
      }
    }
    
    // Not a cross-origin error, rethrow
    throw firstError;
  }
};

/**
 * Native file download function (replaces file-saver).
 * @param {Blob} blob - The blob to download.
 * @param {string} filename - The filename for the download.
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports the current editor state as a JSON file.
 * Preserves all formatting including line breaks and bullet points.
 * Filename format: titel-stand.json
 * @param {Object} state - The editor state object.
 */
export const exportAsJson = (state) => {
  // Generate filename from state's title and stand
  const title = state.headerTitle || 'SOP Überschrift';
  const stand = state.headerStand || 'STAND';
  const filename = generateFilename(title, stand);
  
  // Deep clone state to avoid mutations
  const stateToExport = JSON.parse(JSON.stringify(state));
  
  // Add metadata for validation
  stateToExport._exportMetadata = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    editorVersion: '2.0'
  };
  
  const jsonString = JSON.stringify(stateToExport, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
};

/**
 * Validates and sanitizes block content to preserve formatting.
 * @param {Object} block - Block object to validate.
 * @returns {Object} - Validated and sanitized block.
 */
const validateAndSanitizeBlock = (block) => {
  if (!block || typeof block !== 'object') {
    return { id: Date.now().toString(), type: 'text', content: '' };
  }
  
  // Ensure block has required fields
  const sanitized = {
    id: block.id || Date.now().toString(),
    type: block.type || 'text',
    content: block.content !== undefined ? block.content : ''
  };
  
  // For contentbox blocks, validate nested structure and preserve all settings
  if (sanitized.type === 'contentbox' && typeof sanitized.content === 'object') {
    sanitized.content = {
      category: sanitized.content.category || 'definition',
      blocks: Array.isArray(sanitized.content.blocks) 
        ? sanitized.content.blocks.map(validateAndSanitizeBlock)
        : [{ id: Date.now().toString(), type: 'text', content: '' }],
      // Preserve box settings
      columnCount: sanitized.content.columnCount || 1,
      customLabel: sanitized.content.customLabel || null,
      customColor: sanitized.content.customColor || null,
    };
  }
  
  // For source blocks, validate nested structure and preserve settings
  if (sanitized.type === 'source' && typeof sanitized.content === 'object') {
    sanitized.content = {
      blocks: Array.isArray(sanitized.content.blocks) 
        ? sanitized.content.blocks.map(validateAndSanitizeBlock)
        : [{ id: Date.now().toString(), type: 'text', content: '' }],
      columnCount: sanitized.content.columnCount || 1,
    };
  }
  
  // For text blocks with HTML content, preserve line breaks
  if (sanitized.type === 'text' && typeof sanitized.content === 'string') {
    // Ensure line breaks are preserved as HTML
    if (!/<br/i.test(sanitized.content) && /\n/.test(sanitized.content)) {
      sanitized.content = sanitized.content.replace(/\n/g, '<br>');
    }
    
    // Preserve bullet points (both Unicode and HTML entities)
    if (!sanitized.content.includes('\u2022') && !sanitized.content.includes('&#8226;')) {
      // Convert markdown-style bullets if present
      sanitized.content = sanitized.content.replace(/^(\s*[-*])\s+/gm, '$1 ');
    }
  }
  
  return sanitized;
};

/**
 * Imports editor state from a JSON file.
 * Validates structure and preserves formatting including line breaks and bullets.
 * @param {File} file - The uploaded JSON file.
 * @returns {Promise<Object>} - Resolves with the parsed and validated state object.
 */
export const importFromJson = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        
        // Comprehensive validation
        if (!json || typeof json !== 'object') {
          reject(new Error('Invalid file format: not a valid JSON object'));
          return;
        }
        
        if (!Array.isArray(json.rows)) {
          reject(new Error('Invalid file format: missing rows array'));
          return;
        }
        
        // Validate and sanitize the imported data
        const sanitizedState = {
          headerTitle: json.headerTitle || 'SOP Überschrift',
          headerStand: json.headerStand || 'STAND 12/22',
          headerLogo: json.headerLogo || null,
          footerVariant: json.footerVariant || 'tiny',
          rows: json.rows.map(row => {
            if (!row || typeof row !== 'object' || !Array.isArray(row.blocks)) {
              return {
                id: `row-${Date.now()}`,
                columnRatio: 0.5,
                blocks: [{ id: Date.now().toString(), type: 'text', content: '' }]
              };
            }
            
            return {
              id: row.id || `row-${Date.now()}`,
              columnRatio: typeof row.columnRatio === 'number' ? row.columnRatio : 0.5,
              blocks: row.blocks.map(validateAndSanitizeBlock)
            };
          })
        };
        
        // Remove metadata if present (not needed in editor state)
        delete sanitizedState._exportMetadata;
        
        resolve(sanitizedState);
      } catch (error) {
        console.error('JSON import error:', error);
        reject(new Error('Failed to parse JSON file: ' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Creates an invisible clone of the container with print styles applied.
 * This prevents flickering in the visible editor.
 */
const createPrintClone = (containerRef) => {
  // Clone the entire container
  const clone = containerRef.cloneNode(true);
  
  // Add a unique class to target only the clone
  clone.classList.add('export-clone');
  
  // Make clone invisible and positioned offscreen
  clone.style.position = 'fixed';
  clone.style.top = '-9999px';
  clone.style.left = '-9999px';
  clone.style.zIndex = '-1';
  clone.style.pointerEvents = 'none';
  
  // WICHTIG: Zoom ignorieren - immer auf 100% skalieren
  clone.style.transform = 'none';
  clone.style.zoom = '1';
  
  // Preserve exact dimensions (verwende offsetWidth statt getBoundingClientRect für ungezoomte Größe)
  clone.style.width = '210mm'; // A4 Breite
  clone.style.minHeight = '297mm'; // A4 Höhe
  
  // Add print styles that only apply to the clone
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* All styles target ONLY the clone */
    /* WICHTIG: Zoom und Transform ignorieren für Export */
    .export-clone {
      transform: none !important;
      zoom: 1 !important;
      scale: 1 !important;
    }
    
    /* Reset zoom for most elements, but preserve ReactFlow viewport transforms */
    .export-clone *:not(.react-flow__viewport):not(.react-flow__viewport *):not(.react-flow__edge):not(.react-flow__node) {
      zoom: 1 !important;
    }
    
    /* WICHTIG: A4-Pages ohne Margin im Export - nur der reine Container */
    .export-clone .a4-page {
      margin: 0 !important;
      box-shadow: none !important;
    }
    
    .export-clone .no-print {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      position: absolute !important;
      pointer-events: none !important;
    }
    
    /* Hide all placeholder text in export */
    .export-clone ::placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    .export-clone ::-webkit-input-placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    .export-clone ::-moz-placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    .export-clone :-ms-input-placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    /* Hide TipTap placeholder text in export */
    .export-clone .tiptap-wrapper .tiptap-editor .is-editor-empty::before,
    .export-clone .tiptap-wrapper .tiptap-editor .is-empty::before {
      content: none !important;
      display: none !important;
    }
    
    .export-clone .hidden.print\\:block {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    .export-clone .hidden.print\\:inline {
      display: inline !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    .export-clone .hidden.print\\:flex {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    .export-clone .sop-header {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      width: 100% !important;
      margin-bottom: 1.5rem !important;
      padding-top: 14px !important;
      padding-bottom: 14px !important;
      padding-left: 14px !important;
      padding-right: 14px !important;
      gap: 0 !important;
    }
    
    .export-clone .sop-header > div.flex.flex-col {
      gap: 0.5rem !important;
      flex: 1 !important;
      min-width: 0 !important;
      max-width: calc(100% - 155.4px - 28px) !important; /* Full width minus logo width minus header padding */
      align-items: flex-start !important; /* Ensure left alignment */
    }
    
    /* Stand text container - ensure left alignment, remove ALL padding that causes misalignment */
    .export-clone .sop-header > div.flex.flex-col > div.flex.items-center {
      padding-left: 0 !important;
      padding-right: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-start !important; /* Left align */
      margin: 0 !important;
      gap: 4px !important; /* Gap between icon and text */
    }
    
    /* Stand icon - ensure proper alignment */
    .export-clone .sop-header > div.flex.flex-col > div.flex.items-center > div {
      flex-shrink: 0 !important;
      width: 11px !important;
      height: 11px !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Stand text - explicit font styles for consistent rendering, reduce weight for Firefox */
    .export-clone .sop-header span[style*="fontFamily"],
    .export-clone .sop-header input[style*="fontFamily"],
    .export-clone .sop-header .sop-header-editable {
      font-family: 'Quicksand', sans-serif !important;
      font-weight: 500 !important; /* Reduced from 600 to prevent Firefox rendering issues */
      font-size: 12px !important;
      letter-spacing: 2px !important;
      text-transform: uppercase !important;
      line-height: 12px !important;
      color: #003366 !important;
      margin: 0 !important;
      padding: 2px 4px !important;
      text-align: left !important;
      display: inline-block !important;
    }
    
    /* Title container - ensure left alignment with NO padding */
    .export-clone .sop-header > div.flex.flex-col > div:not(.flex.items-center) {
      width: 100% !important;
      text-align: left !important;
      margin: 0 !important;
      padding: 0 !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    
    /* Title - ensure left alignment with minimal padding */
    .export-clone .sop-header .sop-header-title-editable,
    .export-clone .sop-header .hidden.print\\:block[style*="fontSize"],
    .export-clone .sop-header textarea[style*="fontSize"] {
      text-align: left !important;
      margin: 0 !important;
      padding: 4px 0 !important; /* Only top/bottom padding, no left/right */
      padding-left: 0 !important;
      padding-right: 0 !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    
    /* Logo container - ensure right alignment */
    .export-clone .sop-header > div.flex.items-center.justify-end {
      padding-left: 0 !important;
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      width: 155.4px !important;
      margin-left: auto !important;
    }
    
    /* Logo wrapper - ensure it stays within bounds and right-aligned */
    .export-clone .sop-header > div.flex.items-center.justify-end > div.relative {
      width: 155.4px !important;
      height: 65.2px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
    }
    
    /* Logo display container - right aligned */
    .export-clone .sop-header > div.flex.items-center.justify-end > div.relative > div {
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
    }
    
    /* Logo image - right aligned */
    .export-clone .sop-header img[alt="Logo"],
    .export-clone .sop-header svg[width="87.6"] {
      max-width: 100% !important;
      height: 54.12px !important;
      width: auto !important;
      object-fit: contain !important;
      object-position: right center !important;
      margin-left: auto !important;
    }
    
    /* Caption container - use transform instead of negative top for better browser compatibility */
    .export-clone .content-box-block .caption-container {
      left: 26px !important;
      top: 0 !important;
      margin-top: 0 !important;
      position: absolute !important;
      transform: translateY(-10px) !important;
      -webkit-transform: translateY(-10px) !important;
      -moz-transform: translateY(-10px) !important;
      z-index: 20 !important;
      display: block !important;
    }
    
    /* Caption box - explicit flexbox centering for text with proper border radius */
    .export-clone .content-box-block .caption-container .caption-box-print,
    .export-clone .content-box-block .caption-box-print[class*="print:block"],
    .export-clone .content-box-block .caption-container .hidden.print\\:block,
    .export-clone .content-box-block .caption-box-print {
      border: 2px solid white !important;
      border-width: 2px !important;
      border-style: solid !important;
      border-color: white !important;
      border-radius: 6px !important;
      -webkit-border-radius: 6px !important;
      -moz-border-radius: 6px !important;
      border-top-left-radius: 6px !important;
      border-top-right-radius: 6px !important;
      border-bottom-left-radius: 6px !important;
      border-bottom-right-radius: 6px !important;
      display: flex !important;
      -webkit-display: flex !important;
      align-items: center !important;
      -webkit-align-items: center !important;
      justify-content: center !important;
      -webkit-justify-content: center !important;
      padding: 4px 8px !important;
      box-sizing: border-box !important;
      -webkit-box-sizing: border-box !important;
      -moz-box-sizing: border-box !important;
      width: auto !important;
      height: auto !important;
      min-width: 0 !important;
      margin: 0 !important;
    }
    
    /* Caption text - explicit font styles for consistent rendering and centering */
    .export-clone .content-box-block .caption-box-print p,
    .export-clone .content-box-block .caption-container .caption-box-print p,
    .export-clone .content-box-block div.caption-box-print p,
    .export-clone .content-box-block .caption-box-print p.font-semibold,
    .export-clone .content-box-block .caption-box-print p.italic,
    .export-clone .content-box-block .caption-box-print p.text-white {
      font-family: 'Roboto', sans-serif !important;
      font-weight: 600 !important;
      font-style: italic !important;
      font-size: 9px !important;
      line-height: 9px !important;
      letter-spacing: 1.05px !important;
      text-transform: uppercase !important;
      color: white !important;
      white-space: nowrap !important;
      margin: 0 auto !important;
      padding: 0 !important;
      text-align: center !important;
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    
    /* Flowchart Block Export Styles */
    .export-clone .flowchart-block-container {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      /* Preserve the actual height from the editor, don't override it */
      overflow: hidden !important;
    }
    
    .export-clone .flowchart-wrapper {
      width: 100% !important;
      height: 100% !important;
    }
    
    .export-clone .react-flow {
      width: 100% !important;
      height: 100% !important;
    }
    
    .export-clone .flowchart-toolbar,
    .export-clone .flowchart-controls {
      display: none !important;
    }
    
    /* Hide background grid */
    .export-clone .react-flow__background {
      display: none !important;
    }
    
    /* Hide helper lines SVG */
    .export-clone svg.no-print {
      display: none !important;
    }
    
    /* Hide all handles */
    .export-clone .react-flow__handle,
    .export-clone .flowchart-custom-handle {
      display: none !important;
      visibility: hidden !important;
    }
    
    /* Hide resize handle */
    .export-clone .flowchart-resize-handle {
      display: none !important;
    }
    
    /* Remove shadows from flowchart nodes */
    .export-clone .flowchart-node {
      box-shadow: none !important;
    }
    
    /* Keep viewport interactive elements disabled but preserve transforms */
    .export-clone .react-flow__viewport {
      pointer-events: none !important;
      /* DO NOT override transform - ReactFlow needs it for positioning */
    }
    
    .export-clone .react-flow__renderer {
      pointer-events: none !important;
    }
    
    /* Ensure nodes and edges preserve their positioning */
    .export-clone .react-flow__node,
    .export-clone .flowchart-node {
      pointer-events: none !important;
      /* Transform is needed for node positioning */
    }
    
    .export-clone .react-flow__edge {
      pointer-events: none !important;
      /* Transform is needed for edge positioning */
    }
    
    .export-clone .flowchart-node-input {
      pointer-events: none !important;
      cursor: default !important;
    }
    
    /* Hide flowchart node placeholder text */
    .export-clone .flowchart-node-input::placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    .export-clone .flowchart-node-input::-webkit-input-placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    .export-clone .flowchart-node-input::-moz-placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    .export-clone .flowchart-node-input:-ms-input-placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    /* Content box wrapper - ensure proper width calculation */
    .export-clone .content-box-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      -webkit-box-sizing: border-box !important;
      -moz-box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important;
    }
    
    /* Content box container - ensure proper width for text wrapping */
    .export-clone .content-box-block .content-box-container {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      -webkit-box-sizing: border-box !important;
      -moz-box-sizing: border-box !important;
      position: relative !important;
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }
    
    /* Content box - ensure proper width for text wrapping */
    .export-clone .content-box-block .content-box-content {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      -webkit-box-sizing: border-box !important;
      -moz-box-sizing: border-box !important;
      overflow: visible !important;
      padding-top: 24px !important;
      padding-right: 26px !important;
      padding-bottom: 20px !important;
      padding-left: 26px !important;
      display: block !important;
    }
    
    /* Two-column layout - ensure proper width calculation */
    .export-clone .block-row.two-columns .content-box-block .content-box-content {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    
    /* TipTap Editor wrapper - ensure proper width */
    .export-clone .tiptap-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      -webkit-box-sizing: border-box !important;
      -moz-box-sizing: border-box !important;
      display: block !important;
      position: relative !important;
    }
    
    /* TipTap Editor - explicit text wrapping for consistent rendering across browsers */
    .export-clone .tiptap-wrapper * {
      box-sizing: border-box !important;
      -webkit-box-sizing: border-box !important;
      -moz-box-sizing: border-box !important;
    }
    
    /* Prevent browser font size adjustments */
    .export-clone {
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    
    .export-clone .tiptap-editor {
      font-family: 'Roboto', sans-serif !important;
      font-size: 11px !important;
      -webkit-font-size: 11px !important;
      -moz-font-size: 11px !important;
      line-height: 1.5 !important;
      font-weight: 400 !important;
      color: #003366 !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      hyphens: none !important;
      -webkit-hyphens: none !important;
      -moz-hyphens: none !important;
      white-space: normal !important;
      width: 100% !important;
      max-width: 100% !important;
      display: block !important;
      box-sizing: border-box !important;
      -webkit-box-sizing: border-box !important;
      -moz-box-sizing: border-box !important;
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    
    .export-clone .tiptap-editor p {
      margin: 0 !important;
      padding: 0 !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      white-space: normal !important;
      line-height: 1.5 !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      display: block !important;
      font-size: 11px !important;
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    
    /* Small font (9px) - ensure proper wrapping with explicit width and size */
    .export-clone .tiptap-editor span[style*="font-size: 9px"],
    .export-clone .tiptap-editor span[style*="fontSize: 9px"],
    .export-clone .tiptap-editor [style*="font-size: 9px"],
    .export-clone .tiptap-editor [style*="fontSize: 9px"] {
      font-size: 9px !important;
      -webkit-font-size: 9px !important;
      -moz-font-size: 9px !important;
      line-height: 1.5 !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      white-space: normal !important;
      display: inline !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    
    /* Heading font (11px) - ensure proper wrapping */
    .export-clone .tiptap-editor .tiptap-heading,
    .export-clone .tiptap-editor span[style*="font-size: 11px"],
    .export-clone .tiptap-editor span[style*="fontSize: 11px"],
    .export-clone .tiptap-editor [style*="font-size: 11px"],
    .export-clone .tiptap-editor [style*="fontSize: 11px"] {
      font-size: 11px !important;
      -webkit-font-size: 11px !important;
      -moz-font-size: 11px !important;
      line-height: 1.8 !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      white-space: normal !important;
      display: inline !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    
    /* All inline elements - ensure proper wrapping and consistent font size */
    .export-clone .tiptap-editor span:not([style*="font-size"]):not([style*="fontSize"]),
    .export-clone .tiptap-editor strong,
    .export-clone .tiptap-editor em,
    .export-clone .tiptap-editor u {
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      white-space: normal !important;
      max-width: 100% !important;
      font-size: inherit !important;
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    
    /* List items - ensure consistent font size */
    .export-clone .tiptap-editor .bullet-list li,
    .export-clone .tiptap-editor .ordered-list li {
      font-size: 11px !important;
      -webkit-font-size: 11px !important;
      -moz-font-size: 11px !important;
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    
    /* Bullet lists - ensure proper spacing and alignment, reduce padding to bring bullets closer to text */
    .export-clone .tiptap-editor .bullet-list {
      margin: 0 !important;
      padding-left: 16px !important; /* Reduced padding to bring bullets closer to text */
      padding-right: 0 !important;
      list-style-type: disc !important;
      list-style-position: outside !important;
      text-indent: 0 !important;
    }
    
    .export-clone .tiptap-editor .bullet-list li {
      margin: 0 0 2px 0 !important;
      padding: 0 !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      list-style-type: disc !important;
      list-style-position: outside !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      white-space: normal !important;
      text-indent: 0 !important;
      margin-left: 0 !important;
    }
    
    .export-clone .tiptap-editor .bullet-list li::marker {
      margin-right: 0 !important;
      padding-right: 0 !important;
    }
    
    .export-clone .tiptap-editor .bullet-list li:last-child {
      margin-bottom: 0 !important;
    }
    
    /* Ordered lists - ensure proper spacing and alignment */
    .export-clone .tiptap-editor .ordered-list {
      margin: 0 !important;
      padding-left: 16px !important; /* Reduced padding to bring numbers closer to text */
      padding-right: 0 !important;
      list-style-type: decimal !important;
      list-style-position: outside !important;
      text-indent: 0 !important;
    }
    
    .export-clone .tiptap-editor .ordered-list li {
      margin: 0 0 2px 0 !important;
      padding: 0 !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      list-style-type: decimal !important;
      list-style-position: outside !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      white-space: normal !important;
      text-indent: 0 !important;
      margin-left: 0 !important;
    }
    
    .export-clone .tiptap-editor .ordered-list li::marker {
      margin-right: 0 !important;
      padding-right: 0 !important;
    }
    
    .export-clone .tiptap-editor .ordered-list li:last-child {
      margin-bottom: 0 !important;
    }
  `;
  
  // Insert clone and styles into document
  document.body.appendChild(clone);
  document.head.appendChild(styleElement);
  
  return { clone, styleElement };
};

/**
 * Removes the print clone and its styles.
 */
const removePrintClone = ({ clone, styleElement }) => {
  if (clone && clone.parentNode) {
    clone.parentNode.removeChild(clone);
  }
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
};

/**
 * Sanitizes a string for use in filenames.
 * Converts to lowercase, replaces special chars, normalizes whitespace and hyphens.
 * @param {string} str - The string to sanitize
 * @returns {string} Sanitized string safe for filenames
 */
const sanitizeForFilename = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .replace(/\//g, '-')        // Replace slashes with hyphens (e.g. 12/22 -> 12-22)
    .replace(/[^a-z0-9äöüß\s-]/g, '')  // Remove special chars except German umlauts
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/-+/g, '-')        // Collapse multiple hyphens
    .replace(/^-|-$/g, '')      // Remove leading/trailing hyphens
    .trim();
};

/**
 * Generates a filename from title and stand.
 * Format: "titel-stand" (without file extension)
 * @param {string} title - The SOP title (e.g. "Einarbeitung Mitarbeiter")
 * @param {string} stand - The stand/version string (e.g. "STAND 12/22")
 * @returns {string} Sanitized filename without extension
 */
const generateFilename = (title, stand) => {
  const sanitizedTitle = sanitizeForFilename(title) || 'dokument';
  const sanitizedStand = sanitizeForFilename(stand) || 'export';
  
  return `${sanitizedTitle}-${sanitizedStand}`;
};

/**
 * Client-side Word export (fallback)
 * @private
 */
const exportAsWordClientSide = async (containerRef, title, stand) => {
  // Pre-fetch font CSS to avoid Firefox cross-origin issues
  const fontEmbedCSS = await fetchFontCSS();
  
  // Create invisible clone with print styles
  const { clone, styleElement } = createPrintClone(containerRef);
  
  // Wait for clone to render and fonts to load
  await new Promise(resolve => setTimeout(resolve, 300));
  await waitForFonts();
  
  const pages = Array.from(clone.querySelectorAll('.a4-page'));
  
  if (!pages || pages.length === 0) {
    removePrintClone({ clone, styleElement });
    return;
  }

  const docChildren = [];

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      console.log(`Capturing page ${i + 1}/${pages.length} for Word...`);
      console.log('Page dimensions:', page.offsetWidth, 'x', page.offsetHeight);
      
      // Use html-to-image with font CSS to fix Firefox cross-origin issues
      // pixelRatio 6 = ~476 DPI for ultra-sharp print quality
      // captureWithFallback handles cross-origin errors automatically
      const dataUrl = await captureWithFallback(page, toPng, fontEmbedCSS, { quality: 1.0 });
      
      console.log('Image captured, data URL length:', dataUrl.length);
      
      // Convert data URL to buffer
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();

      const imageRun = new ImageRun({
        data: buffer,
        transformation: {
          width: 794,
          height: 1123,
        },
      });

      // Jedes Bild in einem Paragraph mit entfernten Abständen
      // Ab dem 2. Bild: Seitenumbruch vor dem Paragraph
      docChildren.push(new Paragraph({ 
        children: [imageRun],
        spacing: { before: 0, after: 0, line: 240 },
        pageBreakBefore: i > 0, // Seitenumbruch nur vor Bildern ab dem zweiten
      }));
    }

    // Alle Seiten in einer einzigen Section ohne zusätzliche Seitenumbrüche
    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } },
        },
        children: docChildren,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const filename = generateFilename(title, stand);
    downloadBlob(blob, `${filename}.docx`);
  } catch (err) {
    console.error('Error rendering page for Word:', err);
    throw new Error('Word-Export fehlgeschlagen.');
  } finally {
    // Clean up clone and styles
    removePrintClone({ clone, styleElement });
  }
};

/**
 * Exports the current editor content as a Word document (DOCX).
 * Tries server-side rendering first, falls back to client-side if needed.
 * @param {HTMLElement} containerRef - Ref to the editor container element.
 * @param {string} title - The SOP title for filename
 * @param {string} stand - The stand/version for filename
 * @param {string} documentId - Optional document ID for caching
 */
export const exportAsWord = async (containerRef, title = 'SOP Überschrift', stand = 'STAND 12/22', documentId = null) => {
  if (!containerRef) return;
  
  try {
    // Try server-side export first
    const blob = await exportDocumentServerSide(
      containerRef,
      'docx',
      { title, stand, documentId },
      true // useCache
    );
    
    const filename = generateFilename(title, stand);
    downloadBlobService(blob, `${filename}.docx`);
    console.log('Word export completed (server-side)');
  } catch (serverError) {
    console.warn('Server-side Word export failed, falling back to client-side:', serverError);
    
    // Fallback to client-side export
    try {
      await exportAsWordClientSide(containerRef, title, stand);
      console.log('Word export completed (client-side fallback)');
    } catch (clientError) {
      console.error('Both server-side and client-side Word export failed:', clientError);
      throw new Error('Word-Export fehlgeschlagen. Bitte versuche es erneut.');
    }
  }
};

/**
 * Client-side PDF export (fallback)
 * @private
 */
const exportAsPdfClientSide = async (containerRef, title, stand) => {
  // Pre-fetch font CSS to avoid Firefox cross-origin issues
  const fontEmbedCSS = await fetchFontCSS();
  
  // Create invisible clone with print styles
  const { clone, styleElement } = createPrintClone(containerRef);
  
  // Wait for clone to render and fonts to load
  await new Promise(resolve => setTimeout(resolve, 300));
  await waitForFonts();
  
  const pages = Array.from(clone.querySelectorAll('.a4-page'));
  
  if (!pages || pages.length === 0) {
    removePrintClone({ clone, styleElement });
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      console.log(`Capturing page ${i + 1}/${pages.length} for PDF...`);
      console.log('Page dimensions:', page.offsetWidth, 'x', page.offsetHeight);
      
      // Use html-to-image with font CSS to fix Firefox cross-origin issues
      // pixelRatio 6 = ~476 DPI for ultra-sharp print quality
      // captureWithFallback handles cross-origin errors automatically
      const dataUrl = await captureWithFallback(page, toJpeg, fontEmbedCSS);
      
      console.log('Image captured, data URL length:', dataUrl.length);
      
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
    }

    const filename = generateFilename(title, stand);
    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('Error rendering page for PDF:', err);
    throw new Error('PDF-Export fehlgeschlagen.');
  } finally {
    // Clean up clone and styles
    removePrintClone({ clone, styleElement });
  }
};

/**
 * Exports the current editor content as a PDF file.
 * Tries server-side rendering first, falls back to client-side if needed.
 * @param {HTMLElement} containerRef - Ref to the editor container element.
 * @param {string} title - The SOP title for filename
 * @param {string} stand - The stand/version for filename
 * @param {string} documentId - Optional document ID for caching
 */
export const exportAsPdf = async (containerRef, title = 'SOP Überschrift', stand = 'STAND 12/22', documentId = null) => {
  if (!containerRef) return;
  
  try {
    // Try server-side export first
    const blob = await exportDocumentServerSide(
      containerRef,
      'pdf',
      { title, stand, documentId },
      true // useCache
    );
    
    const filename = generateFilename(title, stand);
    downloadBlobService(blob, `${filename}.pdf`);
    console.log('PDF export completed (server-side)');
  } catch (serverError) {
    console.warn('Server-side PDF export failed, falling back to client-side:', serverError);
    
    // Fallback to client-side export
    try {
      await exportAsPdfClientSide(containerRef, title, stand);
      console.log('PDF export completed (client-side fallback)');
    } catch (clientError) {
      console.error('Both server-side and client-side PDF export failed:', clientError);
      throw new Error('PDF-Export fehlgeschlagen. Bitte versuche es erneut.');
    }
  }
};

/**
 * Creates a JSON export state from a document object.
 * @param {Object} doc - The document from database
 * @returns {Object} Export state object
 */
const createExportState = (doc) => {
  return {
    headerTitle: doc.title || 'SOP Überschrift',
    headerStand: doc.version || 'STAND',
    headerLogo: doc.content?.headerLogo || null,
    footerVariant: doc.content?.footerVariant || 'tiny',
    rows: doc.content?.rows || [],
    _exportMetadata: {
      version: '1.0',
      exportDate: new Date().toISOString(),
      editorVersion: '2.0'
    }
  };
};

/**
 * Exports multiple documents in bulk as JSON.
 * - Single document: Downloads as single JSON file
 * - Multiple documents: Downloads as ZIP archive containing JSON files
 * 
 * Note: PDF/Word export requires the document to be open in the editor
 * to capture the fully rendered React components. Use the editor's
 * export function for pixel-perfect PDF/Word output.
 * 
 * @param {Array<string>} documentIds - Array of document IDs to export
 * @param {string} format - Export format (only 'json' supported for bulk)
 * @param {Function} onProgress - Progress callback function(current, total, completed)
 * @returns {Promise<void>}
 */
export const exportMultipleDocuments = async (documentIds, format = 'json', onProgress = null) => {
  const total = documentIds.length;
  const useZip = total > 1;
  
  let zip = null;
  if (useZip) {
    zip = new JSZip();
  }
  
  const exportedFiles = [];
  
  for (let i = 0; i < documentIds.length; i++) {
    const docId = documentIds[i];
    
    try {
      // Load document from database
      const { data: doc, error } = await getDocument(docId);
      
      if (error || !doc) {
        console.error(`Failed to load document ${docId}:`, error);
        if (onProgress) onProgress(i + 1, total, false);
        continue;
      }
      
      const title = doc.title || 'SOP Überschrift';
      const stand = doc.version || 'STAND';
      const baseFilename = generateFilename(title, stand);
      
      // JSON Export (only format supported for bulk)
      const exportState = createExportState(doc);
      const jsonString = JSON.stringify(exportState, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const filename = `${baseFilename}.json`;
      
      if (useZip) {
        zip.file(filename, jsonString);
        exportedFiles.push(filename);
      } else {
        // Single file - download directly
        downloadBlob(blob, filename);
      }
      
      // Update progress
      if (onProgress) onProgress(i + 1, total, false);
      
    } catch (err) {
      console.error(`Error exporting document ${docId}:`, err);
      if (onProgress) onProgress(i + 1, total, false);
    }
  }
  
  // If using ZIP, generate and download the archive
  if (useZip && exportedFiles.length > 0) {
    try {
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Generate ZIP filename with date
      const date = new Date().toISOString().split('T')[0];
      const zipFilename = `sop-export-${date}.zip`;
      
      downloadBlob(zipBlob, zipFilename);
    } catch (err) {
      console.error('Error creating ZIP archive:', err);
    }
  }
  
  // Signal completion
  if (onProgress) onProgress(total, total, true);
};

/**
 * @deprecated Use exportMultipleDocuments with format='json' instead
 * Kept for backwards compatibility
 */
export const exportMultipleDocumentsAsJson = async (documentIds, onProgress = null) => {
  return exportMultipleDocuments(documentIds, 'json', onProgress);
};
