# Supabase Access Token finden

## Option 1: Über Supabase CLI (Empfohlen)

1. **Bei Supabase anmelden:**
   ```bash
   npx supabase login
   ```
   
   Dies öffnet einen Browser und Sie werden automatisch eingeloggt. Der Token wird dann lokal gespeichert.

2. **Token anzeigen:**
   Der Token wird normalerweise in `~/.supabase/access-token` gespeichert.

## Option 2: Über Supabase Dashboard

1. Öffnen Sie: https://supabase.com/dashboard/account/tokens
2. Klicken Sie auf **"Generate new token"**
3. Geben Sie einen Namen ein (z.B. "Deployment Token")
4. Kopieren Sie den generierten Token

## Option 3: Über Supabase CLI Status

Nach dem Login können Sie prüfen:
```bash
npx supabase projects list
```

Falls dies funktioniert, sind Sie bereits eingeloggt und der Token ist verfügbar.

## Token verwenden

Sobald Sie den Token haben, können Sie ihn als Umgebungsvariable setzen:
```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
```

Oder ich kann das Deployment direkt durchführen, wenn Sie mir den Token geben.

