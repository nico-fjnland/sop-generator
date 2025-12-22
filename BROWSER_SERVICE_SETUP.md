# Browser-Service Setup für serverseitiges PDF/Word-Rendering

## Problem
Supabase Edge Functions haben kein vorinstalliertes Chromium. Um serverseitiges Rendering zu ermöglichen, benötigen wir einen externen Browser-Service.

## Lösung: Browser-Service konfigurieren

### Option 1: Browserless.io (Empfohlen)

1. **Account erstellen**: Gehen Sie zu [browserless.io](https://www.browserless.io/) und erstellen Sie einen Account
2. **Token generieren**: Erstellen Sie ein API-Token in Ihrem Dashboard
3. **Environment Variable setzen**: Fügen Sie die folgende Variable zu Ihren Supabase Edge Function Secrets hinzu:

```bash
# In Supabase Dashboard: Project Settings > Edge Functions > Secrets
BROWSER_WS_ENDPOINT=wss://chrome.browserless.io?token=IHR_TOKEN_HIER
```

**Kosten**: Browserless.io bietet einen kostenlosen Plan mit 6 Stunden Laufzeit pro Monat.

### Option 2: Self-Hosted Browserless

Falls Sie Ihren eigenen Browser-Service hosten möchten:

1. **Browserless Docker Container starten**:
```bash
docker run -p 3000:3000 browserless/chrome
```

2. **Environment Variable setzen**:
```bash
BROWSER_WS_ENDPOINT=ws://IHR_SERVER:3000
```

### Option 3: Andere Browser-Services

- **Puppeteer-as-a-Service**: Verschiedene Anbieter bieten ähnliche Services
- **Custom Server**: Eigenes Puppeteer-Setup auf einem Server mit Chromium

## Environment Variable in Supabase setzen

1. Gehen Sie zu Ihrem Supabase Dashboard
2. Navigieren Sie zu: **Project Settings > Edge Functions > Secrets**
3. Fügen Sie eine neue Secret hinzu:
   - **Name**: `BROWSER_WS_ENDPOINT`
   - **Value**: Ihre WebSocket-Endpoint-URL (z.B. `wss://chrome.browserless.io?token=...`)

## Testen

Nach dem Setzen der Environment Variable sollte die Edge Function automatisch den Browser-Service verwenden. Testen Sie den Export, um zu sehen, ob serverseitiges Rendering funktioniert.

## Fallback

Falls kein Browser-Service konfiguriert ist, fällt die Anwendung automatisch auf die client-seitige Export-Funktion zurück. Diese funktioniert, hat aber Browser-Unterschiede.

