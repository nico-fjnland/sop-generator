
-- Add new columns to profiles table
alter table profiles 
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists job_position text,
  add column if not exists hospital text;

-- Update handle_new_user function to include new fields if passed in metadata (optional future proofing)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, first_name, last_name)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

