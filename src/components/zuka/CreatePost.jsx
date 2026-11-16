import React, { useState } from 'react';
import { Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CreatePost({ userProfile, onCreatePost, onOpenProfile }) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [open, setOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    setPosting(true);
    let imageUrl = '';
    if (imageFile) {
      const clean = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const path = `posts/${Date.now()}_${clean}`;
      for (const bucket of ['media', 'posts', 'public']) {
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, imageFile);
        if (!upErr) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          if (pub?.publicUrl) { imageUrl = pub.publicUrl; break; }
        }
      }
    }
    if (onCreatePost) await onCreatePost(text.trim(), imageUrl);
    setText('');
    setImageFile(null);
    setPosting(false);
    setOpen(false);
  }

  const initial = (userProfile?.full_name || userProfile?.username || 'Z').charAt(0).toUpperCase();

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E6EB', padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={onOpenProfile}
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E4E6EB', border: 'none', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#050505', flexShrink: 0, cursor: 'pointer' }}
        >
          {userProfile?.avatar_url ? <img src={userProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{ flex: 1, height: '40px', padding: '0 16px', borderRadius: '20px', border: '1px solid #CED0D4', backgroundColor: '#FFFFFF', textAlign: 'left', fontSize: '15px', color: '#65676B', cursor: 'pointer' }}
        >
          What's on your mind?
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 6px', background: 'none', border: 'none', color: '#45BD62', cursor: 'pointer' }}
        >
          <Image size={24} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#65676B' }}>Photo</span>
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E4E6EB', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind?" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} style={{ fontSize: '13px', padding: '6px', border: '1px solid #CED0D4', borderRadius: '8px' }} />
          <button type="submit" disabled={posting} style={{ alignSelf: 'flex-end', backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', fontWeight: 700, padding: '8px 18px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>
      )}
    </div>
  );
}
