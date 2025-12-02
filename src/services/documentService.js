import { supabase } from '../lib/supabase';

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
    console.error('Error saving document:', error);
    return { data: null, error };
  }
};

/**
 * Fetches all documents for an organization
 * @param {string} organizationId - The organization's ID
 * @returns {Promise<Array>} List of documents
 */
export const getDocuments = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, version, updated_at, created_at, category, user_id')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching documents:', error);
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
    console.error('Error fetching document:', error);
    return { data: null, error };
  }
};

/**
 * Deletes a document
 * @param {string} id 
 * @returns {Promise<boolean>} Success status
 */
export const deleteDocument = async (id) => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
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
    console.error('Error updating document category:', error);
    return { data: null, error };
  }
};
