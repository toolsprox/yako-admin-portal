const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to parse environment variables from .env.local
function parseEnvValue(val) {
  if (!val) return '';
  let cleaned = val.trim();
  // Strip quotes if they exist
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
}

// 1. Read Supabase connection details from .env.local
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  console.log(`Loading environment variables from: ${envPath}`);
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = parseEnvValue(trimmed.split('NEXT_PUBLIC_SUPABASE_URL=')[1]);
    }
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = parseEnvValue(trimmed.split('NEXT_PUBLIC_SUPABASE_ANON_KEY=')[1]);
    }
  }
} catch (e) {
  console.error('Error reading .env.local:', e.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local");
  process.exit(1);
}

// 2. Initialize the Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  console.log("\n==========================================");
  console.log("Customer Intelligence Verification Script");
  console.log("==========================================\n");

  try {
    // A. Fetch all visitors to check total count
    console.log("Fetching visitors from 'intelligence_visitors'...");
    const { data: allVisitors, error: visitorsError } = await supabase
      .from('intelligence_visitors')
      .select('*');

    if (visitorsError) {
      throw new Error(`Failed to fetch visitors: ${visitorsError.message}`);
    }

    const totalVisitorCount = allVisitors ? allVisitors.length : 0;
    console.log(`- Total visitor count in DB: ${totalVisitorCount}`);

    // Assertion: Total visitor count is greater than 0
    if (totalVisitorCount <= 0) {
      throw new Error("Assertion Failed: Total visitor count is 0. Please run the traffic simulation script first.");
    }
    console.log("✓ Assertion Passed: Total visitor count is greater than 0.");

    // B. Search for specific visitors: Azure Fox, Brave Wolf, Golden Eagle
    console.log("\nSearching for target visitors: Azure Fox, Brave Wolf, Golden Eagle...");
    const targetNames = ['Azure Fox', 'Brave Wolf', 'Golden Eagle'];
    const targets = allVisitors.filter(v => targetNames.includes(v.dummy_name));

    console.log(`Found ${targets.length} out of ${targetNames.length} target visitors:`);
    for (const name of targetNames) {
      const visitor = targets.find(v => v.dummy_name === name);
      if (visitor) {
        console.log(`- ${name}: Found! (ID: ${visitor.id}, Lead Score: ${visitor.lead_score}, Classification: ${visitor.intent_classification}, Interest: ${visitor.primary_interest})`);
      } else {
        console.log(`- ${name}: NOT FOUND`);
      }
    }

    // Assertion: Verify presence of Golden Eagle and Brave Wolf
    const goldenEagle = targets.find(v => v.dummy_name === 'Golden Eagle');
    const braveWolf = targets.find(v => v.dummy_name === 'Brave Wolf');

    if (!goldenEagle) {
      throw new Error("Assertion Failed: 'Golden Eagle' was not found in intelligence_visitors.");
    }
    if (!braveWolf) {
      throw new Error("Assertion Failed: 'Brave Wolf' was not found in intelligence_visitors.");
    }

    // Assertion: Lead scores are calculated and non-zero
    if (typeof goldenEagle.lead_score !== 'number' || goldenEagle.lead_score === 0) {
      throw new Error(`Assertion Failed: 'Golden Eagle' lead score is zero or invalid: ${goldenEagle.lead_score}`);
    }
    if (typeof braveWolf.lead_score !== 'number' || braveWolf.lead_score === 0) {
      throw new Error(`Assertion Failed: 'Brave Wolf' lead score is zero or invalid: ${braveWolf.lead_score}`);
    }
    console.log("✓ Assertion Passed: Lead scores are calculated and non-zero.");
    console.log(`  * Golden Eagle Lead Score: ${goldenEagle.lead_score}`);
    console.log(`  * Brave Wolf Lead Score: ${braveWolf.lead_score}`);

    // C. Traffic source distribution / sessions exist (ROI metrics)
    console.log("\nFetching sessions from 'intelligence_sessions'...");
    const { data: sessions, error: sessionsError } = await supabase
      .from('intelligence_sessions')
      .select('*');

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    const totalSessions = sessions ? sessions.length : 0;
    console.log(`- Total session count in DB: ${totalSessions}`);

    // Assertion: Sessions count > 0
    if (totalSessions <= 0) {
      throw new Error("Assertion Failed: Total session count is 0.");
    }

    // Calculate traffic source distribution
    const sourceDistribution = {};
    for (const session of sessions) {
      const source = session.traffic_source || 'Direct';
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
    }

    // Assertion: Traffic source distribution exists (ROI metrics)
    const sourcesCount = Object.keys(sourceDistribution).length;
    if (sourcesCount === 0) {
      throw new Error("Assertion Failed: No traffic source distribution exists.");
    }

    console.log(`✓ Assertion Passed: Traffic source distribution exists (${sourcesCount} distinct sources).`);
    console.log("Traffic Source Distribution (ROI Metrics):");
    for (const [source, count] of Object.entries(sourceDistribution)) {
      console.log(`  * ${source}: ${count} session(s) (${((count / totalSessions) * 100).toFixed(1)}%)`);
    }

    console.log("\n==========================================");
    console.log("VERIFICATION SUCCESS");
    console.log("==========================================\n");
    process.exit(0);

  } catch (error) {
    console.error("\n==========================================");
    console.error("VERIFICATION FAILED");
    console.error(`Error: ${error.message}`);
    console.error("==========================================\n");
    process.exit(1);
  }
}

runVerification();
