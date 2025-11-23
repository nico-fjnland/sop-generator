# TipTap Migration - Test Guide

## Was wurde geändert?

### 1. Neue Implementierung
- **TextBlock.js** wurde komplett durch eine TipTap-basierte Version ersetzt
- **TextBlock.css** wurde hinzugefügt für TipTap-spezifisches Styling
- **TextBlock.backup.js** enthält die alte Implementierung als Backup
- **InlineTextToolbar.js** wurde angepasst, um sowohl mit TipTap als auch mit der alten Implementierung zu funktionieren

### 2. Technische Verbesserungen
- ✅ Ersetzt `document.execCommand` durch TipTap's moderne API
- ✅ Automatisches Cursor-Management durch ProseMirror
- ✅ ~70% weniger Code (von 1122 auf ~200 Zeilen)
- ✅ Stabilere Formatierungsoperationen
- ✅ Gleiche UI/UX - Benutzer merken keinen Unterschied

### 3. Installierte Pakete
```bash
@tiptap/react
@tiptap/pm
@tiptap/starter-kit
@tiptap/extension-underline
@tiptap/extension-subscript
@tiptap/extension-superscript
@tiptap/extension-bubble-menu
```

## Was muss getestet werden?

### A. Textformatierung in ContentBoxen

1. **Fett/Bold**
   - Text markieren und **Fett** Button in Toolbar klicken
   - Markdown-Shortcut: `**text**` + Leerzeichen → sollte fett werden
   - Erwartung: Text wird fett formatiert

2. **Kursiv/Italic**
   - Text markieren und *Kursiv* Button klicken
   - Markdown-Shortcut: `*text*` + Leerzeichen → sollte kursiv werden
   - Erwartung: Text wird kursiv formatiert

3. **Unterstrichen/Underline**
   - Text markieren und Unterstreichen Button klicken
   - Erwartung: Text wird unterstrichen

4. **Kleinere Schrift (10px)**
   - Text markieren und TextAa Button klicken
   - Erwartung: Text wird auf 10px verkleinert

5. **Hochgestellt/Superscript**
   - Text markieren und Hochgestellt Button klicken
   - Erwartung: Text wird hochgestellt (z.B. für x²)

6. **Tiefgestellt/Subscript**
   - Text markieren und Tiefgestellt Button klicken
   - Erwartung: Text wird tiefgestellt (z.B. für H₂O)

7. **Formatierung entfernen**
   - Formatierten Text markieren und Formatierung-entfernen Button klicken
   - Erwartung: Alle Formatierungen werden entfernt

### B. Aufzählungslisten (Bullets)

1. **Markdown-Shortcut**
   - `- ` oder `* ` am Zeilenanfang tippen
   - Erwartung: Wird automatisch zu Bullet-Punkt (•)

2. **Neue Bullet-Punkte**
   - Enter in einer Bullet-Liste drücken
   - Erwartung: Neuer Bullet-Punkt wird erstellt

3. **Liste beenden**
   - Enter in leerem Bullet-Punkt drücken
   - Erwartung: Bullet wird entfernt, normale Textzeile

### C. Toolbar-Verhalten

1. **Bubble Menu erscheint**
   - Text in ContentBox markieren
   - Erwartung: Toolbar erscheint oberhalb der Selektion

2. **Active States**
   - Fett formatierten Text markieren
   - Erwartung: Fett-Button ist hervorgehoben (pressed state)

3. **Toolbar verschwindet**
   - Selektion aufheben
   - Erwartung: Toolbar verschwindet

### D. Content-Synchronisation

1. **Initialer Content**
   - Bestehende ContentBox mit Inhalt öffnen
   - Erwartung: Content wird korrekt angezeigt

2. **Content-Änderungen**
   - Text ändern, speichern, neu laden
   - Erwartung: Änderungen bleiben erhalten

3. **Undo/Redo**
   - Text ändern, Undo (Ctrl+Z) verwenden
   - Erwartung: Editor-Undo funktioniert

### E. Export-Funktionen

1. **JSON Export**
   - Dokument mit formatierten ContentBoxen exportieren
   - JSON-Datei prüfen: HTML-Content sollte korrekt gespeichert sein
   - Erwartung: `<p><strong>Fett</strong> <em>Kursiv</em></p>` etc.

2. **JSON Import**
   - Exportierte JSON wieder importieren
   - Erwartung: Alle Formatierungen sind erhalten

3. **Word Export**
   - Als Word exportieren
   - In Word öffnen und Formatierungen prüfen
   - Erwartung: Fett, Kursiv, Listen etc. sind erhalten

4. **PDF Export**
   - Als PDF exportieren
   - PDF öffnen und Formatierungen prüfen
   - Erwartung: Alle Formatierungen sind sichtbar

### F. Edge Cases

1. **Leere ContentBox**
   - Neue ContentBox erstellen (leer lassen)
   - Erwartung: Placeholder "Text eingeben..." wird angezeigt

2. **Sehr langer Text**
   - Mehrere Absätze in ContentBox einfügen
   - Erwartung: Text wird korrekt umgebrochen

3. **Copy & Paste**
   - Formatierten Text von außen einfügen
   - Erwartung: Formatierungen werden übernommen (aber sanitized)

4. **Mehrere ContentBoxen**
   - Mehrere ContentBoxen auf einer Seite
   - In verschiedenen Boxen arbeiten
   - Erwartung: Kein Konflikt zwischen Editoren

### G. TextBlock außerhalb von ContentBoxen

1. **Normale TextBlocks**
   - TextBlock außerhalb von ContentBoxen (z.B. bei Überschriften)
   - Erwartung: Funktioniert wie vorher (einfaches Textarea, keine Formatierung)

## Bekannte Unterschiede zur alten Version

1. **HTML-Output**: TipTap wrapped Text in `<p>` Tags (ProseMirror-Standard)
   - Alt: `<strong>Text</strong>`
   - Neu: `<p><strong>Text</strong></p>`
   - Dies sollte kein Problem sein, wird beim Export korrekt behandelt

2. **Bullet-Darstellung**: TipTap verwendet native `<ul><li>` statt Unicode-Bullets
   - Alt: `• Text` (Unicode bullet)
   - Neu: `<ul><li>Text</li></ul>` (semantisches HTML)
   - Vorteil: Bessere Semantik, konsistenteres Styling

## Rollback-Plan (falls nötig)

Falls kritische Probleme auftreten:

1. Alte Version wiederherstellen:
```bash
cp src/components/blocks/TextBlock.backup.js src/components/blocks/TextBlock.js
```

2. InlineTextToolbar zurücksetzen (usePortal-Prop entfernen)

3. TipTap.css entfernen
```bash
rm src/components/blocks/TextBlock.css
```

## Performance-Verbesserungen

Die neue Version sollte spürbar performanter sein:
- Weniger Re-Renders
- Kein manuelles Cursor-Restore
- Effizientere State-Synchronisation
- Weniger komplexe Event-Handler

## Nächste Schritte

Nach erfolgreichem Testing:
1. ✅ Backup entfernen (TextBlock.backup.js) - optional
2. ✅ Diese Test-Dokumentation aktualisieren mit Testergebnissen
3. ✅ Bei Bedarf weitere Formatierungsoptionen hinzufügen (z.B. Farben, Links)

