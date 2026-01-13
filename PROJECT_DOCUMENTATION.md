# SOP Editor - Vollständige Projektdokumentation

> **Version:** siehe [`package.json`](./package.json) (aktuell: 0.9.9)  
> **Stack:** React 18 + Supabase + TailwindCSS  
> **Zielgruppe:** Medizinisches Personal zur Erstellung von Standard Operating Procedures (SOPs)  
> **Changelog:** [`CHANGELOG.md`](./CHANGELOG.md)

---

## 📋 Inhaltsverzeichnis

1. [Projektübersicht](#projektübersicht)
2. [Technologie-Stack](#technologie-stack)
3. [Architektur](#architektur)
4. [Komponenten-Übersicht](#komponenten-übersicht)
5. [Block-System](#block-system)
6. [Editor-Funktionen](#editor-funktionen)
7. [Authentifizierung & Benutzerverwaltung](#authentifizierung--benutzerverwaltung)
8. [Datenbankschema](#datenbankschema)
9. [Export-Funktionen](#export-funktionen)
10. [Kontexte & State Management](#kontexte--state-management)
11. [UI-Komponenten](#ui-komponenten)
12. [Routing](#routing)
13. [Styling & Theming](#styling--theming)
14. [Browserkompatibilität](#browserkompatibilität)

---

## Projektübersicht

Der **SOP Editor** ist eine webbasierte Anwendung zur Erstellung von Standard Operating Procedures (SOPs) für den medizinischen Bereich. Die Anwendung bietet einen Notion-ähnlichen Block-Editor mit spezialisierten Komponenten für medizinische Dokumentation.

### Hauptfunktionen

- **Block-basierter Editor** mit "/" Slash-Kommandos
- **12 vordefinierte Content-Box Kategorien** für medizinische Inhalte
- **Drag & Drop** zum Verschieben und Anordnen von Blöcken
- **Mehrspalten-Layout** (1/2/3 Spalten) mit anpassbarem Spaltenverhältnis
- **Flowchart-Editor** für Algorithmen (basierend auf ReactFlow)
- **Tabellen** mit TipTap (Zellen verbinden, Spalten/Zeilen, Hintergrundfarben)
- **Multi-Format Export:** PDF, Word (DOCX), JSON
- **Cloud-Speicherung** via Supabase
- **Undo/Redo** mit lokalem History-Tracking
- **A4-Seitenumbruch-Vorschau** mit automatischer Paginierung
- **Tag/Nacht Modus**
- **GitHub Releases** via release-it

---

## Technologie-Stack

### Frontend-Framework
| Technologie | Version | Zweck |
|-------------|---------|-------|
| React | 18.2.0 | UI-Framework |
| React Router | 7.9.6 | Client-Side Routing |
| TailwindCSS | 3.4.1 | Utility-First CSS |

### Rich-Text & Editor
| Technologie | Version | Zweck |
|-------------|---------|-------|
| TipTap | 3.13.0 | Rich-Text Editor (StarterKit, Tabellen, Unterstr., Sub/Superscript, Image Upload) |
| ReactFlow | 11.11.4 | Flowchart/Algorithmus-Editor |
| tippy.js | 6.3.7 | Tooltips & Popovers (Slash-Menü) |
| @floating-ui/react | 0.27.16 | Floating UI für TipTap Tooltips |

### Drag & Drop
| Technologie | Version | Zweck |
|-------------|---------|-------|
| @dnd-kit/core | 6.3.1 | Drag & Drop Framework |
| @dnd-kit/sortable | 10.0.0 | Sortierbare Listen |
| @dnd-kit/utilities | 3.2.2 | Hilfsfunktionen (CSS Transform) |
| @dnd-kit/modifiers | 9.0.0 | Drag-Modifikatoren (snapCenterToCursor) |

### UI-Komponenten
| Technologie | Version | Zweck |
|-------------|---------|-------|
| Radix UI | v1.x - v2.x | Accessible UI Primitives (9 Pakete, alle aktuell) |
| @phosphor-icons/react | 2.1.10 | Icon-Bibliothek |
| sonner | 2.0.7 | Toast-Benachrichtigungen |

### Backend & Datenbank
| Technologie | Version | Zweck |
|-------------|---------|-------|
| Supabase | 2.83.0 | Backend-as-a-Service (Auth, DB, Storage) |

### Export
| Technologie | Version | Zweck |
|-------------|---------|-------|
| jsPDF | 3.0.3 | PDF-Generierung |
| docx | 9.5.1 | Word-Dokument-Generierung |
| html-to-image | 1.11.13 | HTML zu Bild-Konvertierung |
| JSZip | 3.x | ZIP-Archiv-Erstellung für Bulk-Export |

### Sonstige
| Technologie | Version | Zweck |
|-------------|---------|-------|
| date-fns | 4.1.0 | Datumsformatierung |
| @vercel/speed-insights | 1.2.0 | Performance-Monitoring |
| @vercel/analytics | 1.6.1 | Nutzungsstatistiken |

### DevDependencies
| Technologie | Version | Zweck |
|-------------|---------|-------|
| release-it | 19.0.6 | Release-Management & GitHub Releases |
| @release-it/conventional-changelog | 10.0.2 | Automatische Changelog-Generierung |
| tailwindcss | 3.4.1 | CSS Framework |
| autoprefixer | 10.4.16 | CSS Vendor Prefixes |
| postcss | 8.4.32 | CSS Processing |

---

## Architektur

```
src/
├── App.js                    # Haupt-App mit Routing
├── index.js                  # React Entry Point
├── index.css                 # Globale Styles + TailwindCSS
├── App.css                   # App-spezifische Styles
│
├── components/
│   ├── Editor.js             # Haupt-Editor-Komponente
│   ├── Block.js              # Block-Wrapper für alle Block-Typen
│   ├── Page.js               # A4-Seiten-Container
│   ├── SOPHeader.js          # Dokument-Header (Titel, Version, Logo)
│   ├── SOPPageHeader.js      # Seitenkopf für Folgeseiten (Titel + Seitenzahl)
│   ├── SOPFooter.js          # Dokument-Footer (Lizenz, Disclaimer)
│   ├── SlashMenu.jsx         # Slash-Kommando Menü
│   ├── InlineTextToolbar.js  # Formatierungs-Toolbar
│   ├── ZoomControl.jsx       # Zoom-Steuerung
│   ├── ZoomWrapper.jsx       # Zoom-Container
│   ├── HelpButton.js         # Support-Button
│   ├── StatusIndicator.js    # Status-Rahmen um Toolbar (farbcodierte Alerts)
│   ├── AccountDropdown.js    # Benutzer-Dropdown
│   ├── PrivateRoute.jsx      # Auth-geschützte Route
│   ├── DocumentCard.jsx      # Dokument-Karte für Account
│   ├── EmptyState.jsx        # Leerzustand-Anzeige
│   ├── BulkExportDialog.jsx  # Massen-Export Dialog
│   │
│   ├── blocks/               # Block-Typen
│   │   ├── ContentBoxBlock.js    # Content-Box (12 Kategorien)
│   │   ├── TextBlock.js          # Rich-Text Block (TipTap)
│   │   ├── TipTapTableBlock.js   # Tabellen-Block
│   │   ├── FlowchartBlock.js     # Algorithmus/Flowchart (Controller)
│   │   ├── FlowchartPreview.js   # Statisches Flowchart-Preview
│   │   ├── FlowchartEditorModal.js # Modal-Editor für Flowcharts
│   │   ├── SourceBlock.js        # Quellen-Block
│   │   ├── TitleBlock.js         # Titel
│   │   ├── HeadingBlock.js       # Überschrift
│   │   └── ImageBlock.js         # Bild
│   │
│   ├── dnd/                  # Drag & Drop Komponenten (@dnd-kit)
│   │   ├── SortableRow.jsx       # Sortierbare Row mit Drop-Zonen
│   │   ├── DraggableBlock.jsx    # Draggable Wrapper für Blöcke
│   │   └── DropIndicator.jsx     # Visuelle Drop-Indikatoren
│   │
│   ├── extensions/           # TipTap-Erweiterungen
│   │   ├── SlashCommand.js       # Slash-Kommando Extension
│   │   └── HighlightItem.js      # Hervorhebung
│   │
│   ├── tiptap-node/          # TipTap Node-Komponenten
│   │   ├── image-upload-node/    # Image Upload Platzhalter
│   │   │   ├── image-upload-node.jsx
│   │   │   ├── image-upload-node-extension.js
│   │   │   └── image-upload-node.scss
│   │   └── image-node-pro/       # Erweiterte Bild-Node (Ausrichtung, Caption)
│   │       ├── image-node-pro.jsx
│   │       ├── image-node-pro-extension.js
│   │       └── image-node-pro.scss
│   │
│   ├── tiptap-ui-primitive/  # TipTap UI-Primitive (Button, Tooltip)
│   │   ├── button/
│   │   └── tooltip/
│   │
│   ├── tiptap-icons/         # TipTap Icons
│   │   └── close-icon.jsx
│   │
│   ├── icons/
│   │   └── CategoryIcons.jsx # SVG-Icons für Kategorien
│   │
│   └── ui/                   # Basis UI-Komponenten (Shadcn/Radix)
│       ├── button.jsx
│       ├── input.jsx
│       ├── dropdown-menu.jsx
│       ├── alert-dialog.jsx
│       ├── checkbox.jsx
│       ├── spinner.jsx
│       ├── hospital-combobox.jsx  # Krankenhaus-Suche Combobox
│       ├── position-combobox.jsx  # Position-Auswahl Combobox
│       └── ...
│
├── contexts/
│   ├── AuthContext.js        # Authentifizierung
│   ├── ThemeContext.js       # Tag/Nacht Modus
│   ├── ZoomContext.js        # Zoom-Level
│   ├── DragDropContext.js    # Drag & Drop State & Provider (@dnd-kit)
│   └── TipTapFocusContext.js # Intelligentes Undo/Redo (TipTap vs Global)
│
├── hooks/
│   ├── useEditorHistory.js   # Undo/Redo + LocalStorage
│   ├── usePageBreaks.js      # A4 Seitenumbruch-Berechnung
│   ├── useKlinikAtlas.js     # Bundes-Klinik-Atlas API Hook
│   ├── useHeightEqualization.js # Höhenangleichung für 2-spaltige Layouts (immer aktiv)
│   └── use-debounced-dimensions.js
│
├── pages/
│   ├── Account.jsx           # Account-Seite (Dokumente, Profil, Templates)
│   └── auth/
│       ├── Login.jsx         # Login-Seite
│       └── Register.jsx      # Registrierung
│
├── services/
│   ├── documentService.js    # Dokument CRUD-Operationen
│   └── organizationService.js # Organisations CRUD-Operationen
│
├── utils/
│   ├── exportUtils.js        # PDF/Word/JSON Export
│   └── performance.js        # Performance-Utilities
│
├── lib/
│   ├── supabase.js           # Supabase Client
│   ├── utils.js              # Utility-Funktionen (cn, etc.)
│   └── tiptap-utils.js       # TipTap Hilfsfunktionen (handleImageUpload, etc.)
│
├── styles/                   # SCSS-Variablen, Animationen und zentrale Style-Konstanten
│   ├── editorStyles.js       # Zentrale Style-Konstanten (Single Source of Truth für Editor + Export)
│   ├── _variables.scss       # TipTap CSS-Variablen (Farben, Abstände)
│   └── _keyframe-animations.scss
│
└── constants/
    └── layout.js             # Layout-Konstanten (Footer-Höhen, etc.)
```

---

## Komponenten-Übersicht

### Editor.js (Hauptkomponente)

Die zentrale Editor-Komponente verwaltet:

- **State:** `rows` (Block-Zeilen), `headerTitle`, `headerStand`, `headerLogo`, `footerVariant`
- **DnD-Context:** Drag & Drop mit `@dnd-kit`
- **History:** Undo/Redo via `useEditorHistory` Hook
- **Toolbar:** Import/Export, Cloud-Save, Benutzer-Aktionen
- **Seitenumbrüche:** Automatische A4-Paginierung via `usePageBreaks`

```jsx
// Struktur der Rows
rows = [
  {
    id: 'row-1',
    columnRatio: 0.5, // 0.333 - 0.666 für Zwei-Spalten
    blocks: [
      { id: '1', type: 'contentbox', content: { category: 'definition', blocks: [...] } }
    ]
  }
]
```

### Block.js (Block-Wrapper)

Rendert den passenden Block-Typ basierend auf `block.type`:
- `title` → TitleBlock
- `heading` → HeadingBlock
- `text` → TextBlock
- `contentbox` → ContentBoxBlock
- `tiptaptable` → TipTapTableBlock
- `flowchart` → FlowchartBlock
- `source` → SourceBlock
- `image` → ImageBlock

---

## Block-System

### ContentBoxBlock (Kategorien)

12 vordefinierte medizinische Kategorien mit Farben und Icons:

| ID | Label | Farbe | Hintergrund |
|----|-------|-------|-------------|
| `definition` | Definition | #EB5547 | #FCEAE8 |
| `ursachen` | Ursachen | #003366 | #E5F2FF |
| `symptome` | Symptome | #004D99 | #E5F2FF |
| `diagnostik` | Diagnostik | #3399FF | #E5F2FF |
| `therapie` | Therapie | #52C41A | #ECF9EB |
| `algorithmus` | Algorithmus | #47D1C6 | #E8FAF9 |
| `merke` | Merke | #FAAD14 | #FFF7E6 |
| `disposition` | Disposition | #B27700 | #FFF7E6 |
| `ablaeufe` | Abläufe | #524714 | #FAF8EB |
| `differenzial` | Differenzial | #9254DE | #F5ECFE |
| `studie` | Studie | #DB70C1 | #FCF0F9 |
| `sonstiges` | Sonstiges | #B3B3B3 | #F5F5F5 |

**Besonderheit `algorithmus`:** Enthält automatisch einen Flowchart-Block.

### Zusätzliche Elemente

Neben Content-Boxen können hinzugefügt werden:
- **Tabelle** (`tiptaptable`) - TipTap-basierte Tabelle
- **Quellen** (`source`) - Quellenangaben-Block

### TextBlock (TipTap)

Rich-Text Editor innerhalb von Content-Boxen:
- Fett, Kursiv, Unterstrichen
- Hochgestellt, Tiefgestellt
- Aufzählungslisten
- Kleine Schriftgröße (10px)
- Slash-Kommandos (`/`)
- Inline-Bilder

### FlowchartBlock (ReactFlow)

Controller-Komponente für den Diagnostischen Algorithmus mit Modal-basierter Bearbeitung:

**Architektur:**
- **FlowchartBlock.js** - Controller, verwaltet State und zeigt Preview/Modal
- **FlowchartPreview.js** - Statisches, nicht-interaktives Preview in der Box
- **FlowchartEditorModal.js** - Großer Modal-Editor (80% Viewport) für Bearbeitung

**Preview-Modus:**
- Nicht-interaktives ReactFlow-Rendering des aktuellen Zustands
- Edit-Button erscheint beim Hover über das Preview
- Klick öffnet den Modal-Editor
- Resize-Handle für Höhenanpassung (200-1200px)

**Modal-Editor (inspiriert von tldraw/Miro):**
- **Linke Sidebar:** Drag-and-Drop Node-Typen
- **Zentrales Canvas:** Voller Arbeitsbereich mit Background-Grid
- **Bottom-Toolbar:** Undo/Redo, Fit-View, Zoom-Reset
- **Footer:** Abbrechen/Speichern Buttons
- **Keyboard-Shortcuts:** Escape, Cmd+S, Cmd+Z

**Features:**
- **Node-Typen:** Start, Phase, Positiv, Negativ, Neutral, Kommentar, Label
- **Automatische Kantenverbindung** (Floating Edges)
- **Helper Lines** beim Positionieren (Snap-to-Grid)
- **Distanzanzeige** zwischen Nodes
- **Undo/Redo** innerhalb des Flowcharts

### TipTapTableBlock

Vollständige Tabellen-Unterstützung:
- Zeilen/Spalten hinzufügen/entfernen
- Zellen verbinden/trennen
- Kopfzeile/Kopfspalte umschalten
- Hintergrundfarben (kategoriebasiert)
- Titel für Tabellen
- Inline-Formatierung

---

## Editor-Funktionen

### Drag & Drop

- **Verschieben von Blöcken** zwischen Zeilen
- **Dropzones:** Oben, Unten, Links, Rechts eines Blocks
- **Mehrspalten-Layout:** Drag auf Links/Rechts erstellt Spalten
- **Spalten-Resize:** Horizontaler Ziehregler zwischen Spalten

### Content-Box Individualisierung

Über das Zahnrad-Icon können Content-Boxen angepasst werden:
- **Name/Caption:** Überschreiben des Kategorie-Labels
- **Spaltenanzahl:** 1, 2 oder 3 Spalten (3 Spalten nur für Disposition)
- **Reset:** Zurücksetzen auf Standardwerte

### Slash-Kommandos

Tippe `/` in einem TextBlock für:
- Aufzählungsliste
- Nummerierte Liste
- Bild einfügen
- Flowchart hinzufügen
- (Weitere nach Konfiguration)

### Undo/Redo

- Lokaler History-Stack (max. 50 Einträge)
- Automatische Speicherung in LocalStorage (`sop-editor-state-v1`)
- Debounced Speicherung (1 Sekunde)

### A4-Seitenumbruch

- Automatische Berechnung basierend auf Block-Höhen
- Footer-Höhe wird berücksichtigt
- Visuell im Editor dargestellt

### Sortierung

- Content-Boxen können nach Kategorie-Reihenfolge sortiert werden
- Button in Dropdown-Menü der Content-Boxen

---

## Authentifizierung & Benutzerverwaltung

### AuthContext

```javascript
// Bereitgestellte Funktionen
const { user, signUp, signIn, signOut, loading } = useAuth();
```

### Supabase Auth

- E-Mail/Passwort Authentifizierung
- Session-Verwaltung via Supabase Auth
- Automatisches Profil-Erstellen bei Registrierung (Trigger)

### Multistep-Registrierung

Der Registrierungsflow erfolgt in 3 Schritten mit visuellem Step-Indicator:

| Step | Titel | Felder |
|------|-------|--------|
| 1 | Account | E-Mail, Passwort, Passwort bestätigen |
| 2 | Persönlich | Vorname, Nachname, Position |
| 3 | Organisation | Einrichtungsname, Mitarbeiterzahl, Webseite, Adresse |

**Features:**
- Visueller Fortschritts-Indikator mit animierter Progress-Line
- Validierung pro Schritt (E-Mail-Format, Passwort-Länge, Passwort-Match)
- Animierte Übergänge zwischen Steps (`animate-in`, `fade-in`, `slide-in-from-right`)
- Profildaten werden direkt nach der Registrierung gespeichert
- Success-Screen mit Hinweis auf E-Mail-Bestätigung

### Account-Seite

4 Navigations-Bereiche:
1. **Meine Leitfäden** - Dokumente mit Sortierung, Filter nach Fachgebiet
2. **SOP Templates** - (In Entwicklung)
3. **Account** - Persönliche Daten und Sicherheitseinstellungen
4. **Organisation** - Krankenhaus- und Logo-Einstellungen

#### Account-Felder
- Vorname, Nachname
- Position (mit Autocomplete für medizinische Positionen)
- Profilbild (Avatar)
- Passwort ändern
- Account löschen

#### Organisation
- Krankenhaus-Name (mit Autocomplete aus Bundes-Klinik-Atlas)
- Adresse (automatisch aus Klinik-Atlas)
- Webseite (automatisch aus Klinik-Atlas)
- Firmenlogo (wird in SOPs angezeigt, mit Qualitätsprüfung)

---

## Datenbankschema

### organizations (Supabase)

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Zweck:** Gruppiert Benutzer und Dokumente. Bei Registrierung wird automatisch eine Organisation für den Benutzer erstellt.

### profiles (Supabase)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  updated_at TIMESTAMP WITH TIME ZONE,
  first_name TEXT,
  last_name TEXT,
  job_position TEXT,
  avatar_url TEXT
);
```

**Hinweis:** Organisations-spezifische Felder (`hospital_name`, `company_logo`) wurden in die `organizations` Tabelle verschoben.

### documents (Supabase)

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL DEFAULT 'Unbenanntes Dokument',
  version TEXT,
  content JSONB,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Änderung:** Dokumente gehören jetzt zur Organisation (`organization_id`), `user_id` dient nur noch dem Ersteller-Tracking.

**content (JSONB):**
```json
{
  "rows": [...],
  "headerLogo": "data:image/...",
  "footerVariant": "tiny"
}
```

### Row Level Security (RLS)

- **Organizations:** Mitglieder können ihre Organisation lesen/aktualisieren
- **Profiles:** Mitglieder der gleichen Organisation können sich gegenseitig sehen
- **Documents:** Organisations-basiert (alle Mitglieder haben vollen CRUD-Zugriff)
  - `Organization members can view documents`: Lesen
  - `Organization members can insert documents`: Erstellen
  - `Organization members can update documents`: Bearbeiten
  - `Organization members can delete documents`: Löschen

### Storage

**avatars Bucket:**
- Für Benutzer-Profilbilder
- Pfad: `{user_id}/avatar.{ext}`

**brandmarks Bucket:**
- Für Organisations-Logos
- Pfad: `{organization_id}/logo.{ext}`

---

## Export-Funktionen

### Einheitliches Dateinamensformat

Alle Exporte verwenden das Format: **`titel-stand.dateiformat`**

Beispiel: "SOP Einarbeitung" mit "STAND 12/22" → `sop-einarbeitung-stand-12-22.pdf`

**Sanitierung:**
- Kleinschreibung
- Sonderzeichen werden entfernt (außer ä, ö, ü, ß)
- Leerzeichen → Bindestriche
- Schrägstriche → Bindestriche (z.B. 12/22 → 12-22)
- Mehrfache Bindestriche werden zusammengefasst

### JSON Export

```javascript
exportAsJson(state)
// Erstellt: titel-stand.json
// z.B.: sop-einarbeitung-stand-12-22.json
```

Enthält Metadaten:
```json
{
  "_exportMetadata": {
    "version": "1.0",
    "exportDate": "2024-...",
    "editorVersion": "2.0"
  },
  "rows": [...],
  "headerTitle": "...",
  "headerStand": "...",
  "headerLogo": "...",
  "footerVariant": "..."
}
```

### JSON Import

**Im Editor (einzelne Datei):**
```javascript
const newState = await importFromJson(file)
```

- Validiert Dateistruktur
- Sanitiert Block-Inhalte
- Konvertiert Legacy-Formate

**In "Meine Leitfäden" (Bulk-Import):**
```javascript
// File-Input mit multiple-Attribut
<input type="file" accept=".json" multiple onChange={handleImportJson} />
```

- Mehrere JSON-Dateien gleichzeitig auswählbar
- Jede Datei wird als neues Dokument gespeichert
- Zusammenfassende Erfolgsmeldung (X importiert, Y fehlgeschlagen)

### PDF Export

```javascript
await exportAsPdf(containerRef, title, stand, documentId)
// Erstellt: titel-stand.pdf
```

**Server-seitig (primär via Gotenberg):**
- Konsistentes Rendering via Chromium (browserunabhängig)
- A4-Format mit korrekten Seitenrändern
- Automatisches Caching in Supabase Storage
- Fallback auf Client-seitig bei Verbindungsproblemen

**Client-seitig (Fallback):**
- Hochauflösend (476 DPI, pixelRatio 6)
- JPEG-Kompression
- Pro Seite ein Bild

### Word Export

```javascript
await exportAsWord(containerRef, title, stand, documentId)
// Erstellt: titel-stand.docx
```

**Server-seitig (primär via Gotenberg):**
- Screenshots jeder A4-Seite via Gotenberg Screenshot API
- PNG-Bilder in Word-Dokument eingebettet
- Seitenumbrüche zwischen Seiten
- Automatisches Caching in Supabase Storage

**Client-seitig (Fallback):**
- Hochauflösend (476 DPI)
- PNG-Bilder eingebettet
- Seitenumbrüche zwischen Seiten

### Gotenberg Service

Die serverseitige PDF/Word-Generierung nutzt **Gotenberg** - einen Open-Source HTML-zu-PDF Konverter.

**Setup:**
- Läuft als Docker Container auf Railway
- Supabase Edge Function (`export-document`) ruft Gotenberg API auf
- Environment Variable `GOTENBERG_URL` in Supabase Secrets

**Kosten:** ~$5-10/Monat auf Railway

**Architektur:**
```
Frontend → Edge Function → Gotenberg → PDF/Screenshots → Word
                               ↓
                       Supabase Storage (Cache)
```

Siehe `railway-gotenberg-setup.md` für detaillierte Installationsanleitung.

### Bulk Export

```javascript
await exportMultipleDocuments(documentIds, 'json', onProgress)
```

**Verhalten:**
- **1 Dokument:** Einzelne JSON-Datei wird heruntergeladen (`titel-stand.json`)
- **Mehrere Dokumente:** ZIP-Archiv wird erstellt (`sop-export-YYYY-MM-DD.zip`)

**Wichtig:** Bulk-Export unterstützt nur JSON-Format. Für originalgetreue PDF/Word-Exporte muss das Dokument im Editor geöffnet werden, da nur dort die vollständig gerenderten React-Komponenten (Flowcharts, TipTap-Tabellen, etc.) als Bild erfasst werden können.

**BulkExportDialog:**
- Nur JSON-Export verfügbar
- Hinweis zu PDF/Word im Dialog integriert
- Progress-Anzeige während des Exports
- Automatische ZIP-Erstellung bei mehreren Dokumenten

---

## Kontexte & State Management

### AuthContext

```javascript
// Provider in App.js
<AuthProvider>
  {children}
</AuthProvider>

// Hook
const { 
  user,              // Auth User
  profile,           // Profil-Daten
  organization,      // Organisation-Daten
  organizationId,    // Organisation-ID (Shortcut)
  signUp, 
  signIn, 
  signOut, 
  loading,
  refreshOrganization,  // Organisation neu laden
  refreshProfile        // Profil neu laden
} = useAuth();
```

### ThemeContext

```javascript
// Provider in App.js
<ThemeProvider>
  {children}
</ThemeProvider>

// Hook
const { timeOfDay, toggleTime, getGradientClass } = useTheme();
// timeOfDay: 'day' | 'night'
```

### ZoomContext

```javascript
// Provider in App.js
<ZoomProvider>
  {children}
</ZoomProvider>

// Hook
const { zoom, setZoom } = useZoom();
// zoom: 50-200 (Prozent)
```

### StatusContext

Globales Status-Management für farbcodierte Alerts. Ersetzt Sonner Toaster.

```javascript
// Provider in App.js
<StatusProvider>
  {children}
</StatusProvider>

// Hook
const { 
  showSuccess,    // Grün (Therapie) #52C41A
  showError,      // Rot (Definition) #EB5547
  showWarning,    // Gelb (Merke) #FAAD14
  showInfo,       // Blau #39F
  showSaving,     // Blau mit Spinner
  showExporting,  // Blau mit Spinner
  showSynced,     // Blau mit Check
  hide            // Status ausblenden
} = useStatus();

// Beispiel
showSuccess('Dokument gespeichert');
showError('Fehler beim Export', { description: 'Bitte erneut versuchen' });
showWarning('Live-Chat nicht verfügbar');
```

**Komponenten:**
- `StatusIndicator` - Rahmen um Toolbar (Editor & Account-Seite)

### useEditorHistory (Custom Hook)

```javascript
const { 
  state,           // Aktueller Editor-State
  undo,            // Rückgängig
  redo,            // Wiederherstellen
  canUndo,         // Boolean
  canRedo,         // Boolean
  setEditorState,  // State setzen (mit History-Option)
  reset,           // Zurücksetzen
  isSaving         // Speicher-Indikator
} = useEditorHistory();
```

**State-Update Optionen:**
```javascript
setEditorState(newState, { history: true })     // Standard: Zu History hinzufügen
setEditorState(newState, { history: 'replace' }) // Nur Present ersetzen
setEditorState(newState, { history: false })     // Kein History-Eintrag
```

### useKlinikAtlas (Custom Hook)

Hook zum Laden und Filtern von Krankenhausdaten aus dem Bundes-Klinik-Atlas:

```javascript
const { 
  hospitals,         // Array aller ~1.600 Krankenhäuser
  loading,           // Ladezustand
  error,             // Fehlermeldung
  isInitialized,     // Daten geladen
  loadData,          // Manuell laden (lazy loading)
  filterHospitals,   // Filtern nach Suchbegriff
  findByName,        // Krankenhaus nach Namen suchen
  totalCount         // Gesamtanzahl
} = useKlinikAtlas();
```

**Datenquelle:** `https://klinikatlas.api.proxy.bund.dev/fileadmin/json/locations.json`

**Caching:**
- Memory-Cache für aktuelle Session
- LocalStorage-Cache für 24 Stunden
- Lazy Loading beim ersten Öffnen der Combobox

**Krankenhaus-Objekt:**
```javascript
{
  id: '771003',
  name: 'Klinikum Südstadt Rostock',
  street: 'Südring 81',
  city: 'Rostock',
  zip: '18059',
  phone: '+49 (0)381/4401-0',
  email: 'info@kliniksued-rostock.de',
  beds: 533,
  latitude: '54.071629513465',
  longitude: '12.107577323914',
  link: 'https://bundes-klinik-atlas.de/krankenhaussuche/krankenhaus/771003/'
}
```

---

## UI-Komponenten

Basierend auf **shadcn/ui** (Radix Primitives + TailwindCSS):

| Komponente | Datei | Beschreibung |
|------------|-------|--------------|
| Button | `button.jsx` | Button mit Varianten |
| Input | `input.jsx` | Text-Eingabefeld |
| Label | `label.jsx` | Form Label |
| Checkbox | `checkbox.jsx` | Checkbox |
| Switch | `switch.jsx` | Toggle Switch |
| Dropdown Menu | `dropdown-menu.jsx` | Kontextmenü |
| Alert Dialog | `alert-dialog.jsx` | Bestätigungs-Dialog |
| Separator | `separator.jsx` | Trennlinie |
| Toggle | `toggle.jsx` | Toggle Button |
| Spinner | `spinner.jsx` | Lade-Indikator |
| Toaster | `sonner.jsx` | Toast-Benachrichtigungen |
| Hospital Combobox | `hospital-combobox.jsx` | Krankenhaus-Suche mit Autocomplete |
| Position Combobox | `position-combobox.jsx` | Positions-Auswahl mit Autocomplete |

---

## Routing

```jsx
// App.js
<Routes>
  {/* Öffentliche Routen */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Geschützte Routen */}
  <Route path="/account" element={
    <PrivateRoute>
      <Account />
    </PrivateRoute>
  } />
  
  {/* Editor (Haupt-Route) */}
  <Route path="/" element={<Editor />} />
</Routes>
```

### URL-Parameter

| Route | Parameter | Beschreibung |
|-------|-----------|--------------|
| `/` | `?id=UUID` | Dokument laden |
| `/` | `?new=true` | Neues Dokument |
| `/account` | `?tab=sops\|templates\|profile` | Account-Tab |

---

## Styling & Theming

### CSS-Variablen (TailwindCSS)

```css
:root {
  --background: ...;
  --foreground: ...;
  --primary: #003366;
  --primary-foreground: ...;
  --muted: ...;
  --accent: ...;
  --destructive: ...;
  --border: ...;
  --ring: ...;
}
```

### Tag/Nacht Modus

```css
.day-mode {
  /* Heller Hintergrund-Gradient */
}

.night-mode {
  /* Dunkler Hintergrund-Gradient */
}

.dark {
  /* Tailwind Dark Mode Klasse */
}
```

### Druck-Styles

```css
@media print {
  .no-print { display: none !important; }
  .print\:block { display: block !important; }
  /* ... */
}
```

### A4-Seiten-Styling

```css
.a4-page {
  width: 210mm;
  min-height: 297mm;
  background: white;
  box-shadow: ...;
  margin: 12mm 0;
}
```

---

## Dateien im Projekt

### Build & Config

| Datei | Beschreibung |
|-------|--------------|
| `package.json` | Abhängigkeiten & Scripts |
| `tailwind.config.js` | TailwindCSS Konfiguration |
| `postcss.config.js` | PostCSS Konfiguration |
| `jsconfig.json` | JS Pfad-Aliase |
| `components.json` | shadcn/ui Konfiguration |
| `.release-it.json` | Release-It Konfiguration für GitHub Releases |

### SQL-Schemas

| Datei | Beschreibung |
|-------|--------------|
| `supabase_complete_schema.sql` | Vollständiges DB-Schema |
| `supabase_documents.sql` | Documents-Tabelle |
| `supabase_schema.sql` | Basis-Schema |
| `supabase_add_category.sql` | Kategorie-Spalte |
| `supabase_update_profiles.sql` | Profil-Updates |

### Dokumentation

| Datei | Beschreibung |
|-------|--------------|
| `README.md` | Projekt-Readme |
| `CHANGELOG.md` | Versions-Historie und Änderungsprotokoll |
| `AGENTS.md` | Regeln für KI-Agenten |
| `PROJECT_DOCUMENTATION.md` | Diese Datei – vollständige Projektdokumentation |
| `IMPLEMENTATION_SUMMARY.md` | Implementierungs-Details |
| `TIPTAP_IMPLEMENTATION_SUMMARY.md` | TipTap-Migration |
| `MARKDOWN_IMPROVEMENTS.md` | Markdown-Verbesserungen |
| `OPTIMIZATION_SUMMARY.md` | Performance-Optimierungen |
| `SUPABASE_TROUBLESHOOTING.md` | Supabase-Fehlerbehebung |

---

## Entwicklung

### Installation

```bash
npm install
```

### Starten

```bash
npm start
# Läuft auf http://localhost:3000
```

### Build

```bash
npm run build
# Erstellt optimierten Build in /build
```

### Release

```bash
# Interaktiver Release (wählt Version)
npm run release

# Spezifische Version (Beispiel ausgehend von 0.6.4)
npm run release:patch   # → 0.6.5
npm run release:minor   # → 0.7.0
npm run release:major   # → 1.0.0

# Dry-Run (zeigt was passieren würde, ohne Änderungen)
npm run release:dry-run
```

**Release-Prozess:**
1. Tests werden ausgeführt
2. Version in `package.json` wird erhöht
3. Commit mit `chore: release v${version}`
4. Git-Tag `v${version}` wird erstellt
5. Push zu GitHub (Branch + Tag)
6. GitHub Release wird erstellt

### Umgebungsvariablen

```env
# Supabase (erforderlich)
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...

# GitHub Releases (optional, nur für Releases)
GITHUB_TOKEN=ghp_xxx
```

**Hinweis:** Die `.env` Datei ist in `.gitignore` und wird nicht committed.

---

## Browserkompatibilität

### Unterstützte Browser

| Browser | Mindestversion | Status |
|---------|----------------|--------|
| Chrome | 65+ | ✅ Vollständig unterstützt |
| Firefox | 60+ | ✅ Vollständig unterstützt |
| Safari | 10.1+ | ✅ Vollständig unterstützt |
| Edge | 79+ (Chromium) | ✅ Vollständig unterstützt |
| Internet Explorer | - | ❌ Nicht unterstützt |

### Technische Grundlage

Die Browserkompatibilität basiert auf folgenden Faktoren:

1. **React 18** - Unterstützt IE11 nicht mehr (seit React 18)
2. **ES6+ JavaScript** - Moderne Syntax (Arrow Functions, Destructuring, etc.)
3. **Native APIs** - `URL.createObjectURL`, `Blob`, `a.download` für Datei-Downloads
4. **CSS Features** - Flexbox, Grid, CSS Variables, `backdrop-filter`

### Browserslist-Konfiguration

```json
{
  "production": [
    ">0.2%",
    "not dead",
    "not op_mini all"
  ],
  "development": [
    "last 1 chrome version",
    "last 1 firefox version",
    "last 1 safari version"
  ]
}
```

### Empfehlung

Für die beste Nutzererfahrung empfehlen wir:
- **Chrome** oder **Edge** (Chromium) für optimale Performance
- **Firefox** als Alternative
- **Safari** auf macOS/iOS

> **Hinweis:** Die Export-Funktionen (PDF/Word) nutzen primär Gotenberg für serverseite Konvertierung. Bei Verbindungsproblemen wird auf `html-to-image` für die clientseitige Bildgenerierung zurückgegriffen.

---

## Bekannte Features & Einschränkungen

### Features

- ✅ Block-basierter Editor
- ✅ 12 medizinische Kategorien
- ✅ Drag & Drop (inkl. Mehrspalten-Layout)
- ✅ Flowchart-Editor
- ✅ TipTap-Tabellen
- ✅ PDF/Word/JSON Export
- ✅ Cloud-Speicherung
- ✅ Undo/Redo
- ✅ Tag/Nacht Modus
- ✅ Zoom-Steuerung
- ✅ Benutzer-Profile & Organisationen
- ✅ Firmenlogo in SOPs
- ✅ Krankenhaus-Autocomplete (Bundes-Klinik-Atlas)
- ✅ GitHub Releases (release-it)

### In Entwicklung

- 🔄 SOP Templates

### Einschränkungen

- Export-Qualität abhängig von Browser-Rendering
- Flowchart-Größe limitiert (300-1200px)
- Content-Box Nutzung pro Kategorie limitiert (1×, "Sonstiges" 3×)

---

*Dokumentation erstellt: November 2024*  
*Letzte Aktualisierung: Dezember 2025*

