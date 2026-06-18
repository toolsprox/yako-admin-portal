'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

export default function PromotionsManagerClient({ initialPromotions, discoveredPaths = [] }) {
  const [promotions, setPromotions] = useState(initialPromotions || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const supabase = createBrowserSupabaseClient();

  const emptyForm = {
    name: '', promo_type: 'popup', 
    content: { title: '', subtitle: '', button_text: '', button_link: '', image_url: '', timing: 'immediate', countdown_date: '' },
    triggers: [{ type: 'global', value: '' }], is_active: true
  };

  const [formData, setFormData] = useState(emptyForm);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (promo) => {
    setEditingId(promo.id);
    setFormData({
      name: promo.name,
      promo_type: promo.promo_type,
      content: promo.content || emptyForm.content,
      triggers: promo.triggers || emptyForm.triggers,
      is_active: promo.is_active
    });
    setIsModalOpen(true);
  };

  const handleAddTrigger = () => {
    setFormData({ ...formData, triggers: [...formData.triggers, { type: 'path', value: '' }] });
  };

  const handleUpdateTrigger = (index, field, value) => {
    const newTriggers = [...formData.triggers];
    newTriggers[index][field] = value;
    setFormData({ ...formData, triggers: newTriggers });
  };

  const handleRemoveTrigger = (index) => {
    const newTriggers = formData.triggers.filter((_, i) => i !== index);
    setFormData({ ...formData, triggers: newTriggers });
  };

  const handleContentChange = (field, value) => {
    setFormData({ ...formData, content: { ...formData.content, [field]: value } });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `promotions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('promotion-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('promotion-assets')
        .getPublicUrl(filePath);

      handleContentChange('image_url', publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingId) {
        // UPDATE
        const { data, error } = await supabase
          .from('site_promotions')
          .update({
            name: formData.name,
            promo_type: formData.promo_type,
            content: formData.content,
            triggers: formData.triggers,
            is_active: formData.is_active
          })
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;
        setPromotions(promotions.map(p => p.id === editingId ? data : p));
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('site_promotions')
          .insert([{
            name: formData.name,
            promo_type: formData.promo_type,
            content: formData.content,
            triggers: formData.triggers,
            is_active: formData.is_active
          }])
          .select()
          .single();

        if (error) throw error;
        setPromotions([data, ...promotions]);
      }

      setIsModalOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
    } catch (e) {
      console.error("Error saving promotion:", e);
      alert("Failed to save promotion.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from('site_promotions')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (!error) {
      setPromotions(promotions.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this promotion?")) return;
    
    try {
      const { error } = await supabase
        .from('site_promotions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setPromotions(promotions.filter(p => p.id !== id));
    } catch (e) {
      console.error("Error deleting promotion:", e);
      alert("Failed to delete promotion.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ marginBottom: '10px' }}>Promotions & Effects</h1>
          <p style={{ color: '#A1A1AA' }}>Launch popups, top banners, and visual effects dynamically across the site.</p>
        </div>
        <button 
          onClick={handleAddNew}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Add Promotion
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#A1A1AA' }}>
              <th style={{ padding: '15px 20px' }}>Name</th>
              <th style={{ padding: '15px 20px' }}>Type</th>
              <th style={{ padding: '15px 20px' }}>Triggers</th>
              <th style={{ padding: '15px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map(promo => (
              <tr key={promo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px 20px', fontWeight: 500 }}>{promo.name}</td>
                <td style={{ padding: '15px 20px' }}><span style={{ background: '#1f2937', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{promo.promo_type}</span></td>
                <td style={{ padding: '15px 20px' }}>
                  {promo.triggers.map((t, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: '#A1A1AA', marginBottom: '2px' }}>
                      • {t.type === 'global' ? 'Every Page' : `Path: ${t.value}`}
                    </div>
                  ))}
                </td>
                <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleEdit(promo)}
                    style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '8px' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => toggleStatus(promo.id, promo.is_active)}
                    style={{ background: promo.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: promo.is_active ? '#22c55e' : '#ef4444', border: '1px solid', borderColor: promo.is_active ? '#22c55e' : '#ef4444', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '8px' }}
                  >
                    {promo.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button 
                    onClick={() => handleDelete(promo.id)}
                    style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#A1A1AA' }}>No active promotions.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative' }}>
            <h2 style={{ marginBottom: '20px' }}>{editingId ? 'Edit Promotion' : 'Add New Promotion'}</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>Campaign Name (Internal)</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Valentine's Day Special" style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>Promotion Type</label>
              <select value={formData.promo_type} onChange={e => setFormData({...formData, promo_type: e.target.value})} style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }}>
                <option value="popup">Glass Popup Modal</option>
                <option value="toast">Slide-in Corner Toast</option>
                <option value="top_bar">Top Announcement Bar</option>
                <option value="countdown">Countdown Timer Bar</option>
                <option value="effect_confetti">Effect: Celebration Confetti</option>
                <option value="effect_snow">Effect: Winter Snow</option>
              </select>
            </div>

            {(formData.promo_type === 'popup' || formData.promo_type === 'top_bar') && (
              <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Content Settings</h3>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.85rem' }}>Title</label>
                  <input type="text" value={formData.content.title} onChange={e => handleContentChange('title', e.target.value)} placeholder="e.g. 20% Off Your Next Visit!" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.85rem' }}>Subtitle / Description</label>
                  <input type="text" value={formData.content.subtitle} onChange={e => handleContentChange('subtitle', e.target.value)} placeholder="e.g. Use code LOVE20 when booking..." style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.85rem' }}>Button Text</label>
                    <input type="text" value={formData.content.button_text} onChange={e => handleContentChange('button_text', e.target.value)} placeholder="e.g. Book Now" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.85rem' }}>Button Link</label>
                    <input type="text" value={formData.content.button_link} onChange={e => handleContentChange('button_link', e.target.value)} placeholder="e.g. /book" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                  </div>
                </div>

                {formData.promo_type === 'popup' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.85rem' }}>Hero Image (Upload or Paste URL)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <input type="text" value={formData.content.image_url} onChange={e => handleContentChange('image_url', e.target.value)} placeholder="https://..." style={{ flex: 1, background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                      <span style={{ color: '#A1A1AA', fontSize: '0.8rem' }}>OR</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        disabled={isUploading}
                        style={{ background: '#374151', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', maxWidth: '150px' }} 
                      />
                      {isUploading && <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Uploading...</span>}
                    </div>
                    {formData.content.image_url && (
                      <div style={{ marginTop: '10px' }}>
                        <img src={formData.content.image_url} alt="Preview" style={{ height: '60px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    )}
                  </div>
                )}
                {formData.promo_type === 'countdown' && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.85rem' }}>Countdown End Date & Time</label>
                    <input type="datetime-local" value={formData.content.countdown_date || ''} onChange={e => handleContentChange('countdown_date', e.target.value)} style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Behavioral Timing</h3>
              <p style={{ fontSize: '0.85rem', color: '#A1A1AA', marginBottom: '10px' }}>When should this promotion appear?</p>
              <select value={formData.content.timing || 'immediate'} onChange={e => handleContentChange('timing', e.target.value)} style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '10px', borderRadius: '6px' }}>
                <option value="immediate">Immediately on load</option>
                <option value="delay_5">Time Delay (5 Seconds)</option>
                <option value="delay_15">Time Delay (15 Seconds)</option>
                <option value="scroll_50">Scroll Depth (After 50% scrolled)</option>
                <option value="exit_intent">Exit Intent (When mouse leaves top of screen)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                Triggers (Where to show)
                <button onClick={handleAddTrigger} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}>+ Add Trigger</button>
              </h3>
              
              {formData.triggers.map((trigger, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select value={trigger.type} onChange={e => handleUpdateTrigger(index, 'type', e.target.value)} style={{ width: '130px', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }}>
                    <option value="global">Every Page</option>
                    <option value="path">Specific Page</option>
                  </select>
                  
                  {trigger.type === 'path' && (
                    <>
                      <input type="text" list="promo-path-options" value={trigger.value} onChange={e => handleUpdateTrigger(index, 'value', e.target.value)} placeholder="e.g. /menu" style={{ flex: 1, background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                      <datalist id="promo-path-options">
                        {discoveredPaths.map((path, i) => (
                          <option key={i} value={path}>{path}</option>
                        ))}
                      </datalist>
                    </>
                  )}
                  {trigger.type === 'global' && (
                    <div style={{ flex: 1, padding: '8px', color: '#A1A1AA', fontSize: '0.9rem' }}>Loads globally across the site</div>
                  )}
                  
                  {formData.triggers.length > 1 && (
                    <button onClick={() => handleRemoveTrigger(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={isSaving || !formData.name || isUploading} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', opacity: (isSaving || !formData.name || isUploading) ? 0.5 : 1 }}>
                {isSaving ? 'Saving...' : editingId ? 'Update Promotion' : 'Launch Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
