import { createServerSupabaseClient } from '@/lib/supabase-server';
import AdminGalleryManager from '@/components/AdminGalleryManager';

export const dynamic = 'force-dynamic';

export default async function AdminContentGalleryPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    return <div>Error loading gallery images: {error.message}</div>;
  }

  return (
    <div className="glass" style={{ padding: '40px' }}>
      <AdminGalleryManager initialImages={data || []} />
    </div>
  );
}
