import { useState, useCallback } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

// Use Supabase Edge Function as proxy to avoid CORS issues
const KLINIK_ATLAS_PROXY = `${SUPABASE_URL}/functions/v1/klinik-atlas-proxy`;
const CACHE_KEY = 'klinik-atlas-data';
const CACHE_EXPIRY_HOURS = 24;

// In-memory cache for the current session
let memoryCache = null;

// Global fetch lock to prevent race conditions across hook instances
let isFetching = false;

/**
 * Hook to fetch and filter hospitals from the Bundes-Klinik-Atlas API
 * Data is cached in memory and optionally in localStorage
 */
export function useKlinikAtlas() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from cache or API
  const loadData = useCallback(async () => {
    // Prevent multiple simultaneous fetches (global lock)
    if (isFetching) return;
    
    // Return memory cache if available
    if (memoryCache) {
      setHospitals(memoryCache);
      setIsInitialized(true);
      return;
    }

    // Check localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);
        
        if (hoursSinceCache < CACHE_EXPIRY_HOURS) {
          memoryCache = data;
          setHospitals(data);
          setIsInitialized(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
    }

    // Fetch from Edge Function proxy
    isFetching = true;
    setLoading(true);
    setError(null);

    try {
      // Get current session for auth header (fallback to anon key)
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(KLINIK_ATLAS_PROXY, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform and sort data
      const transformedData = data
        .map((hospital) => ({
          id: hospital.link?.match(/\/(\d+)\/$/)?.[1] || String(Math.random()),
          name: hospital.name || '',
          street: hospital.street || '',
          city: hospital.city || '',
          zip: hospital.zip || '',
          phone: hospital.phone || '',
          email: hospital.mail || '',
          beds: hospital.beds_number || 0,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          link: hospital.link || '',
        }))
        .filter((h) => h.name) // Filter out entries without name
        .sort((a, b) => a.name.localeCompare(b.name, 'de'));

      // Cache in memory
      memoryCache = transformedData;
      
      // Cache in localStorage
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: transformedData,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn('Failed to write to localStorage:', e);
      }

      setHospitals(transformedData);
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to fetch Klinik-Atlas data:', err);
      setError(err.message || 'Fehler beim Laden der Krankenhausdaten');
    } finally {
      setLoading(false);
      isFetching = false;
    }
  }, []);

  // Filter hospitals by search term
  const filterHospitals = useCallback((searchTerm, limit = 15) => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    const searchWords = normalizedSearch.split(/\s+/);

    return hospitals
      .filter((hospital) => {
        const searchableText = `${hospital.name} ${hospital.city} ${hospital.zip}`.toLowerCase();
        // All search words must match
        return searchWords.every((word) => searchableText.includes(word));
      })
      .slice(0, limit);
  }, [hospitals]);

  // Find a hospital by exact name match
  const findByName = useCallback((name) => {
    if (!name) return null;
    const normalizedName = name.toLowerCase().trim();
    return hospitals.find((h) => h.name.toLowerCase() === normalizedName) || null;
  }, [hospitals]);

  return {
    hospitals,
    loading,
    error,
    isInitialized,
    loadData,
    filterHospitals,
    findByName,
    totalCount: hospitals.length,
  };
}

export default useKlinikAtlas;

