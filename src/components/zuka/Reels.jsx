import React, { useState, useEffect, useRef } from 'react';
import {
  ThumbsUp, MessageCircle, Share2, Volume2, VolumeX, MoreHorizontal,
  Plus, Search, X, Send, Bookmark, Music, Check, Play, Trash2, EyeOff, FastForward
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

function formatCount(n) {
  const num = Number(n || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

async function uploadFast(bucket, path, file, ms = 35000) {
  const up = (async () => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'video/mp4',
      upsert: true
    });
    if (error) return '';
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || '';
  })();
  return Promise.race([up, new Promise((r) => setTimeout(() => r(''), ms))]);
}

export default function Reels({ userProfile, onOpenProfile, onCreatePost }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [clearMode, setClearMode] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);

  const [followingIds, setFollowingIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [expandedCaptions, setExpandedCaptions] = useState({});
  const [heartPopId, setHeartPopId] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [commentReelId, setCommentReelId] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [menuReelId, setMenuReelId] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [draftVideo, setDraftVideo] = useState(null);
  const [draftCaption, setDraftCaption] = useState('');
  const [draftMusic, setDraftMusic] = useState('');
  const [uploading, setUploading] = useState(false);

  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const fileInputRef = useRef(null);
  const lastTapRef = useRef(0);

  const myName = userProfile?.full_name || 'Zuka User';
  const myAvatar = userProfile?.avatar_url || `https://ui-avatars.com{encodeURIComponent(myName)}&background=1877F2&color=fff&bold=true`;

  useEffect(() => {
    const killAllVideos = () => {
      Object.values(videoRefs.current).forEach((v) => {
        if (v) { try { v.pause(); v.muted = true; } catch (_) {} }
      });
    };
    const onVis = () => { if (document.hidden) killAllVideos(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', killAllVideos);
    window.addEventListener('blur', killAllVideos);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', killAllVideos);
      window.removeEventListener('blur', killAllVideos);
      Object.values(videoRefs.current).forEach((v) => {
        if (v) { try { v.pause(); v.muted = true; v.removeAttribute('src'); v.load(); } catch (_) {} }
      });
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadReelsData() {
      setLoading(true);
      const profMap = {};
      try {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url, is_verified');
        if (Array.isArray(profs)) profs.forEach((p) => { profMap[String(p.id)] = p; });
      } catch (_) {}

      let allLikes = [];
      let allComments = [];
      try {
        const { data: lData } = await supabase.from('reel_likes').select('reel_id, user_id');
        if (Array.isArray(lData)) allLikes = lData;
      } catch (_) {}

      try {
        const { data: cData } = await supabase.from('reel_comments').select('id, reel_id, user_id, content, created_at').order('created_at', { ascending: true });
        if (Array.isArray(cData)) allComments = cData;
      } catch (_) {}

      if (userProfile?.id) {
        try {
          const { data: fData } = await supabase.from('follows').select('following_id').eq('follower_id', userProfile.id);
          if (alive && Array.isArray(fData)) setFollowingIds(fData.map((f) => String(f.following_id)));
        } catch (_) {}
      }

      try {
        const { data: rData } = await supabase.from('reels').select('*').order('created_at', { ascending: false }).limit(40);
        if (!alive) return;
        setReels((rData || []).map((r) => {
          const prof = profMap[String(r.user_id)] || {};
          const rawCap = String(r.caption || '');
          const mMatch = rawCap.match(/\[🎵\s*([^\]]+)\]/);
          const rLikes = allLikes.filter((l) => String(l.reel_id) === String(r.id));
          const rComms = allComments.filter((c) => String(c.reel_id) === String(r.id)).map((c) => {
            const cp = profMap[String(c.user_id)] || {};
            return {
              id: c.id,
              user_id: c.user_id,
              user: cp.full_name || 'Zuka User',
              avatar: cp.avatar_url || `https://ui-avatars.com{encodeURIComponent(cp.full_name || 'Z')}&background=1877F2&color=fff`,
              verified: Boolean(cp.is_verified),
              text: c.content || '',
              created_at: c.created_at
            };
          });
          return {
            id: r.id,
            user_id: r.user_id || null,
            author_name: prof.full_name || r.author_name || 'Zuka User',
            author_avatar: prof.avatar_url || `https://ui-avatars.com{encodeURIComponent(prof.full_name || r.author_name || 'Z')}&background=1877F2&color=fff`,
            verified: Boolean(prof.is_verified),
            video_url: r.video_url || '',
            caption: rawCap.replace(/\s*\[🎵\s*[^\]]+\]/g, '').trim(),
            music: (mMatch && mMatch) ? mMatch : 'Original audio',
            likes: Math.max(Number(r.likes_count || 0), rLikes.length),
            liked: Boolean(userProfile?.id && rLikes.some((l) => String(l.user_id) === String(userProfile.id))),
            commentsList: rComms,
            created_at: r.created_at
          };
        }));
      } catch (_) {}
      if (alive) setLoading(false);
    }
    loadReelsData();
    return () => { alive = false; };
  }, [userProfile?.id]);

  const visibleReels = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reels;
    return reels.filter((r) => r.caption.toLowerCase().includes(q) || r.author_name.toLowerCase().includes(q) || r.music.toLowerCase().includes(q));
  }, [reels, searchQuery]);

  useEffect(() => {
    visibleReels.forEach((r, idx) => {
      const vid = videoRefs.current[r.id];
      if (!vid) return;
      vid.muted = muted;
      vid.playbackRate = speed;
      if (idx === activeIdx && !paused && !createOpen) vid.play().catch(() => {});
      else vid.pause();
    });
  }, [activeIdx, muted, paused, speed, createOpen, visibleReels]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el || el.clientHeight === 0) return;
    const next = Math.round(el.scrollTop / el.clientHeight);
    if (next !== activeIdx && next >= 0 && next < visibleReels.length) {
      setActiveIdx(next);
      setPaused(false);
      setProgress(0);
    }
  }

  function handleVideoTap(reel) {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      setHeartPopId(reel.id);
      setTimeout(() => setHeartPopId(null), 750);
      if (!reel.liked) toggleLike(reel.id, true);
    } else setPaused((p) => !p);
    lastTapRef.current = now;
  }

  async function toggleLike(reelId, forceLike = false) {
    const target = reels.find((r) => String(r.id) === String(reelId));
    if (!target || (forceLike && target.liked)) return;
    const nextLiked = forceLike ? true : !target.liked;
    const nextLikes = Math.max(0, target.likes + (nextLiked ? 1 : -1));
    setReels((prev) => prev.map((r) => (String(r.id) === String(reelId) ? { ...r, liked: nextLiked, likes: nextLikes } : r)));
    try {
      await supabase.from('reels').update({ likes_count: nextLikes }).eq('id', reelId);
      if (userProfile?.id) {
        await supabase.from('reel_likes').delete().eq('reel_id', reelId).eq('user_id', userProfile.id);
        if (nextLiked) await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: userProfile.id });
      }
    } catch (_) {}
  }

  async function handleAddComment(e) {
    e.preventDefault();
    const text = commentInput.trim();
    if (!text || !commentReelId || sendingComment) return;
    setSendingComment(true);
    const optimistic = { id: `c-${Date.now()}`, user_id: userProfile?.id || null, user: myName, avatar: myAvatar, verified: Boolean(userProfile?.is_verified), text, created_at: new Date().toISOString() };
    const currentReel = reels.find((r) => String(r.id) === String(commentReelId));
    const nextCount = (currentReel?.commentsList?.length || 0) + 1;
    setReels((prev) => prev.map((r) => (String(r.id) === String(commentReelId) ? { ...r, commentsList: [...r.commentsList, optimistic] } : r)));
    setCommentInput('');
    try {
      if (userProfile?.id) await supabase.from('reel_comments').insert({ reel_id: commentReelId, user_id: userProfile.id, content: text });
      await supabase.from('reels').update({ comments_count: nextCount }).eq('id', commentReelId);
    } catch (_) {}
    setSendingComment(false);
  }

  async function toggleFollow(authorId) {
    if (!userProfile?.id || !authorId || String(authorId) === String(userProfile.id)) return;
    const idStr = String(authorId);
    const isFollowing = followingIds.includes(idStr);
    setFollowingIds((prev) => (isFollowing ? prev.filter((id) => id !== idStr) : [...prev, idStr]));
    try {
      if (isFollowing) await supabase.from('follows').delete().eq('follower_id', userProfile.id).eq('following_id', authorId);
      else await supabase.from('follows').insert({ follower_id: userProfile.id, following_id: authorId });
    } catch (_) {}
  }

  function handleShareReel(reel) {
    if (onCreatePost) onCreatePost({ content: reel.caption ? `${reel.caption} (via @${reel.author_name} Reels)` : `Check out this Reel by ${reel.author_name}`, media_url: reel.video_url, media_type: 'video' });
    else if (navigator.clipboard) { navigator.clipboard.writeText(window.location.href).catch(() => {}); alert('Reel link copied to clipboard.'); }
  }

  async function handleDeleteReel(reelId) {
    setReels((prev) => prev.filter((r) => String(r.id) !== String(reelId)));
    setMenuReelId(null);
    try { await supabase.from('reels').delete().eq('id', reelId); } catch (_) {}
  }

  function handlePickReelFile(e) {
    const f = (e.target.files && e.target.files.item(0)) || null;
    e.target.value = '';
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { alert('Video exceeds 4MB limit. Please select a video under 4MB.'); return; }
    setDraftVideo({ file: f, previewUrl: URL.createObjectURL(f) });
  }

  async function handlePublishReel() {
    if (!draftVideo?.file || uploading) return;
    setUploading(true);
    try {
      const ext = (draftVideo.file.name.split('.').pop() || 'mp4').toLowerCase();
      const path = `reels/reel_${userProfile?.id || 'guest'}_${Date.now()}.${ext}`;
      let videoUrl = '';
      for (const b of ['reels', 'post-media', 'avatars', 'stories']) {
        videoUrl = await uploadFast(b, path, draftVideo.file, 45000);
        if (videoUrl) break;
      }
      if (!videoUrl) { alert('Upload failed. Please check your connection and try again.'); setUploading(false); return; }
      const fullCap = draftMusic.trim() ? `${draftCaption.trim()} [🎵 ${draftMusic.trim()}]`.trim() : draftCaption.trim();
      const payload = { video_url: videoUrl, caption: fullCap, author_name: myName, likes_count: 0, comments_count: 0 };
      if (userProfile?.id) payload.user_id = userProfile.id;
      const { data: ins } = await supabase.from('reels').insert(payload).select('*').single();
      setReels((prev) => [{
        id: ins?.id || `r-${Date.now()}`, user_id: userProfile?.id || null, author_name: myName, author_avatar: myAvatar,
        verified: Boolean(userProfile?.is_verified), video_url: videoUrl, caption: draftCaption.trim(),
        music: draftMusic.trim() || 'Original audio', likes: 0, liked: false, commentsList: [], created_at: ins?.created_at || new Date().toISOString()
      }, ...prev]);
      if (draftVideo.previewUrl) URL.revokeObjectURL(draftVideo.previewUrl);
      setDraftVideo(null); setDraftCaption(''); setDraftMusic(''); setCreateOpen(false); setActiveIdx(0);
      if (containerRef.current) containerRef.current.scrollTo({ top: 0 });
    } catch (_) {}
    setUploading(false);
  }

  const activeCommentReel = reels.find((r) => String(r.id) === String(commentReelId)) || null;

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 54px)', backgroundColor: '#000', overflow: 'hidden' }}>
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handlePickReelFile} style={{ display: 'none' }} />

      {!clearMode && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }}>
          {searchOpen ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '20px', padding: '6px 12px' }}>
              <Search size={18} color="#FFF" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setActiveIdx(0); }} placeholder="Search Reels, creators, audio..." autoFocus style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: '14px' }} />
              <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}><X size={18} /></button>
            </div>
          ) : (
            <>
              <span style={{ color: '#FFF', fontSize: '21px', fontWeight: 800, letterSpacing: '-0.3px' }}>Reels</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="button" onClick={() => setSearchOpen(true)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Search size={19} /></button>
                <button type="button" onClick={() => setCreateOpen(true)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={21} /></button>
                <button type="button" onClick={() => onOpenProfile && userProfile?.id && onOpenProfile(userProfile.id)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #FFF', overflow: 'hidden', padding: 0, cursor: 'pointer' }}>
                  <img src={myAvatar} alt={myName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {clearMode && (
        <button type="button" onClick={() => setClearMode(false)} style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 40, padding: '6px 12px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
          Exit Clear Mode
        </button>
      )}

      <div ref={containerRef} onScroll={handleScroll} style={{ width: '100%', height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}>
        {loading ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '15px' }}>Loading Reels...</div>
        ) : visibleReels.length === 0 ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFF', gap: '12px', padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 700 }}>No Reels found</p>
            <button type="button" onClick={() => setCreateOpen(true)} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>Create First Reel</button>
          </div>
        ) : (
          visibleReels.map((reel, idx) => {
            const isFollowing = followingIds.includes(String(reel.user_id));
            const isSaved = savedIds.includes(String(reel.id));
            const isExpanded = Boolean(expandedCaptions[reel.id]);

            return (
              <div key={reel.id} style={{ position: 'relative', width: '100%', height: '100%', scrollSnapAlign: 'start', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  ref={(el) => { if (el) videoRefs.current[reel.id] = el; else delete videoRefs.current[reel.id]; }}
                  src={reel.video_url}
                  loop={!autoScroll}
                  playsInline
                  preload="metadata"
                  onClick={() => handleVideoTap(reel)}
                  onTimeUpdate={(e) => { if (idx === activeIdx && e.currentTarget.duration > 0) setProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100); }}
                  onEnded={() => { if (autoScroll && idx + 1 < visibleReels.length && containerRef.current) containerRef.current.scrollTo({ top: (idx + 1) * containerRef.current.clientHeight, behavior: 'smooth' }); }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
                />

                {paused && idx === activeIdx && (
                  <div onClick={() => setPaused(false)} style={{ position: 'absolute', zIndex: 20, width: '62px', height: '62px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', cursor: 'pointer' }}>
                    <Play size={30} fill="#FFF" />
                  </div>
                )}

                {heartPopId === reel.id && <div style={{ position: 'absolute', zIndex: 25, fontSize: '74px', pointerEvents: 'none' }}>❤️</div>}

                {!clearMode && (
                  <div style={{ position: 'absolute', right: '10px', bottom: '86px', zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <button type="button" onClick={() => toggleLike(reel.id)} style={{ background: 'none', border: 'none', color: reel.liked ? '#1877F2' : '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: reel.liked ? 'rgba(24,119,242,0.22)' : 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ThumbsUp size={24} fill={reel.liked ? '#1877F2' : 'none'} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFF' }}>{formatCount(reel.likes)}</span>
                    </button>

                    <button type="button" onClick={() => setCommentReelId(reel.id)} style={{ background: 'none', border: 'none', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={24} /></div>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{formatCount(reel.commentsList.length)}</span>
                    </button>

                    <button type="button" onClick={() => handleShareReel(reel)} style={{ background: 'none', border: 'none', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={23} /></div>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Share</span>
                    </button>

                    <button type="button" onClick={() => setSavedIds((p) => (isSaved ? p.filter((x) => x !== String(reel.id)) : [...p, String(reel.id)]))} style={{ background: 'none', border: 'none', color: isSaved ? '#F7B928' : '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bookmark size={22} fill={isSaved ? '#F7B928' : 'none'} /></div>
                    </button>

                    <button type="button" onClick={() => setMuted((m) => !m)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.45)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    <button type="button" onClick={() => setMenuReelId(reel.id)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.45)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <MoreHorizontal size={21} />
                    </button>
                  </div>
                )}

                {!clearMode && (
                  <div style={{ position: 'absolute', left: '12px', right: '72px', bottom: '18px', zIndex: 25, display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)', paddingTop: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={reel.author_avatar} alt={reel.author_name} onClick={() => onOpenProfile && reel.user_id && onOpenProfile(reel.user_id)} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FFF', cursor: 'pointer' }} />
                      <span onClick={() => onOpenProfile && reel.user_id && onOpenProfile(reel.user_id)} style={{ color: '#FFF', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {reel.author_name}
                        {reel.verified && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFF' }}><Check size={10} strokeWidth={3} /></span>}
                      </span>
                      {userProfile?.id && reel.user_id && String(reel.user_id) !== String(userProfile.id) && (
                        <button type="button" onClick={() => toggleFollow(reel.user_id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.75)', backgroundColor: isFollowing ? 'rgba(255,255,255,0.22)' : 'transparent', color: '#FFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>

                    {reel.caption && (
                      <div onClick={() => setExpandedCaptions((p) => ({ ...p, [reel.id]: !isExpanded }))} style={{ color: '#FFF', fontSize: '13.5px', lineHeight: 1.35, cursor: 'pointer' }}>
                        {isExpanded || reel.caption.length <= 75 ? reel.caption : `${reel.caption.slice(0, 75)}... more`}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E4E6EB', fontSize: '12px', fontWeight: 600 }}>
                      <Music size={13} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reel.music}</span>
                    </div>
                  </div>
                )}

                {idx === activeIdx && (
                  <div
                    onClick={(e) => {
                      const vid = videoRefs.current[reel.id];
                      if (!vid || !vid.duration) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      vid.currentTime = ratio * vid.duration;
                      setProgress(ratio * 100);
                    }}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'rgba(255,255,255,0.28)', zIndex: 30, cursor: 'pointer' }}
                  >
                    <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#FFF', transition: 'width 80ms linear' }} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {activeCommentReel && (
        <div onClick={() => setCommentReelId(null)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '65vh', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#050505' }}>Comments ({activeCommentReel.commentsList.length})</span>
              <button type="button" onClick={() => setCommentReelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#65676B' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeCommentReel.commentsList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#65676B', fontSize: '14px', marginTop: '32px' }}>No comments yet. Be the first to comment!</p>
              ) : (
                activeCommentReel.commentsList.map((c) => (
                  <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <img src={c.avatar} alt={c.user} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ backgroundColor: '#F0F2F5', borderRadius: '14px', padding: '8px 12px', maxWidth: '84%' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#050505', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {c.user}
                        {c.verified && <span style={{ width: '13px', height: '13px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Check size={9} strokeWidth={3} /></span>}
                      </div>
                      <div style={{ fontSize: '14px', color: '#050505', marginTop: '2px' }}>{c.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} style={{ padding: '10px 12px', borderTop: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFF' }}>
              <img src={myAvatar} alt={myName} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
              <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Add a comment..." style={{ flex: 1, padding: '9px 14px', borderRadius: '20px', border: 'none', backgroundColor: '#F0F2F5', fontSize: '14px', outline: 'none' }} />
              <button type="submit" disabled={!commentInput.trim() || sendingComment} style={{ background: 'none', border: 'none', color: commentInput.trim() ? '#1877F2' : '#BCC0C4', cursor: 'pointer', padding: '4px' }}><Send size={20} /></button>
            </form>
          </div>
        </div>
      )}

      {menuReelId && (
        <div onClick={() => setMenuReelId(null)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Reel Options</span>
              <button type="button" onClick={() => setMenuReelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><FastForward size={18} /> Playback Speed</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0.5, 1, 1.5, 2].map((sp) => (
                  <button key={sp} type="button" onClick={() => { setSpeed(sp); setMenuReelId(null); }} style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', backgroundColor: speed === sp ? '#1877F2' : '#F0F2F5', color: speed === sp ? '#FFF' : '#050505', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>{sp}x</button>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => { setClearMode(true); setMenuReelId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}><EyeOff size={18} /> Clear Mode (Hide UI overlays)</button>
            <button type="button" onClick={() => { setAutoScroll((a) => !a); setMenuReelId(null); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              <span>Auto-scroll to next Reel</span>
              <span style={{ color: autoScroll ? '#1877F2' : '#65676B', fontWeight: 700 }}>{autoScroll ? 'ON' : 'OFF'}</span>
            </button>
            {userProfile?.id && reels.some((r) => String(r.id) === String(menuReelId) && String(r.user_id) === String(userProfile.id)) && (
              <button type="button" onClick={() => handleDeleteReel(menuReelId)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', background: 'none', border: 'none', color: '#E41E3F', fontSize: '14px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}><Trash2 size={18} /> Delete Reel</button>
            )}
          </div>
        </div>
      )}

      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => { if (!uploading) { if (draftVideo?.previewUrl) URL.revokeObjectURL(draftVideo.previewUrl); setDraftVideo(null); setCreateOpen(false); } }} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
            <span style={{ color: '#FFF', fontWeight: 700, fontSize: '16px' }}>New Reel</span>
            <div style={{ width: '36px' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '12px 0' }}>
            {draftVideo?.previewUrl ? (
              <video src={draftVideo.previewUrl} autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '16px 24px', borderRadius: '14px', border: '1.5px dashed rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>+ Select Video (Max 4MB)</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '12px' }}>
            <input type="text" value={draftCaption} onChange={(e) => setDraftCaption(e.target.value)} placeholder="Describe your Reel..." style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', fontSize: '14px', outline: 'none' }} />
            <input type="text" value={draftMusic} onChange={(e) => setDraftMusic(e.target.value)} placeholder="Audio / Song name (optional)..." style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', fontSize: '14px', outline: 'none' }} />
            <button type="button" onClick={handlePublishReel} disabled={!draftVideo || uploading} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700, fontSize: '15px', cursor: uploading ? 'wait' : 'pointer', opacity: !draftVideo || uploading ? 0.6 : 1 }}>
              {uploading ? 'Sharing Reel...' : 'Share Reel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
