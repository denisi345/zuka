import React, { useEffect, useState, useRef } from 'react';
import { ThumbsUp, MessageCircle, Forward, X, Volume2, VolumeX, Send, Play, MoreHorizontal, Trash2, Search, Camera, UserCircle, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';

function ReelCard({ reel, muted, onToggleMute, isLiked, isFollowed, currentUserId, onToggleLike, onToggleFollow, onOpenComments, onShare, onOpenMenu, onOpenUserProfile }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const tapTimerRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [heartBurst, setHeartBurst] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    const v = videoRef.current;
    if (!el || !v) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.muted = muted;
          v.play().then(() => setPaused(false)).catch(() => { v.muted = true; v.play().then(() => setPaused(false)).catch(() => {}); });
        } else { v.pause(); }
      },
      { threshold: 0.65 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reel.video_url]);

  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);

  function handleVideoClick() {
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      if (!isLiked) onToggleLike(reel);
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 750);
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapTimerRef.current = null;
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) { v.play().catch(() => {}); setPaused(false); }
      else { v.pause(); setPaused(true); }
    }, 220);
  }

  function handleSeek(e) {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setProgress(ratio * 100);
  }
  const author = reel.author_name || 'ZUKA Creator';
  const isOwn = currentUserId && String(reel.user_id) === String(currentUserId);
  const cap = reel.caption || '';
  const isLongCap = cap.length > 42;
  const shownCap = captionExpanded || !isLongCap ? cap : `${cap.slice(0, 42)}...`;

  return (
    <div ref={containerRef} style={{ position: 'relative', height: 'calc(100vh - 46px)', width: '100%', scrollSnapAlign: 'start', backgroundColor: '#000000', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={reel.video_url}
        loop
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
        onTimeUpdate={() => { const v = videoRef.current; if (v && v.duration) setProgress((v.currentTime / v.duration) * 100); }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
      />

      {paused && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
            <Play size={32} fill="#FFFFFF" />
          </div>
        </div>
      )}

      {heartBurst && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '84px', height: '84px', borderRadius: '50%', backgroundColor: 'rgba(24,119,242,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
            <ThumbsUp size={42} fill="#FFFFFF" />
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '150px', background: 'linear-gradient(to top, rgba(0,0,0,0.84), transparent)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', left: '14px', bottom: '18px', right: '72px', color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <div
            onClick={() => reel.user_id && onOpenUserProfile && onOpenUserProfile({ id: reel.user_id, full_name: author, avatar_url: reel.avatar_url, is_verified: reel.is_verified })}
            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #FFFFFF', backgroundColor: '#1877F2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', flexShrink: 0, cursor: 'pointer' }}
          >
            {reel.avatar_url ? <img src={reel.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : author.charAt(0).toUpperCase()}
          </div>
          <span
            onClick={() => reel.user_id && onOpenUserProfile && onOpenUserProfile({ id: reel.user_id, full_name: author, avatar_url: reel.avatar_url, is_verified: reel.is_verified })}
            style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          >
            {author}
            {reel.is_verified && <ZukaBadge size={15} />}
            <Globe size={13} style={{ opacity: 0.85, marginLeft: '2px' }} />
          </span>
          {!isOwn && (
            <button type="button" onClick={() => onToggleFollow(reel.id)} style={{ marginLeft: '2px', padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.75)', backgroundColor: isFollowed ? 'rgba(255,255,255,0.22)' : 'transparent', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              {isFollowed ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        {cap && (
          <div onClick={() => isLongCap && setCaptionExpanded(!captionExpanded)} style={{ fontSize: '14px', lineHeight: '1.35', cursor: isLongCap ? 'pointer' : 'default' }}>
            {shownCap}
            {isLongCap && !captionExpanded && <span style={{ color: '#B0B3B8', fontWeight: 700 }}> more</span>}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', right: '10px', bottom: '18px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', color: '#FFFFFF' }}>
        <button type="button" onClick={() => onToggleLike(reel)} style={{ background: 'none', border: 'none', color: isLiked ? '#1877F2' : '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
          <ThumbsUp size={28} fill={isLiked ? '#1877F2' : 'none'} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{reel.likes_count || 0}</span>
        </button>
        <button type="button" onClick={() => onOpenComments(reel.id)} style={{ background: 'none', border: 'none', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
          <MessageCircle size={28} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{reel.comments_count || 0}</span>
        </button>
        <button type="button" onClick={() => onShare(reel)} style={{ background: 'none', border: 'none', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
          <Forward size={28} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>Share</span>
        </button>
        <button type="button" onClick={onToggleMute} style={{ background: 'none', border: 'none', color: '#FFFFFF', padding: '2px', cursor: 'pointer' }}>
          {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
        <button type="button" onClick={() => onOpenMenu(reel)} style={{ background: 'none', border: 'none', color: '#FFFFFF', padding: '2px', cursor: 'pointer' }}>
          <MoreHorizontal size={24} />
        </button>
      </div>

      <div onClick={handleSeek} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '10px', display: 'flex', alignItems: 'flex-end', cursor: 'pointer', zIndex: 25 }}>
        <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.28)' }}>
          <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#FFFFFF' }} />
        </div>
      </div>
    </div>
  );
}
export default function Reels({ userProfile, onOpenUserProfile }) {
  const [reels, setReels] = useState([]);
  const [muted, setMuted] = useState(false);
  const [likedIds, setLikedIds] = useState({});
  const [followedIds, setFollowedIds] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [reelAudioFile, setReelAudioFile] = useState(null);
  const [reelAudioPreview, setReelAudioPreview] = useState("");
  const [reelAudioName, setReelAudioName] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    loadReels();
    const openH = () => setCreateOpen(true);
    window.addEventListener('zuka:open-reel', openH);
    return () => window.removeEventListener('zuka:open-reel', openH);
  }, []);

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
          return { ...r, author_name: owner?.full_name || owner?.username || r.author_name || 'ZUKA Creator', avatar_url: owner?.avatar_url || r.avatar_url || '', is_verified: Boolean(owner?.is_verified || r.is_verified) };
        }));
      }
    } catch (_) {}
  }

  function handleSelectVideo(e) {
    const file = (e.target.files && e.target.files) || null;
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

  function handleAddComment(e) {
    e.preventDefault();
    const txt = commentInput.trim();
    if (!txt || !commentReelId) return;
    const author = userProfile?.full_name || userProfile?.username || 'You';
    setReelComments((prev) => ({ ...prev, [commentReelId]: [...(prev[commentReelId] || []), { id: `rc-${Date.now()}`, author, is_verified: Boolean(userProfile?.is_verified), content: txt }] }));
    setReels((prev) => prev.map((r) => (r.id === commentReelId ? { ...r, comments_count: Number(r.comments_count || 0) + 1 } : r)));
    setCommentInput(''); if (userProfile?.id && commentReelId) { supabase.from('comments').insert({ post_id: commentReelId, user_id: userProfile.id, content: text }).then(() => {}); }
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

  const shownReels = reels.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (r.caption || '').toLowerCase().includes(q) || (r.author_name || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 46px)', backgroundColor: '#000000', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
      {sharedToast && <div style={{ position: 'fixed', top: '110px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, backgroundColor: '#1877F2', color: '#FFFFFF', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>Link copied to share!</div>}

      <div style={{ position: 'fixed', top: '54px', left: 0, right: 0, zIndex: 25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px', maxWidth: '680px', margin: '0 auto', pointerEvents: 'none' }}>
        <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '22px', textShadow: '0 1px 4px rgba(0,0,0,0.65)' }}>Reels</span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', pointerEvents: 'auto' }}>
          <button type="button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search reels" style={{ background: 'none', border: 'none', color: '#FFFFFF', padding: '2px', cursor: 'pointer', display: 'flex' }}><Search size={24} /></button>
          <button type="button" onClick={() => setCreateOpen(true)} aria-label="Create reel" style={{ background: 'none', border: 'none', color: '#FFFFFF', padding: '2px', cursor: 'pointer', display: 'flex' }}><Camera size={24} /></button>
          <button type="button" onClick={() => userProfile && onOpenUserProfile && onOpenUserProfile(userProfile)} aria-label="Your profile" style={{ background: 'none', border: 'none', color: '#FFFFFF', padding: '2px', cursor: 'pointer', display: 'flex' }}><UserCircle size={25} /></button>
        </div>
      </div>

      {searchOpen && (
        <div style={{ position: 'fixed', top: '96px', left: '14px', right: '14px', zIndex: 35, maxWidth: '652px', margin: '0 auto' }}>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Reels..." style={{ width: '100%', padding: '9px 14px', borderRadius: '20px', border: 'none', backgroundColor: 'rgba(255,255,255,0.92)', color: '#050505', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      )}
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
            <textarea rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#F0F2F5', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1877F2', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                <span>🎵 {reelAudioName ? reelAudioName.slice(0, 22) : 'Add Music (Audio)'}</span>
                <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => {
                  const af = (e.target.files && e.target.files) || null;
                  if (!af) return;
                  setReelAudioFile(af);
                  setReelAudioName(af.name || 'Original Audio');
                  setReelAudioPreview(URL.createObjectURL(af));
                }} />
              </label>
              {reelAudioPreview && <audio src={reelAudioPreview} controls style={{ height: '28px', maxWidth: '150px' }} />}
            </div>
            <input type="hidden" placeholder="Write a caption for your Reel..." style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px', color: '#050505' }} />
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
              {(reelComments[commentReelId] || []).length === 0 ? <div style={{ textAlign: 'center', color: '#65676B', fontSize: '13px', padding: '20px 0' }}>No comments yet. Be the first!</div> : (reelComments[commentReelId] || []).map((c) => <div key={c.id} style={{ backgroundColor: '#F0F2F5', padding: '8px 12px', borderRadius: '12px', fontSize: '13px', color: '#050505' }}><strong style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', verticalAlign: 'middle' }}><span>{c.author}</span>{c.is_verified && <ZukaBadge size={12} />}<span>: </span></strong>{c.content}</div>)}
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

      {shownReels.length === 0 ? (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>No Reels found.</p>
          <button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Upload Reel</button>
        </div>
      ) : (
        shownReels.map((reel) => <ReelCard key={reel.id} reel={reel} muted={muted} onToggleMute={() => setMuted(!muted)} isLiked={!!likedIds[reel.id]} isFollowed={!!followedIds[reel.id]} currentUserId={userProfile?.id} onToggleLike={toggleLike} onToggleFollow={(id) => setFollowedIds((prev) => ({ ...prev, [id]: !prev[id] }))} onOpenComments={(id) => setCommentReelId(id)} onShare={handleShare} onOpenMenu={(r) => setMenuReelId(r)} onOpenUserProfile={onOpenUserProfile} />)
      )}
    </div>
  );
}
