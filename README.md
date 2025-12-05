# SOP Editor (ALPHA)

Der SOP Editor/Generator ist ein webbasierter Block-Editor zur Erstellung von Standard Operating Procedures (SOPs) für den medizinischen Bereich. Er folgt dem etablierten System von SOP Notaufnahme, dessen Leitfäden sich an alle in der Akutmedizin tätigen Fachkräfte richten.

> [Changelog](./CHANGELOG.md) · [Vollständige Dokumentation](./PROJECT_DOCUMENTATION.md)

---

## 📋 Hintergrund

Wer in einer Notaufnahme arbeitet, kennt das: In kritischen Momenten braucht man schnellen Zugriff auf verlässliche Handlungsanweisungen. Doch hochwertige medizinische Leitfäden sind im Netz schwer zu finden – oft versteckt hinter Paywalls, unübersichtlich formatiert oder veraltet.

Als in der Notaufnahme tätige Ärztinnen und Ärzte haben wir das selbst erlebt. Deshalb haben wir [sop-notaufnahme.de](https://sop-notaufnahme.de) ins Leben gerufen: eine Plattform mit frei zugänglichen, sorgfältig recherchierten Leitfäden für die Akutmedizin.

## 📦 Dieses Repository

Der SOP Editor ist das Werkzeug, mit dem diese Leitfäden (zukünftig) entstehen – und mehr. Unsere Vision ist es, medizinischen Einrichtungen unsere SOPs über ein lizenzgestütztes Modell zur Verfügung stellen zu können. Teilnehmende Kliniken können damit künftig:

- **eigene SOPs zu erstellen** – im einheitlichen Format der Plattform
- **bestehende Leitfäden anzupassen** – auf hausspezifische Abläufe, Medikamente oder Protokolle
- **standardisierte Dokumentation im Team zu etablieren**

---

## ✨ Features

### Grundfunktionen

- **Block-basierter Editor** mit Notion-ähnlichem "/" Slash-Kommando-System
- **12 medizinische Content-Box Kategorien:** Definition, Ursachen, Symptome, Diagnostik, Therapie, Algorithmus, Merke, Disposition, Abläufe, Differenzial, Studie, Sonstiges
- **Drag & Drop** zum Verschieben und Anordnen von Blöcken
- **Mehrspalten-Layout** (1/2/3 Spalten) mit anpassbarem Spaltenverhältnis

### Spezialkomponenten

- **Flowchart-Editor** für Algorithmen und Entscheidungsbäume (ReactFlow)
- **Rich-Text Tabellen** mit Zellen-Merge und Hintergrundfarben (TipTap)
- **A4-Seitenumbruch-Vorschau** mit automatischer Paginierung

### Export & Speicherung

- **Multi-Format Export:** PDF, Word (DOCX), JSON
- **Cloud-Speicherung** via Supabase
- **Organisations-Verwaltung** für Teams und Krankenhäuser

---

## 🚀 Quick Start

### Voraussetzungen

- Node.js 18+
- npm oder yarn
- Supabase-Projekt (für Backend-Funktionen)

### Installation

```bash
git clone https://github.com/[username]/sop-editor.git
cd sop-editor
npm install
```

### Umgebungsvariablen

Erstelle eine `.env` Datei im Projektroot:

```env
# Supabase (erforderlich)
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...

# GitHub Releases (optional)
GITHUB_TOKEN=ghp_xxx
```

### Entwicklung

```bash
npm start
```

### Production Build

```bash
npm run build
```

---

## 🛠 Technologie-Stack

| Kategorie | Technologien |
|-----------|--------------|
| **Frontend** | React 18, TailwindCSS, React Router 7 |
| **Editor** | TipTap 3, ReactFlow 11 |
| **UI** | Radix UI, Phosphor Icons, shadcn/ui |
| **Backend** | Supabase (Auth, Database, Storage) |
| **Export** | jsPDF, docx, html-to-image |
| **DnD** | @dnd-kit |

---

## 📁 Projektstruktur

```
src/
├── components/        # React-Komponenten
│   ├── blocks/        # Block-Typen (ContentBox, Table, Flowchart, etc.)
│   ├── dnd/           # Drag & Drop Komponenten
│   ├── ui/            # Basis UI-Komponenten (shadcn/ui)
│   └── extensions/    # TipTap-Erweiterungen
├── contexts/          # React Contexts (Auth, Theme, Zoom)
├── hooks/             # Custom Hooks (History, PageBreaks)
├── pages/             # Seiten-Komponenten
├── services/          # API-Services
└── utils/             # Utility-Funktionen (Export)
```

---

## 🌐 Browser-Support

| Browser | Status |
|---------|--------|
| Chrome 65+ | ✅ |
| Firefox 60+ | ✅ |
| Safari 10.1+ | ✅ |
| Edge 79+ | ✅ |
| Internet Explorer | ❌ |

---

## 📖 Dokumentation

- [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md) – Vollständige technische Dokumentation
- [`CHANGELOG.md`](./CHANGELOG.md) – Versions-Historie
- [`AGENTS.md`](./AGENTS.md) – Regeln für KI-Agenten

## 🔗 Links

- [sop-notaufnahme.de](https://sop-notaufnahme.de) – Frei zugängliche Leitfäden
- [GitHub Releases](https://github.com/nico-fjnland/sop-generator/releases)

## 📝 Lizenz

Privates Projekt

---

*Von Mediziner:innen entwickelt – für bessere Leitfäden in der Notaufnahme.*
