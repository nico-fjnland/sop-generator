import { createClient } from '@supabase/supabase-js';

// Fallback values in case environment variables are not loaded correctly
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://btwuvqpwfyqadavqzccs.supabase.co';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0d3V2cXB3ZnlxYWRhdnF6Y2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzE4NjEsImV4cCI6MjA3OTIwNzg2MX0.dt0r8QSK8o_2Rks8aCobWscOAFszidJ4uYqlM6Lpr0o';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
