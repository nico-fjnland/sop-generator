-- Setup Storage Bucket for Export Caching
-- Run this SQL script in your Supabase SQL Editor

-- Create exports bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false, -- Private bucket
  52428800, -- 50MB file size limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for authenticated users to read their cached exports
-- Note: This allows any authenticated user to read cached exports
-- For more security, you could add organization_id checks
CREATE POLICY "Allow authenticated users to read exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exports' 
  AND auth.role() = 'authenticated'
);

-- Create RLS policy for service role to write exports (for Edge Function)
-- This is automatically handled by the service role key, but we document it here
-- The Edge Function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS

-- Optional: Create policy to allow users to delete their own cached exports
-- (if you want to implement cache invalidation)
-- CREATE POLICY "Allow users to delete their own exports"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'exports' 
--   AND auth.role() = 'authenticated'
--   -- Add additional conditions if needed (e.g., check document ownership)
-- );

