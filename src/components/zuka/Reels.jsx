import ZukaBadge from './ZukaBadge';
import React, { useState, useEffect, useRef } from 'react';
import {
  ThumbsUp, MessageCircle, Forward, Volume2, VolumeX, MoreHorizontal,
  Video, Search, X, Send, Bookmark, Music, Check, Play, Trash2, EyeOff,
  FastForward, Link2, Share, Sparkles, Users, Eye
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

export default function Reels({ userProfile, onOpenUserProfile, initialReel, onBackToFeed }) {
  const [reels, setReels] = useState(() => { const init = initialReel || window.__ZUKA_OPEN_REEL__; return init ? [init] : []; });
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
  const [toastMsg, setToastMsg] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [commentReelId, setCommentReelId] = useState(null);
  const [likesReelId, setLikesReelId] = useState(null);
  const [viewersReel, setViewersReel] = useState(null);
  const [reelViewersList, setReelViewersList] = useState([]);
  const loggedReelViews = useRef({});
  const [shareReel, setShareReel] = useState(null);
  const [menuReelId, setMenuReelId] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [commentInput, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [likedCommentIds, setLikedCommentIds] = useState({});
  const [sendingComment, setSendingComment] = useState(false);

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

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  }

  // Android / Browser Back Button Support for all Reels overlays
  const anyModalOpen = Boolean(commentReelId || likesReelId || shareReel || menuReelId || viewingProfile || createOpen || searchOpen);
  useEffect(() => {
    if (!anyModalOpen) return;
    window.history.pushState({ zukaReelModal: true }, '');
    const onPop = () => {
      setCommentReelId(null);
      setLikesReelId(null);
      setShareReel(null);
      setMenuReelId(null);
      setViewingProfile(null);
      setSearchOpen(false);
      setCreateOpen((prev) => {
        if (prev && draftVideo?.previewUrl) {
          try { URL.revokeObjectURL(draftVideo.previewUrl); } catch (_) {}
          setDraftVideo(null);
        }
        return false;
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [anyModalOpen]);

  // Stop all video audio immediately when leaving Reels or hiding browser
  useEffect(() => {
    const killAll = () => {
      Object.values(videoRefs.current).forEach((v) => {
        if (v) { try { v.pause(); v.muted = true; } catch (_) {} }
      });
    };
    const onVis = () => { if (document.hidden) killAll(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', killAll);
    window.addEventListener('blur', killAll);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', killAll);
      window.removeEventListener('blur', killAll);
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
        const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url, cover_url, bio, is_verified');
        if (Array.isArray(profs)) profs.forEach((p) => { profMap[String(p.id)] = p; });
      } catch (_) {}

      let allLikes = [];
      let allComments = [];
      try {
        const { data: lData } = await supabase.from('reel_likes').select('reel_id, user_id, created_at');
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
        const mapped = (rData || []).map((r) => {
          const prof = profMap[String(r.user_id)] || {};
          const rawCap = String(r.caption || '');
          const mMatch = rawCap.match(/\[🎵\s*([^\]]+)\]/);
          const rLikes = allLikes.filter((l) => String(l.reel_id) === String(r.id)).map((l) => {
            const lp = profMap[String(l.user_id)] || {};
            return {
              user_id: l.user_id,
              name: lp.full_name || 'Zuka User',
              avatar: lp.avatar_url || `https://ui-avatars.com{encodeURIComponent(lp.full_name || 'Z')}&background=1877F2&color=fff`,
              verified: Boolean(lp.is_verified)
            };
          });
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
            music: (mMatch && mMatch[1]) ? mMatch[1] : 'Original audio',
            likes: Math.max(Number(r.likes_count || 0), rLikes.length),
            liked: Boolean(userProfile?.id && rLikes.some((l) => String(l.user_id) === String(userProfile.id))),
            likesList: rLikes,
            commentsList: rComms,
            created_at: r.created_at
          };
      });
      const activeInit = initialReel || window.__ZUKA_OPEN_REEL__; if (activeInit && activeInit.video_url) { const rawPid = String(activeInit.post_id || activeInit.id || '').replace(/^post-/, ''); let syncedInit = { ...activeInit, _postId: rawPid }; try { if (rawPid) { const [{ data: pLikes }, { data: pComms }] = await Promise.all([supabase.from('post_likes').select('user_id').eq('post_id', rawPid), supabase.from('comments').select('id, user_id, content, created_at').eq('post_id', rawPid).order('created_at', { ascending: true })]); if (Array.isArray(pLikes)) { const mLikes = pLikes.map((l) => { const lp = profMap[String(l.user_id)] || {}; return { user_id: l.user_id, name: lp.full_name || 'Zuka User', avatar: lp.avatar_url || '', verified: Boolean(lp.is_verified) }; }); syncedInit.likes = Math.max(Number(activeInit.likes || 0), mLikes.length); syncedInit.liked = Boolean(userProfile?.id && mLikes.some((l) => String(l.user_id) === String(userProfile.id))); syncedInit.likesList = mLikes; } if (Array.isArray(pComms)) { syncedInit.commentsList = pComms.map((c) => { const cp = profMap[String(c.user_id)] || {}; return { id: c.id, user_id: c.user_id, user: cp.full_name || 'Zuka User', avatar: cp.avatar_url || '', verified: Boolean(cp.is_verified), text: c.content || c.text || '', time: 'Just now' }; }); } } } catch (_) {} const rest = mapped.filter((x) => String(x.video_url) !== String(syncedInit.video_url)); setReels([syncedInit, ...rest]); setActiveIdx(0); setMuted(false); } else { setReels(mapped); }
    } catch (_) { const fbInit = initialReel || window.__ZUKA_OPEN_REEL__; if (fbInit) { setReels([fbInit]); setActiveIdx(0); setMuted(false); } }
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
      if (idx === activeIdx && !paused && !createOpen && !viewingProfile) vid.play().catch(() => {});
      else vid.pause();
    });
  }, [activeIdx, muted, paused, speed, createOpen, viewingProfile, visibleReels]);

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

  async function openReelViewers(reel) { setViewersReel(reel); const isPost = String(reel.id).startsWith('post-'); const rawId = isPost ? String(reel.id).replace('post-', '') : String(reel.id); const { data: rows } = await supabase.from('video_views').select('viewer_id').eq('target_type', isPost ? 'post' : 'reel').eq('target_id', rawId).limit(60); const ids = [...new Set((rows || []).map((x) => x.viewer_id).filter(Boolean))]; if (!ids.length) { setReelViewersList([]); return; } const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified, verified').in('id', ids); setReelViewersList(profs || []); }
  async function toggleLike(reelId, forceLike = false) {
    const target = reels.find((r) => String(r.id) === String(reelId));
    if (!target || (forceLike && target.liked)) return;
    const nextLiked = forceLike ? true : !target.liked;
    const nextLikes = Math.max(0, target.likes + (nextLiked ? 1 : -1));
    const myLikeObj = { user_id: userProfile?.id || 'me', name: myName, avatar: myAvatar, verified: Boolean(userProfile?.is_verified) };

    setReels((prev) => prev.map((r) => {
      if (String(r.id) !== String(reelId)) return r;
      const filtered = (r.likesList || []).filter((l) => String(l.user_id) !== String(userProfile?.id));
      return { ...r, liked: nextLiked, likes: nextLikes, likesList: nextLiked ? [myLikeObj, ...filtered] : filtered };
    }));

    try {
      await supabase.from('reels').update({ likes_count: nextLikes }).eq('id', reelId);
      if (userProfile?.id) {
        await supabase.from('reel_likes').delete().eq('reel_id', reelId).eq('user_id', userProfile.id);
        if (nextLiked) await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: userProfile.id }); const pid = String(reelId).replace(/^post-/, ''); if (pid) { await supabase.from('post_likes').delete().eq('post_id', pid).eq('user_id', userProfile.id); if (nextLiked) await supabase.from('post_likes').insert({ post_id: pid, user_id: userProfile.id }); }
      }
    } catch (_) {}
  }

  const [likedComments, setLikedComments] = useState({});
  const [replyTarget, setReplyTarget] = useState(null);
  const toggleCommentLike = (cid) => setLikedComments((p) => ({ ...p, [cid]: !p[cid] }));
  async function handleAddComment(e) {
    e.preventDefault();
    const raw = commentInput.trim();
    const text = replyTarget && !raw.startsWith("@" + replyTarget.user) ? `@${replyTarget.user} ${raw}` : raw;
    if (!text || !commentReelId || sendingComment) return;
    setSendingComment(true);
    const optimistic = { id: `c-${Date.now()}`, user_id: userProfile?.id || null, user: myName, avatar: myAvatar, verified: Boolean(userProfile?.is_verified), text, created_at: new Date().toISOString() };
    const currentReel = reels.find((r) => String(r.id) === String(commentReelId));
    const nextCount = (currentReel?.commentsList?.length || 0) + 1;
    setReels((prev) => prev.map((r) => (String(r.id) === String(commentReelId) ? { ...r, commentsList: [...r.commentsList, optimistic] } : r)));
    setCommentInput('');
    setReplyTarget(null);
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

  async function openCreatorProfile(targetUserId, fallbackName = 'Zuka User', fallbackAvatar = '') {
    if (!targetUserId) return;
    setCommentReelId(null);
    setLikesReelId(null);
    setShareReel(null);
    setMenuReelId(null);
    setProfileLoading(true);
    setViewingProfile({
      id: targetUserId,
      full_name: fallbackName,
      avatar_url: fallbackAvatar || `https://ui-avatars.com{encodeURIComponent(fallbackName)}&background=1877F2&color=fff`,
      cover_url: '',
      bio: '',
      is_verified: false,
      followersCount: 0,
      userReels: reels.filter((r) => String(r.user_id) === String(targetUserId))
    });
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle();
      const { data: fRows } = await supabase.from('follows').select('follower_id').eq('following_id', targetUserId);
      setViewingProfile((prev) => prev ? ({
        ...prev,
        full_name: prof?.full_name || prev.full_name,
        avatar_url: prof?.avatar_url || prev.avatar_url,
        cover_url: prof?.cover_url || '',
        bio: prof?.bio || '',
        is_verified: Boolean(prof?.is_verified),
        followersCount: Array.isArray(fRows) ? fRows.length : 0
      }) : null);
    } catch (_) {}
    setProfileLoading(false);
  }

  async function handleShareToFeed(reel) {
    if (!reel) return;
    setShareReel(null);
    try {
      await supabase.from('posts').insert({
        user_id: userProfile?.id || null,
        author_name: myName,
        content: reel.caption ? `${reel.caption} (Shared Reel from ${reel.author_name})` : `Shared Reel from ${reel.author_name}`,
        media_url: reel.video_url,
        media_type: 'video',
        likes_count: 0,
        comments_count: 0
      });
      showToast('Shared to your Feed');
    } catch (_) {
      showToast('Could not share to Feed');
    }
  }

  async function handleShareToStory(reel) {
    if (!reel) return;
    setShareReel(null);
    try {
      await supabase.from('stories').insert({
        user_id: userProfile?.id || null,
        author_name: myName,
        media_url: reel.video_url,
        media_type: 'video',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      showToast('Shared to your Story (24h)');
    } catch (_) {
      showToast('Could not share to Story');
    }
  }

  async function handleDeleteReel(reelId) {
    setReels((prev) => prev.filter((r) => String(r.id) !== String(reelId)));
    setMenuReelId(null);
    try { await supabase.from('reels').delete().eq('id', reelId); } catch (_) {}
    showToast('Reel deleted');
  }

  function handlePickReelFile(e) {
    const f = (e.target.files && e.target.files.item(0)) || null;
    e.target.value = '';
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { showToast('Video exceeds 4MB limit'); return; }
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
      if (!videoUrl) { showToast('Upload failed. Try again.'); setUploading(false); return; }
      const fullCap = draftMusic.trim() ? `${draftCaption.trim()} [🎵 ${draftMusic.trim()}]`.trim() : draftCaption.trim();
      const payload = { video_url: videoUrl, caption: fullCap, author_name: myName, likes_count: 0, comments_count: 0 };
      if (userProfile?.id) payload.user_id = userProfile.id;
      const { data: ins } = await supabase.from('reels').insert(payload).select('*').single();
      setReels((prev) => [{
        id: ins?.id || `r-${Date.now()}`, user_id: userProfile?.id || null, author_name: myName, author_avatar: myAvatar,
        verified: Boolean(userProfile?.is_verified), video_url: videoUrl, caption: draftCaption.trim(),
        music: draftMusic.trim() || 'Original audio', likes: 0, liked: false, likesList: [], commentsList: [], created_at: ins?.created_at || new Date().toISOString()
      }, ...prev]);
      if (draftVideo.previewUrl) URL.revokeObjectURL(draftVideo.previewUrl);
      setDraftVideo(null); setDraftCaption(''); setDraftMusic(''); setCreateOpen(false); setActiveIdx(0);
      if (containerRef.current) containerRef.current.scrollTo({ top: 0 });
      showToast('Reel shared');
    } catch (_) {}
    setUploading(false);
  }

  const activeCommentReel = reels.find((r) => String(r.id) === String(commentReelId)) || null;
  const activeLikesReel = reels.find((r) => String(r.id) === String(likesReelId)) || null;

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100dvh - 54px)', backgroundColor: '#000', overflow: 'hidden' }}>
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handlePickReelFile} style={{ display: 'none' }} />

      {toastMsg && (
        <div style={{ position: 'fixed', top: '68px', left: '50%', transform: 'translateX(-50%)', zIndex: 12000, backgroundColor: 'rgba(24,25,26,0.92)', color: '#FFF', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}>
          {toastMsg}
        </div>
      )}

      {!clearMode && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
          {searchOpen ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '20px', padding: '6px 12px' }}>
              <Search size={18} color="#FFF" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setActiveIdx(0); }} placeholder="Search Reels, creators, audio..." autoFocus style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: '14px' }} />
              <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}><X size={18} /></button>
            </div>
          ) : (
            <>
              <span style={{ color: '#FFF', fontSize: '21px', fontWeight: 800, letterSpacing: '-0.3px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>Reels</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => setSearchOpen(true)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Search size={19} /></button>
                <button type="button" onClick={() => setCreateOpen(true)} style={{ padding: '0 12px', height: '36px', borderRadius: '18px', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFF', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  <Video size={18} /> Create
                </button>
                <button type="button" onClick={() => setMuted((m) => !m)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
                </button>
                <button type="button" onClick={() => userProfile?.id && openCreatorProfile(userProfile.id, myName, myAvatar)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #FFF', overflow: 'hidden', padding: 0, cursor: 'pointer' }}>
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
                  <div onClick={() => setPaused(false)} style={{ position: 'absolute', zIndex: 20, width: '62px', height: '62px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', cursor: 'pointer' }}>
                    <Play size={30} fill="#FFF" />
                  </div>
                )}

                {heartPopId === reel.id && <div style={{ position: 'absolute', zIndex: 25, fontSize: '74px', pointerEvents: 'none' }}>❤️</div>}

                {!clearMode && (
                  <div style={{ position: 'absolute', right: '12px', bottom: '62px', zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <button type="button" onClick={() => toggleLike(reel.id)} style={{ background: 'none', border: 'none', color: reel.liked ? '#1877F2' : '#FFF', padding: '4px', cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.75))' }}>
                        <ThumbsUp size={27} fill={reel.liked ? '#1877F2' : '#FFF'} color={reel.liked ? '#1877F2' : '#FFF'} />
                      </button>
                      <button type="button" onClick={() => setLikesReelId(reel.id)} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
                        {formatCount(reel.likes)}
                      </button>
                    </div>

                    <button type="button" onClick={() => setCommentReelId(reel.id)} style={{ background: 'none', border: 'none', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.75))' }}>
                      <MessageCircle size={27} fill="#FFF" color="#FFF" />
                      <span style={{ fontSize: '12.5px', fontWeight: 700 }}>{formatCount(reel.commentsList.length)}</span>
                    </button>

                    <button type="button" onClick={() => setShareReel(reel)} style={{ background: 'none', border: 'none', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.75))' }}>
                      <Forward size={28} fill="#FFF" color="#FFF" />
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Share</span>
                    </button>

                    <button type="button" onClick={() => openReelViewers(reel)} style={{ background: 'none', border: 'none', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: 0 }}><Eye size={25} color="#FFF" /><span style={{ fontSize: '12px', fontWeight: 700 }}>{formatCount(reel.views || 0)}</span></button>
                <button type="button" onClick={() => setMenuReelId(reel.id)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.75))' }}>
                      <MoreHorizontal size={25} />
                    </button>
                  </div>
                )}

                {!clearMode && (
                  <div style={{ position: 'absolute', left: '12px', right: '72px', bottom: '62px', zIndex: 25, display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)', paddingTop: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <img src={reel.author_avatar} alt={reel.author_name} onClick={() => reel.user_id && openCreatorProfile(reel.user_id, reel.author_name, reel.author_avatar)} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FFF', cursor: 'pointer' }} />
                      <span onClick={() => reel.user_id && openCreatorProfile(reel.user_id, reel.author_name, reel.author_avatar)} style={{ color: '#FFF', fontWeight: 700, fontSize: '14.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.75)' }}>
                        {reel.author_name}
                        <ZukaBadge userId={reel.user_id} size={15} />
                      </span>
                      {userProfile?.id && reel.user_id && String(reel.user_id) !== String(userProfile.id) && (
                        <button type="button" onClick={() => toggleFollow(reel.user_id)} style={{ background: 'none', border: 'none', color: isFollowing ? '#E4E6EB' : '#4599FF', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', textShadow: '0 1px 3px rgba(0,0,0,0.85)', padding: 0 }}>
                          · {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>

                    {reel.caption && (
                      <div onClick={() => setExpandedCaptions((p) => ({ ...p, [reel.id]: !isExpanded }))} style={{ color: '#FFF', fontSize: '13.5px', lineHeight: 1.35, cursor: 'pointer', textShadow: '0 1px 2px rgba(0,0,0,0.75)' }}>
                        {isExpanded || reel.caption.length <= 75 ? reel.caption : `${reel.caption.slice(0, 75)}... more`}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E4E6EB', fontSize: '12px', fontWeight: 600 }}>
                      <Music size={13} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reel.music}</span>
                    </div>
                  </div>
                )}

                {!clearMode && (<div onClick={() => setCommentReelId(reel.id)} style={{ position: 'absolute', left: '12px', right: '12px', bottom: '12px', zIndex: 26, height: '40px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', padding: '0 16px', color: 'rgba(255,255,255,0.92)', fontSize: '14px', cursor: 'pointer' }}>Add a comment...</div>)}
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

      {activeLikesReel && (
        <div onClick={() => setLikesReelId(null)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '65dvh', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ThumbsUp size={17} fill="#1877F2" color="#1877F2" /> Likes ({activeLikesReel.likes})
              </span>
              <button type="button" onClick={() => setLikesReelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#65676B' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(activeLikesReel.likesList || []).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#65676B', fontSize: '14px', padding: '24px 0' }}>No likes yet.</p>
              ) : (
                activeLikesReel.likesList.map((lk, i) => (
                  <div key={`${lk.user_id}-${i}`} onClick={() => lk.user_id && openCreatorProfile(lk.user_id, lk.name, lk.avatar)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <img src={lk.avatar} alt={lk.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#050505', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {lk.name}
                      <ZukaBadge userId={lk.user_id} size={14} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {viewersReel && (<div onClick={() => setViewersReel(null)} style={{ position: 'fixed', inset: 0, zIndex: 13600, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}><div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', maxHeight: '70vh', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '14px 16px', overflowY: 'auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 700 }}><span>Views ({formatCount(viewersReel.views || 0)})</span><button type="button" onClick={() => setViewersReel(null)} style={{ border: 'none', background: '#E4E6EB', borderRadius: '50%', width: '28px', height: '28px' }}>✕</button></div>{reelViewersList.length === 0 ? <p style={{ color: '#65676B', fontSize: '14px' }}>{formatCount(viewersReel.views || 0)} views</p> : reelViewersList.map((u) => (<div key={u.id} onClick={() => { setViewersReel(null); openCreatorProfile && openCreatorProfile(u.id); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }}><img src={u.avatar_url || 'https://ui-avatars.com' + encodeURIComponent(u.full_name || 'Member')} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} /><span style={{ fontWeight: 600 }}>{u.full_name || u.username || 'Member'}</span></div>))}</div></div>)}
      {activeCommentReel && (
        <div onClick={() => setCommentReelId(null)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '65dvh', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', flexDirection: 'column' }}>
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
                    <img src={c.avatar} alt={c.user} onClick={() => c.user_id && openCreatorProfile(c.user_id, c.user, c.avatar)} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                    <div style={{ backgroundColor: '#F0F2F5', borderRadius: '14px', padding: '8px 12px', maxWidth: '84%' }}>
                      <div onClick={() => c.user_id && openCreatorProfile(c.user_id, c.user, c.avatar)} style={{ fontWeight: 700, fontSize: '13px', color: '#050505', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
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
              <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Add a comment..." style={{ flex: 1, padding: '9px 14px', borderRadius: '20px', border: 'none', backgroundColor: '#F0F2F5', fontSize: '14px', outline: 'none', color: '#050505' }} />
              <button type="submit" disabled={!commentInput.trim() || sendingComment} style={{ background: 'none', border: 'none', color: commentInput.trim() ? '#1877F2' : '#BCC0C4', cursor: 'pointer', padding: '4px' }}><Send size={20} /></button>
            </form>
          </div>
        </div>
      )}

      {shareReel && (
        <div onClick={() => setShareReel(null)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#050505' }}>Share Reel</span>
              <button type="button" onClick={() => setShareReel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <button type="button" onClick={() => handleShareToFeed(shareReel)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 4px', background: 'none', border: 'none', fontSize: '15px', fontWeight: 600, color: '#050505', cursor: 'pointer', textAlign: 'left' }}>
              <Share size={20} color="#1877F2" /> Share Now to Public Feed
            </button>
            <button type="button" onClick={() => handleShareToStory(shareReel)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 4px', background: 'none', border: 'none', fontSize: '15px', fontWeight: 600, color: '#050505', cursor: 'pointer', textAlign: 'left' }}>
              <Sparkles size={20} color="#1877F2" /> Share to Your Story
            </button>
            <button type="button" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(shareReel.video_url || window.location.href).catch(() => {}); setShareReel(null); showToast('Link copied to clipboard'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 4px', background: 'none', border: 'none', fontSize: '15px', fontWeight: 600, color: '#050505', cursor: 'pointer', textAlign: 'left' }}>
              <Link2 size={20} color="#65676B" /> Copy Link
            </button>
          </div>
        </div>
      )}

      {menuReelId && (
        <div onClick={() => setMenuReelId(null)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#050505' }}>Reel Options</span>
              <button type="button" onClick={() => setMenuReelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#050505', display: 'flex', alignItems: 'center', gap: '8px' }}><FastForward size={18} /> Playback Speed</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0.5, 1, 1.5, 2].map((sp) => (
                  <button key={sp} type="button" onClick={() => { setSpeed(sp); setMenuReelId(null); }} style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', backgroundColor: speed === sp ? '#1877F2' : '#F0F2F5', color: speed === sp ? '#FFF' : '#050505', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>{sp}x</button>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => { setSavedIds((p) => (p.includes(menuReelId) ? p.filter((x) => x !== menuReelId) : [...p, menuReelId])); setMenuReelId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 4px', border: 'none', borderBottom: '1px solid #F0F2F5', background: 'none', fontSize: '14px', fontWeight: 600, color: '#050505', cursor: 'pointer' }}><Bookmark size={18} /> {savedIds.includes(menuReelId) ? 'Saved Reel' : 'Save Reel'}</button><button type="button" onClick={() => { setClearMode(true); setMenuReelId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, color: '#050505', cursor: 'pointer', textAlign: 'left' }}><EyeOff size={18} /> Clear Mode (Hide UI overlays)</button>
            <button type="button" onClick={() => { setAutoScroll((a) => !a); setMenuReelId(null); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, color: '#050505', cursor: 'pointer' }}>
              <span>Auto-scroll to next Reel</span>
              <span style={{ color: autoScroll ? '#1877F2' : '#65676B', fontWeight: 700 }}>{autoScroll ? 'ON' : 'OFF'}</span>
            </button>
            {userProfile?.id && reels.some((r) => String(r.id) === String(menuReelId) && String(r.user_id) === String(userProfile.id)) && (
              <button type="button" onClick={() => handleDeleteReel(menuReelId)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', background: 'none', border: 'none', color: '#E41E3F', fontSize: '14px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}><Trash2 size={18} /> Delete Reel</button>
            )}
          </div>
        </div>
      )}

      {viewingProfile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000, backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FFF', padding: '10px 14px', borderBottom: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" onClick={() => setViewingProfile(null)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
            <span style={{ fontWeight: 700, fontSize: '16px', color: '#050505' }}>{viewingProfile.full_name}</span>
          </div>
          <div style={{ height: '140px', backgroundColor: '#D8DADF', backgroundImage: viewingProfile.cover_url ? `url(${viewingProfile.cover_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ padding: '0 16px 16px', marginTop: '-44px' }}>
            <img src={viewingProfile.avatar_url} alt={viewingProfile.full_name} style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #FFF', backgroundColor: '#FFF' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#050505', margin: 0 }}>{viewingProfile.full_name}</h2>
              <ZukaBadge userId={viewingProfile.id} size={18} />
            </div>
            <div style={{ fontSize: '13.5px', color: '#65676B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} /> {profileLoading ? 'Loading...' : `${viewingProfile.followersCount} Followers · ${(viewingProfile.userReels || []).length} Reels`}
            </div>
            {viewingProfile.bio && <p style={{ fontSize: '14px', color: '#050505', marginTop: '8px' }}>{viewingProfile.bio}</p>}
            {userProfile?.id && String(viewingProfile.id) !== String(userProfile.id) && (
              <button type="button" onClick={() => toggleFollow(viewingProfile.id)} style={{ marginTop: '12px', width: '100%', padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: followingIds.includes(String(viewingProfile.id)) ? '#E4E6EB' : '#1877F2', color: followingIds.includes(String(viewingProfile.id)) ? '#050505' : '#FFF', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                {followingIds.includes(String(viewingProfile.id)) ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E4E6EB' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#050505', marginBottom: '10px' }}>Reels</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {(viewingProfile.userReels || []).map((ur) => (
                <div key={ur.id} onClick={() => { const foundIdx = visibleReels.findIndex((x) => String(x.id) === String(ur.id)); setViewingProfile(null); if (foundIdx >= 0 && containerRef.current) { setActiveIdx(foundIdx); containerRef.current.scrollTo({ top: foundIdx * containerRef.current.clientHeight }); } }} style={{ aspectRatio: '9/16', backgroundColor: '#000', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                  <video src={ur.video_url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: '6px', left: '6px', color: '#FFF', fontSize: '11px', fontWeight: 700, textShadow: '0 1px 2px #000' }}>▶ {formatCount(ur.likes)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: '#000', display: 'flex', flexDirection: 'column', height: '100dvh', overflowY: 'auto' }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
            <button type="button" onClick={() => { if (!uploading) { if (draftVideo?.previewUrl) URL.revokeObjectURL(draftVideo.previewUrl); setDraftVideo(null); setCreateOpen(false); } }} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
            <span style={{ color: '#FFF', fontWeight: 700, fontSize: '16px' }}>New Reel</span>
            <button type="button" onClick={handlePublishReel} disabled={!draftVideo || uploading} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700, fontSize: '14px', cursor: uploading ? 'wait' : 'pointer', opacity: !draftVideo || uploading ? 0.5 : 1 }}>
              {uploading ? 'Sharing...' : 'Share'}
            </button>
          </div>
          <div style={{ flex: 1, minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '12px' }}>
            {draftVideo?.previewUrl ? (
              <video src={draftVideo.previewUrl} autoPlay loop playsInline style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '10px' }} />
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '18px 26px', borderRadius: '14px', border: '1.5px dashed rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>+ Select Video (Max 4MB)</button>
            )}
          </div>
          <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, backgroundColor: '#111' }}>
            <input type="text" value={draftCaption} onChange={(e) => setDraftCaption(e.target.value)} placeholder="Describe your Reel..." style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', fontSize: '14px', outline: 'none' }} />
            <input type="text" value={draftMusic} onChange={(e) => setDraftMusic(e.target.value)} placeholder="Audio / Song name (optional)..." style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', fontSize: '14px', outline: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}
