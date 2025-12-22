# Deployment via MCP

Um das Deployment direkt über MCP durchzuführen, benötige ich Zugriff auf folgende Funktionen:

## Benötigte MCP-Tools

1. **SQL Execution Tool**
   - Zum Ausführen von `supabase_setup_export_storage.sql`
   - Erstellt den Storage Bucket `exports`

2. **Edge Function Deployment Tool**
   - Zum Deployen der Edge Function `export-document`
   - Upload von `supabase/functions/export-document/index.ts`

## Alternative: Manuelle Schritte

Falls keine MCP-Tools verfügbar sind, können Sie:

1. **Storage Bucket:** SQL-Script in Supabase Dashboard → SQL Editor ausführen
2. **Edge Function:** Über Supabase Dashboard → Edge Functions deployen

## Welche MCP-Tools haben Sie?

Bitte teilen Sie mir die verfügbaren Tool-Namen mit, dann kann ich das Deployment direkt durchführen.

