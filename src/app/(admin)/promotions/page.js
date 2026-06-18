import { createServerSupabaseClient } from '@/lib/supabase-server';
import PromotionsManagerClient from '@/components/PromotionsManagerClient';

export const dynamic = 'force-dynamic';

export default async function PromotionsManagerPage() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch site promotions
  const { data: promotions, error } = await supabase
    .from('site_promotions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching site promotions:", error);
  }

  const { data: sessions } = await supabase.from('intelligence_sessions').select('landing_page').limit(500);
  const { data: cmsPages } = await supabase.from('pages').select('slug');
  
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
    <PromotionsManagerClient 
      initialPromotions={promotions || []} 
      discoveredPaths={discoveredPaths}
    />
  );
}
