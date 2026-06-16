'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminGalleryManager({ initialImages }) {
  const [images, setImages] = useState(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createBrowserSupabaseClient();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const loadingToast = toast.loading('Uploading image...');

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('gallery')
      .upload(fileName, file);

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`, { id: loadingToast });
      setIsUploading(false);
      return;
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // 3. Insert into database
    const newImageRecord = {
      image_url: imageUrl,
      alt_text: 'Yako London Gallery Image',
      span_class: 'col-span-1 row-span-1', // Default size
      order_index: images.length,
      is_active: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('gallery_images')
      .insert([newImageRecord])
      .select();

    if (insertError) {
      toast.error('Failed to save to database', { id: loadingToast });
    } else {
      toast.success('Image added successfully!', { id: loadingToast });
      setImages([...images, insertData[0]]);
    }
    
    setIsUploading(false);
    // Reset file input
    e.target.value = null;
  };

  const toggleActive = async (id, currentStatus) => {
    const loadingToast = toast.loading('Updating...');
    const newStatus = !currentStatus;
    
    const { error } = await supabase
      .from('gallery_images')
      .update({ is_active: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update', { id: loadingToast });
    } else {
      toast.success(newStatus ? 'Image is now visible' : 'Image is hidden', { id: loadingToast });
      setImages(images.map(img => img.id === id ? { ...img, is_active: newStatus } : img));
    }
  };

  const handleDelete = async (id, imageUrl) => {
    if (!confirm('Are you sure you want to completely delete this image?')) return;
    
    const loadingToast = toast.loading('Deleting...');
    
    // 1. Delete from database
    const { error: dbError } = await supabase.from('gallery_images').delete().eq('id', id);

    if (dbError) {
      toast.error('Failed to delete from database', { id: loadingToast });
      return;
    }

    // 2. Try to delete from storage if it's a Supabase hosted image
    if (imageUrl.includes('supabase.co')) {
      const fileName = imageUrl.split('/').pop();
      // We ignore storage delete errors as the main thing is removing it from the UI/DB
      await supabase.storage.from('gallery').remove([fileName]);
    }

    toast.success('Image deleted', { id: loadingToast });
    setImages(images.filter(img => img.id !== id));
  };

  const handleAltTextChange = async (id, newAltText) => {
    setImages(images.map(img => img.id === id ? { ...img, alt_text: newAltText } : img));
    await supabase.from('gallery_images').update({ alt_text: newAltText }).eq('id', id);
  };

  const handleSpanChange = async (id, newSpan) => {
    setImages(images.map(img => img.id === id ? { ...img, span_class: newSpan } : img));
    await supabase.from('gallery_images').update({ span_class: newSpan }).eq('id', id);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 className="font-script" style={{ color: 'var(--primary)', fontSize: '2rem', margin: 0 }}>Gallery Manager</h3>
        
        <div style={{ position: 'relative' }}>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{ 
              position: 'absolute', 
              inset: 0, 
              opacity: 0, 
              cursor: isUploading ? 'not-allowed' : 'pointer' 
            }} 
          />
          <button className="btn-primary" disabled={isUploading} style={{ opacity: isUploading ? 0.7 : 1 }}>
            {isUploading ? 'Uploading...' : '+ Upload New Image'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {images.map(img => (
          <div key={img.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', opacity: img.is_active ? 1 : 0.5, transition: 'opacity 0.2s' }}>
            <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
              <Image src={img.image_url} alt={img.alt_text || 'Gallery Image'} fill style={{ objectFit: 'cover' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input 
                type="text" 
                value={img.alt_text || ''} 
                onChange={(e) => handleAltTextChange(img.id, e.target.value)}
                placeholder="Caption / Alt Text"
                className="glass-input"
                style={{ width: '100%', padding: '8px', fontSize: '0.9rem' }}
              />
              
              <select 
                value={img.span_class} 
                onChange={(e) => handleSpanChange(img.id, e.target.value)}
                className="glass-input"
                style={{ width: '100%', padding: '8px', fontSize: '0.9rem', appearance: 'auto' }}
              >
                <option value="col-span-1 row-span-1">Standard (Small Rectangle)</option>
                <option value="col-span-1 row-span-2">Tall Portrait</option>
                <option value="col-span-2 row-span-1">Wide Landscape</option>
                <option value="col-span-2 row-span-2">Large Feature</option>
              </select>

              <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => toggleActive(img.id, img.is_active)}
                  className="btn-outline"
                  style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }}
                >
                  {img.is_active ? 'Hide' : 'Show'}
                </button>
                <button 
                  onClick={() => handleDelete(img.id, img.image_url)}
                  style={{ flex: 1, padding: '6px', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {images.length === 0 && <p style={{ color: '#A1A1AA' }}>No images in the gallery yet.</p>}
    </div>
  );
}
