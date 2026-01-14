import { getDocument } from '../services/documentService';
import JSZip from 'jszip';
import { exportDocumentServerSide, downloadBlob as downloadBlobService, ExportError } from '../services/exportService';
import { logger } from './logger';

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
        logger.error('JSON import error:', error);
        reject(new Error('Failed to parse JSON file: ' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
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
 * Exports the current editor content as a Word document (DOCX).
 * Uses server-side rendering via Gotenberg.
 * @param {HTMLElement} containerRef - Ref to the editor container element.
 * @param {string} title - The SOP title for filename
 * @param {string} stand - The stand/version for filename
 * @param {string} documentId - Optional document ID for caching
 */
export const exportAsWord = async (containerRef, title = 'SOP Überschrift', stand = 'STAND 12/22', documentId = null) => {
  if (!containerRef) return;
  
  try {
    const blob = await exportDocumentServerSide(
      containerRef,
      'docx',
      { title, stand, documentId },
      true // useCache
    );
    
    const filename = generateFilename(title, stand);
    downloadBlobService(blob, `${filename}.docx`);
    logger.log('Word export completed (server-side)');
  } catch (error) {
    logger.error('Server-side Word export failed:', error);
    // Use user-friendly message from ExportError if available
    const userMessage = error instanceof ExportError 
      ? error.userMessage 
      : 'Der Export ist fehlgeschlagen. Bitte versuche es erneut.';
    throw new Error(userMessage);
  }
};

/**
 * Exports the current editor content as a PDF file.
 * Uses server-side rendering via Gotenberg.
 * @param {HTMLElement} containerRef - Ref to the editor container element.
 * @param {string} title - The SOP title for filename
 * @param {string} stand - The stand/version for filename
 * @param {string} documentId - Optional document ID for caching
 */
export const exportAsPdf = async (containerRef, title = 'SOP Überschrift', stand = 'STAND 12/22', documentId = null) => {
  if (!containerRef) return;
  
  try {
    const blob = await exportDocumentServerSide(
      containerRef,
      'pdf',
      { title, stand, documentId },
      true // useCache
    );
    
    const filename = generateFilename(title, stand);
    downloadBlobService(blob, `${filename}.pdf`);
    logger.log('PDF export completed (server-side)');
  } catch (error) {
    logger.error('Server-side PDF export failed:', error);
    // Use user-friendly message from ExportError if available
    const userMessage = error instanceof ExportError 
      ? error.userMessage 
      : 'Der Export ist fehlgeschlagen. Bitte versuche es erneut.';
    throw new Error(userMessage);
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
        logger.error(`Failed to load document ${docId}:`, error);
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
      logger.error(`Error exporting document ${docId}:`, err);
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
      logger.error('Error creating ZIP archive:', err);
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
