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

  return (
    <TrackingManagerClient initialScripts={scripts || []} />
  );
}
