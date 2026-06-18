const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = 'https://gaokwzpweewqtvpnryoh.supabase.co';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.log('Error reading .env.local:', e.message);
}

if (!supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const outputFile = path.join(__dirname, '.agents', 'teamwork_preview_explorer_m2', 'db_metadata.json');
  console.log('Querying Supabase API Schema...');
  const result = {};

  try {
    // 1. Fetch Swagger/OpenAPI spec from PostgREST root
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (response.ok) {
      const schema = await response.json();
      result.definitions = schema.definitions;
      result.paths = schema.paths;
      console.log('OpenAPI schema fetched.');
    } else {
      result.openapi_error = `HTTP ${response.status}`;
    }
  } catch (error) {
    result.openapi_error = error.message;
  }

  // 2. Query some actual rows to verify columns
  const tables = ['intelligence_visitors', 'intelligence_sessions', 'intelligence_events', 'reservations'];
  result.table_samples = {};
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        result.table_samples[table] = { error: error.message };
      } else {
        result.table_samples[table] = { data };
      }
    } catch (error) {
      result.table_samples[table] = { error: error.message };
    }
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log('Saved DB metadata to:', outputFile);
}

main();
