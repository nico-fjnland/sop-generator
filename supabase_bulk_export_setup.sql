-- ============================================
-- Bulk Export Setup: HTML Cache Infrastructure
-- ============================================
-- Run this SQL script in your Supabase SQL Editor
-- This enables bulk PDF/Word export from "Meine Leitfäden"

-- ============================================
-- 1. Add html_cached_at column to documents table
-- ============================================
-- This tracks when the HTML cache was last updated
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS html_cached_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN documents.html_cached_at IS 'Timestamp when HTML cache was last updated for bulk export';

-- ============================================
-- 2. Create Storage Bucket for HTML Cache
-- ============================================
-- This bucket stores the serialized HTML for each document
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-html',
  'document-html',
  false, -- Private bucket
  5242880, -- 5MB file size limit (HTML files are typically 50-100KB)
  ARRAY['text/html']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. RLS Policies for document-html bucket
-- ============================================

-- Policy: Authenticated users can read HTML files
-- (The actual organization check happens in the application layer)
CREATE POLICY "Authenticated users can read document html"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'document-html' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can upload HTML files
CREATE POLICY "Authenticated users can upload document html"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'document-html' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update (overwrite) HTML files
CREATE POLICY "Authenticated users can update document html"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'document-html' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can delete HTML files
CREATE POLICY "Authenticated users can delete document html"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'document-html' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 4. Create index for faster queries
-- ============================================
-- Index on html_cached_at for filtering documents without cache
CREATE INDEX IF NOT EXISTS idx_documents_html_cached_at 
ON documents (html_cached_at);

-- ============================================
-- Verification Queries (optional - run to verify setup)
-- ============================================

-- Check if column exists:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'documents' AND column_name = 'html_cached_at';

-- Check if bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'document-html';

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%document html%';
