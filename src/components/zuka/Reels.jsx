import React, { useEffect, useState, useRef } from 'react';
import { ThumbsUp, MessageCircle, Share2, Plus, X, Volume2, VolumeX, Send, Play, Music, MoreHorizontal, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';

export default function Reels({ userProfile }) {
  const [reels, setReels] = useState([]);
  const [muted, setMuted] = useState(false);
  const [likedIds, setLikedIds] = useState({});
  const [followedIds, setFollowedIds] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const [commentReelId, setCommentReelId] = useState(null);
  const [reelComments, setReelComments] = useState({});
  const [commentInput, setCommentInput] = useState('');
  const [menuReelId, setMenuReelId] = useState(null);
  const [sharedToast, setSharedToast] = useState(false);

  useEffect(() => { loadReels(); }, []);

  async function loadReels() {
    let profMap = {};
    try {
      const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified');
      if (Array.isArray(profs)) profs.forEach((p) => { profMap[String(p.id)] = p; });
    } catch (_) {}

    try {
      const { data } = await supabase.from('reels').select('*').order('created_at', { ascending: false }).limit(25);
      if (Array.isArray(data)) {
        setReels(data.map((r) => {
          const owner = r.user_id ? profMap[String(r.user_id)] : null;
          return {
            ...r,
            author_name: owner?.full_name || owner?.username || r.author_name || 'ZUKA Creator',
            avatar_url: owner?.avatar_url || r.avatar_url || '',
            is_verified: Boolean(owner?.is_verified || r.is_verified)
          };
        }));
      }
    } catch (_) {}
  }

  function handleSelectVideo(e) {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : '');
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
          const { error: upErr } = await supabase.storage.from(bucket).upload(path, videoFile, { contentType: videoFile.type || 'video/mp4', upsert: true });
          if (!upErr) {
            const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
            if (pub?.publicUrl) { finalVideoUrl = pub.publicUrl; break; }
          }
        }
      }
      const authorName = userProfile?.full_name || userProfile?.username || 'ZUKA Creator';
      const newReel = { id: `reel-${Date.now()}`, user_id: userProfile?.id, author_name: authorName, avatar_url: userProfile?.avatar_url, is_verified: userProfile?.is_verified, caption: caption.trim(), video_url: finalVideoUrl, likes_count: 0, comments_count: 0 };
      setReels((prev) => [newReel, ...prev]);
      const payload = { caption: caption.trim(), video_url: finalVideoUrl, author_name: authorName };
      if (userProfile?.id) payload.user_id = userProfile.id;
      await supabase.from('reels').insert(payload);
    } catch (_) {}
    setCaption(''); setVideoFile(null); setPreviewUrl(''); setVideoUrlInput(''); setUploading(false); setCreateOpen(false);
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
function ReelCard({ reel, muted, isLiked, isFollowed, currentUserId, onToggleLike, onToggleFollow, onOpenComments, onShare, onOpenMenu }) {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }, [reel.video_url]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  function handleTapVideo() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (v && v.duration) setProgress((v.currentTime / v.duration) * 100);
  }

  const author = reel.author_name || 'ZUKA Creator';
  const isOwn = currentUserId && String(reel.user_id) === String(currentUserId);

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 98px)', width: '100%', scrollSnapAlign: 'start', backgroundColor: '#000000', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={reel.video_url}
        loop
        playsInline
        onClick={handleTapVideo}
        onTimeUpdate={handleTimeUpdate}
        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
      />

      {paused && (
        <div onClick={handleTapVideo} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
            <Play size={32} fill="#FFFFFF" />
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: '12px', bottom: '18px', right: '74px', color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.85)', pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #FFFFFF', backgroundColor: '#1877F2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', flexShrink: 0 }}>
            {reel.avatar_url ? <img src={reel.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : author.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center' }}>
            {author}
            {reel.is_verified && <ZukaBadge size={15} />}
          </span>
          {!isOwn && (
            <button
              type="button"
              onClick={() => onToggleFollow(reel.id)}
              style={{ marginLeft: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.85)', backgroundColor: isFollowed ? 'rgba(255,255,255,0.25)' : 'transparent', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              {isFollowed ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        {reel.caption && <div style={{ fontSize: '14px', lineHeight: '1.35', marginBottom: '6px' }}>{reel.caption}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.92 }}>
          <Music size={13} />
          <span>Original audio · {author}</span>
        </div>
      </div>

      <div style={{ position: 'absolute', right: '10px', bottom: '20px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', color: '#FFFFFF' }}>
        <button type="button" onClick={() => onToggleLike(reel)} style={{ background: 'none', border: 'none', color: isLiked ? '#1877F2' : '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
          <ThumbsUp size={27} fill={isLiked ? '#1877F2' : 'none'} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{reel.likes_count || 0}</span>
        </button>
        <button type="button" onClick={() => onOpenComments(reel.id)} style={{ background: 'none', border: 'none', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
          <MessageCircle size={27} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{reel.comments_count || 0}</span>
        </button>
        <button type="button" onClick={() => onShare(reel)} style={{ background: 'none', border: 'none', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
          <Share2 size={27} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>Share</span>
        </button>
        <button type="button" onClick={() => onOpenMenu(reel)} style={{ background: 'none', border: 'none', color: '#FFFFFF', padding: '2px', cursor: 'pointer' }}>
          <MoreHorizontal size={24} />
        </button>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '2.5px', backgroundColor: 'rgba(255,255,255,0.28)' }}>
        <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#FFFFFF' }} />
      </div>
    </div>
  );
}
  function handleAddComment(e) {
    e.preventDefault();
    const txt = commentInput.trim();
    if (!txt || !commentReelId) return;
    const author = userProfile?.full_name || userProfile?.username || 'You';
    setReelComments((prev) => ({
      ...prev,
      [commentReelId]: [...(prev[commentReelId] || []), { id: `rc-${Date.now()}`, author, content: txt }]
    }));
    setReels((prev) => prev.map((r) => (r.id === commentReelId ? { ...r, comments_count: Number(r.comments_count || 0) + 1 } : r)));
    setCommentInput('');
  }

  async function handleShare(reel) {
    const shareText = `${reel.author_name || 'ZUKA Reel'}: ${reel.caption || 'Watch on ZUKA'}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'ZUKA Reels', text: shareText, url: window.location.href }); return; } catch (_) {}
    }
    try { await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`); } catch (_) {}
    setSharedToast(true);
    setTimeout(() => setSharedToast(false), 2200);
  }

  async function handleDeleteReel(reel) {
    setMenuReelId(null);
    setReels((prev) => prev.filter((r) => r.id !== reel.id));
    if (reel.id && !String(reel.id).startsWith('reel-')) {
      try { await supabase.from('reels').delete().eq('id', reel.id); } catch (_) {}
    }
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 98px)', backgroundColor: '#000000', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
      {sharedToast && (
        <div style={{ position: 'fixed', top: '150px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, backgroundColor: '#1877F2', color: '#FFFFFF', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
          Link copied to share!
        </div>
      )}
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
            {(previewUrl || videoUrlInput.trim()) && <video src={previewUrl || videoUrlInput.trim()} controls muted playsInline style={{ width: '100%', maxHeight: '220px', borderRadius: '8px', backgroundColor: '#000000' }} />}
            <input type="url" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} placeholder="Or paste video URL (.mp4)" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px', color: '#050505' }} />
            <textarea rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption for your Reel..." style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px', color: '#050505' }} />
            <button type="submit" disabled={uploading} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>{uploading ? 'Uploading...' : 'Share Reel'}</button>
          </form>
        </div>
      )}

      {commentReelId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 45, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFFFFF', width: '100%', maxWidth: '680px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '14px', maxHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '8px', marginBottom: '8px' }}>
              <strong style={{ fontSize: '15px', color: '#050505' }}>Comments</strong>
              <button type="button" onClick={() => setCommentReelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {(reelComments[commentReelId] || []).length === 0 ? <div style={{ textAlign: 'center', color: '#65676B', fontSize: '13px', padding: '20px 0' }}>No comments yet. Be the first!</div> : (reelComments[commentReelId] || []).map((c) => <div key={c.id} style={{ backgroundColor: '#F0F2F5', padding: '8px 12px', borderRadius: '12px', fontSize: '13px', color: '#050505' }}><strong>{c.author}: </strong>{c.content}</div>)}
            </div>
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, padding: '9px 14px', borderRadius: '20px', border: '1px solid #CED0D4', fontSize: '14px' }} />
              <button type="submit" style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={16} /></button>
            </form>
          </div>
        </div>
      )}

      {menuReelId && (
        <div onClick={() => setMenuReelId(null)} style={{ position: 'fixed', inset: 0, zIndex: 48, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', width: '100%', maxWidth: '680px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button type="button" onClick={() => { handleShare(menuReelId); setMenuReelId(null); }} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#F0F2F5', fontWeight: 700, fontSize: '15px', textAlign: 'left', cursor: 'pointer', color: '#050505' }}>Copy link / Share Reel</button>
            {userProfile?.id && String(menuReelId.user_id) === String(userProfile.id) && <button type="button" onClick={() => handleDeleteReel(menuReelId)} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#FFEBEE', color: '#D32F2F', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Trash2 size={18} /> Delete Reel</button>}
          </div>
        </div>
      )}

      {reels.length === 0 ? (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>No Reels yet on ZUKA.</p>
          <button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Upload First Reel</button>
        </div>
      ) : (
        reels.map((reel) => <ReelCard key={reel.id} reel={reel} muted={muted} isLiked={!!likedIds[reel.id]} isFollowed={!!followedIds[reel.id]} currentUserId={userProfile?.id} onToggleLike={toggleLike} onToggleFollow={(id) => setFollowedIds((prev) => ({ ...prev, [id]: !prev[id] }))} onOpenComments={(id) => setCommentReelId(id)} onShare={handleShare} onOpenMenu={(r) => setMenuReelId(r)} />)
      )}
    </div>
  );
}
