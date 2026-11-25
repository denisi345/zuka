import PostAudioSheet from "./PostAudioSheet";
import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, Share2, Trash2, Send, MoreHorizontal, X, Bookmark, Link2, Edit3, Pin, EyeOff, AlertCircle, UserMinus, Volume2, VolumeX } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';
import PhotoViewer from './PhotoViewer';
import { sendZukaNotification } from './notifyHelper';
import { formatTimeAgo } from './timeAgo';
import { toggleSavePost } from './savedHelper';

const VerifiedBadge = ({ size = 14 }) => (<svg width={size + 2} height={size + 2} viewBox="0 0 24 24" fill="#1877F2" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}><path d="M12 2L14.8 4.2L18.4 3.8L19.6 7.2L22.6 9.2L21.8 12.7L23.2 16L20.4 18.3L19.8 21.8L16.2 21.8L13.7 24L12 22.8L10.3 24L7.8 21.8L4.2 21.8L3.6 18.3L0.8 16L2.2 12.7L1.4 9.2L4.4 7.2L5.6 3.8L9.2 4.2L12 2Z"/><path d="M9.5 12.3L11.2 14L15 10.2" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>);

function Post({ post, currentUserId, onOpenUserProfile, onDeletePost, userProfile }) {
  const [isFeatured, setIsFeatured] = useState(Boolean(post.is_pinned));
  const isCeoViewer = Boolean(userProfile?.is_admin || String(userProfile?.username || '').toLowerCase().startsWith('ceo'));
  const storageKey = `zuka_liked_${post.id}`;
  const [liked, setLiked] = useState(() => localStorage.getItem(storageKey) === '1');
  const [likesCount, setLikesCount] = useState(Number(post.likes_count || 0)); const [commentsCount, setCommentsCount] = useState(Number(post.comments_count || 0)); const [sharesCount, setSharesCount] = useState(Number(post.shares_count || 0)); const [commentLikes, setCommentLikes] = useState({}); const [replyTarget, setReplyTarget] = useState(null); const [commentReplies, setCommentReplies] = useState({}); React.useEffect(() => { if (!post?.id || String(post.id).startsWith('live-') || String(post.id).startsWith('demo-')) return; Promise.all([supabase.from('post_likes').select('user_id').eq('post_id', post.id), supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id)]).then(([lk, cm]) => { if (Array.isArray(lk.data)) { setLikesCount((v) => Math.max(v, lk.data.length)); if (currentUserId && lk.data.some((x) => String(x.user_id) === String(currentUserId))) setLiked(true); } if (typeof cm.count === 'number') setCommentsCount((v) => Math.max(v, cm.count)); }).catch(() => {}); }, [post?.id, currentUserId]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [contentText, setContentText] = useState(post.content || '');
  const [pinned, setPinned] = useState(false);
  const [audioSheetOpen, setAudioSheetOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [likersList, setLikersList] = useState([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
      const [authorOnline, setAuthorOnline] = useState(false);
  React.useEffect(() => { if (!post?.user_id) return; if (currentUserId && String(post.user_id) === String(currentUserId)) { setAuthorOnline(true); return; } let live = true; supabase.from("profiles").select("last_seen,show_active_status").eq("id", post.user_id).maybeSingle().then(({ data }) => { if (!live || !data) return; const diff = data.last_seen ? (Date.now() - new Date(data.last_seen).getTime()) : 999999; setAuthorOnline(data.show_active_status !== false && diff < 120000); }).catch(() => {}); return () => { live = false; }; }, [post?.user_id, currentUserId]);
  const isVideo = post.media_type === 'video' || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(post.image_url || '');
  const [videoFullOpen, setVideoFullOpen] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPortrait, setVideoPortrait] = useState(true);
  const [videoTimeStr, setVideoTimeStr] = useState("");
  const [videoProg, setVideoProg] = useState(0);
  const [viewsCount, setViewsCount] = useState(() => Number(post.views_count || 0));
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const viewLoggedRef = React.useRef(false);
  const [fullPaused, setFullPaused] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [likedCommentIds, setLikedCommentIds] = useState({});
  const commentInputRef = React.useRef(null);
  const feedVidRef = React.useRef(null);
  const fullVidRef = React.useRef(null);
  React.useEffect(() => { const el = feedVidRef.current; if (!el || !isVideo) return; const obs = new IntersectionObserver(([ent]) => { if (ent.isIntersecting && !videoFullOpen) { el.play().catch(() => {}); } else { el.pause(); } }, { threshold: 0.55 }); obs.observe(el); return () => obs.disconnect(); }, [isVideo, videoFullOpen]);
    function fmtVidSec(sec) { const m = Math.floor((sec || 0) / 60); const r = Math.floor((sec || 0) % 60); return m + ":" + (r < 10 ? "0" : "") + r; }
  const audioRef = React.useRef(null);
  const audioMatch = String(contentText || "").match(/\[zuka_audio:([^|\]]+)\|([^\]]+)\]/);
  const parsedAudio = audioMatch ? { title: audioMatch.at(1), url: audioMatch.at(2) } : null;
  const cleanText = String(contentText || "").replace(/\n?\[zuka_audio:[^\]]+\]/g, "").trim();

  const isLiveOrDemo = String(post.id).startsWith('live-') || String(post.id).startsWith('funny-') || String(post.id).startsWith('temp-');
  const authorName = post.author_name || 'ZUKA Member';
  const isOwner = currentUserId && String(post.user_id) === String(currentUserId);

  async function handleOpenViewers() { setViewersOpen(true); const { data: rows } = await supabase.from('video_views').select('viewer_id').eq('target_type', 'post').eq('target_id', String(post.id)).limit(60); const ids = [...new Set((rows || []).map((r) => r.viewer_id).filter(Boolean))]; if (!ids.length) { setViewersList([]); return; } const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified, verified').in('id', ids); setViewersList(profs || []); }
  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  }

  async function handleOpenLikers() {
    setLikesOpen(true);
    setLoadingLikers(true);
    try {
      const [{ data: lk }, { data: profs }] = await Promise.all([
        supabase.from('post_likes').select('user_id').eq('post_id', post.id),
        supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified')
      ]);
      const pMap = {}; if (Array.isArray(profs)) profs.forEach((p) => { pMap[String(p.id)] = p; });
      const ids = new Set(Array.isArray(lk) ? lk.map((r) => String(r.user_id)) : []);
      if (liked && currentUserId) ids.add(String(currentUserId));
      const rows = Array.from(ids).map((uid) => pMap[uid] || { id: uid, full_name: 'ZUKA Member', is_verified: false });
      setLikersList(rows);
    } catch (_) { setLikersList([]); }
    setLoadingLikers(false);
  }
  async function handleLike() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    if (nextLiked) localStorage.setItem(storageKey, '1');
    else localStorage.removeItem(storageKey);
    const nextCount = Math.max(0, likesCount + (nextLiked ? 1 : -1));
    setLikesCount(nextCount);
    if (!isLiveOrDemo) {
      try { supabase.from('posts').update({ likes_count: nextCount }).eq('id', post.id); } catch (_) {}
      if (currentUserId) {
        try {
          if (nextLiked) { await supabase.from('post_likes').upsert({ post_id: post.id, user_id: currentUserId }, { onConflict: 'post_id,user_id' }); }
          else { await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId); }
        } catch (_) {}
      }
      if (nextLiked) sendZukaNotification({ receiverId: post.user_id, senderId: currentUserId, type: 'like', message: 'Someone liked your post on ZUKA.' });
    }
  }
  async function handleToggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && !isLiveOrDemo) {
      try {
        const [{ data }, { data: profs }] = await Promise.all([supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true }), supabase.from('profiles').select('id, full_name, username, is_verified')]);
        const pMap = {}; if (Array.isArray(profs)) profs.forEach((p) => { pMap[String(p.id)] = p; });
        if (Array.isArray(data)) setComments(data.map((cm) => { const ow = cm.user_id ? pMap[String(cm.user_id)] : null; return { ...cm, author_name: ow?.full_name || ow?.username || cm.author_name || 'Member', is_verified: Boolean(ow?.is_verified || cm.is_verified) }; }));
      } catch (_) {}
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    const txt = commentText.trim();
    if (!txt) return;
    setCommentText('');
    setCommentsCount((c) => c + 1); setComments((prev) => [...prev, { id: `c-${Date.now()}`, author_name: 'You', content: txt }]);
    if (!isLiveOrDemo) {
      try {
        await supabase.from('comments').insert({ post_id: post.id, user_id: currentUserId, content: txt });
        sendZukaNotification({ receiverId: post.user_id, senderId: currentUserId, type: 'comment', message: `New comment on your post: "${txt.slice(0, 60)}"` });
      } catch (_) {}
    }
  }

  async function handleShare() {
    const shareText = `${authorName}: ${cleanText}`.slice(0, 200);
    if (navigator.share) {
      try { await navigator.share({ title: 'ZUKA', text: shareText, url: window.location.href }); return; } catch (_) {}
    }
    try { await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`); } catch (_) {}
    showToast('Link copied');
  }

  async function handleSaveEditedPost(e) {
    e.preventDefault();
    setEditingPost(false);
    showToast('Post updated');
    if (!isLiveOrDemo) {
      try { await supabase.from('posts').update({ content: contentText }).eq('id', post.id); } catch (_) {}
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!isLiveOrDemo) {
      try { await supabase.from('posts').delete().eq('id', post.id); } catch (_) {}
    }
    if (onDeletePost) onDeletePost(post.id);
  }

  return (
    <article style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB', marginTop: '8px', position: 'relative' }}>
      {toastMsg && (
        <div style={{ position: 'fixed', top: '112px', left: '50%', transform: 'translateX(-50%)', zIndex: 90, backgroundColor: '#1877F2', color: '#FFFFFF', padding: '9px 18px', borderRadius: '22px', fontSize: '13px', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>
          {toastMsg}
        </div>
      )}

      {pinned && (
        <div style={{ padding: '6px 12px 0', fontSize: '12px', fontWeight: 700, color: '#65676B', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Pin size={13} color="#1877F2" /> Pinned post
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 12px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div
            onClick={() => post.user_id && onOpenUserProfile && onOpenUserProfile({ id: post.user_id, full_name: authorName, avatar_url: post.avatar_url, is_verified: post.is_verified })}
            style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0, cursor: post.user_id ? 'pointer' : 'default' }}
          >
            {authorOnline && <span style={{ position: "absolute", right: "-1px", bottom: "-1px", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#31A24C", border: "2px solid #FFFFFF", zIndex: 2 }} />}{post.avatar_url ? <img src={post.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : authorName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
              <span onClick={() => post.user_id && onOpenUserProfile && onOpenUserProfile({ id: post.user_id, full_name: authorName, avatar_url: post.avatar_url, is_verified: post.is_verified })} style={{ cursor: post.user_id ? 'pointer' : 'default' }}>
                {authorName}
              </span>
              {post.is_verified && <ZukaBadge size={16} />}
              {!isOwner && (
                <button type="button" onClick={() => setFollowed(!followed)} style={{ background: 'none', border: 'none', color: followed ? '#65676B' : '#1877F2', fontWeight: 700, fontSize: '14px', padding: '0 2px', cursor: 'pointer' }}>
                  · {followed ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#65676B', marginTop: '1px' }}>{formatTimeAgo(post.created_at, post.time_label)} · {parsedAudio ? <span onClick={() => setAudioSheetOpen(true)} style={{ color: "#050505", fontWeight: 600, cursor: "pointer" }}>🎵 {parsedAudio.title} · </span> : null}🌐</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="More options" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'none', border: 'none', color: '#65676B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <MoreHorizontal size={20} />
          </button>
          <button type="button" onClick={() => onDeletePost && onDeletePost(post.id)} aria-label="Hide post" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'none', border: 'none', color: '#65676B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
      </div>
      {editingPost ? (
        <form onSubmit={handleSaveEditedPost} style={{ padding: '6px 12px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea rows={3} value={cleanText} onChange={(e) => setContentText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '15px', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={() => setEditingPost(false)} style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#E4E6EB', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#1877F2', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Save</button>
          </div>
        </form>
      ) : (
        cleanText && <div style={{ padding: '4px 12px 10px', fontSize: '15px', color: '#050505', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{cleanText}</div>
      )}

      {post.image_url && (
        isVideo
          ? <div onClick={() => { if (feedVidRef.current) feedVidRef.current.pause(); const reelPayload = { id: "post-" + post.id, post_id: post.id, user_id: post.user_id, author_name: authorName, author_avatar: authorAvatar, verified: Boolean(post.verified || post.is_verified), video_url: post.image_url, caption: post.content || "", music: "Original audio", likes: likesCount, liked: liked, likesList: [], commentsList: comments, created_at: post.created_at }; window.__ZUKA_OPEN_REEL__ = reelPayload; window.dispatchEvent(new CustomEvent("zuka:open-reel", { detail: reelPayload })); }} style={{ position: "relative", width: "100%", aspectRatio: videoPortrait ? "9 / 14" : "16 / 9", maxHeight: "76vh", backgroundColor: "#000", overflow: "hidden", cursor: "pointer" }}><video ref={feedVidRef} src={post.image_url} autoPlay loop muted={videoMuted} playsInline preload="metadata" onLoadedMetadata={(e) => { const v = e.currentTarget; if (v.videoWidth && v.videoHeight) setVideoPortrait(v.videoHeight >= v.videoWidth); setVideoTimeStr(fmtVidSec(v.duration)); e.currentTarget.play().catch(() => {}); }} onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) { setVideoProg((v.currentTime / v.duration) * 100); setVideoTimeStr(fmtVidSec(Math.max(0, v.duration - v.currentTime))); } }} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }} />{parsedAudio && (<button type="button" onClick={(e) => { e.stopPropagation(); if (typeof handleToggleAudio === "function") handleToggleAudio(); else if (typeof toggleAudio === "function") toggleAudio(); else if (typeof setAudioPlaying === "function") setAudioPlaying(p => !p); }} aria-label="Post audio speaker" style={{ position: "absolute", right: "12px", bottom: "12px", width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.68)", border: "none", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 20 }}>{(typeof audioPlaying !== "undefined" && audioPlaying) ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>)}<div onClick={(e) => { e.stopPropagation(); if (feedVidRef.current) feedVidRef.current.pause(); const rp = { id: 'post-' + post.id, post_id: post.id, user_id: post.user_id, author_name: authorName, author_avatar: post.author_avatar || '', verified: Boolean(post.verified || post.is_verified), video_url: post.image_url, caption: post.content || '', music: 'Original audio', likes: 0, liked: false, likesList: [], commentsList: [], created_at: post.created_at }; window.__ZUKA_OPEN_REEL__ = rp; window.dispatchEvent(new CustomEvent('zuka:open-reel', { detail: rp })); }} style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'pointer' }} />{videoTimeStr && <span style={{ position: "absolute", top: "10px", right: "10px", backgroundColor: "rgba(0,0,0,0.62)", color: "#FFF", fontSize: "11.5px", fontWeight: 700, padding: "2px 7px", borderRadius: "6px" }}>{videoTimeStr}</span>}<button type="button" onClick={(e) => { e.stopPropagation(); setVideoMuted((m) => !m); }} style={{ position: "absolute", bottom: "12px", right: "12px", width: "32px", height: "32px", borderRadius: "50%", border: "none", backgroundColor: "rgba(0,0,0,0.62)", zIndex: 10, color: "#FFF", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{videoMuted ? "🔇" : "🔊"}</button><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "2.5px", backgroundColor: "rgba(255,255,255,0.25)" }}><div style={{ width: videoProg + "%", height: "100%", backgroundColor: "#1877F2" }} /></div></div>
          : <div style={{ position: "relative", width: "100%", display: "block" }}><img loading="lazy" decoding="async" src={post.image_url} alt="" onClick={() => setPhotoOpen(true)} style={{ width: "100%", maxHeight: "460px", objectFit: "cover", display: "block", cursor: "pointer" }} />{parsedAudio && (<button type="button" onClick={(e) => { e.stopPropagation(); if (!audioRef.current) return; if (audioPlaying) { audioRef.current.pause(); setAudioPlaying(false); } else { audioRef.current.play().catch(() => {}); setAudioPlaying(true); } }} style={{ position: "absolute", bottom: "12px", right: "12px", width: "32px", height: "32px", borderRadius: "50%", border: "none", backgroundColor: "rgba(0,0,0,0.62)", zIndex: 10, color: "#FFF", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{audioPlaying ? "🔊" : "🔇"}</button>)}</div>
      )}

      {(likesCount > 0 || commentsCount > 0 || sharesCount > 0 || (isVideo && viewsCount > 0)) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', fontSize: '13px', color: '#65676B' }}>
          <span onClick={likesCount > 0 ? handleOpenLikers : undefined} style={{ cursor: likesCount > 0 ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {likesCount > 0 && (<><span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#1877F2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><ThumbsUp size={11} fill="#FFFFFF" color="#FFFFFF" /></span><span>{likesCount}</span></>)}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {commentsCount > 0 && <span onClick={handleToggleComments} style={{ cursor: 'pointer' }}>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>}
            {sharesCount > 0 && <span>{sharesCount} {sharesCount === 1 ? 'share' : 'shares'}</span>}
            {isVideo && viewsCount > 0 && <span>{viewsCount} views</span>}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', padding: '4px 12px 10px' }}>
        <button type="button" onClick={handleLike} style={{ flex: 1, height: '36px', borderRadius: '20px', border: 'none', backgroundColor: '#F0F2F5', color: liked ? '#1877F2' : '#65676B', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><ThumbsUp size={18} fill={liked ? '#1877F2' : 'none'} color={liked ? '#1877F2' : '#65676B'} /> {likesCount > 0 ? likesCount : 'Like'}</button>
        <button type="button" onClick={handleToggleComments} style={{ flex: 1, height: '36px', borderRadius: '20px', border: 'none', backgroundColor: '#F0F2F5', color: '#65676B', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><MessageCircle size={18} /> {commentsCount > 0 ? commentsCount : 'Comment'}</button>
        <button type="button" onClick={handleShare} style={{ flex: 1, height: '36px', borderRadius: '20px', border: 'none', backgroundColor: '#F0F2F5', color: '#65676B', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Share2 size={18} /> {sharesCount > 0 ? sharesCount : 'Share'}</button>
      </div>

      {commentsOpen && (
        <div style={{ padding: '10px 12px 12px', borderTop: '1px solid #E4E6EB' }}>
          {comments.map((c) => {
            const cLiked = Boolean(commentLikes[c.id]);
            const reps = commentReplies[c.id] || [];
            return (
              <div key={c.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <div onClick={() => c.user_id && onOpenUserProfile && onOpenUserProfile(c.user_id, c.author_name, c.avatar_url)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
                  {c.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.author_name || 'Z').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'inline-block', maxWidth: '100%', backgroundColor: '#F0F2F5', borderRadius: '18px', padding: '8px 12px' }}>
                    <strong onClick={() => c.user_id && onOpenUserProfile && onOpenUserProfile(c.user_id, c.author_name, c.avatar_url)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '13px', color: '#050505' }}>{c.author_name}{c.is_verified && <VerifiedBadge size={13} />}</strong>
                    <div style={{ fontSize: '14px', color: '#050505', lineHeight: 1.35, wordBreak: 'break-word' }}>{c.content}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '3px 8px 0', fontSize: '12px', fontWeight: 600 }}>
                    <span onClick={() => setCommentLikes((prev) => ({ ...prev, [c.id]: !prev[c.id] }))} style={{ cursor: 'pointer', color: cLiked ? '#1877F2' : '#65676B' }}>Like</span>
                    <span onClick={() => { setReplyTarget({ id: c.id, name: c.author_name }); setCommentText(`@${c.author_name} `); commentInputRef.current?.focus(); }} style={{ cursor: 'pointer', color: '#65676B' }}>Reply</span>
                    {cLiked && (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#65676B' }}>1 <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#1877F2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><ThumbsUp size={9} fill="#FFFFFF" color="#FFFFFF" /></span></span>)}
                  </div>
                  {reps.map((r) => (<div key={r.id} style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'flex-start' }}><div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', fontWeight: 700, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>{r.avatar_url ? <img src={r.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (r.author_name || 'Z').charAt(0).toUpperCase()}</div><div style={{ backgroundColor: '#F0F2F5', borderRadius: '16px', padding: '6px 10px', fontSize: '13px' }}><strong style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px' }}>{r.author_name}{r.is_verified && <VerifiedBadge size={12} />}</strong><div style={{ color: '#050505' }}>{r.content}</div></div></div>))}
                </div>
              </div>
            );
          })}
          {replyTarget && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#65676B', padding: '4px 8px', backgroundColor: '#F0F2F5', borderRadius: '10px', marginBottom: '6px' }}><span>Replying to <b>{replyTarget.name}</b></span><span onClick={() => { setReplyTarget(null); setCommentText(''); }} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span></div>)}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <input ref={commentInputRef} type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={replyTarget ? `Reply to ${replyTarget.name}...` : 'Write a comment...'} style={{ flex: 1, height: '36px', borderRadius: '18px', border: 'none', backgroundColor: '#F0F2F5', padding: '0 14px', fontSize: '14px', outline: 'none' }} />
            <button type="submit" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: '#1877F2', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={15} /></button>
          </form>
        </div>
      )}

      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 65, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', width: '100%', maxWidth: '680px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '10px 14px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#CED0D4', borderRadius: '2px', margin: '0 auto 6px' }} />
            <button type="button" onClick={() => { setMenuOpen(false); toggleSavePost({ ...post, content: contentText }); showToast('Saved successfully'); }} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#F0F2F5', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#050505', textAlign: 'left' }}>
              <Bookmark size={20} /> Save post
            </button>
            {isOwner && (
              <>
                <button type="button" onClick={() => { setMenuOpen(false); setPinned(!pinned); showToast(!pinned ? 'Pinned to profile' : 'Unpinned'); }} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#F0F2F5', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#050505', textAlign: 'left' }}>
                  <Pin size={20} /> {pinned ? 'Unpin post' : 'Pin post'}
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); setEditingPost(true); }} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#F0F2F5', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#050505', textAlign: 'left' }}>
                  <Edit3 size={20} /> Edit post
                </button>
              </>
            )}
            {!isOwner && (
              <>
                <button type="button" onClick={() => { setMenuOpen(false); if (onDeletePost) onDeletePost(post.id); showToast('Post hidden'); }} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#F0F2F5', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#050505', textAlign: 'left' }}>
                  <EyeOff size={20} /> Hide post
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); setFollowed(false); showToast(`Unfollowed ${authorName}`); }} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#F0F2F5', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#050505', textAlign: 'left' }}>
                  <UserMinus size={20} /> Unfollow {authorName}
                </button>
              </>
            )}
            {isCeoViewer && !isLiveOrDemo && (<button type="button" onClick={async () => { const next = !isFeatured; setMenuOpen(false); const { error } = await supabase.rpc('ceo_toggle_pin_post', { p_post_id: String(post.id), p_pin: next }); if (error) { showToast(error.message); return; } setIsFeatured(next); showToast(next ? 'Marked as Suggested for you' : 'Removed from Suggested'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: 'none', background: 'none', fontSize: '15px', fontWeight: 600, color: '#050505', cursor: 'pointer', textAlign: 'left' }}><span>✦</span> {isFeatured ? 'Remove from Suggested' : 'Feature Post (Suggested for you)'}</button>)}
            <button type="button" onClick={() => { setMenuOpen(false); handleShare(); }} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#F0F2F5', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#050505', textAlign: 'left' }}>
              <Link2 size={20} /> Copy link
            </button>
            {isOwner ? (
              <button type="button" onClick={handleDelete} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#FFEBEE', color: '#D32F2F', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left' }}>
                <Trash2 size={20} /> Move to trash
              </button>
            ) : (
              <button type="button" onClick={() => { setMenuOpen(false); showToast('Post reported'); }} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#FFEBEE', color: '#D32F2F', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left' }}>
                <AlertCircle size={20} /> Report post
              </button>
            )}
          </div>
        </div>
      )}

      {likesOpen && (
        <div onClick={() => setLikesOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '380px', maxHeight: '70vh', overflowY: 'auto', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '10px', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>👍 People who reacted ({likesCount})</span>
              <button type="button" onClick={() => setLikesOpen(false)} style={{ border: 'none', backgroundColor: '#E4E6EB', borderRadius: '50%', width: '28px', height: '28px', fontWeight: 700, cursor: 'pointer' }}>✕</button>
            </div>
            {loadingLikers ? <div style={{ padding: '16px', textAlign: 'center', color: '#65676B', fontSize: '13px' }}>Loading...</div> : likersList.length === 0 ? <div style={{ padding: '16px', textAlign: 'center', color: '#65676B', fontSize: '13px' }}>👍 {likesCount} likes</div> : likersList.map((u) => (
              <div key={u.id} onClick={() => { setLikesOpen(false); if (onOpenUserProfile) onOpenUserProfile(u.id); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', cursor: 'pointer', borderBottom: '1px solid #F0F2F5' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>{u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.full_name || u.username || 'Z')[0].toUpperCase()}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '14px' }}><span>{u.full_name || u.username || 'ZUKA Member'}</span><ZukaBadge userId={u.id} size={14} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {photoOpen && (
        <PhotoViewer
          post={{ ...post, content: contentText }}
          liked={liked}
          likesCount={likesCount}
          commentsCount={comments.length}
          onClose={() => setPhotoOpen(false)}
          onLike={handleLike}
          onComment={() => setCommentsOpen(true)}
          onShare={handleShare}
          onHidePost={() => onDeletePost && onDeletePost(post.id)}
        />
      )}
      {parsedAudio && (

          <audio ref={audioRef} src={parsedAudio.url} onEnded={() => setAudioPlaying(false)} style={{ display: "none" }} />







      )}
      
    {viewersOpen && (<div onClick={() => setViewersOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 13600, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}><div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', maxHeight: '70vh', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '14px 16px', overflowY: 'auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 700 }}><span>Video Views ({viewsCount})</span><button type="button" onClick={() => setViewersOpen(false)} style={{ border: 'none', background: '#E4E6EB', borderRadius: '50%', width: '28px', height: '28px' }}>✕</button></div>{viewersList.length === 0 ? <p style={{ color: '#65676B', fontSize: '14px' }}>{viewsCount} views</p> : viewersList.map((u) => (<div key={u.id} onClick={() => { setViewersOpen(false); onOpenProfile && onOpenProfile(u.id); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }}><img src={u.avatar_url || 'https://ui-avatars.com' + encodeURIComponent(u.full_name || 'Member')} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} /><span style={{ fontWeight: 600 }}>{u.full_name || u.username || 'Member'}</span></div>))}</div></div>)}
      {videoFullOpen && (<div style={{ position: "fixed", inset: 0, zIndex: 13500, backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}><video ref={fullVidRef} src={post.image_url} autoPlay loop muted={videoMuted} playsInline onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) setVideoProg((v.currentTime / v.duration) * 100); if (!viewLoggedRef.current && v.currentTime >= 1.5 && post?.id) { viewLoggedRef.current = true; setViewsCount((c) => c + 1); supabase.rpc('record_video_view', { p_type: 'post', p_id: String(post.id), p_viewer: currentUserId || null }).then(() => {}).catch(() => {}); } }} onClick={(e) => { const v = e.currentTarget; if (v.paused) { v.play().catch(() => {}); setFullPaused(false); } else { v.pause(); setFullPaused(true); } }} style={{ width: "100%", height: "100%", objectFit: videoPortrait ? "cover" : "contain" }} />{fullPaused && <div style={{ position: "absolute", width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.55)", color: "#FFF", fontSize: "26px", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>▶</div>}<div style={{ position: "absolute", top: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}><button type="button" onClick={() => { setVideoFullOpen(false); setVideoMuted(true); }} style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none", backgroundColor: "rgba(0,0,0,0.5)", color: "#FFF", fontSize: "20px", fontWeight: 700, cursor: "pointer" }}>&lt;</button><span style={{ color: "#FFF", fontWeight: 700, fontSize: "16px", textShadow: "0 1px 4px rgba(0,0,0,0.75)" }}>Reels</span><button type="button" onClick={() => setVideoMuted((m) => !m)} style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none", backgroundColor: "rgba(0,0,0,0.5)", color: "#FFF", fontSize: "16px", cursor: "pointer" }}>{videoMuted ? "🔇" : "🔊"}</button></div><div style={{ position: "absolute", right: "12px", bottom: "94px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", zIndex: 10 }}><button type="button" onClick={handleLike} style={{ background: "none", border: "none", color: "#FFF", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}><span style={{ fontSize: "26px" }}>{liked ? "❤️" : "👍"}</span><span style={{ fontSize: "12px", fontWeight: 700 }}>{likesCount}</span></button><button type="button" onClick={() => setCommentsOpen((c) => !c)} style={{ background: "none", border: "none", color: "#FFF", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}><span style={{ fontSize: "25px" }}>💬</span><span style={{ fontSize: "12px", fontWeight: 700 }}>{comments.length}</span></button><button type="button" onClick={() => { if (navigator.share) { navigator.share({ title: post.author_name, url: post.image_url }).catch(() => {}); } else if (navigator.clipboard) { navigator.clipboard.writeText(post.image_url); } }} style={{ background: "none", border: "none", color: "#FFF", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}><span style={{ fontSize: "25px" }}>↗</span><span style={{ fontSize: "12px", fontWeight: 700 }}>Share</span></button></div><div style={{ position: "absolute", left: "14px", right: "76px", bottom: "26px", zIndex: 10, color: "#FFF", textShadow: "0 1px 4px rgba(0,0,0,0.85)" }}><div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}><img src={post.author_avatar || ""} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #FFF" }} /><span style={{ fontWeight: 700, fontSize: "14.5px" }}>{post.author_name}</span><ZukaBadge userId={post.user_id} size={15} /></div>{cleanText && <div style={{ fontSize: "13.5px", marginBottom: "4px" }}>{cleanText}</div>}<div style={{ fontSize: "12px", opacity: 0.9 }}>🎵 Original audio</div></div><input type="range" min="0" max="100" value={videoProg} onChange={(e) => { const v = fullVidRef.current; if (v && v.duration) v.currentTime = (Number(e.target.value) / 100) * v.duration; }} style={{ position: "absolute", left: "12px", right: "12px", bottom: "8px", zIndex: 10, accentColor: "#FFF" }} />{commentsOpen && (<div onClick={() => setCommentsOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 20, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxHeight: "65dvh", backgroundColor: "#FFF", borderRadius: "16px 16px 0 0", padding: "14px", display: "flex", flexDirection: "column" }}><div style={{ fontWeight: 700, fontSize: "15px", textAlign: "center", paddingBottom: "10px", borderBottom: "1px solid #E4E6EB" }}>Comments ({comments.length})</div><div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>{comments.map((c) => (<div key={c.id} style={{ marginBottom: "8px", backgroundColor: "#F0F2F5", padding: "8px 12px", borderRadius: "12px" }}><div style={{ fontWeight: 700, fontSize: "12.5px" }}>{c.author_name || "User"}<ZukaBadge userId={c.user_id} size={13} /></div><div style={{ fontSize: "13.5px" }}>{c.content}</div></div>))}</div><form onSubmit={handleAddComment} style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #E4E6EB" }}><input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, padding: "9px 12px", borderRadius: "20px", border: "1px solid #CCD0D5", fontSize: "13.5px" }} /><button type="submit" style={{ padding: "8px 14px", borderRadius: "20px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700 }}>Send</button></form></div></div>)}</div>)}
</article>
  );
}

export default React.memo(Post);
