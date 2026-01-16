# Changelog

Alle wesentlichen Änderungen am SOP Editor werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [0.9.19] - 2026-01-16

### 🐛 Bugfixes

- **Flowchart: Abgeschnittene Ränder am unteren und rechten Rand behoben:**
  - Bei manchen Bildschirmkonfigurationen (z.B. Windows mit bestimmten Auflösungen) erschienen die Ränder der Algorithmus-Box am unteren und rechten Rand dünner oder abgeschnitten
  - Ursache: Der Flowchart-Container füllte den gesamten Platz aus und überlagerte die ContentBox-Border
  - Fix in `FlowchartBlock.css`:
    - `width: calc(100% - 2px)` verhindert Überlappung am rechten Rand
    - `margin-bottom: 2px` verhindert Überlappung am unteren Rand
    - `box-sizing: border-box` für konsistente Größenberechnung

- **Flowchart-Editor: Abgeschnittene Minimap-Ränder behoben:**
  - Die Minimap im Flowchart-Editor hatte ebenfalls ungleichmäßige Ränder
  - Ursache: Asymmetrische Margin-Einstellungen auf der SVG (`margin: 3px` aber `margin-left: 0`)
  - Fix in `FlowchartEditorModal.css`:
    - Margin von SVG auf Padding am Parent-Container verschoben
    - Konsistentes Spacing: `padding: 3px` (außer links wegen Icon-Überlappung)
    - `box-sizing: content-box` für korrekte Minimap-Größe

---

## [0.9.18] - 2026-01-16

### ✨ Features

- **Per-Page Footer-Varianten:**
  - Jede Seite kann nun eine eigene Footer-Variante haben (Tiny, Small, Signature, Placeholder)
  - Footer-Button ändert nur den Footer der jeweiligen Seite, nicht aller Seiten
  - Ermöglicht optimale Platznutzung: z.B. Signature-Footer auf Seite 1, Tiny-Footer auf Seite 2
  - State-Struktur geändert von `footerVariant` (einzelner Wert) zu `footerVariants` (pro Seite)
  - Abwärtskompatibilität: Alte Dokumente mit `footerVariant` werden automatisch migriert

- **Intelligente Seitenumbruch-Berechnung mit per-page Footer-Höhen:**
  - `usePageBreaks.js`: Berechnet verfügbare Höhe pro Seite basierend auf individueller Footer-Variante
  - Vordefinierte Footer-Höhen in `layout.js` für zuverlässige Berechnungen:
    - Tiny: 82px → 955px verfügbarer Platz auf Folgeseiten
    - Small: 188px → 849px verfügbarer Platz
    - Signature: 207px → 830px verfügbarer Platz
    - Placeholder: 152px → 885px verfügbarer Platz
  - Behebt Problem, bei dem Inhalte auf eine zusätzliche Seite verschoben wurden, obwohl mit kleinerem Footer genug Platz gewesen wäre

- **Signature-Footer-Felder persistieren Daten:**
  - Texte in den Signaturfeldern (Erstellt, Modifiziert, Freigegeben, Gültig ab) werden jetzt gespeichert
  - Per-page Struktur: Jede Seite kann eigene Signaturdaten haben
  - State-Erweiterung: `signatureData: { 1: { created: '...', ... }, 2: { ... } }`
  - Daten werden beim Neuladen wiederhergestellt

### 🐛 Bugfixes

- **Signature-Footer Unterstriche im Export korrigiert:**
  - Unterstriche sind jetzt separate div-Elemente statt Input-Borders
  - Konsistente Darstellung in Editor und Export
  - Behebt Problem mit doppelten oder fehlenden Unterstrichen
  - `htmlSerializer.js`: Angepasste Ersetzungslogik für Signature-Felder

- **Text-Overflow mit Ellipsis in Signature-Feldern:**
  - Lange Texte werden im Editor mit `...` abgekürzt (wie im Export)
  - Verhindert horizontales Überlaufen der Textfelder

- **Flowchart: Aktion-Nodes wurden nicht korrekt gerendert:**
  - "Aktion"-Nodes zeigten rohen HTML-Code (`<p class="flowchart-tiptap-paragraph">Aktion</p>`) statt nur den Text
  - Ursache: `StaticAktionNode`-Komponente fehlte im `nodeTypes`-Mapping in `FlowchartPreview.js`
  - Fix: Neue `StaticAktionNode`-Komponente hinzugefügt und im Preview registriert

- **Flowchart: Langer Text lief über Box-Grenzen hinaus:**
  - Text ohne Leerzeichen (z.B. lange Zeichenketten) brach nicht um und überschritt die Node-Grenzen
  - Fix: `max-width: 300px` für `.flowchart-node` und `word-break: break-word` für Text-Container
  - Betrifft sowohl Preview als auch Print-Export

- **Flowchart: Connector-Lines konnten nicht erstellt werden:**
  - Verbindungslinien zwischen Nodes funktionierten nicht mehr nach vorherigen Änderungen am Klick-Verhalten
  - Ursache: Source-Handles hatten `pointerEvents: 'none'`, was das Starten von Verbindungen blockierte
  - Fix: Source-Handles verwenden jetzt `opacity: 0` statt `visibility: hidden` + `pointerEvents: 'none'`
  - Handles bleiben unsichtbar aber interaktiv für Drag-Verbindungen

- **Flowchart: Änderungen gingen bei Seitenneuladen verloren (Cloud-Dokumente):**
  - Bei Cloud-Dokumenten wurde localStorage komplett deaktiviert (`skipLocalStorage: true`)
  - Änderungen im Flowchart-Editor wurden nicht zwischengespeichert und gingen bei Verbindungsabbruch verloren
  - Fix: Neues Draft-System für Cloud-Dokumente implementiert:
    - Dokumentspezifischer Draft-Key (`sop-draft-{documentId}`) mit Zeitstempel
    - Beim Laden wird geprüft, ob ein neuerer lokaler Draft existiert
    - Nach erfolgreichem Cloud-Speichern wird der Draft automatisch gelöscht
  - `useEditorHistory.js`: Neue Funktionen `loadDraft()`, `clearDraft()`, `getDraftKey()`
  - `Editor.js`: Draft-Logik beim Laden und Speichern integriert

---

## [0.9.17] - 2026-01-15

### 🔒 Security

- **Verschärfte Passwort-Policy (BSI-konform):**
  - Neue Mindestanforderungen: 12 Zeichen, Groß-/Kleinbuchstaben, Zahl, Sonderzeichen
  - Passwort-Stärke-Indikator mit Echtzeit-Feedback bei Registrierung und Passwort-Änderung
  - Visuelle Checkliste zeigt erfüllte/fehlende Anforderungen
  - Farbcodierte Stärkeanzeige (rot → grün) mit Fortschrittsbalken
  - Bonus-Punkte für Passwörter länger als 12 Zeichen
  - Neue Utility: `src/utils/passwordPolicy.js`
  - Neue Komponente: `src/components/auth/PasswordStrengthIndicator.jsx`

- **Account → Sicherheit überarbeitet:**
  - Neuer Beschreibungstext für Passwort-Ändern mit BSI-Hinweis
  - Anforderungs-Checkliste in linker Spalte, Passwortstärke-Skala neben Button
  - Passwortfelder untereinander angeordnet
  - Validierung verwendet BSI-konforme Policy

- **Login-Historie verbessert:**
  - Pagination mit max. 5 Einträgen pro Seite (statt Scroll)
  - Zeigt jetzt die letzten 20 Sessions (statt 10)
  - Feste Tabellenhöhe (312px) für konsistentes Layout
  - Neuer Beschreibungstext mit Sicherheitshinweisen
  - "Support kontaktieren" Button öffnet HelpScout Beacon

### ✨ Features

- **Session-Timeout-Meldung auf Login-Seite:**
  - Bei automatischer Abmeldung durch Inaktivität wird der Nutzer auf die Login-Seite weitergeleitet
  - Prominente Sicherheitshinweis-Box erklärt den Grund für die Abmeldung
  - Meldung verschwindet nach Seitenaktualisierung (URL-Parameter wird bereinigt)
  - Verbessert die User Experience bei Session-Timeouts

### 🐛 Bugfixes

- **Box-Leveling in zweispaltigen Layouts im Export korrigiert:**
  - `htmlSerializer.js`: Verwendet jetzt exakt die gleiche Logik wie der Editor
  - Zweispaltige Row ist 100% breit (wie Editor), Icons verwenden negative Margins (`-14px`)
  - Einspaltige Boxen haben `margin-right: 14px` (wie Editor)
  - Höhen werden im Serializer neu berechnet (wie `useHeightEqualization` Hook im Editor)
  - Robustere Regex-Prüfung (`/flex:\s*[0-9]/`) für `flex` Shorthand-Erkennung
  - Behebt Problem, bei dem Boxen im Export unterschiedliche Höhen/Breiten hatten

- **Höhenanpassung reagiert jetzt auf Browser-Zoom:**
  - `useHeightEqualization.js`: Hook erkennt jetzt Zoom-Änderungen via `devicePixelRatio`
  - Bei Browser-Zoom werden die Box-Höhen automatisch neu berechnet
  - Behebt Problem, bei dem Boxen nach Zoom-Änderung zu hoch angezeigt wurden

- **Custom-Logo im Export jetzt rechtsbündig (wie im Editor):**
  - `SOPHeader.js`: Print-Container verwendet jetzt `print:flex` statt `print:block` mit expliziter `justify-content: flex-end` Ausrichtung
  - `htmlSerializer.js`: Neue CSS-Regel `.sop-header-logo-print` für konsistente Rechtsbündigkeit im PDF/Word-Export
  - Logo-Ausrichtung in Editor und Export ist jetzt identisch

---

## [0.9.16] - 2026-01-15

### ✨ Features

- **Account-Dropdown um rechtliche Links erweitert:**
  - Neue Menüpunkte: Impressum, Datenschutz, Geschäftsbedingungen, Nutzungsbedingungen, Compliance
  - Links öffnen die entsprechenden Seiten auf sop-notaufnahme.de/legal/ in neuem Tab
  - Externe Links mit ArrowUpRight-Icon am rechten Rand gekennzeichnet
  - Neue Phosphor-Icons für jeden Menüpunkt mit externer Verlinkung

- **Column Resizer in zweispaltigen Layouts vertikal zentriert:**
  - Resizer wird jetzt mittig statt am oberen Rand positioniert

- **Footer-Platzhalter-Text aktualisiert:**
  - Text geändert zu: "Platzhalter für Dokumentenlenksysteme (Diese Box wird im Export nicht angezeigt, sondern erscheint als Weißraum)."

- **Bulk-Export-Dialog zeigt geschätzte Verarbeitungszeit:**
  - Während des Exports: Anzeige der geschätzten Verarbeitungszeit unten links
  - Nach Abschluss: "Export abgeschlossen. ZIP-Datei an Browser übergeben."

### 🐛 Bugfixes

- **CORS-Whitelist für Export-Edge-Function erweitert:**
  - `export-document/index.ts`: Domain `https://sop-editor.vercel.app` zur CORS-Whitelist hinzugefügt
  - Behebt "Export-Server ist nicht erreichbar" Fehler beim Bulk-Export von dieser Domain
  - Edge Function wurde neu deployed (Version 49)

---

## [0.9.15] - 2026-01-14

### 🔒 Security

- **CSP (Content Security Policy) erweitert für HelpScout Beacon und Jam.dev:**
  - `style-src`: `https://fonts.googleapis.com` hinzugefügt (für dynamische Beacon-Styles)
  - `font-src`: `https://fonts.gstatic.com` hinzugefügt (für Beacon-Fonts)
  - `script-src`: `https://*.jam.dev` und `https://*.helpscout.net` hinzugefügt
  - `img-src`: `https://*.jam.dev` hinzugefügt
  - `connect-src`: `https://monitoring.jam.dev` explizit hinzugefügt
  - Behebt "Failed to initialize Beacon" und "Unable to Load Beacon" Fehler

### 🐛 Bugfixes

- **Animierter Hintergrund-Gradient wiederhergestellt:**
  - `AnimatedBackgroundGradient.jsx`: `speed`-Wert von 120s auf 60s reduziert (120s war praktisch unsichtbar)
  - `_keyframe-animations.scss`: Keyframes `background-gradient` als CSS-Fallback hinzugefügt
  - `animated-gradient-with-svg.jsx`: CSS-Variablen als Strings formatiert für korrektes `calc()`
  - Subtile Hintergrund-Animation funktioniert wieder im Tag- und Nachtmodus

- **Grain-Overlay feiner und subtiler eingestellt:**
  - `App.css`: `baseFrequency` von 2.5 auf 4 erhöht für feinere Körnung
  - `App.css`: `opacity` von 0.15 auf 0.1 reduziert für subtileren Effekt

---

## [0.9.14] - 2026-01-14

### 🔒 Security

- **CSP (Content Security Policy) erweitert:**
  - Jam Recorder zu `frame-src` hinzugefügt (`https://recorder.jam.dev`, `https://*.jam.dev`)
  - HelpScout CloudFront CDN zu `connect-src` hinzugefügt (`https://*.cloudfront.net`)
  - Behebt CSP-Fehler in der Browser-Konsole

- **Google Fonts aus PDF-Export entfernt (DSGVO-Compliance):**
  - `htmlSerializer.js`: Fonts werden jetzt als Base64 aus lokalen Dateien eingebettet
  - Webpack-Imports statt `new URL()` für korrekte Pfadauflösung in Produktion
  - Keine externen Anfragen mehr an Google-Server beim PDF/Word-Export
  - `standalone.html`: System-Font-Stack statt Google Fonts

- **Self-Hosted Fonts (DSGVO-Compliance):**
  - Google Fonts durch selbst gehostete Fonts ersetzt
  - Inter, Roboto und Quicksand werden jetzt lokal aus `/src/fonts/` geladen
  - Keine externen Anfragen mehr an Google-Server beim Seitenaufruf
  - Verhindert IP-Übertragung an Google (relevant nach EuGH-Urteil 2022)
  - Variable Fonts für optimale Dateigröße (~375KB gesamt)

- **Hardcodierte Credentials entfernt:**
  - Supabase URL und Anon Key werden jetzt ausschließlich aus Environment-Variablen geladen
  - Fehler wird geworfen wenn Konfiguration fehlt (statt Fallback auf hardcodierte Werte)
  - Verhindert versehentliches Leaken von Credentials im Quellcode

- **Console.log Statements für Produktion bereinigt:**
  - Neuer Logger-Utility (`src/utils/logger.js`) für umgebungsabhängige Ausgaben
  - In Produktion werden `log`, `debug`, `info` unterdrückt
  - `warn` und `error` bleiben für Debugging aktiv
  - 15+ Dateien auf Logger-Utility umgestellt

- **Session-Timeout nach 30 Minuten Inaktivität:**
  - Automatischer Logout bei Inaktivität (Sicherheit bei verlassenen Arbeitsplätzen)
  - Warnung 2 Minuten vor Timeout mit Countdown
  - Benutzer kann Sitzung verlängern oder sich sofort abmelden
  - Aktivitätserkennung: Mausklicks, Tastatureingaben, Scrollen, Touch
  - Neuer Hook: `useSessionTimeout.js`
  - Neue Komponente: `SessionTimeoutWarning.js`

- **Persistente Login-Historie im Account-Bereich:**
  - Zeigt die letzten 10 Anmeldungen mit Datum, Zeit, Browser und IP-Adresse
  - Persistente `login_history` Tabelle speichert alle Login-Events dauerhaft
  - Einträge bleiben auch nach Logout/Session-Timeout erhalten
  - Automatischer Trigger kopiert neue Sessions in die Historie
  - Aktuelle Sitzung wird hervorgehoben
  - User-Agent-Parsing für lesbare Browser/OS-Namen
  - Optionale Bereinigung alter Einträge nach 90 Tagen
  - Neue Komponente: `LoginHistory.jsx`
  - Neue SQL-Dateien: `supabase_login_history.sql`, `supabase_login_history_persistent.sql`

- **Security Headers für Vercel:**
  - Neue `vercel.json` mit umfassenden Sicherheits-Headern
  - **HSTS**: Erzwingt HTTPS-Verbindung (1 Jahr Gültigkeit)
  - **X-Content-Type-Options**: Verhindert MIME-Type-Sniffing
  - **X-Frame-Options**: Blockiert Einbettung in fremde Frames (Clickjacking-Schutz)
  - **X-XSS-Protection**: Aktiviert Browser-XSS-Filter
  - **Referrer-Policy**: Kontrolliert Referrer-Informationen
  - **Permissions-Policy**: Deaktiviert Kamera, Mikrofon, Geolocation
  - **Content-Security-Policy**: Whitelist für Scripts, Styles, Fonts, Images, Connections

- **CORS-Einschränkung in Edge Function:**
  - PDF/Word-Export nur noch von erlaubten Domains aufrufbar
  - Whitelist: `sop-generator.vercel.app`, `editor.sop-notaufnahme.de`, `localhost`
  - Anfragen von anderen Origins werden mit HTTP 403 abgelehnt
  - Verhindert Missbrauch des Export-Dienstes durch fremde Webseiten

### ✨ Added

- **Logger-Utility** (`src/utils/logger.js`):
  - `logger.log()`, `logger.debug()`, `logger.info()` - nur in Development
  - `logger.warn()`, `logger.error()` - immer aktiv
  - Einfacher Drop-in Ersatz für console.log

- **Session-Timeout Hook** (`src/hooks/useSessionTimeout.js`):
  - Konfigurierbare Timeout-Dauer (Standard: 30 Minuten)
  - Warning-Phase mit Countdown
  - Activity-Throttling für Performance

- **Session-Timeout Warnung** (`src/components/SessionTimeoutWarning.js`):
  - AlertDialog mit Countdown-Timer
  - Buttons für "Sitzung verlängern" und "Jetzt abmelden"

---

## [0.9.13] - 2026-01-14

### ✨ Added

- **Bulk PDF/Word Export aus "Meine Leitfäden":**
  - Mehrere Dokumente können jetzt direkt als PDF oder Word exportiert werden
  - Automatisches HTML-Caching beim Speichern im Editor ermöglicht schnellen Bulk-Export
  - Parallele Verarbeitung (max. 10 gleichzeitig) für optimale Performance
  - Fortschrittsanzeige während des Exports
  - Export als ZIP-Datei bei mehreren Dokumenten
  - Neue Format-Auswahl im Export-Dialog: PDF, Word oder JSON

- **HTML-Cache-System für Export:**
  - Neuer Storage-Bucket `document-html` für gecachte HTML-Dateien
  - Neue Datenbank-Spalte `html_cached_at` zur Verfolgung des Cache-Status
  - Automatische Cache-Invalidierung bei Dokumentänderungen
  - Cache wird beim Löschen von Dokumenten automatisch entfernt

### 🔧 Changed

- **BulkExportDialog komplett überarbeitet:**
  - Drei Export-Formate: PDF, Word, JSON
  - Zeigt geschätzte Exportzeit basierend auf Dokumentanzahl mit "Verarbeitungszeit:"-Label
  - Warnung bei Dokumenten ohne gültigen HTML-Cache
  - Verbesserte Fortschrittsanzeige mit vollständiger Dokumentenliste in Originalreihenfolge
  - Live-Status-Updates: Dokumentstatus wird in Echtzeit aktualisiert
  - Jedes Dokument zeigt Status mit Icon: Wartend (Hourglass), In Verarbeitung (Spinner), Fertig (CheckCircle)
  - Fortschrittsanzeige bleibt nach Export sichtbar (100% Progressbar)
  - "Abbrechen"-Button während des Exports zum Abbruch des Vorgangs
  - "Fertig"-Button nach Abschluss zum Schließen des Modals

- **documentService.js erweitert:**
  - `saveDocumentHtml()` - Speichert HTML-Cache in Supabase Storage
  - `getDocumentHtml()` - Lädt gecachtes HTML für Export
  - `checkHtmlCacheStatus()` - Prüft welche Dokumente exportierbar sind
  - `getDocuments()` enthält jetzt `html_cached_at` Feld

- **exportService.js erweitert:**
  - `bulkExportFromCache()` - Bulk-Export mit paralleler Verarbeitung
  - `createExportZip()` - Erstellt ZIP-Datei aus mehreren Exports

### 📋 Setup erforderlich

Nach dem Update muss das SQL-Script `supabase_bulk_export_setup.sql` ausgeführt werden:
- Erstellt Storage-Bucket `document-html`
- Fügt `html_cached_at` Spalte zur `documents` Tabelle hinzu
- Erstellt RLS-Policies für den HTML-Cache

**Hinweis:** Bestehende Dokumente müssen einmal im Editor geöffnet und gespeichert werden, um den HTML-Cache zu erstellen.

---

## [0.9.11] - 2026-01-13

### ✨ Added

- **Placeholder Footer-Variante:** Neuer Footer-Typ für Platzhalter-Bereich
  - Hellblauer Hintergrund (#E5F2FF) mit gestricheltem Rand (#3399FF)
  - Zentrierter Text "Platzhalter für XYZ Prozess"
  - Nur im Editor sichtbar - im PDF/Word-Export als Weißraum (Platzhalter)
  - Gleiche Höhe wie Signature-Footer

### 🐛 Fixed

- **Flowchart - Abgerundete Connector-Ecken im Export:**
  - Connector-Lines haben jetzt auch im PDF/Word-Export abgerundete Ecken
  - Neue zentrale Konstante `EDITOR_STYLES.flowchart.edgeBorderRadius` für konsistente Styles
  - Editor, Preview und SVG-Export verwenden jetzt dieselbe Konstante (8px Radius)
  - SVG-Pfade nutzen quadratische Bézier-Kurven für sanfte Eckenübergänge

---

## [0.9.10] - 2026-01-13

### ✨ Improved

- **Flowchart - Visueller Abstand bei Pfeilen:**
  - Pfeile (Edges) haben jetzt einen 2px Abstand zu den Nodes
  - Gilt für Editor, Preview und SVG-Export
  - Verbesserte visuelle Trennung zwischen Verbindungen und Nodes

- **Flowchart - Node-Dragging verbessert:**
  - Nodes können jetzt überall angefasst und verschoben werden (nicht nur am Rand)
  - `nodrag` wird nur noch im Bearbeitungsmodus (Doppelklick) aktiviert
  - Einfacheres und intuitiveres Verschieben von Nodes

- **Flowchart - Bearbeitungsmodus-Rand angepasst:**
  - Beim Doppelklick verwendet der Rand jetzt die jeweilige Node-Farbe statt der Primärfarbe
  - Neutral = gelber Rand, Start = türkis, Phase = dunkelblau, etc.
  - Konsistentere visuelle Darstellung im Bearbeitungsmodus

- **Flowchart - Edge-Label Schriftgröße angepasst:**
  - Labels auf Connector-Lines verwenden jetzt 9px (Small Text) statt 11px
  - Neue Konstante `EDITOR_STYLES.smallText` in `editorStyles.js` hinzugefügt
  - Schatten von Edge-Label Containern entfernt
  - Gilt für Editor, Preview und SVG-Export

### 🐛 Fixed

- **Flowchart - Doppelte Connector-Dots behoben:**
  - Source-Handles sind jetzt permanent unsichtbar
  - Nur Target-Handles werden beim Hover angezeigt
  - Behebt den Bug, dass beim Hover zwei Dots übereinander erschienen

- **Flowchart - Connector-Dot Hover-Animation entfernt:**
  - Handle vergrößert sich nicht mehr beim Hover (`scale(1.2)` entfernt)
  - Stabilere visuelle Darstellung der Verbindungspunkte

- **PDF-Export - Konsistente Text-Styles:**
  - Zentrale Style-Konstanten in `src/styles/editorStyles.js` eingeführt
  - Export-CSS wird jetzt aus denselben Konstanten generiert wie der Editor
  - Behebt unterschiedliche Zeilenumbrüche zwischen Editor und PDF
  - `line-height` für Headings jetzt korrekt 1.8 (war 1.5)
  - Listen `padding-left` jetzt korrekt 12px (war 16px)
  - Highlight-Item `padding-left` jetzt korrekt 20px (war 24px)

- **Word-Export - Zuverlässigere Seitenextraktion:**
  - DOM-Parser (`deno_dom`) statt Regex für `.a4-page`-Extraktion
  - Behebt Problem mit fehlenden Seiten (insbesondere letzte Seite)
  - Fallback auf Regex-Methode falls DOM-Parser fehlschlägt
  - Verbessertes Logging für Debugging

- **Word-Export - Höhere Auflösung:**
  - Screenshots werden jetzt mit 2x Scale-Faktor generiert (~150 DPI)
  - Bilder im Word-Dokument sind schärfer beim Drucken
  - Viewport bleibt A4-Größe, Ausgabe ist 2x größer (1588×2246 px)

- **Export - Längere Wartezeit:**
  - `waitDelay` von 2s auf 3s erhöht
  - Verbessert Stabilität bei komplexen Flowcharts

### 🏗️ Architecture

- **Single Source of Truth für Styles:**
  - Neue Datei `src/styles/editorStyles.js` mit allen Text-Style-Konstanten
  - `EDITOR_STYLES` Objekt enthält alle relevanten Werte
  - `generateExportCSS()` Funktion generiert CSS für den Export
  - Zukünftige Style-Änderungen müssen nur noch an einer Stelle erfolgen

### 🔧 Technical

- `src/styles/editorStyles.js`: Neue Datei mit zentralen Style-Konstanten
- `src/utils/htmlSerializer.js`: Importiert und verwendet `generateExportCSS()`
- `supabase/functions/export-document/index.ts`:
  - DOM-Parser Import (`deno_dom@0.1.38`)
  - Neue Funktion `generateSingleScreenshotHighRes()` mit `scale` Parameter
  - `extractA4Pages()` mit DOM-Parser und Regex-Fallback
  - Logging für Debugging hinzugefügt

---

## [0.9.8] - 2026-01-13

### 🔧 Fixed

- **Flowchart Zentrierung - Robuste Lösung:**
  - Flowcharts werden jetzt IMMER zentriert, unabhängig von gespeicherten Viewport-Werten
  - Zentrierung funktioniert zuverlässig bei Browser-Zoom, Neuladen, JSON-Upload und Cloud-Laden
  - Viewport-Persistenz komplett entfernt (war fehleranfällig und im read-only Preview unnötig)
  - Flowchart wird automatisch neu zentriert bei Dokumentwechsel (JSON-Upload, Supabase)

### 🗑️ Removed

- **Viewport-Persistenz entfernt:**
  - `savedViewport` und `onViewportChange` Props aus FlowchartPreview
  - `viewport` wird nicht mehr im Content-Objekt gespeichert

### ✨ Changed

- **Einheitliches 4-Pixel-Raster im Flowchart-Editor:**
  - Dot-Grid von 14×14px auf **8×8px** geändert (feineres visuelles Raster)
  - Snap-Grid von 14×14px auf **4×4px** geändert (präzisere Node-Positionierung)
  - Alignment-Snap-Distanz von 5px auf **4px** angepasst
  - Abstands-Indikatoren zeigen jetzt **4er-Einheiten** statt 14er-Einheiten
  - Node-Höhen sind jetzt ein Vielfaches von 4 (min-height: 24px)
  - Line-height von 1.5 auf 1.45 angepasst für exaktes 4er-Raster

### 🔧 Technical

- `FlowchartPreview.js`: Vereinfachter useEffect, der IMMER zentriert wenn initialisiert
- `FlowchartPreview.js`: `lastViewportRef` wird bei Node-Änderungen zurückgesetzt
- `FlowchartPreview.js`: Background gap auf 8px geändert
- `FlowchartBlock.js`: `savedViewport` State und `handleViewportChange` entfernt
- `FlowchartBlock.js`: useEffect reagiert jetzt auf `content`-Änderungen (nicht nur Mount)
- `FlowchartBlock.css`: Node-Styling mit min-height 24px, line-height 1.45, padding 4px 8px
- `FlowchartEditorModal.js`: CustomDotBackground gap=8, snapGrid=[4,4], snapDistance=4
- `FlowchartEditorModal.css`: TipTap-Editor line-height auf 1.45
- Loop-Prevention bleibt erhalten durch `lastViewportRef` Vergleich

---

## [0.9.7] - 2026-01-12

### 🔧 Fixed

- **Flowchart Zentrierung im Preview:**
  - Flowcharts werden jetzt korrekt horizontal zentriert in der Content Box angezeigt
  - Das Problem trat auf, weil die Viewport-Initialisierung vor der Node-Messung lief
  - Lösung: `hasInitialized` Ref durch `isInitialized` State ersetzt, damit der useEffect reaktiv neu ausgeführt wird

- **Flowchart Re-Render Loop verhindert:**
  - Verhindert "Maximum update depth exceeded" Fehler durch mehrfache Viewport-Updates
  - Stabile `measuredNodesKey` verhindert unnötige Neuberechnungen
  - Viewport-Änderungen werden nur gespeichert, wenn tatsächlich unterschiedlich (Toleranz-basierter Vergleich)

- **React SVG Attribut-Warnung behoben:**
  - `fill-rule` → `fillRule` und `clip-rule` → `clipRule` in SOPHeader SVG

### 🔧 Technical

- `FlowchartPreview.js`: Refactoring der Initialisierungslogik mit reaktivem State statt Ref
- `FlowchartPreview.js`: `measuredNodesKey` für stabile Node-Referenzen basierend auf ID und Position
- `FlowchartPreview.js`: Loop-Prevention durch `lastViewportRef` und `lastMeasuredNodesKeyRef`

---

## [0.9.6] - 2026-01-09

### 🔧 Fixed

- **Flowchart Viewport-Persistenz:**
  - Viewport-Position (x, y, zoom) wird jetzt beim Speichern persistiert
  - Beim Neuladen der Seite wird die gespeicherte Position wiederhergestellt
  - Verhindert, dass Flowcharts nach dem Neuladen aus der vorgesehenen Box "springen"
  - Viewport wird automatisch aktualisiert, wenn sich die Position ändert

- **Word Export: Letzte Seite fehlte:**
  - Word-Export erfasst jetzt alle Seiten korrekt, einschließlich der letzten Seite mit Flowchart
  - Das Problem trat auf, weil die Regex für die Seitenerkennung verschachtelte divs nicht korrekt verarbeitete
  - Neue `extractA4Pages` Funktion verwendet Tag-Zähler statt fehlerhafter Regex
  - PDF-Export war nicht betroffen, da dieser die gesamte HTML direkt konvertiert

### 🔧 Technical

- `FlowchartPreview.js`: Viewport-Position wird in `updateViewport` gespeichert und über `onViewportChange` Callback an Parent weitergegeben
- `FlowchartPreview.js`: `onInit` prüft auf gespeicherte Viewport-Position und stellt sie sofort wieder her, falls vorhanden
- `FlowchartBlock.js`: Viewport wird im Flowchart-Datenobjekt gespeichert (`viewport: { x, y, zoom }`)
- `FlowchartBlock.js`: `handleViewportChange` Callback speichert Viewport-Änderungen automatisch
- `supabase/functions/export-document/index.ts`: Ersetzt fehlerhafte Regex durch `extractA4Pages` Funktion, die Öffnungs- und Schließungstags zählt, um verschachtelte `.a4-page` Elemente korrekt zu extrahieren

---

## [0.9.5] - 2026-01-09

### 🔧 Fixed

- **Flowchart Editor Grid-Verbesserungen:**
  - Grid bewegt sich jetzt korrekt beim Panning mit dem Canvas (wie bei tldraw/Miro)
  - Grid bleibt beim Zoomen mit den Nodes synchronisiert (korrekte Offset-Berechnung mit positivem Modulo)
  - Engmaschiges 14x14px Raster für präzise Node-Ausrichtung

### 🗑️ Removed

- **Client-seitiger PDF/Word Export entfernt:**
  - Der clientseitige Fallback-Export wurde vollständig entfernt
  - PDF und Word Export erfolgen jetzt ausschließlich über den serverseitigen Gotenberg-Service
  - Bei Server-Nichtverfügbarkeit wird eine kontextbezogene Fehlermeldung angezeigt

- **Flowchart Editor: "Alles anzeigen" Button entfernt**

### ✨ Improved

- **Kontextbezogene Export-Fehlermeldungen:**
  - Keine Internetverbindung: "Keine Internetverbindung. Bitte überprüfe deine Verbindung..."
  - Server nicht erreichbar: "Der Export-Server ist nicht erreichbar..."
  - Timeout: "Der Export hat zu lange gedauert..."
  - Authentifizierungsfehler: "Du bist nicht angemeldet oder deine Sitzung ist abgelaufen..."
  - Rate-Limiting: "Zu viele Anfragen. Bitte warte einen Moment..."
  - Dokument zu groß: "Das Dokument ist zu groß für den Export..."
  - Server-Fehler: "Der Export-Server hat einen Fehler gemeldet..."

- **Flowchart-Darstellung in ContentBox optimiert:**
  - Node-Textgröße auf 11px angepasst (entspricht Fließtext in anderen Boxen)
  - Dynamische Höhenanpassung der ContentBox basierend auf Flowchart-Inhalt
  - Flowchart wird nur skaliert, wenn es breiter als die Box ist (Standard: Zoom 1.0)
  - Manueller Resize-Handle entfernt (Höhe passt sich automatisch an)
  - Flowcharts werden nicht mehr an den Rändern abgeschnitten

### 📦 Dependencies Removed

- `docx` - Wurde nur für clientseitigen Word-Export verwendet
- `jspdf` - Wurde nur für clientseitigen PDF-Export verwendet
- `html-to-image` - Wurde nur für clientseitige Screenshot-Erstellung verwendet

### 🔧 Technical

- `FlowchartEditorModal.js`: `CustomDotBackground`-Komponente mit korrekter Viewport-Synchronisation
- `FlowchartEditorModal.js`: Mathematisch korrekte Pattern-Offset-Berechnung für Zoom und Pan
- `exportUtils.js`: Stark vereinfacht, ~1000 Zeilen Code entfernt
- Entfernte Funktionen: `exportAsWordClientSide`, `exportAsPdfClientSide`, `createPrintClone`, `removePrintClone`, `captureWithFallback`, `getHtmlToImageOptions`, `fetchFontCSS`, `waitForFonts`
- `exportService.js`: Neue `ExportError`-Klasse mit Fehlercode und benutzerfreundlicher Meldung
- `exportService.js`: Automatische Erkennung von Netzwerk-, Timeout-, Auth- und Server-Fehlern
- `exportService.js`: 60-Sekunden Timeout für Export-Anfragen
- `Editor.js`: Export-Handler zeigen jetzt die spezifische Fehlermeldung im StatusIndicator an
- `StatusIndicator.js`: Dynamische Höhenberechnung basierend auf Inhalt (kein fester Wert mehr)
- `StatusIndicator.css`: Längere Fehlermeldungen werden zweizeilig dargestellt, Frame-Höhe passt sich automatisch an
- `FlowchartPreview.js`: Neue `calculateFlowchartBounds` und `calculateZoomAndHeight` Funktionen
- `FlowchartPreview.js`: Manuelle Viewport-Steuerung statt automatischem `fitView`
- `FlowchartPreview.js`: Verwendet `useStore` für gemessene Node-Dimensionen
- `FlowchartBlock.js`: `containerWidth` via ResizeObserver gemessen
- `FlowchartBlock.js`: Dynamische Höhe über `onHeightChange` Callback
- `FlowchartBlock.css` + `FlowchartEditorModal.css`: Node font-size von 12px auf 11px geändert

### 🎨 Flowchart Editor

- **Doppelklick-zum-Editieren für Nodes:**
  - Einfacher Klick auf Node: Node wird ausgewählt (zum Verschieben, Verbinden, Löschen)
  - Doppelklick auf Node: Text-Editiermodus wird aktiviert
  - Escape-Taste oder Klick außerhalb der Node: Editiermodus beenden
  - Visuelles Feedback: Accent-farbiger Rahmen und subtiler Schatten im Editiermodus
  - Standard UX-Pattern wie in Figma, Miro und draw.io

---

## [0.9.4] - 2025-12-22

### ✨ Changed

- **Tabellen-Zellen Padding:**
  - Vertikales Padding von `0.375rem` (≈6px) auf `4px` reduziert
  - Kompaktere Darstellung der Tabellenzellen
  - Gilt für Editor, Print und Export

- **SOP Header Logo-Ausrichtung:**
  - Logo bleibt bei mehrzeiligen Überschriften am oberen Rand der Spalte ausgerichtet
  - Keine vertikale Zentrierung mehr - Logo bleibt oben fixiert
  - Header-Container verwendet `align-items: flex-start` statt `center`
  - Gilt für Editor, Print und Export

- **Header-Container Alignment:**
  - Header bleibt immer oben ausgerichtet und expandiert nur nach unten
  - Verhindert "Springen" des Headers nach oben bei mehrzeiligen Überschriften
  - Beide Spalten (Titel und Logo) sind oben ausgerichtet

- **Höhenanpassung bei Boxen:**
  - Boxen passen sich wieder ihrer natürlichen Höhe an, wenn sie von zweispaltig zu einspaltig wechseln
  - `minHeight` wird zurückgesetzt, wenn Layout einspaltig wird
  - Verhindert, dass Boxen in angepasster Höhe bleiben

- **Maximale Anzahl Algorithmus-Boxen:**
  - Limit von 1 auf 5 erhöht
  - Es können jetzt bis zu 5 "Diag. Algorithmus"-Boxen pro Dokument erstellt werden

### 🎨 Flowchart Editor

- **Neuer Node-Typ "Aktion":**
  - Gleiche Form wie "Phase" (Rechteck mit abgerundeten Ecken)
  - Weißer Hintergrund statt hellblau
  - Dunkelblauer Rahmen (#003366)

- **Neue Icons für Phase und Aktion:**
  - "Phase" zeigt jetzt ein Rechteck mit "P"
  - "Aktion" zeigt ein Rechteck mit "A"
  - Bessere visuelle Unterscheidung in der Toolbar

- **Verbesserte Node-Positionierung:**
  - Neue Nodes erscheinen in der Mitte des Viewports
  - Spiral-Suche für freie Position bei Kollision
  - Keine Überlappungen mehr beim Hinzufügen neuer Nodes

- **Flowchart zurücksetzen:**
  - Neuer Button (Mülleimer-Icon) in der Toolbar
  - Setzt das Flowchart auf den Ausgangszustand zurück (nur Start-Node)
  - Button ist deaktiviert, wenn keine Änderungen vorhanden sind
  - Selektives Löschen-Button entfernt (Radierer erfüllt diese Funktion)

### 🔧 Technical

- `TipTapTableBlock.css`: Padding-Werte angepasst (4px vertikal, responsive 3px)
- `SOPHeader.js`: `alignItems` von `center` auf `flex-start` geändert
- `useHeightEqualization.js`: Reset-Logik für einspaltige Layouts hinzugefügt
- `ContentBoxBlock.js`: `maxUsage` für `algorithmus` von 1 auf 5 erhöht
- `htmlSerializer.js`: Print-Styles für Header-Alignment angepasst
- `exportUtils.js`: Export-Styles für Header-Alignment angepasst
- `FlowchartEditorModal.js`: Neuer Node-Typ `AktionNode`, Collision-Detection, Reset-Funktion
- `FlowchartEditorModal.css`: Letter-Icons für Phase/Aktion Toolbar-Items
- `FlowchartBlock.css`: Styling für `.flowchart-node-aktion`

---

## [0.9.3] - 2025-12-22

### 🐛 Bug Fixes

- **Quellen-Block Ausrichtung:**
  - Quellen-Text ist jetzt auf gleicher Höhe wie Tabellen-Inhalte und Überschriften
  - `margin-left: 16px`, `margin-right: 14px` (wie Tabellen)
  - Inneres Padding: `14px` auf beiden Seiten

- **Flowchart SVG-Export (Print):**
  - Icons für High/Low/Equal Nodes werden jetzt im SVG korrekt gerendert
  - Pfeile (Arrows) als offene Pfeilspitzen (polyline) wie im Editor
  - Minimaler Abstand (1px gap) zwischen Text und Icon in Nodes
  - Korrekte Farbgebung für alle Node-Typen

- **Height Equalization:**
  - Zweispaltige Content-Boxen haben jetzt gleiche Höhe im Print-Export

### 🔧 Technical

- `FlowchartEditorModal.js`: Manueller SVG-Generator mit korrekten Node-Styles und Icons
- `htmlSerializer.js`: Quellen-Block verwendet gleiche Margins wie Tabellen
- `htmlSerializer.js`: Height Equalization mit Inline-Styles für Print

---

## [0.9.2] - 2025-12-22

### 🐛 Bug Fixes

- **Height-Equalization für zweispaltige Layouts:**
  - `ensureHeightEqualization()` setzt jetzt Inline-Styles direkt auf alle Container
  - Überschreibt Tailwind `items-center` mit `align-items: stretch`
  - Alle Container in der Kette (row, draggable-block, content-box-wrapper, etc.) erhalten explizite Flex-Styles

- **Flowchart Export:**
  - SVG wird jetzt automatisch beim Rendern der Vorschau generiert (nicht nur beim Speichern)
  - Verwendet `useReactFlow()` Hook + `useEffect` statt `onInit` Callback
  - Funktioniert auch für aus Cache/Cloud/Import geladene Flowcharts
  - Statisches SVG wird im Content gespeichert für Print-Export

- **Quellen-Block:**
  - Symmetrische Einrückung: 14px margin-left und 14px margin-right

- **Tabellen-Überschrift:**
  - Überschrift und Icon um 14px von links/rechts eingerückt (`.mb-2` Selektor)
  - Tabellen-Inhalt selbst behält volle Breite

- **Text-Formatierung:**
  - `.tiptap-heading` hat keine Unterstreichung mehr (entspricht Editor-Darstellung)
  - Links werden ohne Unterstreichung gerendert (`text-decoration: none`)

### 🔧 Technical

- Edge Function Version 36 deployed
- `FlowchartPreview.js`: Neuer `FlowchartPreviewInner` mit `useReactFlow()` Hook
- `htmlSerializer.js`: Neue `ensureHeightEqualization()` Funktion mit Inline-Styles

---

## [0.9.1] - 2025-12-22

### 🐛 Bug Fixes

- **PDF/Word Export - Konsistentes Rendering wie im Editor:**
  - **Logo-Platzhalter:** Wird im PDF nicht angezeigt (nur echte Logos)
  - **Zweispaltiges Layout:** Korrektes 50/50 Layout, Boxen sind bündig mit einspaltigen Boxen
  - **Height-Equalized:** Automatische Höhenanpassung funktioniert korrekt im Export
  - **Content-Box Ränder:** Border-Farben werden korrekt übernommen (inline-styles)
  - **Box-Ausrichtung:** 
    - Rechter Rand der rechten Box in zweispaltigem Layout ist bündig mit einspaltigen Boxen
    - Tabellen und Quellen beginnen am linken Rand der Boxen (16px margin-left)
    - Rechter Rand von Tabellen/Quellen ist bündig mit Content-Boxen (14px margin-right)
  - **Quellen-Block:** Keine Hintergrundfarbe mehr, gleiche Breite wie Content-Boxen
  - **Footer:** Styles korrekt übernommen

- **Internes Zwei-/Dreispalten-Layout (Disposition etc.):**
  - CSS Grid für `.two-column` und `.three-column` auf `content-box-content`
  - Layout wird jetzt korrekt im PDF exportiert
  
- **Tabellen-Styling komplett überarbeitet:**
  - **Abgerundete Ecken:** Wrapper mit `border-radius: 6px`
  - **Kopfzeile blau:** Header-Hintergrund `#003366` statt grau
  - **Korrekte Breite:** Gleiche Breite wie einzeilige Content-Boxen (nur `margin-right: 14px`)
  - **Zellen-Padding:** `6px 14px` für kompakte Darstellung
  - **Border-Handling:** `border-separate` mit korrekten Rändern

- **Auszeichnung (Highlight-Item):**
  - Pfeil-Icon wird im PDF angezeigt (CSS-Mask mit SVG)
  - Korrekte vertikale Positionierung (`top: 0`)

- **Plus-Icon neben Stand:** Korrekte vertikale Zentrierung

- **Trailing Paragraph:** Leere letzte Absätze im Editor werden ausgeblendet (weniger unterer Abstand)
  
- **HTML-Serialisierung komplett überarbeitet (`htmlSerializer.js`):**
  - `.no-print` und `.icon-container` Elemente werden physisch entfernt
  - `.sop-header-logo-editable` (Editor-Logo-Container) wird entfernt
  - Print-only Elemente (`hidden print:block/flex`) werden sichtbar gemacht
  - Vollständige CSS-Regeln für alle Komponenten integriert

- **Gotenberg Rendering verbessert:**
  - `emulatedMediaType: print` für korrekte CSS @media print Regeln
  - `waitDelay` auf 2s erhöht für bessere Font- und Bildladung

### 🔧 Technical

- Edge Function Version 13 deployed
- Tabellen-Padding-Override für inline-styles aus TipTapTableBlock.js

---

## [0.9.0] - 2025-12-22

### ✨ Features

- **Gotenberg Integration für PDF/Word Export:** Migration von Puppeteer zu Gotenberg
  - Konsistentes PDF-Rendering unabhängig vom Browser des Benutzers
  - PDF-Export nutzt Gotenberg's Chromium-basierte HTML-zu-PDF Konvertierung
  - Word-Export nutzt Gotenberg Screenshots für pixelgenaue Darstellung
  - Gotenberg läuft als Docker Container auf Railway 
  - Client-seitiger Fallback bleibt für den Fall, dass Gotenberg nicht erreichbar ist

### 🔄 Changed

- **Edge Function refactored:** `supabase/functions/export-document/index.ts`
  - Puppeteer-Code komplett entfernt
  - Neue `generatePdfWithGotenberg()` Funktion für PDF-Export
  - Neue `generateScreenshotsWithGotenberg()` Funktion für Word-Export
  - Environment Variable `GOTENBERG_URL` statt `BROWSER_WS_ENDPOINT`



### 🔧 Technical

- **Neue Environment Variable:** `GOTENBERG_URL` muss in Supabase Edge Function Secrets gesetzt werden
- **Gotenberg API Endpunkte:**
  - `/forms/chromium/convert/html` für PDF-Generierung
  - `/forms/chromium/screenshot/html` für Screenshot-Generierung

---

## [0.8.8] - 2025-12-19

### 🐛 Bugfixes

- **Undo für hinzugefügte Boxen repariert:** Das Rückgängigmachen einer neu hinzugefügten Box entfernt diese jetzt korrekt
  - Vorher: Undo machte nur interne Content-Änderungen rückgängig, die Box blieb bestehen (wurde nur "kleiner")
  - Jetzt: Undo entfernt die Box vollständig wie erwartet
  - **Ursache:** Ein redundanter `useEffect` in `FlowchartBlock.js` wurde bei jedem Render ausgelöst (nicht nur nach echtem Resize), was sofort einen neuen History-Eintrag erstellte und den Undo-Eintrag für das Hinzufügen überschrieb
  - **Lösung:** Entfernung des redundanten `useEffect` – der `handleMouseUp` im Resize-Handler speichert bereits korrekt beim Ende eines echten Resize-Vorgangs

---

## [0.8.7] - 2025-12-18

### ✨ Features

- **Adaptive Favicons:** Automatischer Wechsel zwischen hellem und dunklem Favicon je nach Browser-Farbschema
  - `favicon-dark.png` für helle Browser-Umgebungen (`prefers-color-scheme: light`)
  - `favicon-light.png` für dunkle Browser-Umgebungen (`prefers-color-scheme: dark`)
  - Fallback auf dunkles Favicon für ältere Browser

- **Animierter Gradient im StatusIndicator:** Der StatusIndicator zeigt nun einen animierten Farbverlauf im Hintergrund
  - Verwendet die `AnimatedGradient`-Komponente mit angepassten Farbpaletten
  - Farbpaletten je nach Status-Typ:
    - **Blau** (info, saving, exporting, synced): `#39F` + `#7BBFFF`
    - **Grün** (success): `#52C41A` + `#85D95C`
    - **Rot** (error, confirm): `#EB5547` + `#FF8A7A`
    - **Gelb** (warning): `#FAAD14` + `#FFCC5C`
  - Sanfter Übergangseffekt bei Farbwechseln (0.6s Transition auf SVG-Kreise und Hintergrundfarbe)

### 🐛 Bugfixes

- **Konsistente Abstände zwischen Zeilen:** Abstände zwischen allen Block-Typen sind jetzt einheitlich
  - Früher: `margin-bottom` war auf einzelnen Blöcken vs. auf der Zeile → unterschiedliche Abstände
  - Neu: `margin-bottom` wird konsistent auf allen `.block-row` Elementen gesetzt
    - Single-column: `1.5rem` (24px)
    - Two-column: `1rem` (16px) – kompensiert visuell die Höhenangleichung
  - Entfernt: `mb-6` Tailwind-Klasse von `ContentBoxBlock`, `SourceBlock`, `TipTapTableBlock`
  - Print-Styles ebenfalls angepasst

---

## [0.8.6] - 2025-12-18

### 🔄 Changed

- **Höhenangleichung in zweispaltigen Layouts vereinfacht:** Boxen werden nun **immer** angeglichen
  - Früher: Intelligente Erkennung basierend auf Schwellenwerten (Differenz < 40px oder < 15%)
  - Neu: Die kleinere Box dehnt sich immer auf die Höhe der größeren Box
  - Beide Boxen können abwechselnd die "orientierungsgebende" Box sein
  - Hook `useHeightEqualization` stark vereinfacht - gibt bei zweispaltigen Layouts immer `true` zurück
  - **Archivierter Code:** Die alte Threshold-basierte Logik ist als Kommentar im Hook erhalten und kann bei Bedarf reaktiviert werden

### 🐛 Bugfixes

- **JavaScript-basierte Höhenangleichung:** CSS-basierte Lösung durch robusteren JS-Ansatz ersetzt
  - `useHeightEqualization` Hook misst die natürlichen Höhen beider `.notion-box-shell` Elemente
  - Setzt `minHeight` auf beide Boxen basierend auf der größeren Box
  - **Kritisch:** ResizeObserver reagiert **nur auf Breitenänderungen** (Column Resizer)
  - Verhindert Feedback-Schleife: Höhenänderungen triggern keinen erneuten Durchlauf
  - `requestAnimationFrame` für korrekte Messung nach Reset
  - Re-Entry-Schutz und Debounce verhindern Race Conditions
  - Funktioniert zuverlässig unabhängig von CSS-Kaskaden und Tailwind-Klassen

---

## [0.8.5] - 2025-12-18

### ✨ Features

- **Logo oben links:** Logo-Integration mit automatischem Theme-Wechsel
  - Position: fixed, top-left (`top-6 left-6`) mit z-50
  - Automatischer Wechsel zwischen heller und dunkler Logo-Version je nach Theme
  - Höhe: 32px (`h-8`), proportionale Breite
  
- **Viewport-basierte Zoomstufe:** Initiale Zoomstufe wird basierend auf Bildschirmgröße berechnet
  - ab 1920px: 150%
  - ab 1536px: 125%
  - ab 1280px: 100%
  - ab 1024px: 90%
  - ab 768px: 75%
  - unter 768px: Dynamisch berechnet (A4-Breite + 32px Abstand = Bildschirmbreite)

- **Responsive UI-Elemente:** Ecken-Elemente werden bei kleinen Bildschirmen ausgeblendet
  - ≤ 1024px: Logo, Account-Button, Zoombar und HelpButton ausgeblendet
  - < 480px: Untere Toolbar ausgeblendet, stattdessen Hinweis "Mobile Bearbeitung nicht unterstützt"
  - Neuer Tailwind-Breakpoint `xs: 480px` hinzugefügt

- **StatusIndicator Blur-Animation:** Sanfter Blur-to-Sharp Effekt beim Ein-/Ausblenden
  - Frame und Header starten mit Blur (6px/4px) und Scale (0.95/0.97)
  - Animiert zu scharf und voller Größe

- **Bestätigungs-Dialoge im StatusIndicator:** Neue `showConfirm()` Funktion
  - Promise-basierte API: `const confirmed = await showConfirm('Nachricht')`
  - Anpassbare Button-Labels: `confirmLabel`, `cancelLabel`
  - Roter Hintergrund für destruktive Aktionen
  - Buttons: Abbrechen (transparent) und Bestätigen (weiß)

### 🔄 Changed

- **Status-Meldungen komplett überarbeitet:** Alle Meldungen sind jetzt sprechender und konsistenter
  - Dynamische Inhalte: Nutzername, Dokumentname, Fachgebiet, Anzahl
  - Einheitliche Formulierungen: "... fehlgeschlagen. Bitte versuche es erneut."
  - Alle Browser-Alerts durch StatusIndicator ersetzt
  - Alle `window.confirm` Dialoge durch native StatusIndicator-Dialoge ersetzt

---

## [0.8.4] - 2025-12-17

### ✨ Features

- **Inline-Textformatierung im Flowchart Editor:** Text in Flowchart-Nodes kann jetzt formatiert werden
  - Markierter Text zeigt die Inline-Text-Toolbar des TipTap-Editors an
  - Unterstützte Formatierungen: Fett, Kursiv, Unterstreichen, Hochgestellt, Tiefgestellt, Überschrift, Kleine Schrift
  - Nodes verwenden jetzt TipTap-Editoren statt einfacher Textareas
  - Rich-Text wird als HTML gespeichert und korrekt angezeigt
  - **Verbesserte UX:** Text markieren funktioniert ohne Node-Dragging - Node ziehen nur am Rand möglich
  - **Canvas-Selektion:** Beim Aufziehen eines Markier-Feldes im Canvas wird nur der Node ausgewählt, nicht der Text darin
  - **Neues Edit-Icon:** Das Bearbeiten-Icon in der Algorithmus-Box wurde von Stift zu "TreeStructure" geändert

---

## [0.8.3] - 2025-12-17

### ✨ Features

- **Neue Node-Typen:** Drei neue Nodes für Wert-Indikatoren hinzugefügt:
  - **Hoch:** Dunkelblauer Rand mit rotem Pfeil-nach-oben-Icon
  - **Runter:** Dunkelblauer Rand mit blauem Pfeil-nach-unten-Icon
  - **Gleich:** Dunkelblauer Rand mit gelbem Pfeil-nach-rechts-Icon

### 🔄 Changed

- **Kommentar-Node:** Platzhaltertext von "Comment" zu "Kommentar" geändert

---

## [0.8.2] - 2025-12-17

### ✨ Features

- **Viewport Logger:** Zeigt Viewport-Position (x, y) und Zoom-Level am unteren linken Rand des Flowchart-Canvas
  - Dezentes Styling: kleine Monospace-Schrift, grauer Text, direkt auf dem Canvas
- **Dynamische MiniMap-Caption:** Benutzerdefinierter Box-Name wird jetzt auch in der MiniMap-Caption angezeigt
- **Dynamisches MiniMap-Icon:** Icon wird jetzt in der gewählten Akzentfarbe eingefärbt
- **"Flowchartoptionen":** Das Menü "Box individualisieren" heißt für Algorithmus-Boxen jetzt "Flowchartoptionen"

### 🔄 Changed

- **Kategorie ändern deaktiviert für Algorithmus:** Klick auf die Caption der Algorithmus-Box öffnet kein Dropdown mehr
  - Verhindert versehentliches Ändern der Kategorie
  - Andere Boxen behalten das Kategorie-Dropdown

---

## [0.8.1] - 2025-12-17

### ✨ Features

- **Farbauswahl für Algorithmus-Box:** Neue Option im "Box individualisieren"-Menü
  - Ersetzt die Spalten-Option (für Algorithmus nicht relevant)
  - Farbpalette mit allen 12 Kategorie-Volltonfarben
  - Gewählte Farbe wird konsistent angewendet auf:
    - Box-Rahmen und Badge
    - Hover-Buttons am rechten Rand
    - Bearbeiten-Button in der Preview
    - Alle Highlight-Farben im Modal (Toolbar, MiniMap, Helper Lines, etc.)

### 🔄 Changed

- **Grid auf ReactFlow Default zurückgesetzt:** Das Hintergrundraster in Preview und Modal verwendet nun die Standard-Einstellungen von ReactFlow
- **CSS-Variablen für Akzentfarbe:** Modal nutzt jetzt `--accent-color`, `--accent-color-light` und `--accent-color-lighter` für dynamische Farbgebung

---

## [0.8.0] - 2025-12-17

### ✨ Features

- **Flowchart Modal Editor:** Grundlegender Umbau der "Diagnostischer Algorithmus"-Box
  - Das Flowchart wird jetzt als statisches, nicht-interaktives Preview in der Box angezeigt
  - Runder Edit-Button (in Kategorie-Farbe) erscheint beim Hover über das Preview
  - Klick öffnet einen großen Modal-Editor (ca. 80% Viewport)
  - Löst Scroll-Konflikte zwischen Seiten-Scroll und Canvas-Navigation
  - Bietet mehr Arbeitsraum für komplexe Flowcharts

- **Flowchart Editor Modal UX (inspiriert von tldraw/Miro):**
  - **Neuer Modal-Titel:** "SOP FLOWCHART EDITOR" in Quicksand, ALL CAPS, Dunkelblau (#003366)
  - **Floating Header:** Header schwebt über dem Canvas, Canvas füllt gesamtes Modal
  - **Speichern/Schließen-Buttons** im Header (Akzentfarbe/grau)
  - Neue tldraw-Style Toolbar am unteren Bildschirmrand:
    - **Obere Reihe (Akzentfarbe):** Löschen | Radierer | Undo/Redo | Auswahl/Pan | Fit-View/Zoom-Reset
    - **Untere Reihe (weiß):** Node-Typen zum Auswählen
  - **Interaktionsmodi:**
    - Auswahl-Modus (V): Nodes auswählen, verschieben und verbinden (Pfeil-Cursor)
    - Pan-Modus (H): Canvas inkl. Grid frei verschieben (Hand-Cursor)
    - Radierer-Modus (E): Nodes/Edges durch Wischen löschen
  - Keyboard-Shortcuts: V (Auswahl), H (Pan), E (Radierer), Escape (Schließen), Cmd/Ctrl+S (Speichern), Cmd/Ctrl+Z (Undo)
  - Smooth Animations beim Öffnen/Schließen

- **Eraser Tool:** Neues Radierer-Werkzeug zum Löschen von Nodes und Edges
  - Aktivierung per Toolbar-Button oder Taste "E"
  - Nodes/Edges werden gelöscht, wenn die Radier-Linie sie kreuzt
  - Ultra-smooth Radier-Linie mit Bezier-Kurven-Glättung
  - Linie in Definition-Rot (#EB5547)

- **MiniMap:** Übersichtskarte unten rechts im Modal
  - Gestylt als Miniatur der ContentBox (Akzentfarbe-Rand, Icon, Caption)
  - Zeigt alle Nodes farbcodiert nach Typ
  - Pannable & Zoomable für Navigation

### 🔄 Changed

- **FlowchartBlock:** Refactored zu Controller-Komponente
  - Zeigt FlowchartPreview (statisch) statt direktem ReactFlow-Canvas
  - Leere Standardansicht mit Hintergrundraster (keine Start-Node)
  - Änderungen werden erst beim "Speichern" im Modal übernommen
  - Resize-Handle für Höhenanpassung bleibt erhalten (200-1200px)

- **FlowchartPreview:** Flowchart wird mittig mit maxZoom=1 angezeigt (nie größer als Original)

### 📁 Files Added

- `src/components/blocks/FlowchartPreview.js` - Statisches Preview mit Edit-Overlay
- `src/components/blocks/FlowchartEditorModal.js` - Modal-Editor mit floatender Toolbox
- `src/components/blocks/FlowchartEditorModal.css` - Styles für den Modal-Editor
- `src/components/blocks/flowchart/Eraser.js` - Eraser-Tool Komponente

### 📁 Files Changed

- `src/components/blocks/FlowchartBlock.js` - Refactored zu Controller
- `src/components/blocks/FlowchartBlock.css` - Erweitert um Preview-Styles

---

## [0.7.3] - 2025-12-17

### ✨ Features

- **SOPPageHeader:** Neue Komponente für Seitenkopfzeile auf Folgeseiten (ab Seite 2)
  - Zeigt SOP-Titel (geerbt vom Header der ersten Seite) und Seitenzahl/Gesamtseitenzahl
  - Rechtsbündig über der ersten Box positioniert (14px Einrückung)
  - Dezentes Design (9px Schriftgröße, kursiv, dunkelblau #003366)

### 🔄 Changed

- **HeadingFont (Headline):** Schriftgröße von 12px auf 11px reduziert, font-weight entfernt
  - Ermöglicht jetzt Kombination mit Bold und anderen Stilen
  - Betrifft: TextBlock.js, TextBlock.css
- **Aufzählungen (bullet-list, ordered-list):** Einrückung von 20px auf 12px reduziert
- **TipTapTableBlock:** Neuer Switch-Toggle "Überschrift anzeigen" in den Tabellenoptionen
  - Ermöglicht Ein-/Ausblenden der Tabellenüberschrift (Default: ein)
  - Als erstes Element im Menü platziert, mit Switch-Toggle wie im Account-Dropdown
  - Einstellung wird im Content-Objekt als `showTitle` gespeichert

### 🔧 Technical

- **usePageBreaks.js:** Berücksichtigt jetzt PAGE_HEADER-Höhe auf Folgeseiten für korrekte Seitenumbruchberechnung
- **layout.js:** Neue PAGE_HEADER-Konstanten für konsistente Dimensionen

### 📁 Files Added

- `src/components/SOPPageHeader.js` - Seitenkopfzeile-Komponente für Folgeseiten

---

## [0.7.2] - 2025-12-17

### 🔄 Changed

- **Silbentrennung deaktiviert:** Automatische Silbentrennung (`hyphens: auto`) wurde durch `overflow-wrap: break-word` ersetzt
  - Betrifft: TextBlock, TipTapTableBlock, SOPHeader
  - Wörter werden nur noch bei Platzmangel umbrochen, aber ohne Trennstrich
  - Verhindert unschöne Trennungen bei kurzen Silben

### ✨ Features

#### Helpscout Beacon User-Identifikation vereinheitlicht
- **HelpButton:** Übergibt jetzt automatisch Benutzerdaten an Helpscout Beacon
  - Name und E-Mail werden vorausgefüllt (erspart Nutzern die erneute Eingabe)
  - Funktioniert jetzt identisch zum "Feedback geben"-Button im Account-Dropdown
  - Verwendet `useAuth` Hook für Zugriff auf Benutzer-, Profil- und Organisationsdaten
- **Standard Helpscout-Felder:** Beide Feedback-Buttons übergeben:
  - `name`: Vollständiger Name (Vorname + Nachname)
  - `email`: E-Mail-Adresse
  - `company`: Krankenhaus-/Organisationsname
  - `avatar`: Profilbild-URL
  - `jobTitle`: Position

### 🐛 Bugfixes

- **AccountDropdown:** Korrektur von `profile?.position` zu `profile?.job_position` für jobTitle-Feld
- **Account.jsx:** Avatar- und Logo-URLs werden jetzt ohne Cache-Buster in der Datenbank gespeichert
  - Vorher wurden Cache-Buster (`?t=...`) bei jedem Profil-Update kumuliert
  - Betraf sowohl `avatar_url` in Profilen als auch `logo_url` in Organisationen
  - Bestehende fehlerhafte URLs in der Datenbank wurden bereinigt

### 🔧 Technical

- **HelpButton.js:** Import von `useAuth` Context hinzugefügt
- **HelpButton.js:** Neue Helper-Funktionen `getDisplayName()` und `identifyUserInBeacon()`

---

## [0.7.1] - 2025-12-16

### ✨ Features

#### Smart Height Equalization für zweispaltige Layouts
- **Intelligente Höhenangleichung:** Boxen in zweispaltigen Layouts werden automatisch auf gleiche Höhe gebracht, wenn der Höhenunterschied gering ist
  - Vermeidet unschöne "Treppen" bei nahezu gleich hohen Boxen
  - Aktiviert sich nur wenn: Unterschied < 40px ODER Unterschied < 15% der größeren Box
  - Bei großen Unterschieden behalten Boxen ihre natürliche Höhe
- **Doppelklick auf Column Resizer:** Passt die Spaltenbreiten automatisch an, um die Box-Höhen anzugleichen
  - Ein Doppelklick genügt - iteriert automatisch bis zu 4x im Hintergrund
  - Verwendet gedämpfte Höhen-basierte Formel (70%) zur Vermeidung von Oszillation
  - Stoppt automatisch wenn Höhen angeglichen sind (Differenz < 15px)
- **Neuer Hook `useHeightEqualization`:** Verwendet ResizeObserver zur Höhenmessung
- **CSS-Klasse `height-equalized`:** Wird automatisch auf `.block-row.two-columns` angewendet wenn passend
- **Print-Unterstützung:** Funktioniert sowohl im Screen- als auch im Print-Modus

### 🐛 Bugfixes

#### Firefox Rechtschreibprüfung verbessert
- **Sprach-Attribute ergänzt:** `lang="de"` auf Editor-Wrapper-Elementen hinzugefügt
  - `TextBlock.js`: tiptap-wrapper erhält jetzt `lang="de"`
  - `TipTapTableBlock.js`: tiptap-table-wrapper erhält jetzt `lang="de"`
- **Content-Language Meta-Tag:** Neues `<meta http-equiv="Content-Language" content="de">` in index.html
- **CSS-Unterstützung:** `-webkit-locale: "de"` und `hyphens: auto` für bessere Sprach-Erkennung
- Firefox verwendet diese Attribute für die korrekte Wörterbuch-Auswahl bei der Rechtschreibprüfung

#### ContentBox Icon z-index im Print-Modus
- **Print z-index wiederhergestellt:** Print-Icon hat wieder `z-10` Klasse (wie ursprünglich)
  - Da das Element `hidden print:flex` hat, wirkt `z-10` nur im Print-Modus
  - Screen-Modus: `.icon-container` hat `z-index: 10` via CSS

### 🎨 UI/UX

#### Bottom-Spacing für Toolbar
- **Editor:** Bottom-Padding von `pb-6` (24px) auf `pb-24` (96px) erhöht
- **Account-Seite:** `pb-24` zum Content-Wrapper hinzugefügt
- Verhindert Überlappung von Toolbar/Navigation mit Seiteninhalt beim Scrollen
- Print-Modus unberührt (Editor-Wrapper hat `no-print`)

#### Algorithmus-Kategorie umbenannt
- **Caption:** "Algorithmus" → "Diagnostischer Algorithmus"
- **Dropdown-Label:** "Diag. Algorithmus" (kurze Variante)
- **Nur in "Inhalt hinzufügen":** Algorithmus wurde aus dem "Kategorie ändern"-Dropdown entfernt
  - Verhindert versehentliches Umwandeln anderer Boxen in Algorithmus-Boxen

#### Headline-Formatierung angepasst
- **Line-Height erhöht:** Von `1.5` (geerbt) auf `1.8` für bessere Lesbarkeit
- Gilt für Screen- und Print-Modus

---

## [0.7.0] - 2025-12-16

### 🎨 Styling

#### Account-Navigation Toolbar
- **Active State angepasst:** Aktive Tab-Buttons verwenden jetzt denselben Grauton (`bg-accent`) wie der Hover-State der Ghost-Buttons
  - Icons und Text bleiben dunkel (foreground color) statt weiß
  - Einheitlicheres Design mit der restlichen Toolbar
- **Dokument-Badge überarbeitet:**
  - Farbe von blau (`bg-primary/20 text-primary`) zu dunkel (`bg-foreground/10 text-foreground`) geändert
  - Badge ist jetzt immer sichtbar (zeigt "0" wenn keine Dokumente) um Layout-Sprünge beim Laden zu vermeiden

#### StatusIndicator
- **Schriftgröße erhöht:** Von 11px auf 13px für bessere Lesbarkeit
- **Padding angepasst:** Größeres Padding (16px statt 14px) und Gap (8px statt 6px)
- **Icon-Größe angepasst:** Von 14px auf 16px
- **Fixe Höhe:** Frame verwendet jetzt `height` statt `top` für konsistente Expansion (+40px wenn aktiv)

#### TextEditor (InlineTextToolbar)
- **Neue "Überschrift"-Funktion:** Vergrößert Text auf 12px mit font-weight 500
  - Neues `TextH` Icon aus Phosphor
  - Erscheint vor der Bold-Option in der Toolbar
  - Korrekte Darstellung im Print-Modus
- **HeadingFont Mark Extension:** Neue TipTap-Extension für Überschriften-Formatierung

### 🐛 Bugfixes

#### Z-Index ContentBox Icons
- **Icon z-index reduziert:** Von `z-50` auf `z-10` um Überlappung mit der Bottom-Toolbar zu verhindern
  - Icons erscheinen nicht mehr über dem Gradient/UI am unteren Viewport-Rand

#### Tabellen-Styling
- **Header-Padding angepasst:** Kopfzeilen haben jetzt dasselbe Padding wie normale Zellen
  - Vorher: th `0.625rem 0.875rem`, td `0.375rem 0.875rem`
  - Nachher: beide `0.375rem 0.875rem`
  - Header unterscheiden sich nur noch farblich (dunkelblauer Hintergrund)

### ✨ Neue Features

#### Globales Status-System mit farbigen Alerts
- **StatusContext:** Neuer globaler Context für Status-Nachrichten
  - Ersetzt alle `toast()` Aufrufe durch einheitliches Status-System
  - Unterstützt Erfolg (Grün), Fehler (Rot), Warnung (Gelb), Info (Blau)
- **Farbkodierung basierend auf ContentBox-Kategorien:**
  - Erfolg: Therapie-Grün `#52C41A`
  - Fehler: Definition-Rot `#EB5547`
  - Warnung: Merke-Gelb `#FAAD14`
  - Info/Standard: Blau `#39F`
- **StatusIndicator:** Zeigt Status als farbiger Rahmen um die Toolbar
  - Farbe wechselt dynamisch je nach Statustyp
  - Passende Icons: Check (Erfolg), X (Fehler), Warning (Warnung), Spinner (Loading)
- **Neue Datei:** `src/contexts/StatusContext.js` - Status-Management Context

### 🎨 UI/UX Überarbeitung

#### StatusIndicator als Toolbar-Rahmen
- **Status aus Toolbar entfernt** - erscheint jetzt als expandierender Rahmen
- **StatusIndicator-Komponente:** Farbiger Rahmen der sich hinter der Toolbar "aufbläht"
  - Erscheint nur bei Statusänderungen (Export, Speichern, Sync)
  - Status-Text erscheint im oberen, dickeren Bereich des Rahmens
  - Toolbar sitzt "innerhalb" des Rahmens (Apple-Style Design)
- **Smooth Animations:** 
  - Einblenden: `padding-top` wächst mit spring-ähnlichem cubic-bezier
  - Status-Text faded mit Verzögerung ein
  - Auto-Hide nach 2,5 Sekunden bei "Synchronisiert"

#### Editor-Toolbars
- **Toolbar aufgeteilt:** Zwei separate Toolbars für bessere Übersichtlichkeit
  - **Bottom-Toolbar** (zentriert unten): History, Export/Import mit Textlabels
  - **Top-Right-Toolbar** (oben rechts, 24px Abstand): Speichern-Button + Account-Avatar
- Speichern-Button als blauer Primary-Button (`variant="default"`)
- Account-Avatar vergrößert (`h-12 w-12`), Dropdown öffnet nach unten
- Export/Import Buttons mit Icon + Textlabel (Import, PDF, Word, JSON)

#### Account-Seite
- **Navigation-Bar:** Jetzt am unteren Bildschirmrand zentriert (wie Editor-Toolbar)
  - Umwickelt vom StatusIndicator für konsistentes Design
  - Gleiche Styling-Sprache wie Editor-Toolbar (rounded-xl, gap-0.5, etc.)
- "Zum Editor" Button + Account-Avatar weiterhin oben rechts (fixed)

#### A4-Seiten-Layout
- **Seiten-Ausrichtung:** Erste A4-Seite beginnt auf gleicher Höhe wie Top-Right-Toolbar
  - `margin-top: 6px` für optimales visuelles Alignment

#### Steuerelemente
- **Bottom-Gradient:** Dezenter Verlauf am unteren Viewport-Rand
  - 144px hoch (`h-36`), weicher 5-stufiger Verlauf
  - Tagmodus: Weißer Verlauf / Nachtmodus: Dunkler Verlauf
- **Zoom-Control:** Prozent-Feld jetzt gleiche Höhe wie +/- Buttons (`h-8`)
- **Einheitliche Schatten:** Alle Bottom-Controls mit `shadow-lg`

### 🔧 Technische Änderungen

- **Entfernt:** Sonner Toaster (`<Toaster />` aus App.js)
- **Entfernt:** `toast` Import aus Editor.js, Account.jsx, HelpButton.js
- **Neu:** `useStatus` Hook mit Convenience-Methoden:
  - `showSuccess()`, `showError()`, `showWarning()`, `showInfo()`
  - `showSaving()`, `showExporting()`, `showSynced()`
- **Komponenten aktualisiert:**
  - Editor.js: Alle toast-Aufrufe durch useStatus ersetzt
  - Account.jsx: Alle toast-Aufrufe durch useStatus ersetzt
  - HelpButton.js: toast.warning durch showWarning ersetzt

### 🔄 Changed
- AccountDropdown: Neue Props `size` und `dropdownPosition`
- UndoRedoButton: Neue `size` Prop für größere Variante

---

## [0.6.12] - 2025-12-15

### 🎨 Changed
- **Small Text Schriftgröße:** Von 10px auf 9px reduziert
  - SmallFont Extension in TextBlock und TipTapTableBlock
  - Entsprechende Print- und Screen-Styles in App.css angepasst
  - Abwärtskompatibilität: Bestehender Content mit 10px/8px/7px wird automatisch als 9px angezeigt

### 🐛 Fixed
- **Definition-Box Trailing Paragraph:** Konsistentes Verhalten bei allen Content-Boxen
  - Definition-Box hat jetzt wie alle anderen Boxen eine leere Zeile am Ende
  - Benutzer können am Ende klicken und weiterschreiben
  - Backspace in der leeren Zeile bewegt Cursor nach oben (ohne die Zeile zu löschen)
- **Tabellen Hover-Buttons:** Abstand der Hover-Buttons zur Tabellen-Box korrigiert
  - Buttons sind jetzt gleich weit von der Tabelle entfernt wie bei ContentBoxBlock
  - Anpassung der CSS-Positionierung ohne Änderung der Tabellenbreite

### ✨ Added
- **Deutsche Rechtschreibprüfung:** Spellcheck funktioniert jetzt auf Deutsch
  - `lang="de"` und `spellcheck="true"` Attribute in allen TipTap-Editoren
  - Funktioniert auch wenn die Browsersprache Englisch ist

---

## [0.6.11] - 2025-12-15

### ✨ Added
- **Tooltips mit Tastaturkürzeln:** Inline-Textformatiertungs-Toolbar zeigt jetzt Shortcuts an
  - Fett (⌘/Ctrl+B), Kursiv (⌘/Ctrl+I), Unterstreichen (⌘/Ctrl+U)
  - Hochgestellt (⌘/Ctrl+.), Tiefgestellt (⌘/Ctrl+,)
  - Aufzählungsliste (⌘/Ctrl+Shift+8)
  - Plattform-spezifische Anzeige (⌘ für Mac, Ctrl für Windows/Linux)
- **Auszeichnung-Element Abstand:** 8px vertikaler Abstand zwischen Auszeichnungen für bessere Lesbarkeit
  - Kein zusätzlicher Abstand am Anfang/Ende des Containers (`:first-child`/`:last-child`)
  - Konsistentes Verhalten in Screen und Print

### 🐛 Fixed
- **JSON-Export/Import:** Box-Einstellungen werden jetzt korrekt beim Export/Import beibehalten
  - `columnCount` (Spaltenanzahl) bleibt erhalten
  - `customLabel` (benutzerdefiniertes Label) bleibt erhalten
  - `customColor` (benutzerdefinierte Farbe) bleibt erhalten
  - Auch SourceBlock-Spalteneinstellungen werden korrekt übernommen

### 🔄 Changed
- **Kategorie umbenannt:** "Differenzial" → "Differenzialdiagnosen" für bessere Klarheit
  - Dropdown-Menüs zeigen die Kurzform "Differenzialdiag."
  - Caption der Box zeigt den vollen Namen "Differenzialdiagnosen"
- **Tabellen-Kopfzellen:** Neuer Default-Stil mit Dunkelblau (#003366) und weißer Schrift
  - Ersetzt das vorherige Hellgrau (`hsl(var(--muted))`)
  - Konsistentes Aussehen in Screen und Print

---

## [0.6.10] - 2025-12-11

### 🐛 Fixed
- **TipTapTableBlock Spaltenbreiten:** Tabellen passen sich jetzt automatisch an die Container-Breite an
  - Spalten werden proportional skaliert, wenn die Gesamtbreite den Container überschreitet
  - Verhindert, dass die letzte Spalte abgeschnitten wird
  - Resize-Funktionalität bleibt vollständig erhalten
  - MutationObserver überwacht Änderungen und korrigiert automatisch
- **Dropdown-Menü z-index:** Tabellenoptionen-Dropdown liegt jetzt korrekt über den Hover-Buttons
  - z-index von 50 auf 200 erhöht für `DropdownMenuContent` und `DropdownMenuSubContent`
  - Portal für Submenüs hinzugefügt, um korrektes Stacking zu gewährleisten
- **Drag & Drop aus Zwei-Spalten-Layout:** Drop-Indikator erscheint jetzt korrekt beim Ziehen einer Box aus einem Zwei-Spalten-Layout
  - `after` Drop-Zone wird für Zwei-Spalten-Zeilen angezeigt, wenn ein Block herausgezogen wird
  - Ermöglicht das Platzieren von Blöcken unterhalb der ursprünglichen Zeile

---

## [0.6.9] - 2025-12-08

### ✨ Added
- **Bulk-Export als JSON:** Unter "Meine Leitfäden" können mehrere Dokumente gleichzeitig als JSON exportiert werden
- **ZIP-Archiv für Bulk-Export:** Bei Export von mehreren Dokumenten wird automatisch ein ZIP-Archiv erstellt
  - Einzelnes Dokument → Einzelne JSON-Datei (`titel-stand.json`)
  - Mehrere Dokumente → ZIP-Archiv (`sop-export-YYYY-MM-DD.zip`)
- **Bulk-Import für JSON:** Mehrere JSON-Dateien können gleichzeitig importiert werden
  - File-Dialog erlaubt Mehrfachauswahl
  - Fortschrittsanzeige und zusammenfassende Erfolgsmeldung
- **JSZip Dependency:** Neue Abhängigkeit für ZIP-Archiv-Erstellung

### ℹ️ Hinweis
- **PDF/Word Bulk-Export nicht verfügbar:** Für originalgetreue PDF/Word-Exporte muss das Dokument im Editor geöffnet werden, da nur dort die vollständig gerenderten React-Komponenten (Flowcharts, Tabellen etc.) erfasst werden können

### 🔄 Changed
- **Einheitliche Dateinamen bei Export:** Alle exportierten Dateien verwenden jetzt das Format `titel-stand.dateiformat`
  - JSON Export: Verwendet nun `headerTitle` und `headerStand` aus dem Editor-State statt generischem Datumsstempel
  - PDF/Word Export: Verwendet weiterhin Titel und Stand, aber mit vollständigem Stand-String
  - Bulk JSON Export: Verwendet ebenfalls das einheitliche Format
  - Beispiel: "SOP Einarbeitung" mit "STAND 12/22" → `sop-einarbeitung-stand-12-22.pdf`
  - Alle Sonderzeichen werden entfernt, Leerzeichen durch Bindestriche ersetzt
- **Verbesserte Export-Erfolgsmeldungen:** Toast-Nachrichten zeigen jetzt das Format und bei mehreren Dokumenten den Hinweis auf das ZIP-Archiv

---

## [0.6.8] - 2025-12-08

### ✨ Added
- **Slash-Menü Filterung:** Eingabe nach `/` filtert die verfügbaren Befehle
  - Sucht in Titel und Keywords (z.B. `/auf` zeigt "Aufzählung", `/liste` findet ebenfalls "Aufzählung")
  - Zeigt "Keine Ergebnisse" wenn nichts passt
  - Auswahl wird bei Filteränderung auf erstes Ergebnis zurückgesetzt
- **HelpScout Feedback mit Nutzerdaten:** Beim Klick auf "Feedback geben" werden Nutzerdaten automatisch vorausgefüllt
  - Name, E-Mail, Organisation, Profilbild, Position
  - Custom Attributes: Dokumentenanzahl, Organisation-ID, Lizenzmodell
  - Ermöglicht schnelleren Support ohne Nachfragen

### 🐛 Fixed
- **Race Condition in useKlinikAtlas behoben:** Globale Fetch-Sperre verhindert jetzt doppelte API-Requests wenn mehrere Hook-Instanzen gleichzeitig `loadData()` aufrufen
- **Footer-Variante wechselt nicht mehr bei Reload:** Alle `footerVariant`-Fallback-Werte auf `'tiny'` vereinheitlicht (war inkonsistent `'default'` vs `'tiny'`)
- **Zwischenspeicher-Probleme bei DB-Dokumenten behoben:** localStorage wird nicht mehr überschrieben wenn ein Dokument aus der Datenbank geladen wird (`?id=xxx`). Dies verhindert das Erscheinen falscher Zwischenstände bei Reload.
- **Platzhalter in leeren ContentBoxen:** Platzhaltertext erscheint jetzt korrekt in leeren Boxen, aber nicht mehr bei einzelnen leeren Paragraphen wenn bereits Inhalt vorhanden ist
  - TipTap Placeholder mit `editor.isEmpty` Prüfung
  - CSS-Selektoren für `.is-editor-empty` korrigiert

### 🔄 Changed
- **Schriftgröße im Editor reduziert:** Von 12px auf 11px für kompaktere Darstellung
  - Betrifft: Tabellen-Zellen (td/th), TextBlöcke, ContentBox-Inhalte
  - Kleine Schrift (`.small-font`): Von 10px auf 9px reduziert
  - Responsive Anpassung: Mobile (< 640px) jetzt 10px statt 11px
  - Druckausgabe verwendet ebenfalls 11px
- **useEditorHistory Hook:** Neuer Parameter `skipLocalStorage` zur Steuerung der localStorage-Nutzung
- **Editor.js:** Übergibt `skipLocalStorage: true` wenn ein DB-Dokument geladen wird

---

## [0.6.7] - 2025-12-07

### ✨ Added
- **Signature Footer-Variante:** Neuer Footer-Typ mit Unterschriftsfeldern
  - Felder: Erstellt, Modifiziert/Geprüft, Freigegeben, Gültig ab
  - 4-spaltiges Grid-Layout mit Unterschriftslinien
- **Lizenzmodell-Einstellung für Organisationen:** Neue Auswahlmöglichkeit unter Account → Organisation
  - Dropdown-Auswahl mit zwei Optionen:
    - "Krankenhaus-Lizenz" (Proprietäre Lizenz für interne Nutzung) - **Default**
    - "Creative Commons" (Open Source Lizenz für freie Weitergabe)
  - Wird in Supabase unter der Organisation gespeichert
  - Neue Spalte `license_model` in der `organizations`-Tabelle
  - **Footer zeigt Lizenzmodell an:** Bei Krankenhaus-Lizenz wird "Krankenhaus-Lizenz" mit SealCheck-Icon angezeigt, bei Creative Commons die CC-Symbole
- **Select UI-Komponente:** Neue wiederverwendbare Dropdown-Komponente basierend auf Radix UI
- **Platzhalter-Logo im SOPHeader:** SVG-Logo "LOGO PLATZHALTER" wird angezeigt wenn kein Logo hinterlegt ist
  - Nur im Editor sichtbar, nicht beim Drucken (no-print)
  - Ersetzt das bisherige Image-Icon
  - Verwendet muted Grautöne (`#94a3b8`, `#cbd5e1`) passend zum UI-Design

### 🎨 Changed
- **ContentBox Name-Feld immer sichtbar:** Das Name-Feld im "Box individualisieren" Dropdown ist jetzt immer sichtbar
  - Bei nicht umbennenbaren Kategorien (Definition, Ursachen, Symptome, etc.) ist das Feld ausgegraut/deaktiviert
  - Konsistentes UI ähnlich der Dreispaltigkeit-Option
  - Betroffene Kategorien für Umbenennung: Sonstiges, Algorithmus, Differenzial, Abläufe, Studie
- **Tabellen-Einstellungen UI verbessert:** "Tabelle zurücksetzen" Menüeintrag entfernt
  - Stattdessen Reset-Icon (ArrowCounterClockwise) im Header des Dropdowns
  - Konsistentes UI mit ContentBox "Box individualisieren" Dropdown
- **Hover-Buttons 14px näher in zweispaltigem Layout:** ContentBox-Controls erscheinen jetzt näher an der Box
  - Neue CSS-Klasse `in-two-column-row` identifiziert Boxen im zweispaltigen Layout
  - `translateX` reduziert von 50px auf 36px (rechte Seite) bzw. -50px auf -36px (linke Seite)
  - Hover-Bridge-Breite entsprechend angepasst
- **Lizenzmodell-Dropdown mit Icons:** SealCheck-Icon für Krankenhaus-Lizenz, Copyright-Icon für Creative Commons
- **Select-Komponente:** Checkmark-Indikator von links nach rechts verschoben
- **HospitalLicenseBadge Styling:** Quicksand-Font und angepasste Farben

---

## [0.6.6] - 2025-12-06

### 🎨 Changed
- **SOPHeader Border komplett entfernt:** Blaue Umrandung bei allen editierbaren Elementen entfernt
  - Betrifft: Stand-Text, Überschrift und Logo-Container
  - Hover-States zeigen keine Border mehr
  - Bearbeitungsmodus (Input/Textarea) zeigt keine Border mehr
  - Der Edit-Cursor ist nun der einzige Indikator für Editierbarkeit
  - Verhindert visuelle Ablenkung beim Bearbeiten

### 🐛 Fixed
- **Import-Pfade korrigiert:** `@/`-Alias durch relative Pfade ersetzt
  - Betrifft: `button.jsx`, `progress.jsx`, `separator.jsx`, `card.jsx`, `file-upload-06.jsx`
  - Create React App unterstützt keine jsconfig.json Pfad-Aliase ohne zusätzliche Konfiguration
  - Behebt "Module not found: Error: Can't resolve '@/lib/utils'" Fehler

- **Toolbar-Breite korrigiert:** Toolbar ist jetzt exakt so breit wie der A4-Container (210mm)
  - Verwendet feste Breite statt max-width für konsistente Ausrichtung
  - Flex-Kinder schrumpfen korrekt, um Overflow zu vermeiden

- **Icon-Text-Abstände in Toolbar reduziert:** Von `gap-2` (8px) auf `gap-1` (4px)
  - Betrifft: Import, PDF, Word, JSON, In Cloud speichern Buttons
  - Kompaktere Darstellung der Toolbar-Elemente

- **Toolbar-zu-A4-Abstand angepasst:** Von 20px auf 12px reduziert
  - Entspricht jetzt dem Abstand zwischen linker und rechter Toolbar-Hälfte (gap-3)
  - Konsistentere visuelle Hierarchie

### ✨ Added
- **Skeleton Loading für "Meine Leitfäden":** Bessere Lade-Animation ohne Layout-Shift
  - Neue ShadCN Skeleton-Komponente (`src/components/ui/skeleton.jsx`)
  - DocumentCardSkeleton-Komponente für detailliertes Skeleton-Layout
  - **Stabile Tabellenstruktur:** Header, Rows und Footer sind immer sichtbar
  - Tabellen-Header wird sofort angezeigt (mit deaktivierten Sortier/Filter-Buttons während Laden)
  - Skeleton-Zeilen werden durch echte Daten ersetzt
  - Footer zeigt "Lade Dokumente..." während des Ladens
  - **Anti-Layout-Shift Maßnahmen:**
    - Badge im Tab "Meine Leitfäden" ist immer vorhanden (opacity statt conditional rendering)
    - `overflow-y: scroll` auf HTML-Element verhindert Scrollbar-bedingte Breitenänderungen
    - SortButton und CategoryFilter unterstützen jetzt `disabled` Prop
    - `min-height: 400px` auf dem Zeilen-Container entspricht der EmptyState-Höhe
    - `min-height: 600px` auf dem Main-Container für Tab-Wechsel
  - **Ladezustand-Logik verbessert:**
    - `loadingDocs=false` wird nur gesetzt NACHDEM Dokumente geladen sind (wenn Organisation existiert)
    - Verhindert kurzes Aufblitzen des EmptyState bevor Daten geladen sind
    - Wartet auf vollständig geladenes Profil bevor Entscheidung getroffen wird

---

## [0.6.5] - 2025-12-06

### ✨ Added
- **TipTap Image Upload Node:** Neues Bild-Upload-Feature im Slash-Menü
  - Statt direktem File-Dialog erscheint jetzt ein Upload-Platzhalter im Editor
  - Drag & Drop Support für Bilder direkt in den Platzhalter
  - Klick-zum-Hochladen Funktion
  - Fortschrittsanzeige während des Uploads
  - Deutsche Lokalisierung ("Klicken zum Hochladen oder Bild hierher ziehen")
  - Bilder werden als Base64 gespeichert (kein externer Upload-Service nötig)

- **ImageNodePro:** Erweiterte Bild-Darstellung nach Upload
  - **Display-Modus:** "Inline" (Textbreite) oder "Full" (volle Box-Breite)
  - **Bildunterschrift:** Klick zum Bearbeiten, Enter zum Speichern
  - **Download-Button:** Bild als Datei herunterladen
  - **Löschen-Button:** Bild entfernen (rot hervorgehoben)
  - **Toolbar-Styling:** Identisch zur Text-Toolbar (Toggle-Buttons, gleiche Icons-Größe)
  - Toolbar erscheint nur bei Selektion des Bildes **UND** wenn Editor fokussiert
  - Toolbar verschwindet automatisch bei Klick in andere ContentBox
  - Text-Toolbar wird ausgeblendet wenn Bild selektiert ist
  - Print-optimierte Darstellung

### 🐛 Fixed
- **SOPHeader Layout-Shift behoben:** Kein Springen mehr beim Klicken auf Überschrift/Stand
  - Padding und Border-Radius jetzt in beiden Modi (Anzeige/Bearbeitung) identisch
  - Nur die Border-Farbe ändert sich (transparent → blau)

### 📦 Dependencies
- **Hinzugefügt:** `@floating-ui/react@0.27.16` - Für TipTap Tooltip-Komponenten
- **Hinzugefügt:** `sass@1.94.2`, `sass-embedded@1.93.3` - SCSS-Support für TipTap UI-Komponenten
- **Aktualisiert:** `@tiptap/pm@3.13.0`, `@tiptap/react@3.13.0` - TipTap Core aktualisiert

### 📁 Neue Dateien
- `src/components/tiptap-node/image-upload-node/` - TipTap Image Upload Node Extension
- `src/components/tiptap-node/image-node-pro/` - Erweiterte Bild-Node mit Toolbar
- `src/components/tiptap-ui-primitive/button/` - TipTap Button UI-Primitiv
- `src/components/tiptap-ui-primitive/tooltip/` - TipTap Tooltip UI-Primitiv
- `src/components/tiptap-icons/close-icon.jsx` - Close-Icon Komponente
- `src/lib/tiptap-utils.js` - TipTap Hilfsfunktionen
- `src/styles/_variables.scss` - TipTap CSS-Variablen
- `src/styles/_keyframe-animations.scss` - CSS-Animationen

---

## [0.6.4] - 2025-12-05

### 🔧 Improved
- **Zoom-Funktion komplett überarbeitet:** Der Zoom-Control zoomt jetzt nur den A4-Seitencontainer und die Toolbar
  - Verwendet jetzt CSS `zoom` statt `transform: scale()` - dadurch passt sich das Layout automatisch an
  - Bei höheren Zoom-Stufen (150%, 175%, 200%) entsteht kein horizontales Scrolling mehr
  - Bei niedrigeren Zoom-Stufen (50%, 75%, 90%) schrumpft der Container korrekt mit (kein Leerraum mehr)
  - Druckfunktion bleibt unbeeinflusst - Print-Styles setzen den Zoom auf 100% zurück
  - Hintergrund-Elemente (Gradient, Grain-Overlay) bleiben unverändert und füllen den Viewport

### 🐛 Fixed
- **DragOverlay bei Zoom korrigiert (Chrome):** Behebt das Problem, dass die Box während des Drags bei veränderten Zoom-Stufen falsche Größe und Position hatte
  - **Ursache:** `getBoundingClientRect()` gibt bei CSS `zoom` gezoomte Werte zurück. Das DragOverlay muss im gleichen Zoom-Kontext sein.
  - **Lösung:** 
    - DragOverlay wird im ZoomWrapper gerendert (via `container` Prop)
    - Breite wird durch Zoom-Faktor geteilt (Basis-Breite)
    - Cursor-Position im Modifier wird ebenfalls zoom-korrigiert
  - Betroffene Dateien: `DragDropContext.js`, `DropIndicator.jsx`, `Editor.js`

### ⚠️ Known Issues
- **Safari/Firefox bei Zoom ≠ 100%:** Drag & Drop zeigt falsche Box-Größe und/oder Cursor-Position
  - Ursache: CSS `zoom` ist nicht standardisiert und wird von Browsern unterschiedlich behandelt
  - Workaround: Bei 100% Zoom funktioniert Drag & Drop in allen Browsern korrekt
  - Status: Wird in einer zukünftigen Version adressiert

---

## [0.6.3] - 2025-12-05

### ✨ Added
- **Settings-Menü für Quellen-Box:** Neues "Box individualisieren" Dropdown-Menü identisch wie bei ContentBoxBlock
  - NotePencil-Icon als erster Button in den Controls
  - Header "Box individualisieren" mit Reset-Button (ArrowCounterClockwise)
  - Spaltenauswahl (1, 2, 3) wobei 3 wie bei den meisten anderen Boxen deaktiviert ist
  - **Vollständige Spaltenlogik von ContentBoxBlock übernommen:**
    - Bei Erhöhung der Spaltenanzahl werden automatisch neue leere Blöcke hinzugefügt
    - Bei Reduzierung werden nur leere trailing Blöcke entfernt, Inhalte bleiben erhalten
  - CSS-Klassen für `.source-box-content.two-column` hinzugefügt (auch für Print)
  - Plus-Dropdown zeigt nun auch die Kategorie-Nutzung (x/max) wie bei anderen Blöcken

- **Drag & Drop für Tabellen:** Tabellen können jetzt per Drag & Drop verschoben werden
  - Das Tabellen-Icon (oben rechts neben dem Titel) dient als Drag Handle
  - Funktionalität identisch wie bei ContentBoxBlock

### 🐛 Fixed
- **Drag-Handle-Buttons bei Tabellen und Quellen-Boxen:** Die separaten Drag-Handle-Buttons wurden entfernt
  - Behebt das Problem, dass der Delete-Button bei Tabellen nicht angezeigt wurde
  - Controls sind jetzt konsistent: Settings → Plus → Delete

---

## [0.6.2] - 2025-12-05

### ✨ Added
- **Export-Status-Anzeige:** Neue Statusanzeige "Exportiere ..." in der Toolbar während PDF-, Word- oder JSON-Exports
  - Zeigt jetzt drei unterschiedliche Zustände: "Exportiere ...", "Aktualisiere ...", "Synchronisiert"

- **Intelligentes Undo/Redo:** Die Toolbar-Buttons wählen automatisch zwischen Text- und Struktur-History
  - Bei fokussiertem Textfeld/Tabelle: TipTap-History (Text-Änderungen)
  - Sonst: Globale History (Box verschieben, Einstellungen, etc.)
  - Button-Klick verhindert Fokus-Verlust für nahtlose Bedienung

- **Fehlermeldungen auf Deutsch:** Login- und Registrierungsfehlermeldungen werden jetzt vollständig auf Deutsch angezeigt
  - "Invalid login credentials" → "Bitte prüfe deine Anmeldedaten erneut."
  - "User already registered" → "Diese E-Mail-Adresse ist bereits registriert."
  - "Email not confirmed" → "Bitte bestätige zuerst deine E-Mail-Adresse."
  - Weitere Supabase-Fehlermeldungen übersetzt

- **Plattformabhängige Tastenkürzel:** Undo/Redo-Tooltips zeigen jetzt die korrekten Shortcuts
  - Mac: ⌘+Z / ⌘+Shift+Z
  - Windows/Linux: Ctrl+Z / Ctrl+Shift+Z

### 🔄 Changed
- **Box-Individualisierung eingeschränkt:** Die Funktion zum Ändern des Box-Namens ist jetzt nur noch für bestimmte Kategorien verfügbar:
  - Sonstiges, Algorithmus, Differenzial, Abläufe, Studie
  - Andere Kategorien (Definition, Ursachen, Symptome, etc.) zeigen die Namensänderung nicht mehr an

### 🔧 Technical
- **Neuer Context:** `TipTapFocusContext.js` für Tracking des aktiven TipTap-Editors
- **TextBlock.js:** Editor-Registrierung bei Fokus für intelligentes Undo/Redo
- **TipTapTableBlock.js:** Editor-Registrierung bei Fokus für intelligentes Undo/Redo
- **UndoRedoButton.jsx:** Intelligente History-Auswahl, Fokus-Steal-Verhinderung
- **App.js:** `TipTapFocusProvider` eingebunden
- **Login.jsx:** `translateAuthError()` Funktion für Fehlerübersetzung hinzugefügt
- **Register.jsx:** `translateAuthError()` Funktion für Fehlerübersetzung hinzugefügt
- **Editor.js:** Statusanzeige-Logik erweitert für Export-Status
- **ContentBoxBlock.js:** Bedingte Anzeige des customLabel-Inputs basierend auf Kategorie

---

## [0.6.1] - 2025-12-05

### 🔧 Technical
- Erste Version mit automatisierten GitHub Releases via release-it

---

## [0.6.0] - 2025-12-05

### ✨ Added
- **Release-It Integration:** Automatisiertes Release-Management für GitHub Releases
  - Neue npm Scripts: `release`, `release:patch`, `release:minor`, `release:major`, `release:dry-run`
  - Automatisches Git-Tagging mit `v${version}` Format
  - GitHub Release-Erstellung mit Changelog-Generierung
  - Conventional Changelog Plugin für automatische Changelog-Updates

### 🔧 Technical
- **Neue devDependencies:**
  - `release-it` - Release-Management-Tool
  - `@release-it/conventional-changelog` - Plugin für Changelog-Generierung
- **Neue Konfigurationsdatei:** `.release-it.json` für Release-Konfiguration

---

## [0.5.3] - 2025-12-05

### 🔄 Changed
- **Spaltenauswahl statt Toggle:** Im "Box individualisieren" Menü ersetzt eine Spaltenauswahl den bisherigen Zweispaltigkeits-Toggle
  - Drei Buttons: **Einspaltig** (1), **Zweispaltig** (2), **Dreispaltig** (3)
  - Dreispaltig ist nur für die Kategorie **Disposition** verfügbar
  - Schlichte Darstellung nur mit Zahlen (1, 2, 3)
  - Aktiver Button wird farblich hervorgehoben

- **Farbauswahl entfernt:** Die manuelle Farbauswahl wurde aus dem "Box individualisieren" Menü entfernt
  - Kategorien behalten ihre Standard-Farben
  - Bestehende Custom-Colors werden weiterhin unterstützt (Abwärtskompatibilität)

### 🔧 Technical
- **ContentBoxBlock.js:**
  - `isTwoColumn` (boolean) zu `columnCount` (number: 1, 2, 3) migriert
  - Migration von alten Dokumenten mit `isTwoColumn` zu `columnCount`
  - `Switch` Import entfernt
  - `handleTwoColumnToggle` zu `handleColumnCountChange` umbenannt

- **App.css:**
  - Neue CSS-Klasse `.three-column` für dreispaltiges Grid-Layout
  - Print-Styles für dreispaltiges Layout ergänzt

---

## [0.5.2] - 2025-12-04

### 🔄 Changed
- **SOPHeader Logo-Platzhalter:** Standard-Logo durch allgemeinen Platzhalter ersetzt
  - SOP-Wotaufnahme SVG-Logo entfernt
  - Neuer Platzhalter mit Image-Icon im gleichen Style wie Account-Seite
  - Verwendet Tailwind-Klassen: `bg-muted`, `border-2 border-border`, `rounded-lg`
  - Platzhalter füllt den gesamten Container aus (100% Breite/Höhe)
  - Im Druck wird kein Platzhalter angezeigt (nur bei vorhandenem Logo)

- **ContentBoxBlock Spalten-Icons:** Icon-Größe angepasst
  - Von `h-7 w-7` auf `h-6 w-6` reduziert für bessere Proportionen

### 🔧 Technical
- **SOPHeader.js:**
  - `Image` Icon von `@phosphor-icons/react` importiert
  - Platzhalter-Div mit Tailwind-Klassen statt inline Styles
  - Print-View zeigt `null` statt Platzhalter wenn kein Logo vorhanden

---

## [0.5.1] - 2025-12-03

### ✨ Added
- **Manuelle Zeilenumbrüche im SOPHeader-Titel:** Nutzende können jetzt manuelle Zeilenumbrüche im Titel einfügen
  - **Shift+Enter** erstellt einen manuellen Zeilenumbruch
  - **Enter** (ohne Shift) beendet den Bearbeitungsmodus wie bisher
  - Textarea ersetzt Input-Feld für mehrzeilige Titel
  - Automatische Umbruch-Logik für lange Wörter bleibt erhalten
  - Manuelle Umbrüche werden mit `white-space: pre-wrap` korrekt angezeigt

### 🔄 Changed
- **SOPHeader Container-Mindesthöhen:** Titel- und Stand-Container bleiben immer mindestens eine Zeile hoch
  - Titel: Mindesthöhe 38.4px (32px × 1.2 line-height)
  - Stand: Mindesthöhe 12px (12px × 1.0 line-height)
  - Container bleiben auch bei leerem Text sichtbar
  - Non-breaking space (`\u00A0`) wird angezeigt wenn Text leer ist

- **Organisation-Updates erweitert:** Adresse und Webseite werden jetzt automatisch gespeichert
  - Adresse wird aus dem ausgewählten Krankenhaus zusammengesetzt (Straße, PLZ, Stadt)
  - Webseite wird aus dem Klinik-Atlas-Link übernommen
  - Beide Felder werden beim Speichern der Organisation aktualisiert

### 🐛 Fixed
- **Logo-Upload Container klickbar:** Firmenlogo- und Profilbild-Container öffnen jetzt direkt den Upload-Dialog
  - Klick auf den Container öffnet den Datei-Dialog (wie der kleine blaue Button)
  - Verhindert Konflikte mit Delete- und Upload-Buttons durch Event-Handling
  - Cursor-Styles und Hover-Effekte zeigen Klickbarkeit an

- **RLS-Policy für Organizations-Update:** "new row violates row-level security policy" Fehler behoben
  - UPDATE-Policy erweitert um `WITH CHECK` Klausel
  - Migration `fix_organization_update_rls_policy` angewendet
  - Benutzer können jetzt ihre Organisation korrekt aktualisieren

- **Storage-Policy für brandmarks Bucket:** Upload-Fehler beim Firmenlogo behoben
  - Policy prüft jetzt Organization-ID statt User-ID im Dateipfad
  - Migration `fix_brandmarks_storage_policy_for_organizations` angewendet
  - Benutzer können jetzt Logos für ihre Organisation hochladen

### 🔧 Technical
- **SOPHeader.js:**
  - `input` durch `textarea` ersetzt für mehrzeilige Titel
  - Auto-Resize-Logik für Textarea mit Mindesthöhen-Respektierung
  - `useEffect` angepasst für korrekte Höhenberechnung beim Fokus

- **Account.jsx:**
  - `useRef` für File-Inputs hinzugefügt
  - Click-Handler für Logo-Container implementiert
  - Adress-Zusammenstellung aus `selectedHospital` Daten

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

### 🔄 Changed
- **Box-Einstellungen umbenannt:** Menü heißt jetzt "Box individualisieren"
  - Reset-Icon (↺) am oberen rechten Rand zum Zurücksetzen auf Standardwerte
  - Setzt Name, Farbe und Zweispaltigkeit auf Default zurück
- **Zweispaltigkeit-Toggle verbessert:** Leere Platzhalter-Blöcke werden beim Deaktivieren automatisch entfernt
  - Wenn der automatisch erstellte rechte Spalten-Block leer bleibt, wird er beim Umschalten auf einspaltig gelöscht

### 🐛 Fixed
- **Drag-Ghost Darstellung:** Entfernt weißen Container um gedraggtes Element
  - Ghost zeigt jetzt die "echte" Box ohne zusätzlichen Rahmen
  - Hover-Buttons (Einstellungen, Hinzufügen, Löschen) werden im Ghost versteckt
  - Verwendet `drop-shadow` Filter statt `box-shadow` für natürlicheren Schatten
- **Drag-Cursor-Tracking:** Box folgt jetzt dem Cursor während des Drag & Drop
  - Custom `snapLeftToCursor` Modifier erstellt
  - Box wird so positioniert, dass der Cursor am Icon (linker Rand) bleibt
  - Verwendet gleiche Logik wie `snapCenterToCursor`, aber mit Offset nach rechts
- **Drop-Zonen optimiert:**
  - Spalten Drop-Zonen (links/rechts): 50% → 120px feste Breite
- **Drop-Indikatoren vereinheitlicht und an Column Resizer angepasst:**
  - Alle Indikatoren nutzen jetzt einheitlichen `DropLine` Komponenten-Stil
  - Optik wie Column Resizer: 4px Breite/Höhe, border-radius 2px, #3399FF
  - Vertikale Linien: Gleiche Höhen-Logik wie Resizer (oben/unten 0.75rem Abstand)
  - Entfernt: Dicke Endpunkte, Box-Shadow, gestrichelte Rahmen

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
