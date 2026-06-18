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
  console.log('Error reading .env.local, using default url/key if set');
}


if (!supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Querying Supabase API Schema...');
  try {
    // 1. Fetch Swagger/OpenAPI spec from PostgREST root
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const schema = await response.json();
    console.log('Successfully fetched OpenAPI schema.');
    
    // Print definitions for tables: intelligence_visitors, intelligence_sessions, intelligence_events, reservations
    const targetTables = ['intelligence_visitors', 'intelligence_sessions', 'intelligence_events', 'reservations'];
    
    console.log('\n--- Table Columns and Definitions ---');
    for (const tableName of targetTables) {
      const definition = schema.definitions[tableName];
      if (definition) {
        console.log(`\nTable: ${tableName}`);
        console.log('Properties:');
        for (const [propName, propDetails] of Object.entries(definition.properties)) {
          console.log(`  - ${propName}: ${propDetails.type} (${propDetails.format || 'no format'})`);
        }
      } else {
        console.log(`\nTable: ${tableName} NOT found in definitions.`);
      }
    }

    // Print paths (functions/RPCs)
    console.log('\n--- Exposed Functions / RPC Paths ---');
    const paths = Object.keys(schema.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log(rpcs.join('\n'));

  } catch (error) {
    console.error('Failed to fetch schema:', error);
  }
}

main();
