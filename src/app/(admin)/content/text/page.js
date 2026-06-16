import { createServerSupabaseClient } from '@/lib/supabase-server';
import AdminTextEditor from '@/components/AdminTextEditor';

export const dynamic = 'force-dynamic';

export default async function AdminContentTextPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('site_content')
    .select('*');

  if (error) {
    return <div>Error loading content: {error.message}</div>;
  }

  return (
    <div className="glass" style={{ padding: '40px' }}>
      <AdminTextEditor initialData={data || []} />
    </div>
  );
}
