import { createServerSupabaseClient } from '@/lib/supabase-server';
import AdminIntelligenceClient from '@/components/AdminIntelligenceClient';

export const dynamic = 'force-dynamic';

export default async function AdminIntelligencePage() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch Visitors
  const { data: visitors } = await supabase
    .from('intelligence_visitors')
    .select('*')
    .order('first_visit_date', { ascending: false, nullsFirst: false })
    .limit(50); // Get latest 50 for performance

  // Fetch Aggregated Sessions
  const { data: sessions } = await supabase
    .from('intelligence_sessions')
    .select('*')
    .order('start_time', { ascending: false })
    .limit(100);

  // Fetch Recent Events for Timeline
  const { data: events } = await supabase
    .from('intelligence_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  return (
    <AdminIntelligenceClient 
      initialVisitors={visitors || []} 
      initialSessions={sessions || []} 
      initialEvents={events || []}
    />
  );
}
