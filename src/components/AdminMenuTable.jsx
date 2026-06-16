'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';

export default function AdminMenuTable({ initialData }) {
  const [items, setItems] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Starters',
    order_index: 0
  });

  const supabase = createBrowserSupabaseClient();

  const categories = [...new Set(initialData.map(item => item.category)), 'Starters', 'Mains', 'Desserts', 'Drinks'];
  const uniqueCategories = [...new Set(categories)];

  const toggleActive = async (id, currentStatus) => {
    const loadingToast = toast.loading('Updating visibility...');
    const newStatus = !currentStatus;
    
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update', { id: loadingToast });
    } else {
      toast.success(newStatus ? 'Item is now visible' : 'Item is now hidden', { id: loadingToast });
      setItems(items.map(item => 
        item.id === id ? { ...item, is_active: newStatus } : item
      ));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to completely delete this item?')) return;
    
    const loadingToast = toast.loading('Deleting...');
    const { error } = await supabase.from('menu_items').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete item', { id: loadingToast });
    } else {
      toast.success('Item deleted', { id: loadingToast });
      setItems(items.filter(item => item.id !== id));
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsCustomCategory(false);
    setFormData({ name: '', description: '', price: '£', category: uniqueCategories[0], order_index: items.length });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsCustomCategory(false);
    setFormData({ 
      name: item.name, 
      description: item.description || '', 
      price: item.price.startsWith('£') ? item.price : `£${item.price}`, 
      category: item.category, 
      order_index: item.order_index || 0 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(editingItem ? 'Updating item...' : 'Adding new item...');

    if (editingItem) {
      const { data, error } = await supabase
        .from('menu_items')
        .update(formData)
        .eq('id', editingItem.id)
        .select();

      if (error) toast.error('Failed to update', { id: loadingToast });
      else {
        toast.success('Item updated', { id: loadingToast });
        setItems(items.map(item => item.id === editingItem.id ? data[0] : item));
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ ...formData, is_active: true }])
        .select();

      if (error) toast.error('Failed to add item', { id: loadingToast });
      else {
        toast.success('Item added successfully', { id: loadingToast });
        setItems([...items, data[0]]);
        setIsModalOpen(false);
      }
    }
    setIsSubmitting(false);
  };

  const inputStyle = { width: '100%', marginBottom: '1rem', fontFamily: 'var(--font-sans)', colorScheme: 'dark' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', color: '#D1D5DB', fontSize: '0.9rem' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={openAddModal} className="btn-primary">
          + Add New Item
        </button>
      </div>

      {items.length === 0 ? (
        <p style={{ color: '#A1A1AA' }}>No menu items found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA' }}>
                <th style={{ padding: '16px 8px', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '16px 8px', fontWeight: 500 }}>Item Name</th>
                <th style={{ padding: '16px 8px', fontWeight: 500 }}>Price</th>
                <th style={{ padding: '16px 8px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '16px 8px', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', opacity: item.is_active ? 1 : 0.5 }} className="table-row-hover">
                  <td style={{ padding: '16px 8px', color: '#A1A1AA' }}>{item.category}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#A1A1AA', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                  </td>
                  <td style={{ padding: '16px 8px', fontWeight: 600, color: 'var(--primary)' }}>{item.price}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <span style={{ 
                      background: item.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: item.is_active ? '#22c55e' : '#ef4444',
                      padding: '4px 12px', 
                      borderRadius: '50px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: `1px solid ${item.is_active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      {item.is_active ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => toggleActive(item.id, item.is_active)}
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {item.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button 
                        onClick={() => openEditModal(item)}
                        style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative' }}>
            <h3 className="font-script" style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#fff' }}>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h3>
            
            <form onSubmit={handleSave}>
              <div>
                <label style={labelStyle}>Category</label>
                {!isCustomCategory ? (
                  <select 
                    required 
                    className="glass-input" 
                    style={{ ...inputStyle, appearance: 'auto' }}
                    value={formData.category}
                    onChange={e => {
                      if (e.target.value === '___CUSTOM___') {
                        setIsCustomCategory(true);
                        setFormData({...formData, category: ''});
                      } else {
                        setFormData({...formData, category: e.target.value});
                      }
                    }}
                  >
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="___CUSTOM___">+ Add Custom Category...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                    <input 
                      type="text" 
                      required 
                      autoFocus
                      className="glass-input" 
                      style={{ ...inputStyle, marginBottom: 0 }}
                      placeholder="Enter new category..."
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                    <button type="button" className="btn-outline" style={{ padding: '0 16px' }} onClick={() => { setIsCustomCategory(false); setFormData({...formData, category: uniqueCategories[0]}); }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Item Name</label>
                <input 
                  type="text" 
                  required 
                  className="glass-input" 
                  style={inputStyle}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label style={labelStyle}>Price</label>
                <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: '1rem' }}>
                  <span style={{ 
                    padding: '0 16px', 
                    background: 'rgba(255,255,255,0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderTopLeftRadius: '8px', 
                    borderBottomLeftRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    borderRight: 'none',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>£</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    className="glass-input" 
                    style={{ ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginBottom: 0 }}
                    placeholder="12.50"
                    value={formData.price.replace('£', '')}
                    onChange={e => setFormData({...formData, price: `£${e.target.value}`})}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea 
                  className="glass-input" 
                  style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Item'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover { background: rgba(255,255,255,0.03); }
      `}} />
    </div>
  );
}
