import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Plus, X, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Reels({ userProfile }) {
  const [reels, setReels] = useState([]);
  const [muted, setMuted] = useState(true);
  const [likedIds, setLikedIds] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadReels(); }, []);

  async function loadReels() {
    try {
      const { data } = await supabase.from('reels').select('*').order('created_at', { ascending: false }).limit(25);
      if (Array.isArray(data)) setReels(data);
    } catch (_) {}
  }

  function handleSelectVideo(e) {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl('');
  }

  async function handlePublishReel(e) {
    e.preventDefault();
    if (!videoFile && !videoUrlInput.trim()) return;
    setUploading(true);
    let finalVideoUrl = videoUrlInput.trim();

    try {
      if (videoFile) {
        finalVideoUrl = previewUrl || URL.createObjectURL(videoFile);
        const clean = (videoFile.name || 'reel.mp4').replace(/[^a-zA-Z0-9._-]/g, '');
        const path = `reels/${Date.now()}_${clean}`;
        for (const bucket of ['media', 'reels', 'videos', 'public']) {
          const { error: upErr } = await supabase.storage.from(bucket).upload(path, videoFile);
          if (!upErr) {
            const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
            if (pub?.publicUrl) { finalVideoUrl = pub.publicUrl; break; }
          }
        }
      }

      const authorName = userProfile?.full_name || userProfile?.username || 'ZUKA Creator';
      const newReel = { id: `reel-${Date.now()}`, author_name: authorName, caption: caption.trim(), video_url: finalVideoUrl, likes_count: 0, comments_count: 0 };
      setReels((prev) => [newReel, ...prev]);
      const payload = { caption: caption.trim(), video_url: finalVideoUrl, author_name: authorName };
      if (userProfile?.id) payload.user_id = userProfile.id;
      await supabase.from('reels').insert(payload);
    } catch (_) {}

    setCaption('');
    setVideoFile(null);
    setPreviewUrl('');
    setVideoUrlInput('');
    setUploading(false);
    setCreateOpen(false);
  }

  function toggleLike(reel) {
    const wasLiked = !!likedIds[reel.id];
    setLikedIds((prev) => ({ ...prev, [reel.id]: !wasLiked }));
    const nextLikes = Math.max(0, Number(reel.likes_count || 0) + (wasLiked ? -1 : 1));
    setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, likes_count: nextLikes } : r)));
    if (reel.id && !String(reel.id).startsWith('reel-')) {
      try { supabase.from('reels').update({ likes_count: nextLikes }).eq('id', reel.id); } catch (_) {}
    }
  }
  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 98px)', backgroundColor: '#000000', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
      <div style={{ position: 'fixed', top: '104px', left: 0, right: 0, zIndex: 25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 14px', maxWidth: '680px', margin: '0 auto', pointerEvents: 'none' }}>
        <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '18px', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Reels</span>
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
          <button type="button" onClick={() => setMuted(!muted)} style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '20px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '20px', padding: '6px 12px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Plus size={16} /> Create
          </button>
        </div>
      </div>

      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={handlePublishReel} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '16px', color: '#050505' }}>Create Reel</strong>
              <button type="button" onClick={() => { setCreateOpen(false); setPreviewUrl(''); setVideoFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505' }}><X size={20} /></button>
            </div>
            <input type="file" accept="video/*" onChange={handleSelectVideo} style={{ fontSize: '13px', padding: '6px', border: '1px solid #CED0D4', borderRadius: '8px', color: '#050505' }} />
            {(previewUrl || videoUrlInput.trim()) && (
              <video src={previewUrl || videoUrlInput.trim()} controls muted playsInline style={{ width: '100%', maxHeight: '220px', borderRadius: '8px', backgroundColor: '#000000' }} />
            )}
            <input type="url" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} placeholder="Or paste video URL (.mp4)" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px', color: '#050505' }} />
            <textarea rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption for your Reel..." style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px', color: '#050505' }} />
            <button type="submit" disabled={uploading} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : 'Share Reel'}
            </button>
          </form>
        </div>
      )}

      {reels.length === 0 ? (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>No Reels yet on ZUKA.</p>
          <button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
            Upload First Reel
          </button>
        </div>
      ) : (
        reels.map((reel) => {
          const isLiked = !!likedIds[reel.id];
          return (
            <div key={reel.id} style={{ position: 'relative', height: 'calc(100vh - 98px)', width: '100%', scrollSnapAlign: 'start', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video src={reel.video_url} autoPlay loop muted={muted} playsInline controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', left: '12px', bottom: '24px', right: '72px', color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.8)', pointerEvents: 'none' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{reel.author_name || 'ZUKA Creator'}</div>
                {reel.caption && <div style={{ fontSize: '14px' }}>{reel.caption}</div>}
              </div>
              <div style={{ position: 'absolute', right: '12px', bottom: '28px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', color: '#FFFFFF' }}>
                <button type="button" onClick={() => toggleLike(reel)} style={{ background: 'none', border: 'none', color: isLiked ? '#1877F2' : '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <Heart size={28} fill={isLiked ? '#1877F2' : 'none'} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{reel.likes_count || 0}</span>
                </button>
                <button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)} style={{ background: 'none', border: 'none', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <MessageCircle size={28} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{reel.comments_count || 0}</span>
                </button>
                <button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)} style={{ background: 'none', border: 'none', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <Share2 size={28} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Share</span>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
