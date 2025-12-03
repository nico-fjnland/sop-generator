# Changelog

Alle wesentlichen Änderungen am SOP Editor werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [0.5.0] - 2025-12-03

### ✨ Added
- **Drag & Drop für Content-Boxen:** Neue @dnd-kit basierte Implementierung
  - Content-Boxen können über das Icon am linken Rand gegriffen und verschoben werden
  - Vertikales Sortieren: Boxen können über/unter andere Boxen gezogen werden
  - Zweispalten-Layout: Boxen können auf die linke/rechte Hälfte einer anderen Box gezogen werden, um ein Zweispalten-Layout zu erstellen
  - Drop-Indikatoren: Blaue Linie zeigt die Zielposition an
  - Ghost-Vorschau: Transparente Kopie des gedraggten Blocks während des Ziehens
  - Spalte auflösen: Block aus Zweispalten-Row wegziehen wandelt zurück zu Single-Column
  - Bestehender Resize-Handle für Spaltenbreiten bleibt funktionsfähig

### 🔧 Technical
- **Neue Dependencies:**
  - `@dnd-kit/core` (6.3.1) - Drag & Drop Framework
  - `@dnd-kit/sortable` (10.0.0) - Sortierbare Listen
  - `@dnd-kit/utilities` (3.2.2) - Hilfsfunktionen

- **Neue Komponenten:**
  - `src/contexts/DragDropContext.js` - DnD-Provider mit Sensors und Collision Detection
  - `src/components/dnd/SortableRow.jsx` - Sortierbare Row mit Drop-Zonen
  - `src/components/dnd/DraggableBlock.jsx` - Draggable Wrapper für Blöcke
  - `src/components/dnd/DropIndicator.jsx` - Visuelle Drop-Indikatoren

- **Angepasste Komponenten:**
  - `Editor.js` - Integration des DragDropProviders
  - `Block.js` - Weiterleitung von dragHandleProps
  - `ContentBoxBlock.js` - Icon-Container als Drag-Handle
  - `TipTapTableBlock.js` - Drag-Handle-Button hinzugefügt
  - `SourceBlock.js` - Drag-Handle-Button hinzugefügt

- **CSS:**
  - Neue Styles für Drag-States, Drop-Indikatoren und Drop-Zonen
  - Cursor-Styles für Drag-Handles (grab/grabbing)
  - Ghost-Element-Styling mit Rotation und Schatten

### 🐛 Fixed
- **Drag-Ghost Darstellung:** Entfernt weißen Container um gedraggtes Element
  - Ghost zeigt jetzt die "echte" Box ohne zusätzlichen Rahmen
  - Hover-Buttons (Einstellungen, Hinzufügen, Löschen) werden im Ghost versteckt
  - Verwendet `drop-shadow` Filter statt `box-shadow` für natürlicheren Schatten
- **Drag-Cursor-Tracking:** Box folgt jetzt dem Cursor während des Drag & Drop
  - Custom `snapLeftToCursor` Modifier erstellt
  - Box wird so positioniert, dass der Cursor am Icon (linker Rand) bleibt
  - Verwendet gleiche Logik wie `snapCenterToCursor`, aber mit Offset nach rechts
- **Drop-Zonen verkleinert:**
  - Horizontale Drop-Zonen (oben/unten): 24px → 16px Höhe
  - Spalten Drop-Zonen (links/rechts): 50% → 60px feste Breite

---

## [0.4.0] - 2025-12-03

### ✨ Added
- **Content-Box Einstellungsmenü:**
  - Neuer Einstellungs-Button (Zahnrad-Icon) ersetzt den Drag-Button in den HoverButtons
  - Das Oval-Icon der Box behält weiterhin die Drag-Funktion via `iconOnRight`
  - Neues Dropdown-Menü mit folgenden Einstellungen:
    - **Name/Caption:** Editierbares Textfeld zum Überschreiben des Kategorie-Labels
    - **Zweispaltigkeit:** Toggle zum Aktivieren eines zweispaltigen Layouts innerhalb der Box (fügt automatisch einen Platzhalter-Block für die rechte Spalte hinzu)
    - **Farbe:** Vordefinierte Farbfelder aller Kategorie-Farben zur schnellen Auswahl

### 🔄 Changed
- **Datenstruktur erweitert:** Content-Boxen speichern nun zusätzlich `customLabel`, `isTwoColumn` und `customColor`
- **CSS:** Neue `.two-column` Klasse für zweispaltiges Grid-Layout in Content-Boxen

---

## [0.3.3] - 2025-12-03

### 🔄 Changed
- **Account-Navigation umstrukturiert:**
  - "Profil & Einstellungen" in "Account" umbenannt
  - Neue separate Seite "Organisation" für Krankenhaus- und Logo-Einstellungen
  - Organisations-Sektion aus dem Profil-Bereich extrahiert
  - Neue `OrganizationView`-Komponente in `Account.jsx`
  - `AccountDropdown.js` um "Organisation"-Menüpunkt erweitert

---

## [0.3.2] - 2025-12-03

### 🐛 Fixed
- **Firefox PDF-Export:** Cross-Origin Stylesheet-Fehler behoben
  - Firefox blockierte den Zugriff auf CSS-Regeln von Google Fonts beim PDF-Export
  - `html-to-image` konnte die Fonts nicht verarbeiten → `TypeError: can't access property "trim", e is undefined`
  - **Lösung 1:** `crossorigin="anonymous"` Attribut zu Google Fonts Link in `index.html` hinzugefügt
  - **Lösung 2:** `exportUtils.js` erweitert um manuelle Font-CSS-Ladung via fetch
  - **Lösung 3:** Automatischer Fallback-Mechanismus (`captureWithFallback`) - wenn Cross-Origin-Fehler auftreten, wird der Export mit `skipFonts=true` wiederholt
  - Redundanten `@import` für Google Fonts aus `index.css` entfernt (war doppelt + problematisch)

---

## [0.3.1] - 2025-12-03

### 🐛 Fixed
- **SOPHeader Titelumbruch:** Lange Überschriften brechen jetzt intelligent um
  - `overflow-wrap: break-word` verhindert Überlaufen des Containers
  - `word-break: break-word` erlaubt Umbrüche innerhalb langer Wörter
  - `hyphens: auto` ermöglicht automatische Silbentrennung (browserabhängig)
  - Gilt für Editor- und Druckansicht

### 🔄 Changed
- **SOPHeader Layout optimiert:**
  - Gap zwischen Titel und Logo von 64px auf 24px reduziert
  - Überflüssiges `paddingRight: 139px` bei der Versionszeile entfernt

- **Content-Box Kategorien neu geordnet:**
  - Neue Standard-Reihenfolge: Definition → Ursachen → Symptome → Diagnostik → Differenzial → Therapie → Algorithmus → Merke → Disposition → Sonstiges → Abläufe → Studie
  - Diese Reihenfolge gilt für Dropdown-Menüs und die Sortier-Funktion

- **Kategorie-Nutzungsanzeige überarbeitet:**
  - Haken durch Nutzungszähler ersetzt: zeigt `0/1`, `1/1` etc.
  - Die meisten Kategorien können 1× verwendet werden (maxUsage: 1)
  - "Sonstiges" kann bis zu 3× verwendet werden (maxUsage: 3)
  - Tabellen und Quellen sind von der Limitierung ausgenommen (∞-Symbol)
  - Zähler nutzt gleiche Farbe/Opazität wie Kategorie-Label

---

## [0.3.0] - 2025-12-02

### ✨ Added
- **Organisations-Struktur:** Neue Multi-User-Organisation-Architektur
  - Neue `organizations` Tabelle in Supabase für Organisationsdaten
  - Profile sind jetzt Mitglieder einer Organisation (über `organization_id`)
  - Dokumente werden auf Organisations-Ebene gespeichert (nicht mehr pro User)
  - Alle Mitglieder einer Organisation können alle Dokumente sehen und bearbeiten
  - Neuer `organizationService.js` für Organisations-CRUD-Operationen
  - `AuthContext` erweitert um `organization`, `organizationId` und `refreshOrganization`

### 🔄 Changed
- **Dokumenten-Speicherung:** Dokumente werden jetzt der Organisation zugeordnet
  - `documentService.js` verwendet `organization_id` statt nur `user_id`
  - `user_id` wird weiterhin für Ersteller-Tracking gespeichert
- **Profil-Daten getrennt:** Persönliche Daten (Name, Position, Avatar) bleiben im Profil
  - Organisationsdaten (Name, Logo) werden in `organizations` gespeichert
- **Account-Seite:** Verwendet jetzt Organisations-Daten für Logo und Krankenhaus-Name
- **Registrierung:** Erstellt automatisch eine Organisation für neue Nutzer

### 🔒 Security
- **RLS Policies aktualisiert:**
  - `organizations`: Mitglieder können ihre Organisation lesen/aktualisieren
  - `profiles`: Mitglieder der gleichen Organisation können sich gegenseitig sehen
  - `documents`: Alle Mitglieder einer Organisation haben vollen CRUD-Zugriff

### 🗑️ Removed
- Spalten `hospital_name` und `company_logo` aus `profiles` Tabelle entfernt
  - Diese Daten werden jetzt in der `organizations` Tabelle gespeichert

### 🐛 Fixed
- **RLS-Policy Rekursion behoben:** Die RLS-Policy für `profiles` verursachte eine Endlosschleife
  - Neue `get_user_organization_id()` Funktion mit `SECURITY DEFINER` umgeht die Rekursion
- **SOPHeader.js:** Lädt Firmenlogo jetzt aus der Organisation statt aus dem Profil
  - Echtzeit-Subscription auf `organizations` Tabelle statt `profiles`

---

## [0.2.6] - 2025-12-02

### 🔄 Changed
- **Storage-Buckets reorganisiert:** Profilbilder und Firmenlogos werden jetzt separat gespeichert
  - Profilbilder (Avatare) bleiben im `avatars` Bucket
  - Firmenlogos werden jetzt im neuen `brandmarks` Bucket gespeichert
  - Uploads überschreiben jetzt vorherige Dateien anstatt neue zu erstellen
  - Dateistruktur: `{user_id}/avatar.{ext}` bzw. `{user_id}/logo.{ext}`
  - Reduziert Storage-Verbrauch durch Vermeidung von Datei-Duplikaten

### 🔒 Security
- **RLS Policies für brandmarks Bucket:** Benutzer können nur ihre eigenen Logos verwalten
  - INSERT, UPDATE, DELETE nur für eigene Dateien
  - SELECT öffentlich (public bucket)

---

## [0.2.5] - 2025-12-02

### ✨ Added
- **Vercel Analytics:** `@vercel/analytics` hinzugefügt für Nutzungsstatistiken
  - Erfasst Page Views und Custom Events
  - Datenschutzfreundlich (GDPR-konform)
  - Integration in `src/index.js` neben SpeedInsights

---

## [0.2.4] - 2025-12-02

### 🐛 Fixed
- **TipTap Duplicate Extension Warning:** Behoben die Konsolenwarnung `Duplicate extension names found: ['underline']`
  - Ursache: `@tiptap/starter-kit` 3.11.0 enthält jetzt `@tiptap/extension-underline` als eingebaute Dependency
  - Lösung: `underline: false` in `StarterKit.configure()` gesetzt, um die eingebaute Version zu deaktivieren
  - Betrifft: `TextBlock.js` und `TipTapTableBlock.js`

### ✨ Improved
- **HelpScout Beacon Graceful Degradation:** Help-Button funktioniert jetzt auch wenn Beacon blockiert ist
  - Erkennt ob HelpScout Beacon verfügbar ist (oft von Ad-Blockern blockiert)
  - **NEU:** Orangefarbener Warn-Punkt am Help-Button wenn Chat blockiert
  - **NEU:** Informativer Toast mit Erklärung und E-Mail-Button als Alternative
  - Tooltip zeigt "Live-Chat blockiert – klicken für Alternativen"

- **React Konsolen-Warnungen behoben:**
  - SVG-Attribute in `CategoryIcons.jsx` auf camelCase konvertiert (`stroke-width` → `strokeWidth`, etc.)
  - "Cannot update component while rendering" in `ContentBoxBlock.js` behoben durch Verschieben von Parent-Updates aus setState-Callbacks

---

## [0.2.3] - 2025-11-30

### ✨ Added
- **Logo-Qualitätsprüfung:** Automatische Checkliste neben dem Firmenlogo-Upload
  - Prüft Mindestauflösung (300×300px für Druck)
  - Prüft Dateiformat (SVG/PNG empfohlen, JPEG akzeptabel)
  - Prüft Seitenverhältnis (max. 3:1)
  - Prüft Dateigröße (max. 2 MB)
  - SVG-Dateien werden als optimal für Druck erkannt (verlustfrei skalierbar)
  - Echtzeit-Feedback mit farbcodierten Checkmarks (grün/orange/rot)

---

## [0.2.2] - 2025-11-30

### ✨ Added
- **Krankenhaus-Autocomplete:** Intelligente Vervollständigung aus dem Bundes-Klinik-Atlas
  - Neuer `useKlinikAtlas` Hook zum Laden und Cachen der ~1.600 Krankenhausdaten
  - Neue `HospitalCombobox` UI-Komponente mit Suchfeld und Dropdown
  - Info-Box zeigt ausgewählte Klinik-Details (Adresse, Betten, Kontakt, Link)
  - Lokales Caching (Memory + localStorage für 24h)
  - Supabase Edge Function `klinik-atlas-proxy` als CORS-Proxy
  - Fallback für manuelle Eingabe wenn Klinik nicht gefunden
- **Position-Combobox:** Neues Dropdown für medizinische Positionen
  - Neue `PositionCombobox` UI-Komponente mit Suchfunktion
  - 8 vordefinierte Positionen (Ärztlicher Direktor:in bis Famulant:in)
  - Sortierung von höchster zu niedrigster Position
  - Fallback für manuelle Eingabe benutzerdefinierter Positionen

### 🗑️ Removed
- Felder "Weitere Informationen" (Mitarbeiterzahl, Webseite) und "Adresse" aus dem Profil
  - Werden jetzt automatisch aus dem Bundes-Klinik-Atlas bezogen
- Datenbankfelder `hospital_employees`, `hospital_address`, `hospital_website` aus `profiles` Tabelle entfernt

### 🐛 Fixed
- Klinik-Details bleiben nach Speichern und Reload erhalten
  - Krankenhaus wird automatisch im Klinik-Atlas nachgeschlagen und Details wiederhergestellt

---

## [0.2.1] - 2025-11-30

### ✨ Added
- **Multistep-Registrierungsformular:** Neuer 3-Schritte-Registrierungsflow
  - Step 1: E-Mail-Adresse & Passwort
  - Step 2: Persönliche Daten (Vorname, Nachname, Position)
  - Step 3: Organisationsdaten (Einrichtungsname, Mitarbeiterzahl, Webseite, Adresse)
  - Visueller Step-Indicator mit Fortschrittsanzeige
  - Validierung pro Schritt
  - Animierte Übergänge zwischen Steps
  - Success-Screen nach erfolgreicher Registrierung
  - Profildaten werden direkt bei der Registrierung gespeichert

### 🐛 Fixed
- **Account-Löschung:** `window.prompt()` durch AlertDialog ersetzt (Browser-Kompatibilität)
- **Account-Löschung funktioniert jetzt korrekt:** Neue `delete_own_account()` RPC-Funktion in Supabase
  - Löscht Dokumente, Profil und Auth-User in einer Transaktion
  - SECURITY DEFINER für sicheren Zugriff auf `auth.users`

### 🔒 Security
- **Row Level Security (RLS) verbessert:** Dokumente sind jetzt strikt pro Benutzer isoliert
  - Doppelte RLS-Policies bereinigt
  - Policies auf `authenticated` Rolle beschränkt (statt `public`)
  - Benutzer können nur noch ihre eigenen Dokumente sehen, erstellen, bearbeiten und löschen

---

## [0.2.0] - 2025-11-29

### 🔄 Changed
- **Icon-Bibliothek:** Migration von Lucide React zu Phosphor Icons
- **Datei-Downloads:** Native Browser-API ersetzt `file-saver` Paket
- **Versionsanzeige:** HelpButton liest Version automatisch aus `package.json`

### 🗑️ Removed
- **Ungenutzte Pakete entfernt:**
  - `lucide-react` (ersetzt durch @phosphor-icons/react)
  - `file-saver` (ersetzt durch native downloadBlob-Funktion)
  - `@emailjs/browser` (nie verwendet)
  - `tesseract.js` (nie verwendet)
  - `pdfjs-dist` (nie verwendet)
  - `html2canvas` (nie verwendet)
  - `react-to-print` (nie verwendet)

- **Legacy Block-Komponenten entfernt:**
  - `src/components/blocks/ListBlock.js`
  - `src/components/blocks/DividerBlock.js`
  - `src/components/blocks/TableBlock.js`
  - `src/components/blocks/TextBlock.backup.js`

- **Ungenutzte Dateien entfernt:**
  - `src/contexts/HeaderContext.js`
  - `src/services/figmaService.js`

### 📝 Documentation
- `PROJECT_DOCUMENTATION.md` erstellt und aktualisiert
- Browserkompatibilität dokumentiert
- Architektur-Übersicht bereinigt

---

## [0.1.0] - 2025-11-01

### ✨ Added
- Initial Release
- Block-basierter Editor mit Slash-Kommandos
- 12 vordefinierte Content-Box Kategorien
- Drag & Drop für Blöcke (inkl. Zwei-Spalten-Layout)
- Flowchart-Editor (ReactFlow)
- TipTap-Tabellen mit Zellen-Merge
- Multi-Format Export (PDF, Word, JSON)
- Cloud-Speicherung via Supabase
- Undo/Redo mit LocalStorage-Persistenz
- A4-Seitenumbruch-Vorschau
- Tag/Nacht Modus
- Benutzer-Authentifizierung
- Profil- und Organisationsverwaltung

---

## Versionsformat

- **MAJOR** (x.0.0): Breaking Changes, inkompatible API-Änderungen
- **MINOR** (0.x.0): Neue Features, abwärtskompatibel
- **PATCH** (0.0.x): Bug-Fixes, kleine Verbesserungen

## Kategorien

- ✨ **Added** – Neue Features
- 🔄 **Changed** – Änderungen an bestehenden Features
- 🗑️ **Removed** – Entfernte Features
- 🐛 **Fixed** – Bug-Fixes
- 🔒 **Security** – Sicherheits-Updates
- 📝 **Documentation** – Dokumentations-Updates

