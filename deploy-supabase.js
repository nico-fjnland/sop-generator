/**
 * Deployment Script für Supabase
 * Führt SQL aus und deployed Edge Function über Supabase Management API
 */

const fs = require('fs');
const path = require('path');

// Supabase Projekt-Informationen
const PROJECT_REF = 'btwuvqpwfyqadavqzccs';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

async function deploy() {
  console.log('🚀 Supabase Deployment gestartet...\n');

  // 1. SQL Script ausführen (Storage Bucket)
  console.log('📦 Schritt 1: Storage Bucket erstellen...');
  const sqlScript = fs.readFileSync(
    path.join(__dirname, 'supabase_setup_export_storage.sql'),
    'utf8'
  );
  
  console.log('SQL Script gelesen. Bitte führen Sie es manuell aus:');
  console.log('👉 https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
  console.log('\nSQL Script:\n');
  console.log(sqlScript);
  console.log('\n');

  // 2. Edge Function deployen
  console.log('📦 Schritt 2: Edge Function deployen...');
  const edgeFunctionCode = fs.readFileSync(
    path.join(__dirname, 'supabase/functions/export-document/index.ts'),
    'utf8'
  );
  
  console.log('Edge Function Code gelesen. Bitte deployen Sie manuell:');
  console.log('👉 https://supabase.com/dashboard/project/' + PROJECT_REF + '/functions');
  console.log('\nOder verwenden Sie die Supabase CLI:');
  console.log('   npx supabase login');
  console.log('   npx supabase link --project-ref ' + PROJECT_REF);
  console.log('   npx supabase functions deploy export-document');
  console.log('\n');

  console.log('✅ Deployment-Anleitung ausgegeben!');
  console.log('\n📝 Nächste Schritte:');
  console.log('   1. Führen Sie das SQL Script im Supabase Dashboard aus');
  console.log('   2. Deployen Sie die Edge Function (siehe Anleitung oben)');
  console.log('   3. Testen Sie den Export in der Anwendung');
}

deploy().catch(console.error);

