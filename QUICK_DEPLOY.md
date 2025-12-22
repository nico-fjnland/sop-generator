# Quick Deploy: Serverseitiges Export-Rendering

## Schnellstart (3 Schritte)

### 1. Storage Bucket erstellen (Optional, für Caching)

Öffnen Sie die **Supabase Dashboard** → **SQL Editor** und führen Sie aus:

```sql
-- Siehe: supabase_setup_export_storage.sql
```

**Hinweis:** Caching funktioniert nur mit Pro Plan. Im Free Plan wird ohne Caching gearbeitet.

### 2. Edge Function deployen

**Option A: Automatisch (Empfohlen)**

```bash
./deploy-edge-function.sh
```

**Option B: Manuell**

1. Öffnen Sie: https://supabase.com/dashboard/project/btwuvqpwfyqadavqzccs/functions
2. Klicken Sie auf **"Create a new function"**
3. Name: `export-document`
4. Kopieren Sie den Inhalt von `supabase/functions/export-document/index.ts`
5. Klicken Sie auf **"Deploy"**

### 3. Testen

1. Öffnen Sie die Anwendung
2. Erstellen Sie ein Dokument
3. Klicken Sie auf **"PDF exportieren"** oder **"Word exportieren"**
4. Prüfen Sie die Browser-Konsole

## Erwartetes Verhalten

- ✅ **Erste Export-Anfrage:** 3-8 Sekunden (serverseitiges Rendering)
- ✅ **Weitere Anfragen (mit Cache):** < 1 Sekunde (nur Pro Plan)
- ✅ **Bei Server-Fehler:** Automatischer Fallback auf clientseitigen Export

## Troubleshooting

### "Export failed" Fehler

1. Prüfen Sie die Browser-Konsole
2. Prüfen Sie Supabase Dashboard → Edge Functions → export-document → Logs
3. Fallback sollte automatisch funktionieren

### Edge Function nicht gefunden

- Prüfen Sie, ob die Function deployed ist: Dashboard → Edge Functions
- Prüfen Sie die Function-URL in `src/services/exportService.js`

### Caching funktioniert nicht

- Caching erfordert Pro Plan (Service Role Key)
- Prüfen Sie, ob Storage Bucket `exports` existiert
- Prüfen Sie, ob `documentId` übergeben wird

## Vollständige Dokumentation

Siehe: `DEPLOYMENT_GUIDE.md`

