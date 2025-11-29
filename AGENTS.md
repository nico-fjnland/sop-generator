# Agentenregeln für den SOP Editor

Diese Datei enthält allgemeingültige Regeln für KI-Agenten, die an diesem Projekt arbeiten.

---

## 📋 Dokumentationspflichten

### 1. Changelog-Einträge

Bei **jeder signifikanten Änderung** muss ein Eintrag in der `CHANGELOG.md` erstellt werden:

```markdown
## [x.x.x] - YYYY-MM-DD

### Category
- Beschreibung der Änderung
```

**Signifikante Änderungen umfassen:**
- Neue Features oder Komponenten
- Entfernte Features oder Dateien
- Geänderte APIs oder Datenstrukturen
- Bug-Fixes
- Dependency-Updates (hinzugefügt/entfernt/aktualisiert)
- Sicherheits-Updates

**Nicht dokumentiert werden müssen:**
- Reine Code-Formatierung
- Kommentar-Änderungen
- Temporäre Debug-Ausgaben

### 2. Projektdokumentation

Strukturelle Änderungen müssen in der `PROJECT_DOCUMENTATION.md` festgehalten werden:

- **Neue Komponenten:** Im Architektur-Baum und ggf. in der Komponenten-Übersicht
- **Entfernte Komponenten:** Aus dem Architektur-Baum entfernen
- **Neue Dependencies:** Im Technologie-Stack dokumentieren
- **Entfernte Dependencies:** Aus dem Technologie-Stack entfernen
- **Neue Kontexte/Hooks:** In den entsprechenden Abschnitten ergänzen
- **Geänderte Datenstrukturen:** Schema-Dokumentation aktualisieren

---

## 🔢 Versionierung

### Semantic Versioning (SemVer)

Die Version wird ausschließlich in `package.json` gepflegt:

```
MAJOR.MINOR.PATCH
```

| Typ | Wann erhöhen? | Beispiel |
|-----|---------------|----------|
| **PATCH** | Bug-Fixes, kleine Änderungen | 0.2.0 → 0.2.1 |
| **MINOR** | Neue Features, Refactoring | 0.2.1 → 0.3.0 |
| **MAJOR** | Breaking Changes | 0.3.0 → 1.0.0 |

### Versions-Update durchführen

```bash
npm version patch  # Bug-Fix
npm version minor  # Feature
npm version major  # Breaking Change
```

Oder manuell in `package.json` ändern.

---

## 🧹 Code-Bereinigung

### Vor dem Entfernen von Code prüfen

1. **Grep-Suche** nach Imports und Verwendungen
2. **Abhängigkeiten** in `package.json` prüfen
3. **Dokumentation** aktualisieren

### Ungenutzte Dependencies entfernen

```bash
# Nach Entfernen aus package.json
npm install
```

---

## 📁 Dateistruktur

### Neue Dateien erstellen

- Komponenten: `src/components/[Name].js` oder `src/components/[category]/[Name].js`
- Hooks: `src/hooks/use[Name].js`
- Kontexte: `src/contexts/[Name]Context.js`
- Services: `src/services/[name]Service.js`
- Utils: `src/utils/[name].js`

### Dateien benennen

- **Komponenten:** PascalCase (`ContentBoxBlock.js`)
- **Hooks:** camelCase mit `use`-Prefix (`useEditorHistory.js`)
- **Utils/Services:** camelCase (`exportUtils.js`)
- **CSS:** Gleicher Name wie Komponente (`FlowchartBlock.css`)

---

## ✅ Checkliste für Änderungen

- [ ] Code-Änderung durchgeführt
- [ ] Linter-Fehler behoben
- [ ] `CHANGELOG.md` aktualisiert (bei signifikanten Änderungen)
- [ ] `PROJECT_DOCUMENTATION.md` aktualisiert (bei strukturellen Änderungen)
- [ ] `package.json` Version erhöht (bei Releases)
- [ ] Ungenutzte Imports entfernt
- [ ] `npm install` ausgeführt (bei Dependency-Änderungen)

---

## 🚫 Verbotene Aktionen

- Keine Dateien löschen ohne vorherige Grep-Suche
- Keine Dependencies entfernen ohne Verwendungsprüfung
- Keine Breaking Changes ohne MAJOR-Version-Bump
- Keine strukturellen Änderungen ohne Dokumentations-Update

---

*Letzte Aktualisierung: 2025-11-29*

