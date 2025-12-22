/**
 * Erstellt den Storage Bucket für Export-Caching über Supabase Management API
 */

const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'btwuvqpwfyqadavqzccs';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_bbf4c0ac065f85bf1f40803151c344757c165665';

const sqlScript = fs.readFileSync('supabase_setup_export_storage.sql', 'utf8');

// Supabase Management API: SQL ausführen
const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Storage Bucket erfolgreich erstellt!');
      console.log('Response:', data);
    } else {
      console.error('❌ Fehler beim Erstellen des Storage Buckets:');
      console.error('Status:', res.statusCode);
      console.error('Response:', data);
      console.log('\n💡 Alternative: Führen Sie das SQL-Script manuell im Dashboard aus:');
      console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Fehler bei der API-Anfrage:', error.message);
  console.log('\n💡 Alternative: Führen Sie das SQL-Script manuell im Dashboard aus:');
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
});

// SQL als Query senden
const body = JSON.stringify({
  query: sqlScript,
});

req.write(body);
req.end();

