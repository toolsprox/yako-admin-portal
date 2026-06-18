## 2026-06-18T20:22:42+05:30
You are the teamwork_preview_worker for Milestone 1, 3, 4: Data Pipeline Implementation.
Your working directory is C:\Users\AMIT\.gemini\antigravity\scratch\yako-admin-portal\.agents\teamwork_preview_worker_m1.

Please implement the following fixes based on the explorer's reports:

1. **Traffic Simulation Script**:
   - Create a traffic simulation script `scripts/simulate-traffic.js` in the `yako-admin-portal` workspace.
   - The script should use `@supabase/supabase-js` and the connection variables in `.env.local` to inject 3 simulated visitor sessions:
     * Azure Fox (Casual Window Shopper): Desktop, direct traffic, Windows. Views Home page (`/`), sends a heartbeat.
     * Brave Wolf (Hungry Foodie): Mobile, Instagram UTM source, iOS. Views menu page (`/menu`), browses menu, views gallery (`/gallery`).
     * Golden Eagle (High-Intent Event Booker): Desktop, Google search, MacOS. Views Home, Gallery, starts reservation, clicks WhatsApp, submits a successful table booking (directly into `reservations` table).
   
2. **PostgreSQL Triggers & Functions (Supabase)**:
   - Check if the Supabase CLI is installed or if there is another way to apply SQL migrations or queries. If not, see if there is a way to execute the trigger migration using a Node.js script or another local utility.
   Wait! If you can run local scripts, maybe you can run SQL via the Supabase HTTP API if there is an admin API key, or look into the Supabase MCP tools.
   Wait, if you can run the SQL query using Supabase CLI `supabase db execute` or similar, check if that works. Or if you can connect using a connection string, try to find the password or check if direct postgres connection can be made.
   Wait! What if you cannot execute the migration because you lack database credentials?
   Let's check if the Supabase anon key has permissions to run SQL, or if there is a migration tool, or check if the table schema already has the columns but we just need to verify or implement a function.
   Wait, if there is a supabase schema file `supabase_location_update.sql`, try to run it.

3. **Visitor Tracking fix in yako-london-platform**:
   - In `yako-london-platform/components/BookingSystem.jsx`, replace any calls to `window.trackConversion` (which doesn't exist) with `window.trackYakoEvent` to correctly capture reservation and conversion clicks:
     * When reservation starts or finishes, call `window.trackYakoEvent`.
     * Let's look at `BookingSystem.jsx` and make sure it calls the correct tracking function with `reservation_complete` and `reservation_start`.

4. **Next.js Dashboard Fetching and UI calculations in yako-admin-portal**:
   - In `yako-admin-portal/src/app/(admin)/intelligence/page.js`:
     * If `first_visit_date` or `start_time` columns do not exist in the database, update the queries to order by `created_at` or another valid existing column (like `last_visit_at` or `created_at`). Let's verify which columns actually exist in the database first.
   - In `yako-admin-portal/src/components/AdminIntelligenceClient.jsx`:
     * Ensure that the average duration calculation is safe against `NaN` (e.g. check for undefined or null `duration_seconds` values and default them to 0).
     * Verify that all widgets render correctly and display non-zero values after running the simulation script.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, run standard builds and verify that everything compiles without errors. Write a handoff report detailing your changes and the build/test results at C:\Users\AMIT\.gemini\antigravity\scratch\yako-admin-portal\.agents\teamwork_preview_worker_m1\handoff.md.
Then send a message to the orchestrator (conversation ID: 4ba38ed4-5d46-4b55-abfb-ca1c6a9e88ef) with a summary.
