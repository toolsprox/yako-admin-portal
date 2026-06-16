'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';

export default function AdminDataTable({ initialData }) {
  const [reservations, setReservations] = useState(initialData);

  const updateStatus = async (id, newStatus) => {
    const loadingToast = toast.loading('Updating...');
    
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status', { id: loadingToast });
    } else {
      toast.success(`Reservation marked as ${newStatus}`, { id: loadingToast });
      // Optimistically update UI
      setReservations(reservations.map(res => 
        res.id === id ? { ...res, status: newStatus } : res
      ));
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return '#22c55e'; // Green
      case 'cancelled': return '#ef4444'; // Red
      default: return '#f59e0b'; // Yellow (pending)
    }
  };

  if (reservations.length === 0) {
    return <p style={{ color: '#A1A1AA' }}>No reservations found.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA' }}>
            <th style={{ padding: '16px 8px', fontWeight: 500 }}>Date & Time</th>
            <th style={{ padding: '16px 8px', fontWeight: 500 }}>Customer</th>
            <th style={{ padding: '16px 8px', fontWeight: 500 }}>Guests</th>
            <th style={{ padding: '16px 8px', fontWeight: 500 }}>Status</th>
            <th style={{ padding: '16px 8px', fontWeight: 500 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((res) => (
            <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="table-row-hover">
              <td style={{ padding: '16px 8px' }}>
                <div style={{ fontWeight: 600 }}>{res.date}</div>
                <div style={{ fontSize: '0.9rem', color: '#A1A1AA' }}>{res.time}</div>
              </td>
              <td style={{ padding: '16px 8px' }}>
                <div style={{ fontWeight: 600 }}>{res.customer_name}</div>
                <div style={{ fontSize: '0.9rem', color: '#A1A1AA' }}>{res.customer_phone}</div>
              </td>
              <td style={{ padding: '16px 8px', fontWeight: 600 }}>{res.guests}</td>
              <td style={{ padding: '16px 8px' }}>
                <span style={{ 
                  background: `${getStatusColor(res.status)}20`, 
                  color: getStatusColor(res.status),
                  padding: '4px 12px', 
                  borderRadius: '50px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: `1px solid ${getStatusColor(res.status)}50`
                }}>
                  {res.status}
                </span>
              </td>
              <td style={{ padding: '16px 8px' }}>
                {res.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => updateStatus(res.id, 'confirmed')}
                      style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => updateStatus(res.id, 'cancelled')}
                      style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {res.status === 'confirmed' && (
                  <button 
                    onClick={() => updateStatus(res.id, 'cancelled')}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#A1A1AA', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cancel Booking
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover { background: rgba(255,255,255,0.02); }
      `}} />
    </div>
  );
}
