# Supabase Troubleshooting - Account Daten werden nicht angezeigt

## Problem
Profilbild, Name und andere Profildaten werden nicht in der Account-Seite angezeigt, obwohl sie im Editor funktionieren.

## Lösung - Schritt für Schritt

### Schritt 1: Schema aktualisieren

1. Öffnen Sie Ihr Supabase Dashboard: https://app.supabase.com
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zu **SQL Editor** (im linken Menü)
4. Klicken Sie auf **New Query**
5. Kopieren Sie den gesamten Inhalt der Datei `supabase_complete_schema.sql`
6. Fügen Sie ihn in den SQL Editor ein
7. Klicken Sie auf **Run** (oder Strg/Cmd + Enter)

✅ Sie sollten die Meldung "Success. No rows returned" sehen.

---

### Schritt 2: Prüfen Sie die Tabellenstruktur

Führen Sie diese Abfrage im SQL Editor aus:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

✅ Sie sollten mindestens diese Spalten sehen:
- id (uuid)
- updated_at (timestamp with time zone)
- first_name (text)
- last_name (text)
- job_position (text)
- avatar_url (text)
- hospital_name (text)
- hospital_employees (text)
- hospital_address (text)
- hospital_website (text)
- company_logo (text)

---

### Schritt 3: Prüfen Sie Ihr Profil

Führen Sie diese Abfrage aus:

```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

**Fall A: "Success. No rows returned"**
→ Ihr Profil existiert nicht! Gehen Sie zu Schritt 4.

**Fall B: Sie sehen eine Zeile mit Ihrer User-ID**
→ Gut! Prüfen Sie, ob die Spalten `avatar_url`, `first_name`, etc. vorhanden sind.

---

### Schritt 4: Profil manuell erstellen (falls es nicht existiert)

Führen Sie diese Abfrage aus:

```sql
INSERT INTO profiles (id, updated_at) 
VALUES (auth.uid(), NOW()) 
ON CONFLICT (id) DO NOTHING;
```

✅ Sie sollten "Success. 1 row affected" sehen.

Prüfen Sie dann erneut mit:
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

---

### Schritt 5: RLS Policies prüfen

Führen Sie diese Abfrage aus:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';
```

✅ Sie sollten mindestens 3 Policies sehen:
1. "Public profiles are viewable by everyone." (SELECT)
2. "Users can insert their own profile." (INSERT)
3. "Users can update own profile." (UPDATE)

---

### Schritt 6: Test - Profil aktualisieren

Führen Sie diese Test-Abfrage aus:

```sql
UPDATE profiles 
SET first_name = 'Test', last_name = 'User'
WHERE id = auth.uid();
```

✅ Sie sollten "Success. 1 row affected" sehen.

Dann prüfen Sie:
```sql
SELECT first_name, last_name FROM profiles WHERE id = auth.uid();
```

✅ Sie sollten "Test User" sehen.

---

### Schritt 7: Browser-Cache löschen

1. Öffnen Sie Ihre App im Browser
2. Öffnen Sie die Entwicklertools (F12)
3. Gehen Sie zum Tab **Application** (Chrome) oder **Storage** (Firefox)
4. Klicken Sie auf **Clear site data** oder **Clear storage**
5. Laden Sie die Seite neu (Strg/Cmd + Shift + R)

---

### Schritt 8: Console-Logs prüfen

1. Öffnen Sie Ihre App
2. Gehen Sie zur Account-Seite
3. Öffnen Sie die Browser-Console (F12 → Console)
4. Suchen Sie nach diesen Logs:
   - "Profile loaded: ..." 
   - "Avatar URL from DB: ..."

**Wenn Sie diese Logs NICHT sehen:**
→ Die Daten werden nicht geladen. Mögliche Ursache:
   - Supabase-Verbindung funktioniert nicht
   - RLS Policies blockieren den Zugriff
   - User ist nicht eingeloggt

**Wenn Sie "Error loading profile:" sehen:**
→ Notieren Sie die Fehlermeldung und teilen Sie sie mir mit.

---

## Häufige Probleme und Lösungen

### Problem: "Row level security policy violation"
**Lösung:** Die RLS Policies sind nicht korrekt. Führen Sie `supabase_complete_schema.sql` erneut aus.

### Problem: "column does not exist"
**Lösung:** Die Tabelle hat nicht alle notwendigen Spalten. Führen Sie die ALTER TABLE Befehle aus `supabase_complete_schema.sql` aus.

### Problem: "relation 'profiles' does not exist"
**Lösung:** Die profiles Tabelle existiert nicht. Führen Sie das CREATE TABLE Statement aus `supabase_complete_schema.sql` aus.

### Problem: Daten werden gespeichert, aber nicht angezeigt
**Lösung:** 
1. Löschen Sie den Browser-Cache
2. Prüfen Sie die Console-Logs
3. Stellen Sie sicher, dass Sie eingeloggt sind

---

## Wenn nichts funktioniert

Senden Sie mir bitte diese Informationen:

1. **Tabellenstruktur:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
```

2. **Ihr Profil:**
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

3. **RLS Policies:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
```

4. **Console-Logs aus dem Browser** (F12 → Console)
   - Kopieren Sie alle roten Fehlermeldungen
   - Kopieren Sie die Logs, die mit "Profile loaded:" oder "Error" beginnen

5. **Network-Tab** (F12 → Network)
   - Filtern Sie nach "profiles"
   - Zeigen Sie mir die Requests und Responses

---

## Kontakt

Falls Sie weitere Hilfe benötigen, teilen Sie mir bitte mit:
- Welcher Schritt hat nicht funktioniert?
- Welche Fehlermeldungen sehen Sie?
- Was zeigen die SQL-Abfragen?

