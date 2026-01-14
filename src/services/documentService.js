import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

/**
 * Saves or updates a document
 * @param {string} organizationId - The organization's ID
 * @param {string} userId - The user's ID (for creator tracking)
 * @param {string} title - Document title
 * @param {string} version - Document version
 * @param {object} content - The editor content (blocks array)
 * @param {string} [id] - Optional document ID if updating
 * @returns {Promise<object>} The saved document
 */
export const saveDocument = async (organizationId, userId, title, version, content, id = null) => {
  try {
    const documentData = {
      organization_id: organizationId,
      user_id: userId,
      title,
      version,
      content,
      updated_at: new Date().toISOString()
    };

    let query = supabase.from('documents');

    // Check if a document with same title and version exists for this organization
    const { data: existingDocs, error: searchError } = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('title', title)
      .eq('version', version)
      .limit(1);

    if (searchError) throw searchError;

    if (existingDocs && existingDocs.length > 0) {
      // Update existing found document
      const existingId = existingDocs[0].id;
      const { data, error } = await query
        .update(documentData)
        .eq('id', existingId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } else {
      // Insert new
      const { data, error } = await query
        .insert([documentData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    logger.error('Error saving document:', error);
    return { data: null, error };
  }
};

/**
 * Fetches all documents for an organization
 * @param {string} organizationId - The organization's ID
 * @returns {Promise<Array>} List of documents (includes html_cached_at for bulk export status)
 */
export const getDocuments = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, version, updated_at, created_at, category, user_id, html_cached_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error fetching documents:', error);
    return { data: [], error };
  }
};

/**
 * Fetches a single document by ID
 * @param {string} id 
 * @returns {Promise<object>} Document data
 */
export const getDocument = async (id) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error fetching document:', error);
    return { data: null, error };
  }
};

/**
 * Deletes a document and its HTML cache
 * @param {string} id 
 * @returns {Promise<boolean>} Success status
 */
export const deleteDocument = async (id) => {
  try {
    // Delete the document from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Also delete the HTML cache (fire and forget - don't fail if cache doesn't exist)
    const fileName = `${id}.html`;
    supabase.storage
      .from('document-html')
      .remove([fileName])
      .catch(err => logger.warn('Failed to delete HTML cache:', err));

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error deleting document:', error);
    return { success: false, error };
  }
};

/**
 * Updates the category of a document
 * @param {string} id - Document ID
 * @param {string|null} category - Category name or null to remove
 * @returns {Promise<object>} Result with success status
 */
export const updateDocumentCategory = async (id, category) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({ 
        category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error updating document category:', error);
    return { data: null, error };
  }
};

// ============================================
// HTML Cache Functions for Bulk Export
// ============================================

/**
 * Saves the serialized HTML for a document to Supabase Storage
 * This enables bulk PDF/Word export without re-rendering
 * @param {string} documentId - The document's ID
 * @param {string} html - The serialized HTML content
 * @returns {Promise<object>} Result with success status
 */
export const saveDocumentHtml = async (documentId, html) => {
  try {
    const fileName = `${documentId}.html`;
    const blob = new Blob([html], { type: 'text/html' });
    
    // Upload to storage (upsert = overwrite if exists)
    const { error: uploadError } = await supabase.storage
      .from('document-html')
      .upload(fileName, blob, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Update the html_cached_at timestamp in the database
    const { error: updateError } = await supabase
      .from('documents')
      .update({ html_cached_at: new Date().toISOString() })
      .eq('id', documentId);

    if (updateError) {
      logger.warn('HTML uploaded but failed to update timestamp:', updateError);
      // Don't throw - the HTML is saved, timestamp is secondary
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error saving document HTML:', error);
    return { success: false, error };
  }
};

/**
 * Retrieves the cached HTML for a document from Supabase Storage
 * @param {string} documentId - The document's ID
 * @returns {Promise<object>} Result with HTML content or error
 */
export const getDocumentHtml = async (documentId) => {
  try {
    const fileName = `${documentId}.html`;
    
    const { data, error } = await supabase.storage
      .from('document-html')
      .download(fileName);

    if (error) throw error;

    // Convert blob to text
    const html = await data.text();
    return { html, error: null };
  } catch (error) {
    // Not found is expected for old documents
    if (error.message?.includes('not found') || error.statusCode === 404) {
      return { html: null, error: { code: 'NOT_FOUND', message: 'HTML cache not found' } };
    }
    logger.error('Error fetching document HTML:', error);
    return { html: null, error };
  }
};

/**
 * Fetches documents with their HTML cache status for bulk export
 * @param {string} organizationId - The organization's ID
 * @returns {Promise<Array>} List of documents with html_cached_at field
 */
export const getDocumentsWithHtmlStatus = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, version, updated_at, created_at, category, user_id, html_cached_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error fetching documents with HTML status:', error);
    return { data: [], error };
  }
};

/**
 * Checks which documents from a list have valid HTML cache
 * A cache is valid if html_cached_at is within 5 seconds of updated_at (to handle timing differences)
 * @param {Array<string>} documentIds - Array of document IDs to check
 * @returns {Promise<object>} Object with cached and uncached document IDs
 */
export const checkHtmlCacheStatus = async (documentIds) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, updated_at, html_cached_at')
      .in('id', documentIds);

    if (error) throw error;

    const cached = [];
    const uncached = [];
    
    // Allow 5 second buffer for timing differences between cache and document save
    const CACHE_BUFFER_MS = 5000;

    for (const doc of data) {
      const cacheTime = doc.html_cached_at ? new Date(doc.html_cached_at).getTime() : 0;
      const updateTime = new Date(doc.updated_at).getTime();
      
      // Cache is valid if it exists and was created within 5 seconds of the document update
      const hasValidCache = doc.html_cached_at && (cacheTime >= updateTime - CACHE_BUFFER_MS);
      
      if (hasValidCache) {
        cached.push({ id: doc.id, title: doc.title });
      } else {
        uncached.push({ id: doc.id, title: doc.title });
      }
    }

    return { cached, uncached, error: null };
  } catch (error) {
    logger.error('Error checking HTML cache status:', error);
    return { cached: [], uncached: documentIds, error };
  }
};

/**
 * Deletes the HTML cache for a document
 * Called when a document is deleted
 * @param {string} documentId - The document's ID
 * @returns {Promise<object>} Result with success status
 */
export const deleteDocumentHtml = async (documentId) => {
  try {
    const fileName = `${documentId}.html`;
    
    const { error } = await supabase.storage
      .from('document-html')
      .remove([fileName]);

    // Ignore "not found" errors - file might not exist
    if (error && !error.message?.includes('not found')) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error deleting document HTML:', error);
    return { success: false, error };
  }
};
