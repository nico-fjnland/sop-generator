/**
 * Export Service for server-side PDF/Word generation
 * Uses Supabase Edge Functions with Puppeteer for consistent rendering
 */

import { SUPABASE_URL } from '../lib/supabase';
import { serializeToHTML, generateContentHash } from '../utils/htmlSerializer';

const EXPORT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/export-document`;

/**
 * Exports document as PDF or Word using server-side rendering
 * @param {HTMLElement} containerRef - The editor container element
 * @param {string} format - Export format: 'pdf' or 'docx'
 * @param {Object} metadata - Document metadata (title, stand, documentId)
 * @param {boolean} useCache - Whether to use caching (default: true)
 * @returns {Promise<Blob>} The exported file as Blob
 */
export const exportDocumentServerSide = async (
  containerRef,
  format,
  metadata = {},
  useCache = true
) => {
  if (!containerRef) {
    throw new Error('Container reference is required');
  }

  if (!['pdf', 'docx'].includes(format)) {
    throw new Error(`Invalid format: ${format}. Must be 'pdf' or 'docx'`);
  }

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
    const response = await fetch(EXPORT_FUNCTION_URL, {
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
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `Export failed: ${response.status} ${response.statusText}`
      );
    }

    // Get blob from response
    const blob = await response.blob();

    return blob;
  } catch (error) {
    console.error('Server-side export error:', error);
    throw error;
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

