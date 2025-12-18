# Status-Meldungen Übersicht

Diese Datei enthält alle Status-Meldungen im SOP Editor.

---

## 🔵 Blau (Info/Saving/Exporting) `#39F`

| Text | Typ | Datei |
|------|-----|-------|
| Speichere SOP in die Cloud … | saving | Editor.js |
| Exportiere SOP als JSON-Datei … | exporting | Editor.js |
| Exportiere SOP als Word-Dokument … | exporting | Editor.js |
| Exportiere SOP als PDF-Datei … | exporting | Editor.js |

---

## 🟢 Grün (Success) `#52C41A`

| Text | Datei |
|------|-------|
| {Name des Nutzers} erfolgreich abgemeldet. | Editor.js |
| „{Name des Leitfadens}" unter Meine Leitfäden gespeichert. | Editor.js |
| JSON-Datei erfolgreich an Browser übergeben. | Editor.js |
| Word-Dokument erfolgreich an Browser übergeben. | Editor.js |
| PDF-Datei erfolgreich an Browser übergeben. | Editor.js |
| JSON-Datei erfolgreich importiert. | Editor.js |
| Profil erfolgreich aktualisiert. | Account.jsx |
| Logo der Organisation erfolgreich aktualisiert. | Account.jsx |
| Logo der Organisation wurde entfernt. | Account.jsx |
| E-Mail-Adresse aktualisiert! Bitte überprüfe deine neue E-Mail. | Account.jsx |
| Passwort erfolgreich aktualisiert! | Account.jsx |
| Dein Avatar wurde erfolgreich aktualisiert. | Account.jsx |
| „{Name des Leitfadens}" wurde gelöscht. | Account.jsx |
| {Anzahl} SOPs erfolgreich importiert. | Account.jsx |
| Deine Daten wurden gelöscht. | Account.jsx |
| Dein Account wurde unwiderruflich gelöscht. | Account.jsx |
| Fachgebiet zu „{neues Fachgebiet}" geändert. | Account.jsx |
| Fachgebiet wurde entfernt. | Account.jsx |
| JSON-Datei erfolgreich an Browser übergeben. | Account.jsx |
| {Anzahl} SOPs als ZIP-Datei an Browser übergeben. | Account.jsx |

---

## 🔴 Rot (Error) `#EB5547`

| Text | Datei |
|------|-------|
| Ausloggen fehlgeschlagen. Bitte versuche es erneut. | Editor.js |
| Hierfür ist ein Account erforderlich. Bitte melde dich an. | Editor.js |
| Die Organisation konnte nicht gefunden werden. | Editor.js |
| Speichern fehlgeschlagen. Bitte versuche es erneut. | Editor.js |
| JSON-Export fehlgeschlagen. Bitte versuche es erneut. | Editor.js |
| Word-Export fehlgeschlagen. Bitte versuche es erneut. | Editor.js |
| PDF-Export fehlgeschlagen. Bitte versuche es erneut. | Editor.js |
| Import fehlgeschlagen. Bitte versuche es erneut. | Editor.js |
| Fehler beim Laden des Dokuments. | Editor.js |
| Aktualisierung fehlgeschlagen. Bitte versuche es erneut. | Account.jsx |
| Löschen fehlgeschlagen. Bitte versuche es erneut. | Account.jsx |
| Bitte gib eine neue E-Mail Adresse ein. | Account.jsx |
| E-Mail konnte nicht aktualisiert werden. Fehler: {Fehler}. Bitte versuche es erneut. | Account.jsx |
| Bitte gib ein neues Passwort ein. | Account.jsx |
| Passwörter stimmen nicht überein. | Account.jsx |
| Das Passwort muss mindestens 6 Zeichen lang sein. | Account.jsx |
| Passwort konnte nicht aktualisiert werden. Fehler: {Fehler}. Bitte versuche es erneut. | Account.jsx |
| Die Organisation konnte nicht gefunden werden. | Account.jsx |
| Import fehlgeschlagen. Bitte versuche es erneut. | Account.jsx |
| Bitte gib "LÖSCHEN" ein, um fortzufahren. | Account.jsx |
| Fehler beim Löschen des Accounts: {Fehler}. | Account.jsx |
| Fachgebiet konnte nicht aktualisiert werden. Bitte versuche es erneut. | Account.jsx |
| Keine Dokumente ausgewählt. | Account.jsx |
| Export fehlgeschlagen. Bitte versuche es erneut. | Account.jsx |

---

## 🟡 Gelb (Warning) `#FAAD14`

| Text | Datei |
|------|-------|
| Live-Chat aktuell nicht verfügbar. | HelpButton.js |
| {X} importiert, {Y} fehlgeschlagen. | Account.jsx |

---

## 🔴 Bestätigungs-Dialoge (Confirm) `#EB5547`

Neue Promise-basierte Confirm-Dialoge mit Buttons.

**Verwendung:**
```javascript
const { showConfirm } = useStatus();

const confirmed = await showConfirm('Bitte bestätige den Löschversuch. Alle Daten gehen verloren.', {
  confirmLabel: 'Bestätigen',
  cancelLabel: 'Abbrechen'
});

if (confirmed) {
  // Aktion durchführen
}
```

---

## Notizen

- **Dynamische Texte:** Einträge mit `{...}` enthalten variable Inhalte
- **Dauer:** Success/Info = 2.5s, Warning = 3.5s, Error = 4s, Saving/Exporting/Confirm = persistent
- **Alle Browser-Alerts wurden entfernt** und durch den StatusIndicator ersetzt

---

*Letzte Aktualisierung: 2025-12-18*
