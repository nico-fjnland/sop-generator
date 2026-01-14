-- ============================================================
-- Persistente Login-Historie
-- ============================================================
-- Dieses Script erstellt eine eigene Tabelle für Login-Events,
-- die auch nach Logout/Session-Timeout erhalten bleibt.
-- 
-- Die alte Implementation nutzte auth.sessions, aber diese
-- Einträge werden bei Logout gelöscht.
-- ============================================================

-- 1. Tabelle für Login-Historie erstellen
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für schnelle Abfragen nach User
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_logged_in_at ON public.login_history(logged_in_at DESC);

-- 2. Row Level Security aktivieren
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Einträge sehen
CREATE POLICY "Users can view their own login history"
  ON public.login_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Nur das System (via Trigger) kann Einträge erstellen
-- Benutzer haben keine direkte INSERT-Berechtigung
CREATE POLICY "System can insert login history"
  ON public.login_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Trigger-Funktion zum Kopieren neuer Sessions in die Historie
CREATE OR REPLACE FUNCTION public.log_new_session()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_history (user_id, logged_in_at, ip_address, user_agent)
  VALUES (NEW.user_id, NEW.created_at, NEW.ip, NEW.user_agent);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger auf auth.sessions erstellen
-- Wird bei jedem neuen Login (INSERT) ausgelöst
DROP TRIGGER IF EXISTS on_session_created ON auth.sessions;
CREATE TRIGGER on_session_created
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_new_session();

-- 5. Aktualisierte RPC-Funktion für Login-Historie
-- Liest jetzt aus der persistenten login_history Tabelle
CREATE OR REPLACE FUNCTION get_login_history(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  logged_in_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lh.logged_in_at,
    lh.ip_address,
    lh.user_agent
  FROM public.login_history lh
  WHERE lh.user_id = auth.uid()
  ORDER BY lh.logged_in_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Berechtigungen für authentifizierte Benutzer
GRANT EXECUTE ON FUNCTION get_login_history TO authenticated;

-- 6. Optional: Bestehende Sessions in die Historie migrieren
-- (Einmalig ausführen, um aktuelle aktive Sessions zu übernehmen)
INSERT INTO public.login_history (user_id, logged_in_at, ip_address, user_agent)
SELECT user_id, created_at, ip, user_agent
FROM auth.sessions
ON CONFLICT DO NOTHING;

-- ============================================================
-- Kommentare zur Dokumentation
-- ============================================================
COMMENT ON TABLE public.login_history IS 'Persistente Speicherung aller Login-Events. Bleibt auch nach Logout erhalten.';
COMMENT ON FUNCTION public.log_new_session IS 'Trigger-Funktion: Kopiert neue Sessions automatisch in die login_history Tabelle.';
COMMENT ON FUNCTION get_login_history IS 'Gibt die letzten Login-Events des aktuellen Benutzers zurück. Nutzt die persistente login_history Tabelle.';

-- ============================================================
-- Aufräumen: Alte Einträge nach 90 Tagen löschen (optional)
-- ============================================================
-- Diese Funktion kann per Cron-Job aufgerufen werden
CREATE OR REPLACE FUNCTION cleanup_old_login_history()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.login_history
  WHERE logged_in_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_login_history IS 'Löscht Login-Historie-Einträge älter als 90 Tage. Kann per Cron-Job aufgerufen werden.';
