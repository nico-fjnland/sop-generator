-- Migration: Sichere Account-Löschfunktion
-- Diese Funktion ermöglicht es Benutzern, ihren eigenen Account zu löschen

-- Funktion erstellen (mit SECURITY DEFINER um auth.users Zugriff zu haben)
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  -- Aktuelle User-ID holen
  current_user_id := auth.uid();
  
  -- Sicherstellen, dass ein User eingeloggt ist
  if current_user_id is null then
    raise exception 'Nicht authentifiziert';
  end if;

  -- 1. Alle Dokumente des Users löschen
  delete from public.documents where user_id = current_user_id;
  
  -- 2. Profil des Users löschen
  delete from public.profiles where id = current_user_id;
  
  -- 3. Den Auth-User löschen (erfordert SECURITY DEFINER)
  delete from auth.users where id = current_user_id;
end;
$$;

-- Berechtigung für authentifizierte Benutzer
grant execute on function public.delete_own_account() to authenticated;

-- Kommentar hinzufügen
comment on function public.delete_own_account() is 'Ermöglicht Benutzern, ihren eigenen Account und alle zugehörigen Daten dauerhaft zu löschen';

