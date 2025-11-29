# SOP Editor

Ein webbasierter Editor zur Erstellung von Standard Operating Procedures (SOPs) für den medizinischen Bereich.

> **Version:** 0.2.0 · [Changelog](./CHANGELOG.md) · [Vollständige Dokumentation](./PROJECT_DOCUMENTATION.md)

## ✨ Features

- **Block-basierter Editor** mit "/" Slash-Kommandos
- **12 medizinische Content-Box Kategorien** (Definition, Ursachen, Symptome, Diagnostik, Therapie, etc.)
- **Drag & Drop** zum Verschieben und Anordnen von Blöcken
- **Zweispalten-Layout** mit anpassbarem Spaltenverhältnis
- **Flowchart-Editor** für Algorithmen und Entscheidungsbäume
- **Rich-Text Tabellen** mit Zellen-Merge und Hintergrundfarben
- **Multi-Format Export:** PDF, Word (DOCX), JSON
- **Cloud-Speicherung** via Supabase
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

### Umgebungsvariablen

Erstelle eine `.env.local` Datei:

```env
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
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
│   ├── ui/            # Basis UI-Komponenten
│   └── extensions/    # TipTap-Erweiterungen
├── contexts/          # React Contexts (Auth, Theme, Zoom)
├── hooks/             # Custom Hooks
├── pages/             # Seiten-Komponenten
├── services/          # API-Services
├── utils/             # Utility-Funktionen
└── lib/               # Bibliotheks-Konfiguration
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

## 📝 Lizenz

Privates Projekt

---

*Entwickelt für medizinisches Personal zur Erstellung standardisierter Behandlungsleitfäden.*
