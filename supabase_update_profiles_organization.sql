-- Add new organization fields to profiles table
-- Run this migration to add the new columns for hospital/organization information

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS hospital_name TEXT,
ADD COLUMN IF NOT EXISTS hospital_employees INTEGER,
ADD COLUMN IF NOT EXISTS hospital_address TEXT,
ADD COLUMN IF NOT EXISTS hospital_website TEXT,
ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- Remove the old 'hospital' column if it exists (replaced by hospital_name)
-- Uncomment the following line if you want to remove the old column
-- ALTER TABLE profiles DROP COLUMN IF EXISTS hospital;

-- Optional: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_hospital_name ON profiles(hospital_name);

-- Comments for reference
COMMENT ON COLUMN profiles.hospital_name IS 'Name of the hospital or organization';
COMMENT ON COLUMN profiles.hospital_employees IS 'Number of employees in the organization';
COMMENT ON COLUMN profiles.hospital_address IS 'Full address of the hospital';
COMMENT ON COLUMN profiles.hospital_website IS 'Website URL of the hospital';
COMMENT ON COLUMN profiles.company_logo IS 'Company/organization logo URL - displayed in all SOPs';

