'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';

export default function AdminTextEditor({ initialData }) {
  // Convert array of {section_key, content_value} into an object mapping
  const initialFormState = initialData.reduce((acc, row) => {
    acc[row.section_key] = row.content_value;
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createBrowserSupabaseClient();

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Saving content...');

    // We must update each key individually, or we can use an upsert array
    const updates = Object.keys(formData).map(key => ({
      section_key: key,
      content_value: formData[key]
    }));

    const { error } = await supabase
      .from('site_content')
      .upsert(updates, { onConflict: 'section_key' });

    if (error) {
      toast.error('Failed to save content', { id: loadingToast });
    } else {
      toast.success('Site content updated successfully!', { id: loadingToast });
    }
    setIsSubmitting(false);
  };

  const inputStyle = { width: '100%', marginBottom: '1.5rem', fontFamily: 'var(--font-sans)', colorScheme: 'dark' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', color: '#D1D5DB', fontSize: '0.9rem', fontWeight: 600, textTransform: 'capitalize' };

  // Helper to group fields visually
  const renderField = (key, label, type = 'text') => (
    <div key={key}>
      <label style={labelStyle}>{label}</label>
      {type === 'textarea' ? (
        <textarea 
          className="glass-input" 
          style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
          value={formData[key] || ''}
          onChange={e => setFormData({...formData, [key]: e.target.value})}
        />
      ) : (
        <input 
          type="text" 
          className="glass-input" 
          style={inputStyle}
          value={formData[key] || ''}
          onChange={e => setFormData({...formData, [key]: e.target.value})}
        />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
        
        {/* About Us Content */}
        <div>
          <h3 className="font-script" style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '1.5rem' }}>About Us Page</h3>
          {renderField('about_hero_title', 'Hero Title')}
          {renderField('about_heritage_title', 'Heritage Section Title')}
          {renderField('about_heritage_p1', 'Heritage Paragraph 1', 'textarea')}
          {renderField('about_heritage_p2', 'Heritage Paragraph 2', 'textarea')}
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }}></div>
          
          {renderField('about_chef_title', 'Chef Section Title')}
          {renderField('about_chef_p1', 'Chef Paragraph 1', 'textarea')}
          {renderField('about_chef_p2', 'Chef Paragraph 2', 'textarea')}
        </div>

        {/* Contact Us Content */}
        <div>
          <h3 className="font-script" style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '1.5rem' }}>Contact Page</h3>
          {renderField('contact_hero_title', 'Hero Title')}
          {renderField('contact_hero_subtitle', 'Hero Subtitle', 'textarea')}
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }}></div>

          {renderField('contact_address', 'Address (use <br/> for new lines)')}
          {renderField('contact_hours', 'Opening Hours (use <br/> for new lines)', 'textarea')}
          {renderField('contact_phone', 'Phone Number')}
          {renderField('contact_email', 'Email Address')}
          {renderField('contact_transport', 'Nearest Transport')}
          {renderField('contact_parking', 'Parking Information')}
        </div>
      </div>

      <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn-primary" style={{ padding: '12px 30px', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </form>
  );
}
