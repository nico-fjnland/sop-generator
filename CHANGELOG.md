# Changelog

Alle wesentlichen Änderungen am SOP Editor werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [0.2.0] - 2025-11-29

### 🔄 Changed
- **Icon-Bibliothek:** Migration von Lucide React zu Phosphor Icons
- **Datei-Downloads:** Native Browser-API ersetzt `file-saver` Paket

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

