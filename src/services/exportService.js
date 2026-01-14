/**
 * Export Service for server-side PDF/Word generation
 * Uses Supabase Edge Functions with Puppeteer for consistent rendering
 */

import { SUPABASE_URL } from '../lib/supabase';
import { serializeToHTML, generateContentHash } from '../utils/htmlSerializer';

const EXPORT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/export-document`;

// Timeout for export requests (60 seconds)
const EXPORT_TIMEOUT_MS = 60000;

/**
 * Custom error class for export errors with user-friendly messages
 */
export class ExportError extends Error {
  constructor(message, userMessage, code) {
    super(message);
    this.name = 'ExportError';
    this.userMessage = userMessage;
    this.code = code;
  }
}

/**
 * Creates an appropriate error based on the error type
 * @param {Error} error - The original error
 * @param {Response} response - The fetch response (if available)
 * @returns {ExportError} - Error with user-friendly message
 */
const createExportError = (error, response = null) => {
  // Check for offline status
  if (!navigator.onLine) {
    return new ExportError(
      'No internet connection',
      'Keine Internetverbindung. Bitte überprüfe deine Verbindung und versuche es erneut.',
      'OFFLINE'
    );
  }

  // Check for network/fetch errors (TypeError is thrown when fetch fails due to network issues)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new ExportError(
      error.message,
      'Der Export-Server ist nicht erreichbar. Bitte überprüfe deine Internetverbindung.',
      'NETWORK_ERROR'
    );
  }

  // Check for abort/timeout errors
  if (error.name === 'AbortError') {
    return new ExportError(
      'Request timed out',
      'Der Export hat zu lange gedauert. Bitte versuche es erneut oder reduziere die Dokumentgröße.',
      'TIMEOUT'
    );
  }

  // Handle HTTP status codes if we have a response
  if (response) {
    const status = response.status;

    if (status === 401 || status === 403) {
      return new ExportError(
        `Authentication error: ${status}`,
        'Du bist nicht angemeldet oder deine Sitzung ist abgelaufen. Bitte lade die Seite neu und melde dich erneut an.',
        'AUTH_ERROR'
      );
    }

    if (status === 429) {
      return new ExportError(
        'Rate limit exceeded',
        'Zu viele Anfragen. Bitte warte einen Moment und versuche es dann erneut.',
        'RATE_LIMIT'
      );
    }

    if (status === 413) {
      return new ExportError(
        'Payload too large',
        'Das Dokument ist zu groß für den Export. Bitte reduziere die Anzahl der Bilder oder teile das Dokument auf.',
        'PAYLOAD_TOO_LARGE'
      );
    }

    if (status >= 500 && status < 600) {
      return new ExportError(
        `Server error: ${status}`,
        'Der Export-Server hat einen Fehler gemeldet. Bitte versuche es in einigen Minuten erneut.',
        'SERVER_ERROR'
      );
    }

    if (status === 404) {
      return new ExportError(
        'Export endpoint not found',
        'Der Export-Service ist derzeit nicht verfügbar. Bitte versuche es später erneut.',
        'NOT_FOUND'
      );
    }
  }

  // Generic error fallback
  return new ExportError(
    error.message || 'Unknown error',
    'Der Export ist fehlgeschlagen. Bitte versuche es erneut.',
    'UNKNOWN'
  );
};

/**
 * Exports document as PDF or Word using server-side rendering
 * @param {HTMLElement} containerRef - The editor container element
 * @param {string} format - Export format: 'pdf' or 'docx'
 * @param {Object} metadata - Document metadata (title, stand, documentId)
 * @param {boolean} useCache - Whether to use caching (default: true)
 * @returns {Promise<Blob>} The exported file as Blob
 * @throws {ExportError} Error with user-friendly message
 */
export const exportDocumentServerSide = async (
  containerRef,
  format,
  metadata = {},
  useCache = true
) => {
  if (!containerRef) {
    throw new ExportError(
      'Container reference is required',
      'Interner Fehler: Kein Dokument gefunden.',
      'INVALID_INPUT'
    );
  }

  if (!['pdf', 'docx'].includes(format)) {
    throw new ExportError(
      `Invalid format: ${format}`,
      'Interner Fehler: Ungültiges Export-Format.',
      'INVALID_FORMAT'
    );
  }

  // Check online status before starting
  if (!navigator.onLine) {
    throw new ExportError(
      'No internet connection',
      'Keine Internetverbindung. Bitte überprüfe deine Verbindung und versuche es erneut.',
      'OFFLINE'
    );
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);

  let response = null;

  try {
    // Serialize container to HTML
    const html = await serializeToHTML(containerRef);

    // Generate cache key if documentId provided
    let cacheKey = null;
    if (useCache && metadata.documentId) {
      const contentHash = await generateContentHash(html, format);
      cacheKey = `export-${metadata.documentId}-${format}-${contentHash}`;
    }

    // Get auth token from Supabase
    const { supabase } = await import('../lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    // Get anon key for API calls
    const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

    // Call Edge Function
    response = await fetch(EXPORT_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({
        html,
        format,
        metadata: {
          title: metadata.title || 'SOP Überschrift',
          stand: metadata.stand || 'STAND',
          documentId: metadata.documentId || null,
        },
        cacheKey: cacheKey || undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error details from response
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `Export failed: ${response.status}`;
      throw createExportError(new Error(errorMessage), response);
    }

    // Get blob from response
    const blob = await response.blob();

    return blob;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // If it's already an ExportError, rethrow it
    if (error instanceof ExportError) {
      console.error('Export error:', error.code, error.message);
      throw error;
    }

    // Create appropriate error based on error type
    const exportError = createExportError(error, response);
    console.error('Export error:', exportError.code, exportError.message);
    throw exportError;
  }
};

/**
 * Downloads a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================
// Bulk Export Functions (using cached HTML)
// ============================================

// Maximum number of parallel export requests
const MAX_PARALLEL_EXPORTS = 10;

// Timeout for bulk export requests (120 seconds - longer for server load)
const BULK_EXPORT_TIMEOUT_MS = 120000;

/**
 * Exports a single document from cached HTML
 * @param {string} html - The cached HTML content
 * @param {string} format - Export format: 'pdf' or 'docx'
 * @param {Object} metadata - Document metadata (title, stand, documentId)
 * @returns {Promise<Blob>} The exported file as Blob
 */
const exportFromHtml = async (html, format, metadata = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BULK_EXPORT_TIMEOUT_MS);

  let response = null;

  try {
    // Get auth token from Supabase
    const { supabase } = await import('../lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

    response = await fetch(EXPORT_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({
        html,
        format,
        metadata: {
          title: metadata.title || 'SOP Überschrift',
          stand: metadata.stand || 'STAND',
          documentId: metadata.documentId || null,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `Export failed: ${response.status}`;
      throw createExportError(new Error(errorMessage), response);
    }

    return await response.blob();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ExportError) throw error;
    throw createExportError(error, response);
  }
};

/**
 * Sanitizes a string for use in filenames
 * @param {string} str - The string to sanitize
 * @returns {string} Sanitized filename-safe string
 */
const sanitizeFilename = (str) => {
  if (!str || typeof str !== 'string') return 'dokument';
  return str
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/[^a-z0-9äöüß\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim() || 'dokument';
};

/**
 * Bulk exports multiple documents from cached HTML
 * Uses parallel processing for efficiency (max 10 concurrent)
 * 
 * @param {Array<Object>} documents - Array of document objects with id, title, version
 * @param {string} format - Export format: 'pdf' or 'docx'
 * @param {Function} onProgress - Progress callback: (current, total, status, currentDoc) => void
 * @returns {Promise<Object>} Result with blobs array and errors
 */
export const bulkExportFromCache = async (documents, format, onProgress = null) => {
  if (!documents || documents.length === 0) {
    throw new ExportError(
      'No documents provided',
      'Keine Dokumente zum Exportieren ausgewählt.',
      'INVALID_INPUT'
    );
  }

  if (!['pdf', 'docx'].includes(format)) {
    throw new ExportError(
      `Invalid format: ${format}`,
      'Ungültiges Export-Format.',
      'INVALID_FORMAT'
    );
  }

  if (!navigator.onLine) {
    throw new ExportError(
      'No internet connection',
      'Keine Internetverbindung. Bitte überprüfe deine Verbindung und versuche es erneut.',
      'OFFLINE'
    );
  }

  const { getDocumentHtml } = await import('./documentService');
  
  const results = [];
  const errors = [];
  let completed = 0;
  const total = documents.length;

  // Process documents in parallel batches
  const processBatch = async (batch) => {
    return Promise.all(
      batch.map(async (doc) => {
        try {
          // Report starting this document
          if (onProgress) {
            onProgress(completed, total, 'loading', doc);
          }

          // Get cached HTML
          const { html, error: htmlError } = await getDocumentHtml(doc.id);
          
          if (htmlError || !html) {
            throw new ExportError(
              `HTML cache not found for ${doc.id}`,
              `„${doc.title}" hat keinen Export-Cache. Bitte öffne das Dokument einmal im Editor.`,
              'CACHE_NOT_FOUND'
            );
          }

          // Report exporting
          if (onProgress) {
            onProgress(completed, total, 'exporting', doc);
          }

          // Export to PDF/Word
          const blob = await exportFromHtml(html, format, {
            title: doc.title,
            stand: doc.version,
            documentId: doc.id,
          });

          // Generate filename
          const filename = `${sanitizeFilename(doc.title)}-${sanitizeFilename(doc.version)}.${format === 'docx' ? 'docx' : 'pdf'}`;

          completed++;
          if (onProgress) {
            onProgress(completed, total, 'completed', doc);
          }

          return { success: true, doc, blob, filename };
        } catch (error) {
          completed++;
          const exportError = error instanceof ExportError 
            ? error 
            : createExportError(error);
          
          if (onProgress) {
            onProgress(completed, total, 'error', doc);
          }

          return { success: false, doc, error: exportError };
        }
      })
    );
  };

  // Split documents into batches for parallel processing
  for (let i = 0; i < documents.length; i += MAX_PARALLEL_EXPORTS) {
    const batch = documents.slice(i, i + MAX_PARALLEL_EXPORTS);
    const batchResults = await processBatch(batch);
    
    for (const result of batchResults) {
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    }
  }

  return { results, errors, total };
};

/**
 * Creates a ZIP file from multiple exported documents
 * @param {Array<Object>} exportResults - Array of {blob, filename} objects
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export const createExportZip = async (exportResults) => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const { blob, filename } of exportResults) {
    zip.file(filename, blob);
  }

  return await zip.generateAsync({ type: 'blob' });
};
