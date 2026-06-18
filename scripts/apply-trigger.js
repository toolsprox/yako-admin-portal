const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, 'apply-trigger.sql');

async function applyTrigger() {
  console.log("Checking for SQL trigger migration script at:", sqlFilePath);
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error("SQL file not found!");
    process.exit(1);
  }

  console.log("To apply the trigger migration, choose one of the following methods:\n");
  
  console.log("Method 1: Supabase SQL Editor (Recommended)");
  console.log("1. Go to your Supabase Dashboard (https://supabase.com)");
  console.log("2. Open the SQL Editor");
  console.log("3. Copy the contents of scripts/apply-trigger.sql and paste them");
  console.log("4. Click 'Run'\n");

  console.log("Method 2: Supabase CLI (if installed locally)");
  console.log("Run the following command:");
  console.log("  supabase db execute --file scripts/apply-trigger.sql\n");

  console.log("Method 3: Direct connection via psql");
  console.log("If you have database credentials, run:");
  console.log("  psql -h db.gaokwzpweewqtvpnryoh.supabase.co -U postgres -d postgres -f scripts/apply-trigger.sql\n");

  // Attempting to check if Supabase CLI is installed locally and execute it if possible
  exec('supabase --version', (error, stdout, stderr) => {
    if (error) {
      console.log("Note: Supabase CLI is not detected in the current PATH. Please use Method 1.");
      return;
    }
    console.log("Supabase CLI detected (version " + stdout.trim() + "). Attempting to apply SQL...");
    // Note: This requires credentials to be configured in Supabase CLI (e.g. logged in and linked to project)
    exec('supabase db execute --file scripts/apply-trigger.sql', (err, out, errOut) => {
      if (err) {
        console.log("Supabase CLI execution failed (likely not linked to project or requires login):", errOut || err.message);
      } else {
        console.log("Supabase CLI successfully executed the migration:\n", out);
      }
    });
  });
}

applyTrigger();
