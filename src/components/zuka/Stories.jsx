import ZukaBadge from './ZukaBadge';
import React, { useEffect, useState, useRef } from 'react';
import { Plus, X, Trash2, MoreVertical, ChevronLeft, ChevronRight, Volume2, VolumeX, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

function formatStoryTime(ts) {
  if (!ts) return 'Just now';
  const diff = Math.max(1, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return '1d';
}

export default function Stories({ userProfile }) {
  const [stories, setStories] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draftStory, setDraftStory] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [draftAudio, setDraftAudio] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    let profMap = {};
    try {
      const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified');
      if (Array.isArray(profs)) profs.forEach((p) => { profMap[String(p.id)] = p; });
    } catch (_) {}

    try {
      const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(30);
      if (Array.isArray(data)) {
        const mapped = data.filter((s) => !s.created_at || Date.now() - new Date(s.created_at).getTime() < 86400000).map((s) => {
          const owner = s.user_id ? profMap[String(s.user_id)] : null;
          return {
            ...s,
            author_name: owner?.full_name || owner?.username || s.author_name || 'ZUKA Member',
            avatar_url: owner?.avatar_url || s.avatar_url || '',
          is_verified: Boolean(owner?.is_verified || s.is_verified)
          };
        });
        setStories(mapped);
      }
    } catch (_) {}
  }

  useEffect(() => {
    if (activeIndex === null || isPaused) return;
    const current = stories[activeIndex];
    if (!current) return;
    const isVideo = /\.(mp4|webm|mov|m4v|3gp)(\?|$)/i.test(current.media_url || "") || String(current.media_url || "").includes("video");
    if (isVideo) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeIndex + 1 < stories.length) {
            setActiveIndex(activeIndex + 1);
            return 0;
          }
          setActiveIndex(null);
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeIndex, isPaused, stories]);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const previewUrl = URL.createObjectURL(file);
    setDraftText('');
    setDraftAudio(null);
    setDraftStory({ file, previewUrl, isVideo });
    e.target.value = '';
  }

  async function publishDraftStory() {
    if (!draftStory?.file || uploading) return;
    const { file, isVideo } = draftStory;
    setUploading(true);
    try {
      let mediaUrl = '';
      const ext = (file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')).toLowerCase();
      const path = `stories/${userProfile?.id || 'guest'}_${Date.now()}.${ext}`;
      for (const bucket of ['post-media', 'avatars', 'stories']) {
        const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: true });
        if (!error) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          if (pub?.publicUrl) { mediaUrl = pub.publicUrl; break; }
        }
      }
      if (!mediaUrl && !isVideo) {
        mediaUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result || '')); r.onerror = () => res(''); r.readAsDataURL(file); });
      }
      let audioUrl = '';
      if (draftAudio?.file) {
        const aExt = (draftAudio.file.name.split('.').pop() || 'mp3').toLowerCase();
        const aPath = `stories/audio_${userProfile?.id || 'guest'}_${Date.now()}.${aExt}`;
        for (const bucket of ['post-media', 'avatars', 'stories']) {
          const { error: ae } = await supabase.storage.from(bucket).upload(aPath, draftAudio.file, { contentType: draftAudio.file.type, upsert: true });
          if (!ae) { const { data: ap } = supabase.storage.from(bucket).getPublicUrl(aPath); if (ap?.publicUrl) { audioUrl = ap.publicUrl; break; } }
        }
      }
      if (mediaUrl) {
        const capWithMusic = draftAudio?.name ? `${draftText.trim() ? draftText.trim() + ' ' : ''}[🎵 ${draftAudio.name}]` : draftText.trim();
        const payload = { media_url: mediaUrl, media_type: isVideo ? 'video' : 'image', author_name: userProfile?.full_name || 'Zuka User', author_avatar: userProfile?.avatar_url || '', caption: capWithMusic, audio_url: audioUrl, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
        if (userProfile?.id) payload.user_id = userProfile.id;
        const { data: inserted } = await supabase.from('stories').insert(payload).select().single();
        const newSt = { id: inserted?.id || Date.now(), user_id: userProfile?.id || '', author_name: payload.author_name, author_avatar: payload.author_avatar, media_url: mediaUrl, media_type: payload.media_type, caption: payload.caption, audio_url: audioUrl, created_at: new Date().toISOString() };
        setStories((prev) => [newSt, ...prev]);
      }
      setDraftStory(null);
      setDraftText('');
      setDraftAudio(null);
    } catch (_) {}
    setUploading(false);
  }

  async function _unusedOldHandleFileSelect(e) {
    const file = e.target.files?.at(0) || null;
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    let mediaUrl = URL.createObjectURL(file);
    try {
      const clean = (file.name || 'story').replace(/[^a-zA-Z0-9._-]/g, '');
      const path = `stories/${Date.now()}_${clean}`;
      for (const bucket of ['media', 'stories', 'posts', 'public']) {
        const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: true });
        if (!error) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          if (pub?.publicUrl) {
            mediaUrl = pub.publicUrl;
            break;
          }
        }
      }
      const authorName = userProfile?.full_name || userProfile?.username || 'ZUKA Member';
      const payload = { media_url: mediaUrl, author_name: authorName };
      if (userProfile?.id) payload.user_id = userProfile.id;
      const { data: inserted } = await supabase.from('stories').insert(payload).select().single();
      const created = inserted
        ? { ...inserted, author_name: authorName, avatar_url: userProfile?.avatar_url || '' }
        : { id: `st-${Date.now()}`, user_id: userProfile?.id, author_name: authorName, avatar_url: userProfile?.avatar_url || '', media_url: mediaUrl, created_at: new Date().toISOString() };
      setStories((prev) => [created, ...prev]);
    } catch (_) {}
    setUploading(false);
  }

  async function handleDeleteStory(storyId) {
    setActiveIndex(null);
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    if (storyId && !String(storyId).startsWith('st-')) {
      try { await supabase.from('stories').delete().eq('id', storyId); } catch (_) {}
    }
  }
  const groupedCount = {};
  stories.forEach((s) => {
    const k = String(s.user_id || s.author_name || s.id);
    groupedCount[k] = (groupedCount[k] || 0) + 1;
  });

  const activeStory = activeIndex !== null ? stories[activeIndex] : null;

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E6EB', padding: '10px 0 10px 10px' }}>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
      {draftStory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', zIndex: 2, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
            <button onClick={() => { if (!uploading) setDraftStory(null); }} style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            <span style={{ color: '#FFF', fontWeight: 700, fontSize: '16px' }}>Create story</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              <span>🎵 {draftAudio ? draftAudio.name.slice(0, 14) : 'Music'}</span>
              <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => {
                const af = (e.target.files && e.target.files.item(0)) || null;
                if (!af) return;
                setDraftAudio({ file: af, url: URL.createObjectURL(af), name: af.name || 'Music' });
              }} />
            </label>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            {draftAudio?.url && (
              <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 4, display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(0,0,0,0.72)', border: '1px solid rgba(255,255,255,0.25)', color: '#FFF', fontSize: '13px', fontWeight: 700 }}>
                <span>🎵 {draftAudio.name.slice(0, 24)}</span>
                <audio src={draftAudio.url} autoPlay loop style={{ display: 'none' }} />
              </div>
            )}
            {draftStory.isVideo ? (
              <video src={draftStory.previewUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <img src={draftStory.previewUrl} alt="Story Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>
          <div style={{ padding: '12px 16px 24px', zIndex: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="Add a caption to your story..." style={{ width: '100%', padding: '10px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.35)', backgroundColor: 'rgba(0,0,0,0.55)', color: '#FFF', fontSize: '14px', outline: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => { if (!uploading) setDraftStory(null); }} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>Discard</button>
              <button onClick={publishDraftStory} disabled={uploading} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700, fontSize: '14px', cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}>{uploading ? 'Sharing...' : 'Share to Story'}</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingRight: '10px' }}>
        <div onClick={() => fileInputRef.current?.click()} style={{ width: '104px', height: '176px', borderRadius: '12px', border: '1px solid #CED0D4', backgroundColor: '#F0F2F5', flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}>
          <div style={{ height: '116px', backgroundColor: '#E4E6EB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#1877F2' }}>{(userProfile?.full_name || 'M').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div style={{ position: 'absolute', top: '98px', left: '50%', transform: 'translateX(-50%)', width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#1877F2', border: '3px solid #FFFFFF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} strokeWidth={3} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#050505', backgroundColor: '#FFFFFF' }}>
            {uploading ? 'Uploading...' : 'Create story'}
          </div>
        </div>

        {stories.filter((st, i, arr) => arr.findIndex((x) => String(x.user_id || x.author_name || x.id) === String(st.user_id || st.author_name || st.id)) === i).map((st) => { const idx = stories.indexOf(st);
          const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(st.media_url || '');
          const name = st.author_name || 'ZUKA Member';
          const count = groupedCount[String(st.user_id || st.author_name || st.id)] || 1;
          return (
            <div key={st.id} onClick={() => { setProgress(0); setActiveIndex(idx); }} style={{ width: '104px', height: '176px', borderRadius: '12px', backgroundColor: '#18191A', flexShrink: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
              {isVideo ? (
                <video src={st.media_url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={st.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent 55%)' }} />
              <div style={{ position: 'absolute', top: '8px', left: '8px', width: '34px', height: '34px', borderRadius: '50%', border: '3px solid #1877F2', backgroundColor: '#1877F2', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                {st.avatar_url ? <img src={st.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0).toUpperCase()}
              </div>
              {count > 1 && (
                <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#1877F2', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>{count}</span>
              )}
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </div>
            </div>
          );
        })}
      </div>

      {activeStory && (
        <FacebookStoryViewer
          story={activeStory}
          stories={stories}
          activeIndex={activeIndex}
          progress={progress}
          currentUser={userProfile}
          onClose={() => { setIsPaused(false); setActiveIndex(null); }}
          onPrev={() => { setProgress(0); setActiveIndex((i) => Math.max(0, i - 1)); }}
          onNext={() => {
            setProgress(0);
            setActiveIndex((i) => (i + 1 < stories.length ? i + 1 : null));
          }}
          onDeleteStory={handleDeleteStory}
          onPauseChange={setIsPaused}
          onVideoProgress={setProgress}
        />
      )}
    </div>
  );
}
function FacebookStoryViewer({ story, stories, activeIndex, progress, currentUser, onClose, onPrev, onNext, onDeleteStory, onPauseChange, onVideoProgress }) {
  const [replyText, setReplyText] = useState("");
  const [vidProgress, setVidProgress] = useState(0);
  const isVid = /\.(mp4|webm|mov|m4v|3gp)(\?|$)/i.test(story.media_url || "") || String(story.media_url || "").includes("video");
  const [muted, setMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState('');
  const [sentNotice, setSentNotice] = useState('');
  const videoRef = useRef(null);
  const activeBarRef = useRef(null);
  useEffect(() => {
    if (!isVid) return;
    let rafId;
    const syncBar = () => {
      const v = videoRef.current;
      const bar = activeBarRef.current;
      if (v && bar && v.duration && Number.isFinite(v.duration)) {
        const ratio = Math.min(1, Math.max(0, v.currentTime / v.duration));
        bar.style.transform = `scaleX(${ratio})`;
      }
      rafId = requestAnimationFrame(syncBar);
    };
    rafId = requestAnimationFrame(syncBar);
    return () => cancelAnimationFrame(rafId);
  }, [story?.id, isVid]);
  const isOwner = currentUser?.id && String(story.user_id) === String(currentUser.id);
  const authorName = story.author_name || 'ZUKA Member';

  async function sendStoryReply(textToSend) {
    const clean = String(textToSend || '').trim();
    if (!clean) return;
    setSentNotice('Sent to Messenger!');
    setTimeout(() => setSentNotice(''), 2000);
    const targetId = story.user_id || currentUser?.id;
    const formatted = `Replied to your story: ${clean}`;
    if (currentUser?.id && targetId) {
      try {
        await supabase.from('messages').insert({
          sender_id: currentUser.id,
          receiver_id: targetId,
          content: formatted
        });
      } catch (_) {}
    }
    try {
      const raw = localStorage.getItem('zuka_story_replies') || '[]';
      const arr = JSON.parse(raw);
      arr.unshift({
        id: `sr-${Date.now()}`,
        peer_id: targetId,
        peer_name: authorName,
        peer_avatar: story.avatar_url || '',
        content: formatted,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('zuka_story_replies', JSON.stringify(arr.slice(0, 30)));
      window.dispatchEvent(new CustomEvent('zuka:story-reply'));
    } catch (_) {}
  }

  function handleSendForm(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    sendStoryReply(replyText);
    setReplyText('');
    if (onPauseChange) onPauseChange(false);
  }

  function handleReaction(emoji) {
    setFloatingEmoji(emoji);
    setTimeout(() => setFloatingEmoji(''), 1100);
    sendStoryReply(emoji);
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 85, backgroundColor: '#000000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ padding: '10px 10px 0', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {stories.map((s, idx) => (
            <div key={s.id} style={{ flex: 1, height: '2.5px', backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                ref={idx === activeIndex ? activeBarRef : null}
                style={{
                  height: "100%",
                  backgroundColor: "#FFFFFF",
                  width: idx < activeIndex ? "100%" : idx === activeIndex ? (isVid ? "100%" : `${progress}%`) : "0%",
                  transform: idx === activeIndex && isVid ? "scaleX(0)" : "none",
                  transformOrigin: "left center",
                  willChange: "transform"
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1877F2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
              {story.avatar_url ? <img src={story.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorName.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span>{authorName}</span>{story?.is_verified && <ZukaBadge size={14} />}</div>
              <div style={{ fontSize: '11px', color: '#E4E6EB' }}>{formatStoryTime(story.created_at)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={() => { const next = !menuOpen; setMenuOpen(next); if (onPauseChange) onPauseChange(next); }} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <MoreVertical size={22} />
            </button>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div onClick={() => { setMenuOpen(false); if (onPauseChange) onPauseChange(false); }} style={{ position: 'fixed', inset: 0, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '58px 14px 0' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#242526', color: '#FFFFFF', borderRadius: '10px', width: '190px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
            {isVid && (
              <button type="button" onClick={() => { const next = !muted; setMuted(next); if (videoRef.current) videoRef.current.muted = next; setMenuOpen(false); if (onPauseChange) onPauseChange(false); }} style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                {muted ? <Volume2 size={18} /> : <VolumeX size={18} />} {muted ? 'Unmute video' : 'Mute video'}
              </button>
            )}
            {isOwner && (
              <button type="button" onClick={() => onDeleteStory(story.id)} style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', color: '#F3425F', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Trash2 size={18} /> Delete story
              </button>
            )}
          </div>
        </div>
      )}

      <div
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={() => { if (onPauseChange) onPauseChange(true); if (videoRef.current) videoRef.current.pause(); }}
        onTouchEnd={() => { if (!replyText.trim() && !menuOpen) { if (onPauseChange) onPauseChange(false); if (videoRef.current) videoRef.current.play().catch(() => {}); } }}
        onMouseDown={() => { if (onPauseChange) onPauseChange(true); if (videoRef.current) videoRef.current.pause(); }}
        onMouseUp={() => { if (!replyText.trim() && !menuOpen) { if (onPauseChange) onPauseChange(false); if (videoRef.current) videoRef.current.play().catch(() => {}); } }}
        style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
      >
        {isVid ? (
          <video
            ref={(el) => {
              videoRef.current = el;
              if (el) {
                el.muted = muted;
                el.play().catch(() => {
                  el.muted = true;
                  setMuted(true);
                  el.play().catch(() => {});
                });
              }
            }}
            src={story.media_url}
            autoPlay
            playsInline
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration && onVideoProgress) { const pct = Math.min(100, (v.currentTime / v.duration) * 100); setVidProgress(pct); if (onVideoProgress) onVideoProgress(pct); }
            }}
            onEnded={() => { if (activeBarRef.current) activeBarRef.current.style.transform = "scaleX(1)"; setTimeout(() => onNext(), 90); }}
            draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none", WebkitTouchCallout: "none" }}
          />
        ) : (
          <img src={story.media_url} alt="" draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none", WebkitTouchCallout: "none" }} />
        )}

        {activeIndex > 0 && (
          <button type="button" onClick={onPrev} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <button type="button" onClick={onNext} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronRight size={20} />
        </button>

        {floatingEmoji && (
          <div style={{ position: 'absolute', fontSize: '68px', pointerEvents: 'none' }}>{floatingEmoji}</div>
        )}
        {sentNotice && (
          <div style={{ position: 'absolute', bottom: '18px', backgroundColor: '#1877F2', color: '#FFFFFF', padding: '6px 14px', borderRadius: '18px', fontSize: '12px', fontWeight: 700 }}>{sentNotice}</div>
        )}
      </div>

      <div style={{ padding: '8px 10px 14px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
        <form onSubmit={handleSendForm} style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.55)', borderRadius: '22px', padding: '4px 10px', backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <input
            type="text"
            value={replyText}
            onFocus={() => { if (onPauseChange) onPauseChange(true); }}
            onBlur={() => { if (!replyText.trim() && onPauseChange) onPauseChange(false); }}
            onChange={(e) => { setReplyText(e.target.value); if (onPauseChange) onPauseChange(true); }}
            placeholder="Send message..."
            style={{ flex: 1, background: 'none', border: 'none', color: '#FFFFFF', fontSize: '14px', outline: 'none', padding: '4px 0' }}
          />
          {replyText.trim() && (
            <button type="submit" style={{ background: 'none', border: 'none', color: '#1877F2', cursor: 'pointer', display: 'flex', padding: '2px' }}>
              <Send size={18} />
            </button>
          )}
        </form>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {['❤️', '👍', '😂', '😮', '😢'].map((em) => (
            <button key={em} type="button" onClick={() => handleReaction(em)} style={{ background: 'none', border: 'none', fontSize: '23px', padding: 0, cursor: 'pointer', lineHeight: 1 }}>
              {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
