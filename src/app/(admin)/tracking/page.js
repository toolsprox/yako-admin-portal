import { createServerSupabaseClient } from '@/lib/supabase-server';
import TrackingManagerClient from '@/components/TrackingManagerClient';

export const dynamic = 'force-dynamic';

export default async function TrackingManagerPage() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch tracking scripts
  const { data: scripts, error } = await supabase
    .from('tracking_scripts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching tracking scripts:", error);
  }

  // Fetch recent analytics to extract discovered paths and events
  const { data: sessions } = await supabase.from('intelligence_sessions').select('landing_page').limit(500);
  const { data: events } = await supabase.from('intelligence_events').select('event_type').limit(500);
  const { data: cmsPages } = await supabase.from('pages').select('slug');

  const discoveredEvents = [...new Set(events?.map(e => e.event_type).filter(Boolean) || [])];
  
  const analyticsPaths = sessions?.map(s => {
    try {
      return new URL(s.landing_page).pathname;
    } catch {
      return s.landing_page.startsWith('/') ? s.landing_page : null;
    }
  }).filter(Boolean) || [];

  const customPaths = cmsPages?.map(p => p.slug) || [];
  const staticPaths = ['/', '/menu', '/gallery', '/about', '/book'];

  const discoveredPaths = [...new Set([...staticPaths, ...customPaths, ...analyticsPaths])];

  return (
    <TrackingManagerClient 
      initialScripts={scripts || []} 
      discoveredPaths={discoveredPaths}
      discoveredEvents={discoveredEvents}
    />
  );
}
