import { createServerSupabaseClient } from '@/lib/supabase-server';
import AdminDataTable from '@/components/AdminDataTable';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    return <div className="glass" style={{ padding: '40px' }}>Error loading reservations: {error.message}</div>;
  }

  return (
    <div className="glass" style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="font-script" style={{ fontSize: '3rem' }}>Reservations</h1>
      </div>
      
      <AdminDataTable initialData={reservations || []} />
    </div>
  );
}
