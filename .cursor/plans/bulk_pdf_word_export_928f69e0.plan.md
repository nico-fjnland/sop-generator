---
name: Bulk PDF/Word Export
overview: Ermöglicht den Bulk-Export von gespeicherten Leitfäden als PDF oder Word direkt aus "Meine Leitfäden" durch intelligentes HTML-Caching beim Speichern.
status: IMPLEMENTED
todos:
  - id: html-cache-storage
    content: Storage-Bucket für HTML-Cache einrichten und Datenbank-Schema erweitern
    status: completed
  - id: editor-save-html
    content: Editor.js erweitern um HTML beim Speichern zu cachen
    status: completed
  - id: bulk-export-service
    content: Service für parallelen Bulk-Export mit gecachtem HTML (max 10 parallel)
    status: completed
  - id: bulk-dialog-ui
    content: BulkExportDialog um PDF/Word-Optionen und Fortschrittsanzeige erweitern
    status: completed
  - id: cache-management
    content: Fehlerbehandlung für fehlenden HTML-Cache (alte Dokumente)
    status: completed
---

# Bulk PDF/Word Export für "Meine Leitfäden"

## Finale Entscheidungen

| Aspekt | Entscheidung |
|--------|--------------|
| **Caching-Strategie** | Nur HTML cachen (kein PDF/Word-Cache) |
| **Alte Dokumente** | Manuell im Editor öffnen (kein Auto-Migrate) |
| **Max Bulk-Export** | 100 Dokumente pro Export |
| **Parallelisierung** | 10 gleichzeitige Anfragen |
| **Infrastruktur** | Railway Hobby Plan Upgrade (~$5/Monat) |

---

## Architektur-Übersicht

### Beim Speichern im Editor

```
┌─────────────────────────────────────────────────────────────────┐
│                        SPEICHER-PROZESS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Editor                     Supabase                           │
│   ┌──────────┐              ┌─────────────────────────────┐    │
│   │          │   JSON       │  documents Tabelle          │    │
│   │  Nutzer  │ ──────────── │  - id, title, content       │    │
│   │  klickt  │              │  - html_cached_at (neu)     │    │
│   │ Speichern│              └─────────────────────────────┘    │
│   │          │                                                  │
│   │          │   HTML       ┌─────────────────────────────┐    │
│   │          │ ──────────── │  Storage: document-html/    │    │
│   └──────────┘              │  - {doc-id}.html (~50-100KB)│    │
│                             └─────────────────────────────┘    │
│                                                                 │
│   Zusätzliche Speicherzeit: ~0,5-1 Sekunde                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Beim Bulk-Export

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXPORT-PROZESS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   "Meine Leitfäden"         Supabase            Gotenberg       │
│   ┌──────────────┐                              (Railway)       │
│   │ Nutzer wählt │                                              │
│   │ 50 Dokumente │                                              │
│   │ + Format PDF │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────┐  10 parallel ┌─────────────┐  ┌───────────┐ │
│   │  Für jedes   │ ───────────► │ Storage:    │ ─►│ Edge Func │ │
│   │  Dokument:   │              │ HTML laden  │   │ HTML→PDF  │ │
│   │  HTML→PDF    │              └─────────────┘   └─────┬─────┘ │
│   └──────────────┘                                      │       │
│          │                                              ▼       │
│          │                                        ┌───────────┐ │
│          │                                        │ Gotenberg │ │
│          │                                        │ (8GB RAM) │ │
│          │                                        └─────┬─────┘ │
│          ▼                                              │       │
│   ┌──────────────┐                                      │       │
│   │ ZIP erstellen│ ◄────────────────────────────────────┘       │
│   │ + Download   │                                              │
│   └──────────────┘                                              │
│                                                                 │
│   Geschätzte Zeit: 50 PDFs ÷ 10 parallel × 4 Sek = ~20 Sek     │
│   Geschätzte Zeit: 50 Words ÷ 10 parallel × 12 Sek = ~60 Sek   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Speicherverbrauch

| Komponente | Pro Dokument | Bei 1.000 Dokumenten |
|------------|--------------|----------------------|
| JSON in DB | ~5-20 KB | ~5-20 MB |
| HTML in Storage | ~50-100 KB | ~50-100 MB |
| **Gesamt neu** | ~50-100 KB | ~50-100 MB |

Supabase Free Plan: 1 GB Storage → Platz für ~10.000 Dokumente

---

## Infrastruktur-Kosten

| Service | Plan | Kosten | Kapazität |
|---------|------|--------|-----------|
| Supabase | Free | $0 | 500k Edge Function Calls/Monat |
| Railway | Hobby | ~$5/Monat | 8 GB RAM, 8 vCPU |
| **Gesamt** | | **~$5/Monat** | |

---

## Kostenrechnung: Wie lange reicht der Plan?

### Kosten pro Bulk-Export (100 Word-Dokumente)

```
Dauer: ~2 Minuten (100 Docs ÷ 10 parallel × 12 Sek)
Ressourcen: ~2 GB RAM, 4 vCPU (Peak)

RAM:  2 GB × 2 Min × $0.000231  = $0.0009
vCPU: 4    × 2 Min × $0.000463  = $0.0037
──────────────────────────────────────────
Kosten pro Bulk-Export:          ~$0.005 (0,5 Cent)
```

### Railway Hobby Plan ($5 Credit/Monat)

| Bulk-Exports/Monat | Export-Kosten | Basis (Auto-Sleep) | Gesamt |
|--------------------|---------------|-------------------|--------|
| 50 | $0.25 | $2.50 | **$2.75** |
| 100 | $0.50 | $2.50 | **$3.00** |
| 200 | $1.00 | $2.50 | **$3.50** |
| 500 | $2.50 | $2.50 | **$5.00** (Limit) |
| 1.000 | $5.00 | $2.50 | **$7.50** (Überschuss) |

**Kapazität:** ~500 Bulk-Exports/Monat im $5 Credit

### Supabase Free Plan (500k Calls/Monat)

| Bulk-Exports/Monat | Edge Function Calls | Auslastung |
|--------------------|---------------------|------------|
| 100 | 10.000 | 2% |
| 500 | 50.000 | 10% |
| 1.000 | 100.000 | 20% |
| 5.000 | 500.000 | 100% (Limit) |

**Kapazität:** ~5.000 Bulk-Exports/Monat (kein Engpass)

### Gleichzeitige Nutzer

Mehrere Nutzer können gleichzeitig Bulk-Exports starten. Die Anfragen werden mit 10er-Parallelisierung abgearbeitet:

| Gleichzeitige Exports | Wartezeit pro Nutzer |
|-----------------------|---------------------|
| 1 × 100 Docs | ~2 Minuten |
| 3 × 100 Docs | ~6 Minuten |
| 5 × 100 Docs | ~10 Minuten |

### Wichtig: Auto-Sleep Konfiguration

Damit der $5 Credit reicht, muss Gotenberg mit Auto-Sleep konfiguriert werden:

```yaml
# railway.toml
[deploy]
  sleepAfterInactivity = "5m"
```

**Nachteil:** Erster Export nach Schlafphase dauert +10-30 Sek (Cold Start)

---

## UX-Flow

### 1. Dokumente auswählen
Nutzer wählt unter "Meine Leitfäden" mehrere Dokumente aus.

### 2. Format wählen
Dialog zeigt drei Optionen:
- **PDF** - Originalgetreue PDF-Dateien (~4 Sek/Dok)
- **Word** - Bearbeitbare .docx-Dateien (~12 Sek/Dok)
- **JSON** - Rohdaten für Backup (sofort)

### 3. Export-Fortschritt
Fortschrittsbalken zeigt: "Exportiere... 23 von 50"
Mit Liste der bereits fertigen Dokumente.

### 4. Download
ZIP-Datei wird automatisch heruntergeladen.
Bei Einzeldokument: Direkt als PDF/Word.

---

## Fehlerbehandlung

### Fehlender HTML-Cache (alte Dokumente)

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Einige Dokumente müssen aktualisiert werden                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  3 von 10 ausgewählten Dokumenten wurden noch nie im neuen     │
│  Editor geöffnet und können nicht exportiert werden.           │
│                                                                 │
│  • SOP Hygiene (zuletzt bearbeitet: 01.01.2024)                │
│  • SOP Notfall (zuletzt bearbeitet: 15.12.2023)                │
│  • SOP Transport (zuletzt bearbeitet: 20.11.2023)              │
│                                                                 │
│  Bitte öffne diese Dokumente einmal im Editor und speichere    │
│  sie erneut, um den Export zu ermöglichen.                     │
│                                                                 │
│  [Nur verfügbare exportieren (7)]  [Abbrechen]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Export-Fehler einzelner Dokumente

- Fehlgeschlagene Dokumente werden markiert
- Erfolgreich exportierte werden trotzdem als ZIP angeboten
- Option: "Fehlgeschlagene erneut versuchen"

---

## Technische Implementierung

### 1. Datenbank-Schema erweitern

```sql
ALTER TABLE documents 
ADD COLUMN html_cached_at TIMESTAMP WITH TIME ZONE;
```

### 2. Storage-Bucket erstellen

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-html', 'document-html', false);

-- RLS Policy: Nur eigene Organisation
CREATE POLICY "Users can access own org html"
ON storage.objects FOR ALL
USING (
  bucket_id = 'document-html' 
  AND auth.role() = 'authenticated'
);
```

### 3. Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| [documentService.js](src/services/documentService.js) | `saveDocumentHtml()`, `getDocumentHtml()` |
| [Editor.js](src/components/Editor.js) | `handleCloudSave`: HTML serialisieren + uploaden |
| [exportService.js](src/services/exportService.js) | `bulkExportFromCache()` mit Parallelisierung |
| [BulkExportDialog.jsx](src/components/BulkExportDialog.jsx) | Format-Auswahl, Fortschrittsanzeige |
| [Account.jsx](src/pages/Account.jsx) | `handleBulkExport` anpassen |

---

## Implementierungsreihenfolge

### Phase 1: Infrastruktur (30 Min)
1. Railway auf Hobby Plan upgraden
2. Storage-Bucket `document-html` erstellen
3. Datenbank-Spalte `html_cached_at` hinzufügen

### Phase 2: HTML-Caching beim Speichern (2-3 Std)
1. `documentService.js`: Neue Funktionen für HTML-Upload/Download
2. `Editor.js`: `handleCloudSave` erweitern

### Phase 3: Bulk-Export Service (2-3 Std)
1. `exportService.js`: `bulkExportFromCache()` mit Parallelisierung
2. Fehlerbehandlung und Retry-Logik

### Phase 4: UI-Anpassungen (2-3 Std)
1. `BulkExportDialog.jsx`: Format-Auswahl, Fortschritt
2. `Account.jsx`: Integration

### Phase 5: Testing (1-2 Std)
1. Einzelexport testen
2. Bulk-Export mit verschiedenen Größen
3. Fehlerszenarien (fehlender Cache, Timeout)

**Geschätzter Gesamtaufwand: 8-12 Stunden**
