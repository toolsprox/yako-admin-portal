import { createServerSupabaseClient } from '@/lib/supabase-server';
import PageBuilderClient from '@/components/PageBuilderClient';

export const dynamic = 'force-dynamic';

export default async function PagesManagerPage() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch custom pages
  const { data: pages, error } = await supabase
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching custom pages:", error);
  }

  return (
    <PageBuilderClient initialPages={pages || []} />
  );
}
