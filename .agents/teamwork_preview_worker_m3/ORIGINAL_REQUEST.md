## 2026-06-18T15:03:15Z
You are the teamwork_preview_worker for Milestone 5: Verification Script.
Your working directory is C:\Users\AMIT\.gemini\antigravity\scratch\yako-admin-portal\.agents\teamwork_preview_worker_m3.

Your task is to:
1. Write a Node.js verification script at `C:\Users\AMIT\.gemini\antigravity\scratch\yako-admin-portal\scripts\verify-metrics.js`.
2. The verification script should:
   - Load connection variables from `.env.local`.
   - Initialize the `@supabase/supabase-js` client.
   - Fetch the visitors from `intelligence_visitors` (specifically searching for `Azure Fox`, `Brave Wolf`, and `Golden Eagle`).
   - Programmatically assert and print whether:
     * Total visitor count is greater than 0.
     * Lead scores are calculated and non-zero (especially for Golden Eagle and Brave Wolf).
     * Traffic source distribution / sessions exist (ROI metrics).
   - If assertions pass, print "VERIFICATION SUCCESS" and exit with code 0. Otherwise print errors and exit with code 1.
3. Write a handoff report at `C:\Users\AMIT\.gemini\antigravity\scratch\yako-admin-portal\.agents\teamwork_preview_worker_m3\handoff.md` detailing the code and logic of the verification script.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, send a message to the orchestrator (conversation ID: 4ba38ed4-5d46-4b55-abfb-ca1c6a9e88ef) with a summary.
