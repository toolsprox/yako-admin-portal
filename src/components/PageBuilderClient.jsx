'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

export default function PageBuilderClient({ initialPages }) {
  const [pages, setPages] = useState(initialPages || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const supabase = createBrowserSupabaseClient();

  const emptyForm = {
    slug: '', title: '', meta_description: '', status: 'draft', blocks: []
  };

  const [formData, setFormData] = useState(emptyForm);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (page) => {
    setEditingId(page.id);
    setFormData({
      slug: page.slug,
      title: page.title,
      meta_description: page.meta_description || '',
      status: page.status,
      blocks: page.blocks || []
    });
    setIsModalOpen(true);
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddBlock = (type) => {
    let newBlock = { id: generateId(), type, data: {} };
    if (type === 'hero') newBlock.data = { title: '', subtitle: '', image_url: '' };
    if (type === 'text') newBlock.data = { content: '' };
    if (type === 'gallery') newBlock.data = { images: ['', '', ''] };
    if (type === 'cta') newBlock.data = { title: 'Book Your Experience', button_text: 'Reservations', button_link: '/book' };
    if (type === 'menu_highlights') newBlock.data = { title: 'Featured Dishes' };
    if (type === 'faq') newBlock.data = { questions: [{ q: '', a: '' }] };
    
    setFormData({ ...formData, blocks: [...formData.blocks, newBlock] });
  };

  const handleUpdateBlock = (index, field, value) => {
    const newBlocks = [...formData.blocks];
    newBlocks[index].data[field] = value;
    setFormData({ ...formData, blocks: newBlocks });
  };

  const handleRemoveBlock = (index) => {
    const newBlocks = formData.blocks.filter((_, i) => i !== index);
    setFormData({ ...formData, blocks: newBlocks });
  };

  const handleMoveBlock = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formData.blocks.length - 1) return;
    
    const newBlocks = [...formData.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setFormData({ ...formData, blocks: newBlocks });
  };

  const handleUpdateArrayBlock = (blockIndex, arrayField, itemIndex, itemField, value) => {
    const newBlocks = [...formData.blocks];
    if (itemField) {
      newBlocks[blockIndex].data[arrayField][itemIndex][itemField] = value;
    } else {
      newBlocks[blockIndex].data[arrayField][itemIndex] = value;
    }
    setFormData({ ...formData, blocks: newBlocks });
  };

  const handleAddArrayItem = (blockIndex, arrayField, defaultItem) => {
    const newBlocks = [...formData.blocks];
    newBlocks[blockIndex].data[arrayField].push(defaultItem);
    setFormData({ ...formData, blocks: newBlocks });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ensure slug starts with /
      let finalSlug = formData.slug.trim();
      if (!finalSlug.startsWith('/')) finalSlug = '/' + finalSlug;

      if (editingId) {
        const { data, error } = await supabase
          .from('pages')
          .update({
            slug: finalSlug, title: formData.title, meta_description: formData.meta_description,
            status: formData.status, blocks: formData.blocks
          })
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;
        setPages(pages.map(p => p.id === editingId ? data : p));
      } else {
        const { data, error } = await supabase
          .from('pages')
          .insert([{
            slug: finalSlug, title: formData.title, meta_description: formData.meta_description,
            status: formData.status, blocks: formData.blocks
          }])
          .select()
          .single();

        if (error) throw error;
        setPages([data, ...pages]);
      }

      setIsModalOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
    } catch (e) {
      console.error("Error saving page:", e);
      alert("Failed to save page. Ensure slug is unique.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this page?")) return;
    try {
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
      setPages(pages.filter(p => p.id !== id));
    } catch (e) {
      console.error("Error deleting page:", e);
      alert("Failed to delete page.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ marginBottom: '10px' }}>Pages (CMS)</h1>
          <p style={{ color: '#A1A1AA' }}>Build custom dynamic pages using the advanced block builder.</p>
        </div>
        <button 
          onClick={handleAddNew}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Create New Page
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#A1A1AA' }}>
              <th style={{ padding: '15px 20px' }}>Page Title</th>
              <th style={{ padding: '15px 20px' }}>URL Slug</th>
              <th style={{ padding: '15px 20px' }}>Status</th>
              <th style={{ padding: '15px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map(page => (
              <tr key={page.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px 20px', fontWeight: 500 }}>{page.title}</td>
                <td style={{ padding: '15px 20px', color: '#A1A1AA' }}>{page.slug}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ background: page.status === 'published' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: page.status === 'published' ? '#22c55e' : '#eab308', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {page.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                  <button onClick={() => handleEdit(page)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '8px' }}>Edit</button>
                  <button onClick={() => handleDelete(page.id)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '8px' }}>Delete</button>
                  {page.status === 'published' && (
                    <a href={`http://localhost:3000${page.slug}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: 'var(--primary)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'none' }}>View Live</a>
                  )}
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#A1A1AA' }}>No custom pages created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '100%', maxWidth: '800px', padding: '30px', position: 'relative', marginTop: '40px', marginBottom: '40px' }}>
            <h2 style={{ marginBottom: '20px' }}>{editingId ? 'Edit Page' : 'Create New Page'}</h2>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>Page Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Christmas Party 2026" style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>URL Slug</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="e.g. /christmas" style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>SEO Meta Description</label>
                <input type="text" value={formData.meta_description} onChange={e => setFormData({...formData, meta_description: e.target.value})} placeholder="Brief description for Google search results..." style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#A1A1AA', fontSize: '0.9rem' }}>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }}>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="published">Published (Live)</option>
                </select>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '30px 0' }} />

            <h3 style={{ marginBottom: '20px' }}>Page Blocks</h3>
            
            {formData.blocks.map((block, index) => (
              <div key={block.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.8rem' }}>{block.type.replace('_', ' ')} BLOCK</div>
                  <div>
                    <button onClick={() => handleMoveBlock(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', color: index === 0 ? '#555' : '#fff', cursor: index === 0 ? 'default' : 'pointer', marginRight: '10px' }}>↑</button>
                    <button onClick={() => handleMoveBlock(index, 'down')} disabled={index === formData.blocks.length - 1} style={{ background: 'none', border: 'none', color: index === formData.blocks.length - 1 ? '#555' : '#fff', cursor: index === formData.blocks.length - 1 ? 'default' : 'pointer', marginRight: '15px' }}>↓</button>
                    <button onClick={() => handleRemoveBlock(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                  </div>
                </div>

                {/* Block Editors */}
                {block.type === 'hero' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" value={block.data.title} onChange={e => handleUpdateBlock(index, 'title', e.target.value)} placeholder="Hero Title" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                    <input type="text" value={block.data.subtitle} onChange={e => handleUpdateBlock(index, 'subtitle', e.target.value)} placeholder="Hero Subtitle" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                    <input type="text" value={block.data.image_url} onChange={e => handleUpdateBlock(index, 'image_url', e.target.value)} placeholder="Background Image URL" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                  </div>
                )}

                {block.type === 'text' && (
                  <textarea rows={5} value={block.data.content} onChange={e => handleUpdateBlock(index, 'content', e.target.value)} placeholder="Paragraph text... (supports basic HTML like <b> or <br>)" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px', fontFamily: 'inherit' }} />
                )}

                {block.type === 'cta' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" value={block.data.title} onChange={e => handleUpdateBlock(index, 'title', e.target.value)} placeholder="CTA Title" style={{ flex: 1, background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                    <input type="text" value={block.data.button_text} onChange={e => handleUpdateBlock(index, 'button_text', e.target.value)} placeholder="Button Text" style={{ flex: 1, background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                    <input type="text" value={block.data.button_link} onChange={e => handleUpdateBlock(index, 'button_link', e.target.value)} placeholder="Button URL (/book)" style={{ flex: 1, background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                  </div>
                )}

                {block.type === 'gallery' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {block.data.images.map((img, i) => (
                      <input key={i} type="text" value={img} onChange={e => handleUpdateArrayBlock(index, 'images', i, null, e.target.value)} placeholder={`Image URL ${i+1}`} style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                    ))}
                    <button onClick={() => handleAddArrayItem(index, 'images', '')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}>+ Add Image</button>
                  </div>
                )}

                {block.type === 'faq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {block.data.questions.map((q, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <input type="text" value={q.q} onChange={e => handleUpdateArrayBlock(index, 'questions', i, 'q', e.target.value)} placeholder="Question" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                        <textarea rows={2} value={q.a} onChange={e => handleUpdateArrayBlock(index, 'questions', i, 'a', e.target.value)} placeholder="Answer" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                      </div>
                    ))}
                    <button onClick={() => handleAddArrayItem(index, 'questions', {q: '', a: ''})} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}>+ Add Question</button>
                  </div>
                )}

                {block.type === 'menu_highlights' && (
                  <div>
                    <input type="text" value={block.data.title} onChange={e => handleUpdateBlock(index, 'title', e.target.value)} placeholder="Section Title" style={{ width: '100%', background: '#374151', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                    <p style={{ fontSize: '0.8rem', color: '#A1A1AA', marginTop: '5px' }}>This block will automatically pull featured dishes from your actual Menu database.</p>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px', padding: '15px', background: '#1f2937', borderRadius: '8px' }}>
              <span style={{ color: '#A1A1AA', fontSize: '0.9rem', width: '100%', marginBottom: '5px' }}>Add new block:</span>
              <button onClick={() => handleAddBlock('hero')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>+ Hero</button>
              <button onClick={() => handleAddBlock('text')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>+ Rich Text</button>
              <button onClick={() => handleAddBlock('gallery')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>+ Image Gallery</button>
              <button onClick={() => handleAddBlock('cta')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>+ Call To Action</button>
              <button onClick={() => handleAddBlock('menu_highlights')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>+ Menu Highlights</button>
              <button onClick={() => handleAddBlock('faq')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>+ FAQ Accordion</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={isSaving || !formData.slug || !formData.title} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', opacity: (isSaving || !formData.slug || !formData.title) ? 0.5 : 1 }}>
                {isSaving ? 'Saving...' : editingId ? 'Update Page' : 'Publish Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
