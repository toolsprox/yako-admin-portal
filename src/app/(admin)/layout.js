import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="glass-nav" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 className="font-script" style={{ fontSize: '2rem', margin: 0 }}>Yako Admin</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Reservations</a>
            <a href="/menu" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Menu</a>
            <a href="/content" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Site Content</a>
            <a href="/intelligence" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Intelligence</a>
            <a href="/tracking" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Tracking & Ads</a>
          </div>
        </div>
        <span style={{ fontSize: '0.9rem', color: '#A1A1AA' }}>Logged in as {session.user.email}</span>
      </nav>
      <main style={{ padding: '40px 20px', flex: 1 }}>
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}
