import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, ImageRun, SectionType } from 'docx';
import jsPDF from 'jspdf';
import { toPng, toJpeg } from 'html-to-image';
import { getDocument } from '../services/documentService';

/**
 * Exports the current editor state as a JSON file.
 * Preserves all formatting including line breaks and bullet points.
 * @param {Object} state - The editor state object.
 */
export const exportAsJson = (state) => {
  const date = new Date().toISOString().split('T')[0];
  const fileName = `sop-state-${date}.json`;
  
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
  saveAs(blob, fileName);
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
  
  // For contentbox blocks, validate nested structure
  if (sanitized.type === 'contentbox' && typeof sanitized.content === 'object') {
    sanitized.content = {
      category: sanitized.content.category || 'definition',
      blocks: Array.isArray(sanitized.content.blocks) 
        ? sanitized.content.blocks.map(validateAndSanitizeBlock)
        : [{ id: Date.now().toString(), type: 'text', content: '' }]
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
          footerVariant: json.footerVariant || 'default',
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
    
    .export-clone * {
      transform: none !important;
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
    }
    
    .export-clone .sop-header > div.flex.flex-col > div.flex.items-center {
      padding-left: 0 !important;
      padding-right: 0 !important;
      width: auto !important;
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
    
    .export-clone .content-box-block .caption-container {
      left: 26px !important;
      top: 0 !important;
      margin-top: -10px !important;
      position: absolute !important;
      transform: none !important;
    }
    
    .export-clone .content-box-block .caption-container .caption-box-print,
    .export-clone .content-box-block .caption-box-print[class*="print:block"],
    .export-clone .content-box-block .caption-container .hidden.print\\:block {
      border: 2px solid white !important;
      border-radius: 4px !important;
      -webkit-border-radius: 4px !important;
      -moz-border-radius: 4px !important;
    }
    
    .export-clone .content-box-block .caption-box-print p {
      font-size: 9px !important;
      line-height: 9px !important;
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
 * Generates a filename from title and stand (date).
 * Format: "title-mm-yy"
 * @param {string} title - The SOP title
 * @param {string} stand - The stand/version string (e.g. "STAND 12/22")
 * @returns {string} Sanitized filename
 */
const generateFilename = (title, stand) => {
  // Extract date from stand (e.g. "STAND 12/22" -> "12-22")
  const dateMatch = stand.match(/(\d{1,2})\/(\d{2})/);
  const dateSuffix = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}` : 'export';
  
  // Sanitize title: remove special chars, replace spaces with hyphens
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${sanitizedTitle}-${dateSuffix}`;
};

/**
 * Exports the current editor content as a Word document (DOCX).
 * Uses html-to-image for better CSS/Tailwind compatibility.
 * @param {HTMLElement} containerRef - Ref to the editor container element.
 * @param {string} title - The SOP title for filename
 * @param {string} stand - The stand/version for filename
 */
export const exportAsWord = async (containerRef, title = 'SOP Überschrift', stand = 'STAND 12/22') => {
  if (!containerRef) return;
  
  // Create invisible clone with print styles
  const { clone, styleElement } = createPrintClone(containerRef);
  
  // Wait for clone to render
  await new Promise(resolve => setTimeout(resolve, 100));
  
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
      
      // Use html-to-image (better with Tailwind/modern CSS)
      // pixelRatio 6 = ~476 DPI for ultra-sharp print quality
      const dataUrl = await toPng(page, {
        quality: 1.0,
        pixelRatio: 6, // Ultra-high resolution for print (794px × 6 = 4764px width)
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      
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

      docChildren.push(new Paragraph({ children: [imageRun] }));
    }

    const doc = new Document({
      sections: docChildren.map((child) => ({
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } },
        },
        children: [child],
      })),
    });

    const blob = await Packer.toBlob(doc);
    const filename = generateFilename(title, stand);
    saveAs(blob, `${filename}.docx`);
  } catch (err) {
    console.error('Error rendering page for Word:', err);
    alert('Fehler beim Word-Export.');
  } finally {
    // Clean up clone and styles
    removePrintClone({ clone, styleElement });
  }
};

/**
 * Exports the current editor content as a PDF file.
 * Uses html-to-image for better CSS/Tailwind compatibility.
 * @param {HTMLElement} containerRef - Ref to the editor container element.
 * @param {string} title - The SOP title for filename
 * @param {string} stand - The stand/version for filename
 */
export const exportAsPdf = async (containerRef, title = 'SOP Überschrift', stand = 'STAND 12/22') => {
  if (!containerRef) return;

  // Create invisible clone with print styles
  const { clone, styleElement } = createPrintClone(containerRef);
  
  // Wait for clone to render
  await new Promise(resolve => setTimeout(resolve, 100));
  
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
      
      // Use html-to-image with JPEG for smaller file size
      // pixelRatio 6 = ~476 DPI for ultra-sharp print quality
      const dataUrl = await toJpeg(page, {
        quality: 0.98, // Higher quality for print
        pixelRatio: 6, // Ultra-high resolution (794px × 6 = 4764px width ≈ 476 DPI)
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      
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
    alert('Fehler beim PDF-Export.');
  } finally {
    // Clean up clone and styles
    removePrintClone({ clone, styleElement });
  }
};

/**
 * Exports multiple documents in bulk
 * @param {Array<string>} documentIds - Array of document IDs to export
 * @param {string} format - Export format ('word' or 'pdf')
 * @param {Function} onProgress - Progress callback function(current, total)
 * @returns {Promise<void>}
 */
export const exportMultipleDocuments = async (documentIds, format = 'pdf', onProgress = null) => {
  const total = documentIds.length;
  let current = 0;

  for (const docId of documentIds) {
    try {
      // Load document from database
      const { data: doc, error } = await getDocument(docId);
      
      if (error || !doc) {
        console.error(`Failed to load document ${docId}:`, error);
        current++;
        if (onProgress) onProgress(current, total, false);
        continue;
      }

      // Create a temporary container to render the document
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm';
      tempContainer.style.minHeight = '297mm';
      tempContainer.style.background = 'white';
      tempContainer.style.zIndex = '-1';
      tempContainer.className = 'a4-page';
      
      // Build the document HTML structure
      // Note: This is a simplified version. For full rendering with all features,
      // you would need to use React to render the actual Editor component
      const content = doc.content || {};
      const rows = content.rows || [];
      
      // Create a simple HTML representation
      // In a real implementation, you'd want to use React to render the full Editor
      let html = `
        <div class="sop-document" style="padding: 20px; font-family: Arial, sans-serif;">
          <div class="sop-header" style="margin-bottom: 20px; border-bottom: 2px solid #003366;">
            <h1 style="color: #003366; font-size: 24px; margin: 0;">${doc.title || 'Unbenanntes Dokument'}</h1>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">${doc.version || 'v1.0'}</p>
          </div>
          <div class="sop-content">
      `;
      
      // Add rows (simplified - just basic text content)
      rows.forEach((row, index) => {
        if (row.columns) {
          row.columns.forEach(col => {
            if (col.blocks) {
              col.blocks.forEach(block => {
                if (block.type === 'contentbox' && block.content) {
                  html += `<div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">`;
                  if (block.content.blocks) {
                    block.content.blocks.forEach(innerBlock => {
                      if (innerBlock.content) {
                        html += `<p style="margin: 10px 0;">${innerBlock.content}</p>`;
                      }
                    });
                  }
                  html += `</div>`;
                }
              });
            }
          });
        }
      });
      
      html += `
          </div>
        </div>
      `;
      
      tempContainer.innerHTML = html;
      document.body.appendChild(tempContainer);
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Export based on format
      const title = doc.title || 'Dokument';
      const stand = doc.version || 'v1.0';
      
      try {
        if (format === 'word') {
          await exportAsWord(tempContainer, title, stand);
        } else {
          await exportAsPdf(tempContainer, title, stand);
        }
      } catch (exportError) {
        console.error(`Failed to export document ${docId}:`, exportError);
      }
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Update progress
      current++;
      if (onProgress) onProgress(current, total, false);
      
      // Small delay between exports to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.error(`Error processing document ${docId}:`, err);
      current++;
      if (onProgress) onProgress(current, total, false);
    }
  }
  
  // Signal completion
  if (onProgress) onProgress(current, total, true);
};

/**
 * Simplified bulk export that exports documents as JSON files in a zip
 * This is a fallback for when full rendering is not feasible
 * @param {Array<string>} documentIds - Array of document IDs to export
 * @param {Function} onProgress - Progress callback function(current, total, completed)
 * @returns {Promise<void>}
 */
export const exportMultipleDocumentsAsJson = async (documentIds, onProgress = null) => {
  const total = documentIds.length;
  const exports = [];

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

      // Create export state
      const exportState = {
        headerTitle: doc.title || 'SOP Überschrift',
        headerStand: doc.version || 'STAND',
        headerLogo: doc.content?.headerLogo || null,
        footerVariant: doc.content?.footerVariant || 'default',
        rows: doc.content?.rows || []
      };

      // Export as JSON
      const fileName = `${doc.title || 'document'}-${doc.version || 'v1'}.json`;
      const jsonString = JSON.stringify(exportState, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, fileName);

      // Update progress
      if (onProgress) onProgress(i + 1, total, false);
      
      // Small delay between exports
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (err) {
      console.error(`Error exporting document ${docId}:`, err);
      if (onProgress) onProgress(i + 1, total, false);
    }
  }
  
  // Signal completion
  if (onProgress) onProgress(total, total, true);
};
