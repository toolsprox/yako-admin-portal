import { createServerSupabaseClient } from '@/lib/supabase-server';
import AdminMenuTable from '@/components/AdminMenuTable';

export const dynamic = 'force-dynamic';

export default async function AdminMenuPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    return <div className="glass" style={{ padding: '40px' }}>Error loading menu: {error.message}</div>;
  }

  return (
    <div className="glass" style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="font-script" style={{ fontSize: '3rem' }}>Menu Management</h1>
      </div>
      
      <AdminMenuTable initialData={menuItems || []} />
    </div>
  );
}
