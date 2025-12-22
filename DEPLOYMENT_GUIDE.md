# Deployment Guide: Serverseitiges PDF/Word Rendering

Diese Anleitung führt Sie durch das Deployment der serverseitigen Export-Funktionalität.

## Schritt 1: Storage Bucket erstellen (Optional, für Caching)

1. Öffnen Sie die **Supabase Dashboard** → **SQL Editor**
2. Führen Sie das SQL-Script `supabase_setup_export_storage.sql` aus
3. Dies erstellt den `exports` Storage Bucket für Caching

**Hinweis:** Caching funktioniert nur mit dem Pro Plan (Service Role Key erforderlich). Im Free Plan wird ohne Caching gearbeitet.

## Schritt 2: Edge Function deployen

### Option A: Mit Supabase CLI (Empfohlen)

1. **Supabase CLI installieren:**
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # oder mit npm (lokal im Projekt)
   npm install supabase --save-dev
   ```

2. **Bei Supabase anmelden:**
   ```bash
   supabase login
   ```

3. **Projekt verlinken:**
   ```bash
   supabase link --project-ref btwuvqpwfyqadavqzccs
   ```
   (Ersetzen Sie `btwuvqpwfyqadavqzccs` mit Ihrer Projekt-Ref, falls unterschiedlich)

4. **Edge Function deployen:**
   ```bash
   supabase functions deploy export-document
   ```

### Option B: Manuell über Supabase Dashboard

1. Öffnen Sie die **Supabase Dashboard** → **Edge Functions**
2. Klicken Sie auf **"Create a new function"**
3. Name: `export-document`
4. Kopieren Sie den Inhalt von `supabase/functions/export-document/index.ts` in den Editor
5. Klicken Sie auf **"Deploy"**

## Schritt 3: Umgebungsvariablen prüfen

Die Edge Function verwendet automatisch die folgenden Umgebungsvariablen (bereits in Supabase verfügbar):

- `SUPABASE_URL` - Automatisch gesetzt
- `SUPABASE_SERVICE_ROLE_KEY` - Automatisch gesetzt (nur Pro Plan)

**Keine zusätzliche Konfiguration erforderlich!**

## Schritt 4: Testen

1. Öffnen Sie die Anwendung im Browser
2. Erstellen oder öffnen Sie ein Dokument
3. Klicken Sie auf **"PDF exportieren"** oder **"Word exportieren"**
4. Prüfen Sie die Browser-Konsole auf Fehler

### Erwartetes Verhalten

- **Erste Export-Anfrage:** 3-8 Sekunden (serverseitiges Rendering)
- **Weitere Anfragen (mit Cache):** < 1 Sekunde (wenn Caching aktiviert)
- **Bei Server-Fehler:** Automatischer Fallback auf clientseitigen Export

## Troubleshooting

### Edge Function Timeout

**Symptom:** Timeout-Fehler bei großen Dokumenten

**Lösung:**
- Free Plan: 10 Sekunden Timeout - verwenden Sie clientseitigen Export für große Dokumente
- Pro Plan: 60 Sekunden Timeout - sollte für die meisten Dokumente ausreichen

### Caching funktioniert nicht

**Symptom:** Jeder Export dauert 3-8 Sekunden, auch bei unveränderten Dokumenten

**Mögliche Ursachen:**
1. **Free Plan:** Caching erfordert Service Role Key (nur Pro Plan)
2. **Storage Bucket fehlt:** Führen Sie `supabase_setup_export_storage.sql` aus
3. **Keine documentId:** Caching funktioniert nur, wenn `documentId` übergeben wird

**Lösung:**
- Prüfen Sie, ob Sie den Pro Plan haben
- Prüfen Sie, ob der `exports` Bucket existiert
- Stellen Sie sicher, dass `documentId` an die Export-Funktionen übergeben wird

### "Export failed" Fehler

**Symptom:** Export schlägt fehl mit Fehlermeldung

**Lösung:**
1. Prüfen Sie die Browser-Konsole für detaillierte Fehlermeldungen
2. Prüfen Sie die Supabase Edge Function Logs (Dashboard → Edge Functions → export-document → Logs)
3. Fallback auf clientseitigen Export sollte automatisch funktionieren

### Puppeteer Memory Issues

**Symptom:** Memory-Fehler bei sehr großen Dokumenten

**Lösung:**
- Reduzieren Sie die Dokumentgröße
- Verwenden Sie clientseitigen Export für sehr große Dokumente
- Upgraden Sie auf Pro Plan für mehr Memory

## Monitoring

### Edge Function Invocations überwachen

1. Öffnen Sie **Supabase Dashboard** → **Edge Functions** → **export-document**
2. Prüfen Sie die **Metrics** für:
   - Anzahl der Invocations
   - Durchschnittliche Ausführungszeit
   - Error-Rate

### Cache-Hit-Rate überwachen

Prüfen Sie die Response-Header:
- `X-Cache: HIT` = Aus Cache geladen
- `X-Cache: MISS` = Neu gerendert

## Kosten

- **Free Plan:** 500.000 Invocations/Monat (ausreichend für ~16.000 Exports/Tag)
- **Pro Plan:** $25/Monat, mehr Invocations, längere Timeouts, Caching

## Nächste Schritte

Nach erfolgreichem Deployment:

1. ✅ Testen Sie PDF-Export
2. ✅ Testen Sie Word-Export
3. ✅ Testen Sie Fallback-Mechanismus (Edge Function deaktivieren)
4. ✅ Überwachen Sie die Performance

Bei Fragen oder Problemen, prüfen Sie die Logs in der Supabase Console.

