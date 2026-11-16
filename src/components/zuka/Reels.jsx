import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Plus, X, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Reels({ userProfile }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [likedIds, setLikedIds] = useState({});
  const [followedIds, setFollowedIds] = useState({});
  const [activeCommentReel, setActiveCommentReel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);

  useEffect(() => { loadReels(); }, []);

  async function loadReels() {
    setLoading(true);
    let rows = [];
    for (const tbl of ['reels', 'videos']) {
      const { data, error } = await supabase.from(tbl).select('*').order('created_at', { ascending: false }).limit(40);
      if (!error && Array.isArray(data)) { rows = data; break; }
    }
    setReels(rows);
    setLoading(false);
  }

  async function toggleLike(reel) {
    const isLiked = !!likedIds[reel.id];
    const nextLikes = Math.max(0, Number(reel.likes_count || 0) + (isLiked ? -1 : 1));
    setLikedIds((prev) => ({ ...prev, [reel.id]: !isLiked }));
    setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, likes_count: nextLikes } : r)));
    await supabase.from('reels').update({ likes_count: nextLikes }).eq('id', reel.id);
  }

  async function openComments(reel) {
    setActiveCommentReel(reel);
    setComments([]);
    const { data } = await supabase.from('reel_comments').select('*').eq('reel_id', reel.id).order('created_at', { ascending: true });
    if (Array.isArray(data)) setComments(data);
  }
  async function submitComment(e) {
    e.preventDefault();
    if (!commentText.trim() || !activeCommentReel) return;
    const text = commentText.trim();
    const author = userProfile?.full_name || userProfile?.username || 'ZUKA Member';
    setComments((prev) => [...prev, { id: `c-${Date.now()}`, author_name: author, content: text }]);
    setCommentText('');
    const nextCount = Number(activeCommentReel.comments_count || 0) + 1;
    setReels((prev) => prev.map((r) => (r.id === activeCommentReel.id ? { ...r, comments_count: nextCount } : r)));
    await supabase.from('reel_comments').insert({ reel_id: activeCommentReel.id, user_id: userProfile?.id || null, author_name: author, content: text });
    await supabase.from('reels').update({ comments_count: nextCount }).eq('id', activeCommentReel.id);
  }

  async function handleCreateReel(e) {
    e.preventDefault();
    setSubmitting(true);
    let finalUrl = videoUrl.trim();
    if (videoFile) {
      const clean = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const path = `reels/${Date.now()}_${clean}`;
      for (const bucket of ['reels', 'media', 'videos', 'public']) {
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, videoFile);
        if (!upErr) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          if (pub?.publicUrl) { finalUrl = pub.publicUrl; break; }
        }
      }
    }
    if (!finalUrl) { setSubmitting(false); return; }
    const author = userProfile?.full_name || userProfile?.username || 'ZUKA Creator';
    const payload = { video_url: finalUrl, caption: caption.trim(), author_name: author, likes_count: 0, comments_count: 0 };
    if (userProfile?.id) payload.user_id = userProfile.id;
    const { data, error } = await supabase.from('reels').insert(payload).select().single();
    setReels((prev) => (!error && data ? [data, ...prev] : [{ id: `local-${Date.now()}`, ...payload }, ...prev]));
    setSubmitting(false);
    setCreateOpen(false);
    setCaption('');
    setVideoUrl('');
    setVideoFile(null);
  }

  return (
    <div style={{ backgroundColor: '#000000', minHeight: 'calc(100dvh - 98px)', color: '#FFFFFF', position: 'relative' }}>
      <div style={{ position: 'sticky', top: '98px', zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
        <strong style={{ fontSize: '18px' }}>Reels</strong>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => setMuted(!muted)} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '18px', padding: '0 14px', height: '36px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Plus size={16} /> Create
          </button>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: '#B0B3B8' }}>Loading Reels...</div>
      ) : reels.length === 0 ? (
        <div style={{ padding: '64px 20px', textAlign: 'center' }}>
          <Play size={44} style={{ margin: '0 auto 12px', color: '#1877F2' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>No Reels yet</h3>
          <p style={{ fontSize: '14px', color: '#B0B3B8', marginBottom: '16px' }}>Share the first vertical video on ZUKA Reels.</p>
          <button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>
            + Create Reel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '24px' }}>
          {reels.map((reel) => {
            const isLiked = !!likedIds[reel.id];
            const isFollowed = !!followedIds[reel.id];
            const author = reel.author_name || 'ZUKA Creator';
            return (
              <div key={reel.id} style={{ position: 'relative', width: '100%', maxWidth: '460px', margin: '0 auto', aspectRatio: '9 / 16', backgroundColor: '#111111', borderRadius: '12px', overflow: 'hidden' }}>
                <video src={reel.video_url} poster={reel.thumbnail_url || ''} loop playsInline controls muted={muted} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', right: '12px', bottom: '84px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 10 }}>
                  <button type="button" onClick={() => toggleLike(reel)} style={{ background: 'none', border: 'none', color: isLiked ? '#F3425F' : '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={22} fill={isLiked ? '#F3425F' : 'none'} /></div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{reel.likes_count || 0}</span>
                  </button>
                  <button type="button" onClick={() => openComments(reel)} style={{ background: 'none', border: 'none', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={22} /></div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{reel.comments_count || 0}</span>
                  </button>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(reel.video_url || window.location.href)} style={{ background: 'none', border: 'none', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={22} /></div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Share</span>
                  </button>
                </div>
                <div style={{ position: 'absolute', left: '12px', right: '68px', bottom: '56px', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{author.charAt(0).toUpperCase()}</div>
                    <strong style={{ fontSize: '14px' }}>{author}</strong>
                    <button type="button" onClick={() => setFollowedIds((p) => ({ ...p, [reel.id]: !isFollowed }))} style={{ backgroundColor: isFollowed ? 'rgba(255,255,255,0.25)' : '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '14px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      {isFollowed ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  {reel.caption && <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.35 }}>{reel.caption}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {activeCommentReel && (
        <div onClick={() => setActiveCommentReel(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', color: '#050505', width: '100%', maxWidth: '520px', borderRadius: '16px 16px 0 0', padding: '14px', maxHeight: '70dvh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '8px', marginBottom: '10px' }}>
              <strong>Comments</strong>
              <button type="button" onClick={() => setActiveCommentReel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {comments.length === 0 ? <p style={{ color: '#65676B', fontSize: '14px', textAlign: 'center', margin: '16px 0' }}>No comments yet.</p> : comments.map((c) => (
                <div key={c.id} style={{ backgroundColor: '#F0F2F5', borderRadius: '12px', padding: '8px 12px', fontSize: '14px' }}>
                  <strong>{c.author_name || 'ZUKA Member'}: </strong>{c.content}
                </div>
              ))}
            </div>
            <form onSubmit={submitComment} style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, padding: '8px 14px', borderRadius: '20px', border: '1px solid #CED0D4', fontSize: '14px' }} />
              <button type="submit" style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '18px', padding: '0 16px', fontWeight: 600, cursor: 'pointer' }}>Post</button>
            </form>
          </div>
        </div>
      )}

      {createOpen && (
        <div onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', color: '#050505', borderRadius: '12px', width: '100%', maxWidth: '460px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '10px', marginBottom: '12px' }}>
              <strong>Create Reel</strong>
              <button type="button" onClick={() => setCreateOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateReel} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
              <input type="url" placeholder="Or paste video URL (.mp4)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
              <textarea rows={2} placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
              <button type="submit" disabled={submitting} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
                {submitting ? 'Uploading...' : 'Share Reel'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
