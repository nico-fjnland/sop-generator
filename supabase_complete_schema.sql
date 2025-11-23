-- ============================================
-- VOLLSTÄNDIGES SUPABASE SCHEMA FÜR SOP APP
-- ============================================
-- Führen Sie dieses Skript in Ihrem Supabase SQL Editor aus

-- 1. Erstellen Sie die profiles Tabelle (falls sie noch nicht existiert)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Alte Felder (für Kompatibilität)
  username TEXT UNIQUE,
  full_name TEXT,
  
  -- Profil-Felder
  first_name TEXT,
  last_name TEXT,
  job_position TEXT,
  avatar_url TEXT,
  
  -- Organisations-Felder
  hospital_name TEXT,
  hospital_employees TEXT,
  hospital_address TEXT,
  hospital_website TEXT,
  company_logo TEXT,
  website TEXT
);

-- 2. Fügen Sie fehlende Spalten hinzu (falls die Tabelle bereits existiert)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_position TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hospital_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hospital_employees TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hospital_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hospital_website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- 3. Row Level Security (RLS) aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies erstellen (löschen Sie zuerst alte Policies falls vorhanden)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. Trigger-Funktion für neue User erstellen/aktualisieren
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, updated_at)
  VALUES (new.id, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger erstellen (löschen Sie zuerst den alten falls vorhanden)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Storage Bucket für Avatars erstellen (falls noch nicht vorhanden)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage Policies erstellen
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar."
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');

-- 9. Erstellen Sie die documents Tabelle (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Unbenanntes Dokument',
  stand TEXT,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. RLS für documents aktivieren
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies für documents
DROP POLICY IF EXISTS "Users can view their own documents." ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents." ON documents;
DROP POLICY IF EXISTS "Users can update their own documents." ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents." ON documents;

CREATE POLICY "Users can view their own documents."
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents."
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents."
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents."
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- 12. Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_profiles_hospital_name ON profiles(hospital_name);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);

-- 13. Kommentare für bessere Dokumentation
COMMENT ON TABLE profiles IS 'User profile information including personal and organization details';
COMMENT ON COLUMN profiles.first_name IS 'User first name';
COMMENT ON COLUMN profiles.last_name IS 'User last name';
COMMENT ON COLUMN profiles.job_position IS 'User job position/title';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN profiles.hospital_name IS 'Name of the hospital or organization';
COMMENT ON COLUMN profiles.hospital_employees IS 'Number of employees in the organization';
COMMENT ON COLUMN profiles.hospital_address IS 'Full address of the hospital';
COMMENT ON COLUMN profiles.hospital_website IS 'Website URL of the hospital';
COMMENT ON COLUMN profiles.company_logo IS 'Company/organization logo URL - displayed in all SOPs';

COMMENT ON TABLE documents IS 'SOP documents created by users';
COMMENT ON COLUMN documents.content IS 'JSONB content containing rows, headerLogo, footerVariant';

-- ============================================
-- WICHTIG: PRÜFEN SIE NACH DER AUSFÜHRUNG
-- ============================================
-- Führen Sie diese Abfragen aus, um zu prüfen, ob alles korrekt ist:

-- Prüfen Sie die Spalten der profiles Tabelle:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- Prüfen Sie die RLS Policies:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Prüfen Sie Ihr eigenes Profil:
-- SELECT * FROM profiles WHERE id = auth.uid();

-- Falls Ihr Profil nicht existiert, erstellen Sie es manuell:
-- INSERT INTO profiles (id, updated_at) VALUES (auth.uid(), NOW()) ON CONFLICT (id) DO NOTHING;

