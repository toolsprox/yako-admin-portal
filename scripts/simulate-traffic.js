const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Read Supabase connection details from .env.local
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
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

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const delay = ms => new Promise(res => setTimeout(res, ms));

async function trackEvent(visitor, session, eventType, pagePath) {
  console.log(`[Event] ${visitor.dummy_name} -> ${eventType} on ${pagePath}`);
  
  const { data, error } = await supabase.rpc('track_event', {
    p_visitor_id: visitor.id,
    p_session_id: session.id,
    p_event_type: eventType,
    p_event_data: { path: pagePath },
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

  if (error) {
    console.error(`Error tracking event ${eventType} for ${visitor.dummy_name}:`, error.message);
  }
  return { data, error };
}

async function run() {
  console.log("Starting traffic simulation...");

  // Profile 1: Azure Fox (Casual Window Shopper)
  // Desktop, direct traffic, Windows. Views Home page (/), sends a heartbeat.
  const v1 = {
    id: crypto.randomUUID(),
    dummy_name: "Azure Fox",
    device: "Desktop",
    browser: "Chrome",
    os: "Windows",
    city: "London",
    country: "United Kingdom",
    fingerprint: "fp_azure_fox",
    lat: "51.5074",
    lng: "-0.1278"
  };
  const s1 = {
    id: crypto.randomUUID(),
    source: "Direct",
    referrer: "",
    landing: "/"
  };

  // Profile 2: Brave Wolf (Hungry Foodie)
  // Mobile, Instagram UTM source, iOS. Views menu page (/menu), browses menu, views gallery (/gallery).
  const v2 = {
    id: crypto.randomUUID(),
    dummy_name: "Brave Wolf",
    device: "Mobile",
    browser: "Safari",
    os: "iOS",
    city: "New York",
    country: "United States",
    fingerprint: "fp_brave_wolf",
    lat: "40.7128",
    lng: "-74.0060"
  };
  const s2 = {
    id: crypto.randomUUID(),
    source: "Instagram",
    referrer: "https://l.instagram.com/",
    landing: "/menu"
  };

  // Profile 3: Golden Eagle (High-Intent Event Booker)
  // Desktop, Google search, MacOS. Views Home, Gallery, starts reservation, clicks WhatsApp, submits a successful table booking.
  const v3 = {
    id: crypto.randomUUID(),
    dummy_name: "Golden Eagle",
    device: "Desktop",
    browser: "Firefox",
    os: "MacOS",
    city: "Paris",
    country: "France",
    fingerprint: "fp_golden_eagle",
    lat: "48.8566",
    lng: "2.3522"
  };
  const s3 = {
    id: crypto.randomUUID(),
    source: "Google Search",
    referrer: "https://www.google.com/",
    landing: "/"
  };

  // --- Inject Visitor 1: Azure Fox ---
  console.log("\nSimulating Azure Fox...");
  await trackEvent(v1, s1, 'page_view', '/');
  await delay(100);
  await trackEvent(v1, s1, 'heartbeat', '/');

  // --- Inject Visitor 2: Brave Wolf ---
  console.log("\nSimulating Brave Wolf...");
  await trackEvent(v2, s2, 'page_view', '/menu');
  await delay(100);
  await trackEvent(v2, s2, 'menu_view', '/menu');
  await delay(100);
  await trackEvent(v2, s2, 'gallery_view', '/gallery');

  // --- Inject Visitor 3: Golden Eagle ---
  console.log("\nSimulating Golden Eagle...");
  await trackEvent(v3, s3, 'page_view', '/');
  await delay(100);
  await trackEvent(v3, s3, 'gallery_view', '/gallery');
  await delay(100);
  await trackEvent(v3, s3, 'reservation_start', '/book');
  
  // Submit successful table booking (directly into reservations table)
  console.log("[Booking] Golden Eagle -> Inserting reservation...");
  const reservationDate = new Date();
  reservationDate.setDate(reservationDate.getDate() + 3); // 3 days in the future
  const formattedDate = reservationDate.toISOString().split('T')[0];

  const { data: bookingData, error: bookingError } = await supabase
    .from('reservations')
    .insert([
      {
        date: formattedDate,
        time: '19:30',
        guests: 4,
        customer_name: v3.dummy_name,
        customer_phone: '+44 7911 123456',
        status: 'pending'
      }
    ]);

  if (bookingError) {
    console.error("Error inserting reservation for Golden Eagle:", bookingError.message);
  } else {
    console.log("Reservation created successfully in database.");
  }
  
  await delay(100);
  await trackEvent(v3, s3, 'whatsapp_click', '/book');
  await delay(100);
  await trackEvent(v3, s3, 'reservation_complete', '/book');

  console.log("\nTraffic simulation finished successfully!");
}

run();
