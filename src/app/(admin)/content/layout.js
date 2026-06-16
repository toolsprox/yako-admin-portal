'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ContentLayout({ children }) {
  const pathname = usePathname();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="font-script" style={{ fontSize: '3rem' }}>Site Content Manager</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <Link 
          href="/content/text" 
          style={{ 
            textDecoration: 'none', 
            color: pathname === '/content/text' ? '#fff' : '#A1A1AA',
            fontWeight: pathname === '/content/text' ? 600 : 400,
            paddingBottom: '1rem',
            borderBottom: pathname === '/content/text' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-1rem'
          }}
        >
          Text & Copy
        </Link>
        <Link 
          href="/content/gallery" 
          style={{ 
            textDecoration: 'none', 
            color: pathname === '/content/gallery' ? '#fff' : '#A1A1AA',
            fontWeight: pathname === '/content/gallery' ? 600 : 400,
            paddingBottom: '1rem',
            borderBottom: pathname === '/content/gallery' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-1rem'
          }}
        >
          Gallery Images
        </Link>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '30px' }}>
        {children}
      </div>
    </div>
  );
}
