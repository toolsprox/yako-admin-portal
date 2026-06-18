# Original User Request

## Initial Request — 2026-06-18T20:11:39+05:30

The goal is to debug and fix the Admin Intelligence dashboard (`yako-admin-portal`) so that the Visitor CRM, Lead Scores, Marketing & ROI, and Audience/Segments metrics correctly capture, calculate, and display real-time tracking data from the Supabase backend.

Working directory: `C:\Users\AMIT\.gemini\antigravity\scratch\yako-admin-portal`
Related backend directory: `C:\Users\AMIT\.gemini\antigravity\scratch\yako-london-platform`
Integrity mode: development

## Requirements

### R1. Restore Metric Calculations
The Admin Intelligence dashboard metrics (Visitor CRM, Lead Scores, Marketing/ROI, Audience/Segments) must correctly populate with data. Currently, they are not capturing or incrementing.

### R2. End-to-End Investigation
The agent team must investigate the entire data pipeline and fix whichever component is causing the failure. This could involve fixing the tracking logic in the main website, correcting the database schema, or repairing the calculation logic in the Admin dashboard UI.

### R3. Controlled Infrastructure
If you need to test live traffic, write and use local programmatic simulation scripts rather than deploying to public clouds or relying solely on manual browser clicking.

## Acceptance Criteria

### Simulation & Verification
- [ ] A local test script must successfully inject 3 distinct simulated visitor sessions with varying behaviors into the local or connected Supabase database.
- [ ] After injection, the programmatic fetching logic for the Admin dashboard must return non-zero values for Lead Scores, ROI, and total visitor counts.
- [ ] The React UI components in the Admin portal must correctly render these non-zero metric values without console errors.
