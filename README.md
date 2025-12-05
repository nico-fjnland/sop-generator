# SOP Editor

Ein webbasierter Editor zur Erstellung von Standard Operating Procedures (SOPs) für den medizinischen Bereich.

> **Version:** 0.6.1 · [Changelog](./CHANGELOG.md) · [Vollständige Dokumentation](./PROJECT_DOCUMENTATION.md)

## ✨ Features

- **Block-basierter Editor** mit "/" Slash-Kommandos
- **12 medizinische Content-Box Kategorien** (Definition, Ursachen, Symptome, Diagnostik, Therapie, etc.)
- **Drag & Drop** zum Verschieben und Anordnen von Blöcken
- **Mehrspalten-Layout** (1/2/3 Spalten) mit anpassbarem Spaltenverhältnis
- **Flowchart-Editor** für Algorithmen und Entscheidungsbäume
- **Rich-Text Tabellen** mit Zellen-Merge und Hintergrundfarben
- **Multi-Format Export:** PDF, Word (DOCX), JSON
- **Cloud-Speicherung** via Supabase
- **Organisations-Verwaltung** für Teams
- **Krankenhaus-Autocomplete** aus dem Bundes-Klinik-Atlas
- **Undo/Redo** mit lokalem History-Tracking
- **A4-Seitenumbruch-Vorschau**
- **Tag/Nacht Modus**

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Entwicklung

```bash
npm start
```

Die Anwendung läuft auf [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

### Release

```bash
# Interaktiver Release
npm run release

# Spezifische Versionen
npm run release:patch   # Bug-Fix (0.6.1 → 0.6.2)
npm run release:minor   # Feature (0.6.1 → 0.7.0)
npm run release:major   # Breaking Change (0.6.1 → 1.0.0)
```

### Umgebungsvariablen

Erstelle eine `.env` Datei:

```env
# Supabase (erforderlich)
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...

# GitHub Releases (optional)
GITHUB_TOKEN=ghp_xxx
```

## 📖 Verwendung

1. **Starte die Anwendung** und melde dich an
2. **Erstelle ein neues Dokument** oder öffne ein bestehendes
3. **Tippe "/"** um Content-Boxen und Elemente hinzuzufügen
4. **Drag & Drop** zum Verschieben von Blöcken
5. **Exportiere** als PDF, Word oder JSON

## 🛠 Technologie-Stack

| Kategorie | Technologien |
|-----------|--------------|
| **Frontend** | React 18, TailwindCSS, React Router |
| **Editor** | TipTap, ReactFlow |
| **UI** | Radix UI, Phosphor Icons, shadcn/ui |
| **Backend** | Supabase (Auth, Database, Storage) |
| **Export** | jsPDF, docx, html-to-image |
| **DnD** | @dnd-kit |

## 📁 Projektstruktur

```
src/
├── components/        # React-Komponenten
│   ├── blocks/        # Block-Typen (ContentBox, Table, Flowchart, etc.)
│   ├── dnd/           # Drag & Drop Komponenten (@dnd-kit)
│   ├── ui/            # Basis UI-Komponenten (shadcn/ui)
│   ├── icons/         # SVG-Icons für Kategorien
│   └── extensions/    # TipTap-Erweiterungen
├── contexts/          # React Contexts (Auth, Theme, Zoom, DragDrop)
├── hooks/             # Custom Hooks (History, PageBreaks, KlinikAtlas)
├── pages/             # Seiten-Komponenten (Account, Auth)
├── services/          # API-Services (Documents, Organizations)
├── utils/             # Utility-Funktionen (Export, Performance)
├── lib/               # Bibliotheks-Konfiguration (Supabase)
└── constants/         # Layout-Konstanten
```

## 🌐 Browser-Support

| Browser | Status |
|---------|--------|
| Chrome 65+ | ✅ |
| Firefox 60+ | ✅ |
| Safari 10.1+ | ✅ |
| Edge 79+ | ✅ |
| Internet Explorer | ❌ |

## 📄 Dokumentation

- [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md) – Vollständige technische Dokumentation
- [`CHANGELOG.md`](./CHANGELOG.md) – Versions-Historie
- [`AGENTS.md`](./AGENTS.md) – Regeln für KI-Agenten

## 🔗 Links

- [GitHub Releases](https://github.com/nico-fjnland/sop-generator/releases)

## 📝 Lizenz

Privates Projekt

---

*Entwickelt für medizinisches Personal zur Erstellung standardisierter Behandlungsleitfäden.*
