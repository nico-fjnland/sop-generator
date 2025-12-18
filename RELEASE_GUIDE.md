# Release-Prozess für SOP Editor

## Ablauf

```bash
cd /Users/nico/sop-generator
git add -A
git commit -m "v[VERSION]: Beschreibung"
git push
npm run release -- --no-increment --ci
```

## Wichtig

- NIEMALS manuell `git tag` erstellen - release-it macht das automatisch
- IMMER `npm run release` verwenden, nicht `npx release-it` (wegen GITHUB_TOKEN)
- `--no-increment` wenn Version bereits in package.json gesetzt
- CHANGELOG.md muss aktuell sein - Release Notes werden daraus extrahiert

## Falls Tag bereits existiert

```bash
git tag -d v[VERSION]
git push origin :refs/tags/v[VERSION]
npm run release -- --no-increment --ci
```

## Ein-Befehl

```bash
cd /Users/nico/sop-generator && git add -A && git commit -m "v[VERSION]: Beschreibung" && git push && npm run release -- --no-increment --ci
```
