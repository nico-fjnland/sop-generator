# Gotenberg auf Railway deployen

Diese Anleitung beschreibt, wie du Gotenberg auf Railway deployest, um konsistente PDF- und Word-Exports zu ermöglichen.

## Voraussetzungen

- Railway Account (https://railway.app)
- Supabase Projekt mit Edge Functions

## Schritt 1: Railway Account erstellen

1. Gehe zu https://railway.app
2. Erstelle einen Account (GitHub Login empfohlen)
3. Verifiziere deine E-Mail-Adresse

## Schritt 2: Neues Projekt erstellen

1. Klicke auf "New Project"
2. Wähle "Deploy a Template" oder "Empty Project"
3. Für Template: Suche nach "Gotenberg" (falls verfügbar)
4. Für Empty Project: Fahre mit Schritt 3 fort

## Schritt 3: Gotenberg Docker Container deployen

### Option A: Via Railway Dashboard

1. Im Projekt, klicke auf "New Service"
2. Wähle "Docker Image"
3. Gib das Image ein: `gotenberg/gotenberg:8`
4. Klicke auf "Deploy"

### Option B: Via railway.json (empfohlen)

Erstelle eine `railway.json` Datei:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "numReplicas": 1,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Und eine `Dockerfile`:

```dockerfile
FROM gotenberg/gotenberg:8

# Expose the default port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Schritt 4: Port konfigurieren

1. Gehe zu den Service-Einstellungen
2. Unter "Networking" → "Public Networking"
3. Aktiviere "Generate Domain"
4. Railway generiert eine URL wie: `gotenberg-production-xxxx.up.railway.app`

**Wichtig:** Notiere dir diese URL für Schritt 5!

## Schritt 5: Environment Variables in Railway (optional)

Falls du Sicherheitseinstellungen vornehmen möchtest:

| Variable | Wert | Beschreibung |
|----------|------|--------------|
| `CHROMIUM_DENY_LIST` | `""` | Blockiert bestimmte URLs (leer = keine Blockierung) |
| `LIBREOFFICE_DISABLE_ROUTES` | `true` | Deaktiviert LibreOffice Konvertierungen |
| `LOG_LEVEL` | `info` | Log Level (debug, info, warn, error) |

## Schritt 6: Gotenberg URL in Supabase konfigurieren

1. Gehe zum Supabase Dashboard
2. Navigiere zu "Project Settings" → "Edge Functions" → "Secrets"
3. Füge einen neuen Secret hinzu:
   - **Name:** `GOTENBERG_URL`
   - **Value:** `https://gotenberg-production-c433.up.railway.app`

## Schritt 7: Testen

Teste Gotenberg mit einem einfachen cURL Befehl:

```bash
curl -X POST \
  -F 'files[]=@index.html' \
  -o result.pdf \
  https://gotenberg-production-c433.up.railway.app/forms/chromium/convert/html
```

Oder über die Health-Check Route:

```bash
curl https://gotenberg-production-c433.up.railway.app/health
# Sollte "OK" oder Status 200 zurückgeben
```

## Gotenberg API Referenz

### HTML zu PDF

```http
POST /forms/chromium/convert/html

Content-Type: multipart/form-data

Form-Felder:
- files (file): HTML-Datei(en), mindestens eine Datei namens "index.html"
- paperWidth (string): Papierbreite in Zoll (default: 8.5)
- paperHeight (string): Papierhöhe in Zoll (default: 11)
- marginTop (string): Oberer Rand in Zoll (default: 0.39)
- marginBottom (string): Unterer Rand in Zoll (default: 0.39)
- marginLeft (string): Linker Rand in Zoll (default: 0.39)
- marginRight (string): Rechter Rand in Zoll (default: 0.39)
- printBackground (string): "true" oder "false" (default: false)
- scale (string): Skalierung 0.1-2.0 (default: 1.0)
```

### A4 Konfiguration

Für A4-Seiten ohne Ränder:

```
paperWidth: 8.27 (210mm in Zoll)
paperHeight: 11.69 (297mm in Zoll)
marginTop: 0
marginBottom: 0
marginLeft: 0
marginRight: 0
printBackground: true
```

### HTML zu Screenshot (PNG)

```http
POST /forms/chromium/screenshot/html

Content-Type: multipart/form-data

Form-Felder:
- files (file): HTML-Datei(en)
- width (string): Viewport-Breite in Pixeln (default: 800)
- height (string): Viewport-Höhe in Pixeln (default: 600)
- format (string): "png", "jpeg", oder "webp" (default: png)
- quality (string): JPEG/WebP Qualität 0-100 (default: 100)
- optimizeForSpeed (string): "true" für schnellere, aber größere Bilder
```

## Kosten

- **Railway Hobby Plan:** ~$5/Monat (inklusive $5 Free Usage)
- **Railway Pro Plan:** ~$20/Monat (für höhere Nutzung)

Typische Kosten für Gotenberg:
- Geringe Nutzung (< 100 Exports/Monat): ~$2-5/Monat
- Mittlere Nutzung (< 1000 Exports/Monat): ~$5-15/Monat

## Fehlerbehebung

### Gotenberg startet nicht

1. Prüfe die Logs in Railway Dashboard
2. Stelle sicher, dass genug RAM verfügbar ist (mindestens 512MB empfohlen)

### PDF-Generierung schlägt fehl

1. Prüfe, ob die HTML-Datei korrekt formatiert ist
2. Stelle sicher, dass alle Assets (CSS, Fonts) inline sind
3. Prüfe Gotenberg-Logs auf Fehlermeldungen

### Timeout-Fehler

1. Erhöhe das Timeout in der Edge Function
2. Optimiere die HTML-Größe (weniger komplexe Styles)
3. Skaliere Gotenberg auf Railway hoch (mehr Replicas)

## Nächste Schritte

Nach erfolgreichem Setup:

1. ✅ Edge Function aktualisieren (`supabase/functions/export-document/index.ts`)
2. ✅ GOTENBERG_URL in Supabase Secrets konfigurieren
3. ✅ Export-Funktionalität testen

---

*Letzte Aktualisierung: 2024-12-22*

