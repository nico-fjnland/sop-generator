-- ============================================
-- MIGRATION: Kategorie-Spalte für documents
-- ============================================
-- Führen Sie dieses Skript in Ihrem Supabase SQL Editor aus

-- 1. Kategorie-Spalte hinzufügen
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Index für bessere Performance bei Kategoriefiltern
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- 3. Kommentar für Dokumentation
COMMENT ON COLUMN documents.category IS 'Medizinische Kategorie des SOP-Dokuments (z.B. Kardiologie, Neurologie, etc.)';

-- ============================================
-- PRÜFUNG NACH AUSFÜHRUNG
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents' ORDER BY ordinal_position;

