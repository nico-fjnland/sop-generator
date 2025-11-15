# SOP Editor

Ein webbasierter PDF-Editor zur Erstellung von Standard Operating Procedures (SOPs) mit einem Notion-ähnlichen Inline-Editor.

## Features

- **Inline-Editor**: Tippe "/" um vorgefertigte Komponenten hinzuzufügen
- **Vorgefertigte Komponenten**:
  - Titel
  - Überschriften
  - Textblöcke
  - Tabellen
  - Listen
  - Bilder
  - Trennlinien
- **PDF-Export**: Erstelle SOPs im A4-Format und lade sie als PDF herunter
- **Responsive Design**: Moderne, benutzerfreundliche Oberfläche

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm start
```

Die Anwendung läuft auf [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
```

## Verwendung

1. Starte die Anwendung
2. Gib einen Titel für deine SOP ein
3. Tippe "/" um Komponenten hinzuzufügen
4. Verwende die Pfeiltasten zum Navigieren im Komponentenmenü
5. Drücke Enter um eine Komponente auszuwählen
6. Klicke auf "PDF herunterladen" um deine SOP als PDF zu exportieren

## Technologie

- React 18
- Tailwind CSS
- react-to-print für PDF-Generierung

