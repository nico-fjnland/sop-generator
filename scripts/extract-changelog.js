#!/usr/bin/env node

/**
 * Extrahiert den Changelog-Eintrag für eine bestimmte Version
 * Wird von release-it verwendet, um detaillierte GitHub Release Notes zu generieren
 * 
 * Unterstützt das "Keep a Changelog" Format:
 * ## [0.6.2] - 2025-12-05
 */

const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
const version = process.argv[2];

if (!version) {
  console.error('Usage: node extract-changelog.js <version>');
  process.exit(1);
}

try {
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const lines = changelog.split('\n');
  
  // Finde die Zeile mit dieser Version (Format: ## [0.6.2] - YYYY-MM-DD)
  const versionRegex = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`);
  let startLine = -1;
  let endLine = lines.length;
  
  for (let i = 0; i < lines.length; i++) {
    if (versionRegex.test(lines[i])) {
      startLine = i + 1; // Starte nach der Versionszeile
    } else if (startLine !== -1 && lines[i].startsWith('## [')) {
      // Nächste Version gefunden - hier aufhören
      endLine = i;
      break;
    } else if (startLine !== -1 && lines[i] === '---') {
      // Trennlinie gefunden - hier aufhören
      endLine = i;
      break;
    }
  }
  
  if (startLine === -1) {
    // Version nicht gefunden - Fallback
    console.log(`Release v${version}\n\nSiehe [CHANGELOG.md](https://github.com/nico-fjnland/sop-generator/blob/main/CHANGELOG.md) für Details.`);
    process.exit(0);
  }
  
  // Extrahiere den Inhalt
  let content = lines.slice(startLine, endLine).join('\n').trim();
  
  // Entferne leere Zeilen am Anfang und Ende
  content = content.replace(/^\n+/, '').replace(/\n+$/, '');
  
  if (!content || content.length < 10) {
    console.log(`Release v${version}\n\nSiehe [CHANGELOG.md](https://github.com/nico-fjnland/sop-generator/blob/main/CHANGELOG.md) für Details.`);
  } else {
    console.log(content);
  }
  
} catch (error) {
  console.error('Error:', error.message);
  console.log(`Release v${version}`);
}
