import React, { useState } from 'react';
import { Image, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CreatePost({ userProfile, onCreatePost, onOpenProfile }) {
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [open, setOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  function handleSelectMedia(e) {
    const file = e.target.files?.[0] || null;
    setMediaFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl('');
    }
  }

  function clearMedia() {
    setMediaFile(null);
    setPreviewUrl('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() && !mediaFile) return;
    setPosting(true);
    let mediaUrl = '';
    const isVideo = mediaFile && mediaFile.type?.startsWith('video/');

    try {
      if (mediaFile) {
        mediaUrl = previewUrl || URL.createObjectURL(mediaFile);
        const clean = (mediaFile.name || 'upload.jpg').replace(/[^a-zA-Z0-9._-]/g, '');
        const path = `posts/${Date.now()}_${clean}`;
        for (const bucket of ['media', 'posts', 'videos', 'public']) {
          const { error: upErr } = await supabase.storage.from(bucket).upload(path, mediaFile, { contentType: mediaFile.type || 'image/jpeg', upsert: true });
          if (!upErr) {
            const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
            if (pub?.publicUrl) { mediaUrl = pub.publicUrl; break; }
          }
        }
      }
      if (onCreatePost) await onCreatePost(text.trim(), mediaUrl, isVideo ? 'video' : 'image');
    } catch (_) {}

    setText('');
    clearMedia();
    setPosting(false);
    setOpen(false);
  }

  const initial = (userProfile?.full_name || userProfile?.username || 'Z').charAt(0).toUpperCase();
  const isVideoPreview = mediaFile && mediaFile.type?.startsWith('video/');

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
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#65676B' }}>Photo/video</span>
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E4E6EB', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind?" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />

          {previewUrl && (
            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E4E6EB', backgroundColor: '#000000' }}>
              {isVideoPreview ? (
                <video src={previewUrl} controls muted playsInline style={{ width: '100%', maxHeight: '280px', display: 'block' }} />
              ) : (
                <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }} />
              )}
              <button
                type="button"
                onClick={clearMedia}
                aria-label="Remove media"
                style={{ position: 'absolute', top: '8px', right: '8px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', backgroundColor: '#F0F2F5', color: '#050505', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            <Image size={18} color="#45BD62" />
            <span>{previewUrl ? 'Change Photo / Video' : 'Choose Photo or Video'}</span>
            <input type="file" accept="image/*,video/*" onChange={handleSelectMedia} style={{ display: 'none' }} />
          </label>

          <button type="submit" disabled={posting} style={{ alignSelf: 'flex-end', backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', fontWeight: 700, padding: '8px 18px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>
      )}
    </div>
  );
}
