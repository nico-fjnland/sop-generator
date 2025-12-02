import { supabase } from '../lib/supabase';

/**
 * Fetches an organization by ID
 * @param {string} organizationId - The organization's ID
 * @returns {Promise<object>} Organization data
 */
export const getOrganization = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching organization:', error);
    return { data: null, error };
  }
};

/**
 * Updates an organization
 * @param {string} organizationId - The organization's ID
 * @param {object} updates - The fields to update
 * @returns {Promise<object>} Updated organization data
 */
export const updateOrganization = async (organizationId, updates) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating organization:', error);
    return { data: null, error };
  }
};

/**
 * Creates a new organization
 * @param {object} organizationData - The organization data
 * @returns {Promise<object>} Created organization data
 */
export const createOrganization = async (organizationData) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        name: organizationData.name || 'Meine Organisation',
        logo_url: organizationData.logo_url || null,
        address: organizationData.address || null,
        website: organizationData.website || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating organization:', error);
    return { data: null, error };
  }
};

/**
 * Fetches all members of an organization
 * @param {string} organizationId - The organization's ID
 * @returns {Promise<Array>} List of organization members
 */
export const getOrganizationMembers = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, job_position, avatar_url, updated_at')
      .eq('organization_id', organizationId)
      .order('first_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return { data: [], error };
  }
};

/**
 * Gets the organization ID for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<string|null>} Organization ID or null
 */
export const getUserOrganizationId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { organizationId: data?.organization_id || null, error: null };
  } catch (error) {
    console.error('Error fetching user organization ID:', error);
    return { organizationId: null, error };
  }
};

/**
 * Links a user to an organization
 * @param {string} userId - The user's ID
 * @param {string} organizationId - The organization's ID
 * @returns {Promise<object>} Result
 */
export const linkUserToOrganization = async (userId, organizationId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        organization_id: organizationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error linking user to organization:', error);
    return { data: null, error };
  }
};

