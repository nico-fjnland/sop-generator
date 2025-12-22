#!/bin/bash

# Deployment Script für Supabase Edge Function
# Führt alle notwendigen Schritte aus, um die Edge Function zu deployen

set -e

echo "🚀 Supabase Edge Function Deployment"
echo "======================================"
echo ""

# Prüfe ob Supabase CLI verfügbar ist
if ! command -v supabase &> /dev/null && ! npx supabase --version &> /dev/null; then
    echo "❌ Supabase CLI nicht gefunden"
    echo "📦 Installiere Supabase CLI..."
    
    # Versuche Installation über Homebrew (macOS)
    if command -v brew &> /dev/null; then
        echo "Installing via Homebrew..."
        brew install supabase/tap/supabase
    else
        echo "⚠️  Bitte installieren Sie Supabase CLI manuell:"
        echo "   brew install supabase/tap/supabase"
        echo "   oder"
        echo "   npm install -g supabase"
        exit 1
    fi
fi

# Verwende npx falls supabase nicht global installiert ist
SUPABASE_CMD="supabase"
if ! command -v supabase &> /dev/null; then
    SUPABASE_CMD="npx supabase"
fi

echo "✅ Supabase CLI gefunden"
echo ""

# Prüfe ob bereits eingeloggt
echo "🔐 Prüfe Supabase Login..."
if ! $SUPABASE_CMD projects list &> /dev/null; then
    echo "⚠️  Bitte melden Sie sich bei Supabase an:"
    echo "   $SUPABASE_CMD login"
    echo ""
    echo "Öffnen Sie den angezeigten Link im Browser und folgen Sie den Anweisungen."
    exit 1
fi

echo "✅ Bereits eingeloggt"
echo ""

# Link zum Projekt
PROJECT_REF="btwuvqpwfyqadavqzccs"
echo "🔗 Verlinke Projekt: $PROJECT_REF"
$SUPABASE_CMD link --project-ref $PROJECT_REF || {
    echo "⚠️  Projekt bereits verlinkt oder Fehler beim Verlinken"
    echo "   Fortfahren mit Deployment..."
}

echo ""

# Deploy Edge Function
echo "📦 Deploye Edge Function: export-document"
$SUPABASE_CMD functions deploy export-document || {
    echo "❌ Deployment fehlgeschlagen"
    echo ""
    echo "📋 Alternative: Manuelles Deployment über Supabase Dashboard"
    echo "   1. Öffnen Sie: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
    echo "   2. Klicken Sie auf 'Create a new function'"
    echo "   3. Name: export-document"
    echo "   4. Kopieren Sie den Inhalt von supabase/functions/export-document/index.ts"
    echo "   5. Klicken Sie auf 'Deploy'"
    exit 1
}

echo ""
echo "✅ Edge Function erfolgreich deployed!"
echo ""
echo "📝 Nächste Schritte:"
echo "   1. Führen Sie supabase_setup_export_storage.sql im SQL Editor aus (optional, für Caching)"
echo "   2. Testen Sie den Export in der Anwendung"
echo ""

