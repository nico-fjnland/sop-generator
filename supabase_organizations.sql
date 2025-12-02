-- ============================================
-- ORGANIZATIONS SCHEMA FOR SOP APP
-- ============================================
-- Run this script in your Supabase SQL Editor
-- Note: This was applied via migrations, this file is for reference

-- ============================================
-- 1. CREATE ORGANIZATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE organizations IS 'Organizations that group users and documents together';
COMMENT ON COLUMN organizations.name IS 'Name of the organization (e.g., hospital name)';
COMMENT ON COLUMN organizations.logo_url IS 'Company/organization logo URL - displayed in all SOPs';
COMMENT ON COLUMN organizations.address IS 'Full address of the organization';
COMMENT ON COLUMN organizations.website IS 'Website URL of the organization';

-- ============================================
-- 2. UPDATE PROFILES TABLE
-- ============================================

-- Add organization_id column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
COMMENT ON COLUMN profiles.organization_id IS 'Reference to the organization this user belongs to';

-- Remove old organization-specific columns (moved to organizations table)
ALTER TABLE profiles DROP COLUMN IF EXISTS hospital_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS company_logo;
ALTER TABLE profiles DROP COLUMN IF EXISTS hospital_employees;
ALTER TABLE profiles DROP COLUMN IF EXISTS hospital_address;
ALTER TABLE profiles DROP COLUMN IF EXISTS hospital_website;

-- ============================================
-- 3. UPDATE DOCUMENTS TABLE
-- ============================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
COMMENT ON COLUMN documents.organization_id IS 'Reference to the organization this document belongs to';
COMMENT ON COLUMN documents.user_id IS 'Reference to the user who created/last edited this document';

-- ============================================
-- 4. RLS POLICIES FOR ORGANIZATIONS
-- ============================================

CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create an organization"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 5. UPDATE PROFILES RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;

CREATE POLICY "Organization members can view each other"
  ON profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
    OR id = auth.uid()
  );

-- ============================================
-- 6. UPDATE DOCUMENTS RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own documents." ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents." ON documents;
DROP POLICY IF EXISTS "Users can update their own documents." ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents." ON documents;

CREATE POLICY "Organization members can view documents"
  ON documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert documents"
  ON documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update documents"
  ON documents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete documents"
  ON documents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

-- ============================================
-- 7. UPDATE TRIGGER FOR NEW USERS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization for the user
  INSERT INTO public.organizations (name, created_at, updated_at)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'organization_name', 'Meine Organisation'),
    NOW(),
    NOW()
  )
  RETURNING id INTO new_org_id;

  -- Create the user profile linked to the organization
  INSERT INTO public.profiles (id, organization_id, updated_at)
  VALUES (new.id, new_org_id, NOW())
  ON CONFLICT (id) DO UPDATE SET
    organization_id = COALESCE(profiles.organization_id, new_org_id),
    updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check organizations table columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organizations' ORDER BY ordinal_position;

-- Check profiles table columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- Check documents table columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents' ORDER BY ordinal_position;

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename IN ('organizations', 'profiles', 'documents');

