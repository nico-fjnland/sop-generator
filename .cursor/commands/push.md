Erstelle ein Release für Version [VERSION] des SOP Editors.

**Schritte:**
1. Aktuelle Version in package.json prüfen und auf [VERSION] aktualisieren (falls nicht bereits gesetzt)
2. Git Status prüfen - alle relevanten Änderungen sollten vorhanden sein
3. CHANGELOG.md prüfen - muss einen vollständigen Eintrag für [VERSION] mit Datum enthalten
4. .cursor/debug.log NICHT committen (falls vorhanden, ignorieren)
5. Alle Änderungen stagen: `git add -A` (oder gezielt ohne debug.log)
6. Commit erstellen mit Message: `v[VERSION]: [Kurze Beschreibung der Hauptänderungen]`
7. Zu GitHub pushen: `git push origin main`
8. Release erstellen mit: `npm run release -- --no-increment --ci`

**Wichtig:**
- NIEMALS manuell `git tag` erstellen - release-it macht das automatisch
- IMMER `npm run release` verwenden, nicht `npx release-it` (wegen GITHUB_TOKEN aus .env)
- `--no-increment` Flag ist erforderlich, da Version bereits in package.json gesetzt wurde
- `--ci` Flag für non-interactive Mode (wichtig für automatisierte Abläufe)
- CHANGELOG.md muss vollständig und aktuell sein - Release Notes werden automatisch daraus extrahiert
- Wenn Tag bereits existiert, muss er zuerst gelöscht werden: `git tag -d v[VERSION]` und `git push origin :refs/tags/v[VERSION]`

**Nach erfolgreichem Release:**
- Prüfe den Release-Link in der Ausgabe
- Verifiziere, dass Release Notes korrekt auf GitHub erscheinen

**Fehlerbehandlung:**
- Bei "Tag already exists": Tag lokal und remote löschen, dann Release erneut ausführen
- Bei "No changes to commit": Normal, wenn alles bereits committed ist - release-it erstellt trotzdem den Tag
- Bei GitHub-Authentifizierungsfehlern: GITHUB_TOKEN in .env prüfen