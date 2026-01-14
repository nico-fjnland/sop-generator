-- Login-Historie RPC-Funktion
-- Ermöglicht Benutzern, ihre eigenen Sessions/Logins abzurufen
-- SECURITY DEFINER stellt sicher, dass nur eigene Daten zugänglich sind

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
    s.created_at,
    s.ip,
    s.user_agent
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Berechtigungen für authentifizierte Benutzer
GRANT EXECUTE ON FUNCTION get_login_history TO authenticated;

-- Kommentar zur Dokumentation
COMMENT ON FUNCTION get_login_history IS 'Gibt die letzten Login-Sessions des aktuellen Benutzers zurück. Nutzt die auth.sessions Tabelle.';
