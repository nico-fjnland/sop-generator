
-- Create documents table
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  version text,
  content jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table documents enable row level security;

-- Policies
create policy "Users can view their own documents" 
  on documents for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own documents" 
  on documents for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own documents" 
  on documents for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own documents" 
  on documents for delete 
  using (auth.uid() = user_id);

-- Auto-update updated_at timestamp
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on documents
  for each row execute procedure moddatetime (updated_at);

