'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

export default function TrackingManagerClient({ initialScripts, discoveredPaths = [], discoveredEvents = [] }) {
  const [scripts, setScripts] = useState(initialScripts || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createBrowserSupabaseClient();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    provider: 'ga4',
    tracking_code: '',
    triggers: [{ type: 'global', value: '' }],
    is_active: true
  });

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('tracking_scripts')
        .insert([{
          name: formData.name,
          provider: formData.provider,
          tracking_code: formData.tracking_code,
          triggers: formData.triggers,
          is_active: formData.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      setScripts([data, ...scripts]);
      setIsModalOpen(false);
      setFormData({
        name: '', provider: 'ga4', tracking_code: '', triggers: [{ type: 'global', value: '' }], is_active: true
      });
    } catch (e) {
      console.error("Error saving script:", e);
      alert("Failed to save tracking script.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from('tracking_scripts')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (!error) {
      setScripts(scripts.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ marginBottom: '10px' }}>Tracking & Ads Manager</h1>
          <p style={{ color: '#A1A1AA' }}>Dynamically inject GA4, Meta Pixels, and custom scripts into your platform.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Add Tracker
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#A1A1AA' }}>
              <th style={{ padding: '15px 20px' }}>Name</th>
              <th style={{ padding: '15px 20px' }}>Provider</th>
              <th style={{ padding: '15px 20px' }}>Triggers</th>
              <th style={{ padding: '15px 20px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {scripts.map(script => (
              <tr key={script.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px 20px', fontWeight: 500 }}>{script.name}</td>
                <td style={{ padding: '15px 20px' }}><span style={{ background: '#1f2937', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{script.provider}</span></td>
                <td style={{ padding: '15px 20px' }}>
                  {script.triggers.map((t, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: '#A1A1AA', marginBottom: '2px' }}>
                      • {t.type === 'global' ? 'Every Page' : t.type === 'path' ? `Path: ${t.value}` : `Event: ${t.value}`}
                    </div>
                  ))}
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <button 
                    onClick={() => toggleStatus(script.id, script.is_active)}
                    style={{ background: script.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: script.is_active ? '#22c55e' : '#ef4444', border: '1px solid', borderColor: script.is_active ? '#22c55e' : '#ef4444', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    {script.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))}
            {scripts.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#A1A1AA' }}>No tracking scripts configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative' }}>
            <h2 style={{ marginBottom: '20px' }}>Add Tracking Script</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>Tracker Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. FB Pixel Main" style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>Provider</label>
              <select value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }}>
                <option value="ga4">Google Analytics (GA4)</option>
                <option value="fbpixel">Meta / Facebook Pixel</option>
                <option value="custom_html">Custom HTML / Script Snippet</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>
                {formData.provider === 'custom_html' ? 'Raw HTML Snippet' : 'Tracking ID (e.g. G-XXXX, AW-XXXX, or Pixel ID)'}
              </label>
              {formData.provider === 'custom_html' ? (
                <textarea rows={4} value={formData.tracking_code} onChange={e => setFormData({...formData, tracking_code: e.target.value})} placeholder="<script>...</script>" style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px', fontFamily: 'monospace' }} />
              ) : (
                <input type="text" value={formData.tracking_code} onChange={e => setFormData({...formData, tracking_code: e.target.value})} placeholder="ID" style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }} />
              )}
            </div>

            <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                Triggers
                <button onClick={handleAddTrigger} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}>+ Add Trigger</button>
              </h3>
              
              {formData.triggers.map((trigger, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select value={trigger.type} onChange={e => handleUpdateTrigger(index, 'type', e.target.value)} style={{ width: '130px', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }}>
                    <option value="global">Every Page</option>
                    <option value="path">Specific Page</option>
                    <option value="event">Custom Event</option>
                  </select>
                  
                  {trigger.type === 'path' && (
                    <>
                      <input type="text" list="path-options" value={trigger.value} onChange={e => handleUpdateTrigger(index, 'value', e.target.value)} placeholder="Select or type a path (e.g. /menu)" style={{ flex: 1, background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                      <datalist id="path-options">
                        {discoveredPaths.map((path, i) => (
                          <option key={i} value={path}>{path}</option>
                        ))}
                      </datalist>
                    </>
                  )}
                  {trigger.type === 'event' && (
                    <>
                      <input type="text" list="event-options" value={trigger.value} onChange={e => handleUpdateTrigger(index, 'value', e.target.value)} placeholder="Select or type an event (e.g. reservation_complete)" style={{ flex: 1, background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                      <datalist id="event-options">
                        {discoveredEvents.map((evt, i) => (
                          <option key={i} value={evt}>{evt}</option>
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
              <button onClick={handleSave} disabled={isSaving || !formData.name || !formData.tracking_code} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', opacity: (isSaving || !formData.name || !formData.tracking_code) ? 0.5 : 1 }}>
                {isSaving ? 'Saving...' : 'Save Tracker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
