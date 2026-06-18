# Handoff Report — Milestone 2: Pipeline Exploration & Gap Analysis

## 1. Observation

A detailed static code analysis was performed across the `yako-admin-portal` and `yako-london-platform` workspaces. The following configurations and files were examined:
1. `yako-admin-portal/src/app/(admin)/intelligence/page.js`
2. `yako-admin-portal/src/components/AdminIntelligenceClient.jsx`
3. `yako-london-platform/components/AnalyticsProvider.jsx`
4. `yako-london-platform/components/BookingSystem.jsx`
5. `yako-london-platform/app/api/reservations/route.js`
6. `yako-london-platform/supabase_location_update.sql`
7. `.env.local` connection files

Below are the exact database schema structures and code snippets extracted during the investigation.

### Database Columns (Deduced from SQL and App Queries)
* **`intelligence_visitors`**:
  * `id` (UUID, primary key)
  * `device_type` (TEXT)
  * `browser` (TEXT)
  * `os` (TEXT)
  * `geo_city` (TEXT)
  * `geo_country` (TEXT)
  * `geo_lat` (TEXT)
  * `geo_lng` (TEXT)
  * `dummy_name` (TEXT)
  * `fingerprint` (TEXT)
  * `total_visits` (INTEGER)
  * `last_visit_at` (TIMESTAMP)
  * `first_visit_date` (TIMESTAMP) — referenced in admin query: `page.js` line 13 (`.order('first_visit_date', ...)`)
  * `lead_score` (INTEGER) — referenced in `AdminIntelligenceClient.jsx` (`v.lead_score`)
  * `intent_classification` (TEXT) — referenced in `AdminIntelligenceClient.jsx` (`v.intent_classification`)
  * `primary_interest` (TEXT) — referenced in `AdminIntelligenceClient.jsx` (`v.primary_interest`)
* **`intelligence_sessions`**:
  * `id` (UUID, primary key)
  * `visitor_id` (UUID, foreign key)
  * `landing_page` (TEXT)
  * `traffic_source` (TEXT)
  * `referrer` (TEXT)
  * `duration_seconds` (INTEGER) — referenced in `AdminIntelligenceClient.jsx` (`s.duration_seconds`)
  * `created_at` (TIMESTAMP)
  * `start_time` (TIMESTAMP) — referenced in admin query: `page.js` line 20 (`.order('start_time', ...)`)
* **`intelligence_events`**:
  * `id` (BIGINT or UUID, primary key)
  * `visitor_id` (UUID, foreign key)
  * `session_id` (UUID, foreign key)
  * `event_type` (TEXT)
  * `event_data` (JSONB)
  * `created_at` (TIMESTAMP)
* **`reservations`**:
  * `id` (BIGINT or UUID, primary key)
  * `customer_name` (TEXT)
  * `customer_phone` (TEXT)
  * `date` (TEXT or DATE)
  * `time` (TEXT or TIME)
  * `guests` (INTEGER)
  * `status` (TEXT, defaults to `'pending'`)
  * `created_at` (TIMESTAMP)

### Expose Methods vs Conversion Clicks
* **Analytics Exposing** (in `yako-london-platform/components/AnalyticsProvider.jsx`, line 173):
  ```javascript
  window.trackYakoEvent = async (eventType, eventData = {}) => { ... }
  ```
* **Conversion Calls** (in `yako-london-platform/components/BookingSystem.jsx`, lines 43-46 and 69-71):
  ```javascript
  if (typeof window !== 'undefined' && window.trackConversion) {
    window.trackConversion('booking_request', formData);
  }
  ```

---

## 2. Logic Chain

1. **Missing Calculation Engine**: 
   - Neither the frontend client code (Yako London Platform) nor the admin portal contains logic to calculate or set `lead_score`, `intent_classification`, or `primary_interest`.
   - The Postgres RPC function `track_event` (defined in `supabase_location_update.sql`) merely inserts rows into `intelligence_visitors`, `intelligence_sessions`, and `intelligence_events`. It does not calculate or update any scores or categories.
   - There are no other SQL setup files, triggers, or views defined in either workspace.
   - *Therefore*, the database currently lacks any database trigger, trigger function, or view to calculate these fields. They remain `null` or `0` in the database.

2. **Tracking Execution Gap**:
   - `AnalyticsProvider.jsx` registers the tracking function as `window.trackYakoEvent`.
   - `BookingSystem.jsx` attempts to track conversion events by calling `window.trackConversion` (which is never defined on the window object).
   - *Therefore*, when a customer completes a reservation or clicks WhatsApp, no event is sent to Supabase. Raw conversion data is lost.

3. **Dashboard Query Failures**:
   - In `yako-admin-portal/src/app/(admin)/intelligence/page.js`, the Supabase queries order visitors by `first_visit_date` and sessions by `start_time`.
   - However, in `supabase_location_update.sql`, the columns `first_visit_date` and `start_time` are not explicitly defined or populated.
   - *Therefore*, if these columns do not exist in the database (with `created_at` or `last_visit_at` being used instead), these queries will fail, resulting in empty metrics.

---

## 3. Caveats

* **Database Connection Restrictions**: Due to command permission timeouts on `run_command` in this Windows environment, we were unable to directly execute Node.js scripts to query the Supabase database schema properties and trigger definitions in real time. Static code analysis was used instead.
* **Clarity Verification**: Clarity tracker code is embedded on the frontend, which must be mocked during local test suite runs to prevent external service pollution.

---

## 4. Conclusion

### Root Causes Identified
1. **Conversion Capture Failure**: Mismatched function name (`window.trackConversion` instead of `window.trackYakoEvent`) in `BookingSystem.jsx` stops reservation and WhatsApp click events from being logged to the database.
2. **Missing Database Computations**: No database trigger, function, or view exists in Supabase to aggregate raw events and calculate `lead_score`, `intent_classification`, and `primary_interest` in the `intelligence_visitors` table.
3. **Database Schema Mismatch**: Mismatch between query ordering columns (`first_visit_date` and `start_time` in the admin portal) and actual table columns.
4. **Average Duration NaN Risk**: Active/incomplete sessions returning `null` for `duration_seconds` can break the average calculation.

### Proposed Code Changes (Diff/Replacement Sketches)

#### 1. Fix Conversion Tracking in `BookingSystem.jsx`
Replace `window.trackConversion` calls with `window.trackYakoEvent`:
```javascript
// In BookingSystem.jsx
// Before:
if (typeof window !== 'undefined' && window.trackConversion) {
  window.trackConversion('booking_request', formData);
}
// After:
if (typeof window !== 'undefined' && window.trackYakoEvent) {
  window.trackYakoEvent('reservation_complete', { path: '/book', ...formData });
}
```

#### 2. Introduce Postgres Triggers to Calculate Lead Scores & Intent
Add a trigger function `calculate_visitor_metrics` in Supabase that fires `AFTER INSERT` on `public.intelligence_events`:
```sql
CREATE OR REPLACE FUNCTION public.calculate_visitor_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_lead_score INT := 0;
    v_intent TEXT := 'Window Shopper';
    v_interest TEXT := 'General';
    v_menu_views INT := 0;
    v_gallery_views INT := 0;
    v_has_booking BOOLEAN := FALSE;
BEGIN
    -- 1. Compute Lead Score
    -- Get count of different event types for the visitor
    SELECT 
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) * 1 +
        COUNT(CASE WHEN event_type = 'menu_view' THEN 1 END) * 5 +
        COUNT(CASE WHEN event_type = 'gallery_view' THEN 1 END) * 5 +
        COUNT(CASE WHEN event_type = 'heartbeat' THEN 1 END) * 2 +
        COUNT(CASE WHEN event_type = 'reservation_start' THEN 1 END) * 15 +
        COUNT(CASE WHEN event_type = 'whatsapp_click' THEN 1 END) * 15 +
        COUNT(CASE WHEN event_type = 'reservation_complete' THEN 1 END) * 100
    INTO v_lead_score
    FROM public.intelligence_events
    WHERE visitor_id = NEW.visitor_id;

    -- 2. Classify Intent
    IF v_lead_score >= 100 THEN
        v_intent := 'Converted';
    ELSIF v_lead_score >= 50 THEN
        v_intent := 'Hot Lead';
    ELSIF v_lead_score >= 20 THEN
        v_intent := 'Warm Lead';
    ELSE
        v_intent := 'Window Shopper';
    END IF;

    -- 3. Determine Primary Interest
    SELECT 
        COUNT(CASE WHEN event_type = 'menu_view' THEN 1 END),
        COUNT(CASE WHEN event_type = 'gallery_view' THEN 1 END),
        EXISTS(SELECT 1 FROM public.intelligence_events WHERE visitor_id = NEW.visitor_id AND event_type IN ('reservation_start', 'reservation_complete'))
    INTO v_menu_views, v_gallery_views, v_has_booking;

    IF v_has_booking THEN
        v_interest := 'Events / Groups';
    ELSIF v_menu_views > v_gallery_views THEN
        v_interest := 'Foodie';
    ELSIF v_gallery_views > 0 THEN
        v_interest := 'Ambiance / Events';
    ELSE
        v_interest := 'General Interest';
    END IF;

    -- 4. Update intelligence_visitors table
    UPDATE public.intelligence_visitors
    SET 
        lead_score = v_lead_score,
        intent_classification = v_intent,
        primary_interest = v_interest
    WHERE id = NEW.visitor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_visitor_metrics
AFTER INSERT ON public.intelligence_events
FOR EACH ROW
EXECUTE FUNCTION public.calculate_visitor_metrics();
```

#### 3. Update Admin page.js to Safe Column Names
Ensure queries order by `created_at` or map `first_visit_date` / `start_time` properly:
```javascript
// In page.js (admin portal)
// Order by created_at if start_time/first_visit_date don't exist
const { data: visitors } = await supabase
  .from('intelligence_visitors')
  .select('*')
  .order('created_at', { ascending: false }) // instead of first_visit_date
  .limit(50);
```

---

## 5. Verification Method

1. **Review Database Schema**: Check columns in `intelligence_visitors` and `intelligence_sessions`. Ensure columns `first_visit_date` and `start_time` are mapped correctly or updated in Next.js queries.
2. **Apply Trigger Migration**: Execute the `trigger_calculate_visitor_metrics` SQL script in Supabase.
3. **Run Traffic Simulation**: Run the simulation script (designed in M1) to verify that:
   * Event types like `reservation_complete` and `menu_view` correctly populate `intelligence_events`.
   * The database trigger executes and automatically updates the visitor's `lead_score`, `intent_classification`, and `primary_interest` in `intelligence_visitors`.
4. **Assert in Admin Panel**: Visit the CRM Dashboard on `localhost:3000/intelligence` and confirm that visitors display correct intent tags and lead scores.
