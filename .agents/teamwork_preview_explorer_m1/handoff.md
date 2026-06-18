# Handoff Report — Milestone 1: E2E Test Suite and Simulation Script

This report details the findings regarding existing test setups, database connection details, and the recommended design of the simulation script and E2E test suite for the Yako Admin Portal and Yako London Platform.

---

## 1. Observation

### Existing Testing Frameworks and Scripts
A full scan of both workspaces was conducted to identify any existing testing configurations, files, or packages.
- **`yako-admin-portal`**:
  - `package.json` (lines 5-10, 21-26) contains only Next.js standard scripts and linter devDependencies. No testing libraries (e.g. Vitest, Jest, Playwright, Cypress) are present:
    ```json
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "eslint"
      },
      "devDependencies": {
        "@tailwindcss/postcss": "^4",
        "eslint": "^9",
        "eslint-config-next": "16.2.9",
        "tailwindcss": "^4"
      }
    ```
  - Searching for `*test*` or `*spec*` in `yako-admin-portal` yielded `Found 0 results`.
  - There are no test folders (e.g., `tests/`, `__tests__/`) in the directory.

- **`yako-london-platform`**:
  - `package.json` (lines 5-10, 23-26) similarly contains only Next.js scripts and eslint in devDependencies. No testing tools are installed:
    ```json
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "eslint"
      },
      "devDependencies": {
        "eslint": "^9",
        "eslint-config-next": "16.2.9"
      }
    ```
  - Searching for `*test*` or `*spec*` in `yako-london-platform` yielded `Found 0 results` (excluding `node_modules`, `.git`, `.next`).
  - There are no test directories or files in this workspace either.

### Database Connection Details
Both repositories contain `.env.local` files with identical Supabase connection variables.
- **`yako-admin-portal/.env.local`** and **`yako-london-platform/.env.local`**:
  - URL (line 1): `NEXT_PUBLIC_SUPABASE_URL=https://gaokwzpweewqtvpnryoh.supabase.co`
  - Key (line 2): `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhb2t3enB3ZWV3cXR2cG5yeW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDQ1MTIsImV4cCI6MjA5NzA4MDUxMn0.XAIHsc2rNuQzSTdm7Ugr67SOOJOrSHbavwhLiihD8_8`

### Database Schema and RPC Interface
The SQL schema migration file `yako-london-platform/supabase_location_update.sql` (lines 7-51) defines the tracking RPC:
- **Function Signature**:
  ```sql
  CREATE OR REPLACE FUNCTION track_event(
      p_visitor_id UUID,
      p_session_id UUID,
      p_event_type TEXT,
      p_event_data JSONB,
      p_device_type TEXT,
      p_browser TEXT,
      p_os TEXT,
      p_source TEXT,
      p_referrer TEXT,
      p_landing_page TEXT,
      p_city TEXT,
      p_country TEXT,
      p_dummy_name TEXT,
      p_fingerprint TEXT,
      p_lat TEXT DEFAULT NULL,
      p_lng TEXT DEFAULT NULL
  )
  ```
- **Operations performed by the RPC**:
  1. **Visitor Upsert**: Inserts or updates a row in `public.intelligence_visitors` using the visitor ID and other geo/device parameters.
  2. **Session Upsert**: Inserts or updates a row in `public.intelligence_sessions` with visitor ID and referrer details.
  3. **Event Insertion**: Inserts a new row in `public.intelligence_events` containing the clickstream event data.

### Analytics Usage on the Frontend
- In `yako-london-platform/components/AnalyticsProvider.jsx`, lines 108-126 show how the frontend calls the Supabase RPC:
  ```javascript
  await supabase.rpc('track_event', {
    p_visitor_id: visitorId,
    p_session_id: sessionId,
    p_event_type: eventType || mappedEventType,
    p_event_data: { path: pathname },
    p_device_type: getDeviceType(),
    p_browser: getBrowserInfo(),
    p_os: getOSInfo(),
    p_source: source,
    p_referrer: document.referrer || '',
    p_landing_page: window.location.href,
    p_city: city,
    p_country: country,
    p_lat: lat,
    p_lng: lng,
    p_dummy_name: dummyName,
    p_fingerprint: fingerprint
  });
  ```
- Reservation bookings call the API endpoint `/api/reservations` on POST, inserting details directly into the `reservations` table (observed in `yako-london-platform/app/api/reservations/route.js`, lines 17-28):
  ```javascript
  const { data: result, error } = await supabase
    .from('reservations')
    .insert([
      {
        date: data.date,
        time: data.time,
        guests: parseInt(data.guests.replace('+', '')),
        customer_name: data.name,
        customer_phone: data.phone,
        status: 'pending'
      }
    ]);
  ```

---

## 2. Logic Chain

1. **No Existing Test Setup**: Based on the complete absence of test script declarations in `package.json` files and the absence of any test folders in both `yako-admin-portal` and `yako-london-platform`, the test suite must be built entirely from scratch.
2. **Unified Data Layer**: Since both workspaces connect to the exact same cloud-hosted Supabase database (same URL and Anon key), we can run a single simulation script using `@supabase/supabase-js` that successfully populates data for both apps.
3. **Trigger-Driven Logic**: The `track_event` RPC is responsible for recording the raw visitor details, session details, and clickstream events. The admin dashboard `AdminIntelligenceClient.jsx` reads metrics like `lead_score`, `intent_classification`, and `primary_interest`. Because the RPC function does not compute or write these fields, they are calculated dynamically via a database trigger/function (or view aggregation) inside the connected Supabase instance.
4. **Real-time vs Historical Simulation**:
   - The `track_event` RPC uses the database's local time (`NOW()`) when inserting events. Therefore, using the RPC simulates real-time activity but cannot backdate entries.
   - To inject historical visitor sessions (e.g. simulating user behavior over the past 7 days to test analytics charts), a script should write directly to the database tables rather than using the RPC.

---

## 3. Caveats

- **CODE_ONLY network restrictions**: Since I am in `CODE_ONLY` network mode, I cannot make active HTTP requests to the cloud Supabase API or verify the active triggers/indexes. The design has been created based on the local SQL file, React page files, and components.
- **Microsoft Clarity**: The dashboard and platform both contain code integrating Microsoft Clarity (`x7w4u3v357`). E2E tests will need to mock or ignore these external tracking script calls.
- **Credentials Access**: The public anon key has insert rights to the `reservations` table and execute rights on the `track_event` RPC, so we do not need a Supabase service role key for basic visitor simulation. However, direct SQL schema changes or table overrides for historical backfill might require a database service role key or Direct SQL execution.

---

## 4. Conclusion

### E2E Test Suite Recommendation
- **Framework**: Use **Playwright** installed in the `yako-admin-portal` workspace.
- **Reason**: Playwright excels at testing multi-domain/port operations. It can open two browser windows: one to perform user interactions (e.g., viewing pages, reserving a table) on the consumer platform (`localhost:3001`), and another to check if the admin CRM panel (`localhost:3000/intelligence`) updates with the correct lead score and classification in real time.

### Simulation Script Design (`scripts/simulate-traffic.js`)
We design a Node.js script that can inject 3 distinct simulated visitor profiles with varying behaviors:

1. **Profile 1: Casual Window Shopper ("Azure Fox")**
   - **Properties**: Desktop device, direct traffic, Windows.
   - **Behavior**: Views Home page (`/`), sends one heartbeat, leaves.
   - **Expected Outcome**: Lead score < 10, Intent: "Window Shopper".

2. **Profile 2: Hungry Foodie ("Brave Wolf")**
   - **Properties**: Mobile device, Instagram UTM source, iOS.
   - **Behavior**: Views menu page (`/menu`), scrolls, sends multiple heartbeats, views gallery (`/gallery`).
   - **Expected Outcome**: Lead score ~20-30, Primary Interest: "Foodie", Intent: "Warm".

3. **Profile 3: High-Intent Event Booker ("Golden Eagle")**
   - **Properties**: Desktop device, Google search, MacOS.
   - **Behavior**: Views Home, browses Gallery, starts reservation, clicks WhatsApp contact, and submits a successful table booking.
   - **Expected Outcome**: Lead score >= 100, Primary Interest: "Events / Groups", Intent: "Hot Lead (Converted)".

#### Recommended Script Code Structure
```javascript
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables. Define them in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const delay = ms => new Promise(res => setTimeout(res, ms));

async function trackEvent(visitor, session, eventType, path) {
  console.log(`[Event] ${visitor.dummy_name} -> ${eventType} on ${path}`);
  return supabase.rpc('track_event', {
    p_visitor_id: visitor.id,
    p_session_id: session.id,
    p_event_type: eventType,
    p_event_data: { path },
    p_device_type: visitor.device,
    p_browser: visitor.browser,
    p_os: visitor.os,
    p_source: session.source,
    p_referrer: session.referrer,
    p_landing_page: `https://yakolondon.com${session.landing}`,
    p_city: visitor.city,
    p_country: visitor.country,
    p_dummy_name: visitor.dummy_name,
    p_fingerprint: visitor.fingerprint,
    p_lat: visitor.lat,
    p_lng: visitor.lng
  });
}

async function run() {
  // Visitor 1: Azure Fox (Casual Window Shopper)
  const v1 = { id: crypto.randomUUID(), dummy_name: "Azure Fox", device: "Desktop", browser: "Chrome", os: "Windows", city: "London", country: "United Kingdom", fingerprint: "fp1", lat: "51.5074", lng: "-0.1278" };
  const s1 = { id: crypto.randomUUID(), source: "Direct", referrer: "", landing: "/" };

  // Visitor 2: Brave Wolf (Hungry Foodie)
  const v2 = { id: crypto.randomUUID(), dummy_name: "Brave Wolf", device: "Mobile", browser: "Safari", os: "iOS", city: "New York", country: "United States", fingerprint: "fp2", lat: "40.7128", lng: "-74.0060" };
  const s2 = { id: crypto.randomUUID(), source: "Instagram", referrer: "https://l.instagram.com/", landing: "/menu" };

  // Visitor 3: Golden Eagle (High-Intent Event Booker)
  const v3 = { id: crypto.randomUUID(), dummy_name: "Golden Eagle", device: "Desktop", browser: "Firefox", os: "MacOS", city: "Paris", country: "France", fingerprint: "fp3", lat: "48.8566", lng: "2.3522" };
  const s3 = { id: crypto.randomUUID(), source: "Google Search", referrer: "https://www.google.com/", landing: "/" };

  console.log("Simulating visitor traffic...");

  // V1 Flow
  await trackEvent(v1, s1, 'page_view', '/');
  await delay(500);
  await trackEvent(v1, s1, 'heartbeat', '/');

  // V2 Flow
  await trackEvent(v2, s2, 'page_view', '/menu');
  await delay(500);
  await trackEvent(v2, s2, 'menu_view', '/menu');
  await delay(500);
  await trackEvent(v2, s2, 'gallery_view', '/gallery');

  // V3 Flow
  await trackEvent(v3, s3, 'page_view', '/');
  await delay(500);
  await trackEvent(v3, s3, 'gallery_view', '/gallery');
  await delay(500);
  await trackEvent(v3, s3, 'reservation_start', '/book');
  
  // Submit actual reservation entry
  await supabase.from('reservations').insert([{
    date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days later
    time: '20:00',
    guests: 2,
    customer_name: v3.dummy_name,
    customer_phone: '+44 7700 900099',
    status: 'pending'
  }]);
  
  await delay(500);
  await trackEvent(v3, s3, 'reservation_complete', '/book');

  console.log("Traffic simulation complete!");
}

run();
```

---

## 5. Verification Method

To verify the setup:
1. **Initialize Playwright in `yako-admin-portal`**:
   ```bash
   cd C:\Users\AMIT\.gemini\antigravity\scratch\yako-admin-portal
   npm install --save-dev @playwright/test
   npx playwright install
   ```
2. **Setup the E2E script**:
   - Write tests under a new directory: `yako-admin-portal/tests/e2e/analytics.spec.js`.
3. **Execute the Simulation Script**:
   - Run the simulation script locally:
     ```bash
     node scripts/simulate-traffic.js
     ```
4. **Assert in Supabase / Dashboard**:
   - Ensure three new visitors are added to `intelligence_visitors` table.
   - Verify that the Visitor CRM Table displays:
     - `Azure Fox` (London, Desktop, "Window Shopper", low lead score)
     - `Brave Wolf` (New York, Mobile, "Foodie", medium lead score)
     - `Golden Eagle` (Paris, Desktop, "Events / Groups", lead score >= 100)
   - Ensure a new reservation entry for `Golden Eagle` is in the `reservations` table.
