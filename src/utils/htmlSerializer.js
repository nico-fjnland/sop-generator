/**
 * HTML Serialization Utility
 * Converts React components to static HTML with inline styles for server-side rendering
 */

/**
 * Fetches Google Fonts CSS and converts to inline @font-face rules
 * @returns {Promise<string>} Font CSS as string
 */
const fetchFontCSS = async () => {
  try {
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap';
    const response = await fetch(fontUrl);
    
    if (!response.ok) {
      throw new Error(`Font fetch failed: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.warn('Could not fetch Google Fonts CSS:', error.message);
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
 * Creates a print-ready clone of the container with all styles inline
 * @param {HTMLElement} containerRef - The editor container element
 * @returns {Promise<{clone: HTMLElement, styleElement: HTMLElement}>}
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

  // Convert images to base64
  await convertImagesToBase64(clone);

  // Fetch font CSS
  const fontCSS = await fetchFontCSS();

  // Create style element with all necessary styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    ${fontCSS}
    
    /* Export clone styles - same as in exportUtils.js */
    .export-clone {
      transform: none !important;
      zoom: 1 !important;
      scale: 1 !important;
    }
    
    .export-clone *:not(.react-flow__viewport):not(.react-flow__viewport *):not(.react-flow__edge):not(.react-flow__node) {
      zoom: 1 !important;
    }
    
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
    
    .export-clone ::placeholder {
      opacity: 0 !important;
      color: transparent !important;
    }
    
    .export-clone .hidden.print\\:block {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Include all export styles from exportUtils.js */
    /* Header styles */
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
    
    /* Flowchart styles */
    .export-clone .flowchart-block-container {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: hidden !important;
    }
    
    .export-clone .flowchart-toolbar,
    .export-clone .flowchart-controls {
      display: none !important;
    }
    
    .export-clone .react-flow__background {
      display: none !important;
    }
    
    .export-clone .react-flow__handle,
    .export-clone .flowchart-custom-handle {
      display: none !important;
      visibility: hidden !important;
    }
    
    .export-clone .react-flow__viewport {
      pointer-events: none !important;
    }
    
    /* Content box styles */
    .export-clone .content-box-block .caption-container {
      left: 26px !important;
      top: 0 !important;
      margin-top: 0 !important;
      position: absolute !important;
      transform: translateY(-10px) !important;
      z-index: 20 !important;
      display: block !important;
    }
    
    .export-clone .content-box-block .caption-box-print {
      border: 2px solid white !important;
      border-radius: 6px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 4px 8px !important;
    }
    
    /* TipTap editor styles */
    .export-clone .tiptap-editor {
      font-family: 'Roboto', sans-serif !important;
      font-size: 11px !important;
      line-height: 1.5 !important;
      font-weight: 400 !important;
      color: #003366 !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      white-space: normal !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    
    /* List styles */
    .export-clone .tiptap-editor .bullet-list {
      margin: 0 !important;
      padding-left: 16px !important;
      list-style-type: disc !important;
      list-style-position: outside !important;
    }
    
    .export-clone .tiptap-editor .ordered-list {
      margin: 0 !important;
      padding-left: 16px !important;
      list-style-type: decimal !important;
      list-style-position: outside !important;
    }
  `;

  // Insert styles into clone
  const cloneHead = clone.ownerDocument.head || clone.appendChild(document.createElement('head'));
  cloneHead.appendChild(styleElement);

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
  ${styleElement.outerHTML}
</head>
<body style="margin: 0; padding: 0; background: white;">
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

