# Project: Admin Intelligence Dashboard Fix

## Architecture
The Admin Intelligence Dashboard features are split across:
1. **Frontend / Admin Portal (`yako-admin-portal`)**: Displays Visitor CRM, Lead Scores, Marketing & ROI, and Audience/Segments metrics based on data fetched from Supabase.
2. **Backend / Main Website (`yako-london-platform`)**: Captures user activities (sessions, pages, clicks) and sends events to the Supabase tracking database.
3. **Database (Supabase)**: Stores tracking tables (`intelligence_visitors`, `intelligence_sessions`, `intelligence_events`) and handles updates via PL/pgSQL functions like `track_event`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Test Suite | Design E2E test infra and write simulation/test scripts. | none | DONE |
| 2 | Pipeline Exploration | Explore tracking, database, and calculations. Identify gaps. | M1 | DONE |
| 3 | Tracking & DB Fixes | Repair tracking logic in website and update database schemas/functions. | M2 | DONE |
| 4 | Admin Portal Fixes | Fix metric retrieval and calculation logic in admin dashboard UI. | M3 | DONE |
| 5 | E2E & Audit Gate | Run tests, verify non-zero values in UI, pass forensic audit. | M4 | DONE |

## Interface Contracts
### Website Tracking ↔ Supabase
- The website invokes `track_event` in Supabase with parameters (visitor_id, session_id, event_type, event_data, etc.).
- Event Types: `page_view`, `lead_conversion`, `click`, etc.

### Supabase ↔ Admin Portal
- Admin portal queries `intelligence_visitors`, `intelligence_sessions`, and `intelligence_events` to compute:
  - Lead Scores: derived from page views, interactions, lead events.
  - Marketing & ROI: derived from session traffic sources, referrers, and value attributes.
  - Visitor CRM: profiles, total visits, device info, browser info.
  - Audience/Segments: categories of visitors.
