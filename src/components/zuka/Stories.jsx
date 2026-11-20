import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Volume2, VolumeX, Eye, Send, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TEXT_BGS = [
  'linear-gradient(135deg, #1877F2 0%, #00C6FF 100%)',
  'linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)',
  'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
  'linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)',
  'linear-gradient(135deg, #141E30 0%, #243B55 100%)'
];

function formatStoryTime(ts) {
  if (!ts) return 'Just now';
  const diff = Math.max(1, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return '24h';
}

async function uploadFast(bucket, path, file, ms = 7000) {
  const up = (async () => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true
    });
    if (error) return '';
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || '';
  })();
  return Promise.race([up, new Promise((r) => setTimeout(() => r(''), ms))]);
}

function fileToDataUrl(file) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ''));
    r.onerror = () => res('');
    r.readAsDataURL(file);
  });
}


async function trimVideoClip(file, startSec, endSec) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.src = url;
      vid.muted = false;
      vid.playsInline = true;
      vid.onloadedmetadata = () => {
        const s0 = Math.max(0, Math.min(startSec, vid.duration - 0.5));
        const s1 = Math.max(s0 + 0.5, Math.min(endSec, vid.duration));
        vid.currentTime = s0;
        vid.onseeked = () => {
          const st = vid.captureStream ? vid.captureStream() : (vid.mozCaptureStream ? vid.mozCaptureStream() : null);
          if (!st) { URL.revokeObjectURL(url); resolve(file); return; }
          const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm';
          const rec = new MediaRecorder(st, { mimeType: mime, videoBitsPerSecond: 1200000 });
          const chunks = [];
          rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
          rec.onstop = () => {
            URL.revokeObjectURL(url);
            resolve(new File([new Blob(chunks, { type: 'video/webm' })], 'trimmed_' + Date.now() + '.webm', { type: 'video/webm' }));
          };
          rec.start();
          vid.play().catch(() => {});
          const iv = setInterval(() => {
            if (vid.currentTime >= s1 || vid.ended) { clearInterval(iv); vid.pause(); if (rec.state !== 'inactive') rec.stop(); }
          }, 100);
        };
      };
      vid.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    } catch (_) { resolve(file); }
  });
}

export default function Stories({ userProfile, onOpenProfile }) {
  const [stories, setStories] = useState([]);
  const [activeGroupIdx, setActiveGroupIdx] = useState(null);
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  const [draftStory, setDraftStory] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [draftBgIdx, setDraftBgIdx] = useState(0);
  const [draftAudio, setDraftAudio] = useState(null);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 15, duration: 0 });
  const [sharing, setSharing] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [floatingEmoji, setFloatingEmoji] = useState(null);
  const [viewersList, setViewersList] = useState([]);
  const [showViewers, setShowViewers] = useState(false);

  const mediaInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const myName = userProfile?.full_name || 'Zuka User';
  const myAvatar = userProfile?.avatar_url || `https://ui-avatars.com{encodeURIComponent(myName)}&background=1877F2&color=fff&bold=true`;

  useEffect(() => {
    let alive = true;
    async function loadStories() {
      const profMap = {};
      try {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url');
        if (Array.isArray(profs)) profs.forEach((p) => { profMap[String(p.id)] = p; });
      } catch (_) {}

      try {
        const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase.from('stories').select('*').gte('created_at', cutoff24h).order('created_at', { ascending: true });
        if (!alive) return;
        setStories((data || []).map((row) => {
          const prof = profMap[String(row.user_id)] || {};
          const rawAuthor = String(row.author_name || '');
          const mMatch = rawAuthor.match(/\[🎵\s*([^\]]+)\]/);
          const cleanAuthor = rawAuthor.replace(/\s*\[🎵\s*[^\]]+\]/g, '').trim();
          return {
            id: row.id,
            user_id: row.user_id || null,
            author_name: prof.full_name || cleanAuthor || 'Zuka User',
            author_avatar: prof.avatar_url || `https://ui-avatars.com{encodeURIComponent(prof.full_name || row.author_name || 'Z')}&background=1877F2&color=fff`,
            media_url: row.media_url || '',
            media_type: row.media_type || 'image',
            audio_url: row.audio_url || '',
            music_title: (mMatch && mMatch) ? mMatch : (row.audio_url ? 'Story Music' : ''),
            caption: row.media_type === 'text' ? cleanAuthor : '',
            created_at: row.created_at
          };
        }));
      } catch (_) {}
    }
    loadStories();
    return () => { alive = false; };
  }, [userProfile?.id]);

  const groupedStories = React.useMemo(() => {
    const groups = [];
    const map = new Map();
    stories.forEach((st) => {
      const k = String(st.user_id || st.author_name || st.id);
      if (!map.has(k)) {
        const g = { key: k, user_id: st.user_id, author_name: st.author_name, author_avatar: st.author_avatar, items: [] };
        map.set(k, g);
        groups.push(g);
      }
      map.get(k).items.push(st);
    });
    return groups;
  }, [stories]);

  const activeGroup = activeGroupIdx !== null ? groupedStories[activeGroupIdx] || null : null;
  const activeStory = activeGroup ? activeGroup.items[activeItemIdx] || null : null;

  useEffect(() => {
    if (!activeStory?.id || !userProfile?.id || String(activeStory.user_id) === String(userProfile.id)) return;
    supabase.from('story_views').upsert({ story_id: activeStory.id, viewer_id: userProfile.id }, { onConflict: 'story_id,viewer_id' }).catch(() => {});
  }, [activeStory?.id, userProfile?.id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      if (paused || showViewers) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
    if (audioRef.current) {
      audioRef.current.muted = muted;
      if (paused || showViewers) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
    }
  }, [paused, muted, showViewers, activeStory?.id]);

  useEffect(() => {
    if (!activeStory || paused || showViewers) return;
    if (activeStory.media_type === 'video' || activeStory.audio_url) return;
    const step = (50 / 6000) * 100;
    const t = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          clearInterval(t);
          if (activeGroup && activeItemIdx + 1 < activeGroup.items.length) {
            setActiveItemIdx((i) => i + 1);
          } else if (activeGroupIdx !== null && activeGroupIdx + 1 < groupedStories.length) {
            setActiveGroupIdx((g) => g + 1);
            setActiveItemIdx(0);
          } else {
            setActiveGroupIdx(null);
            setActiveItemIdx(0);
          }
          return 0;
        }
        return prev + step;
      });
    }, 50);
    return () => clearInterval(t);
  }, [activeStory?.id, activeGroupIdx, activeItemIdx, paused, showViewers, groupedStories.length]);

  function goNextStory() {
    if (!activeGroup) return;
    if (activeItemIdx + 1 < activeGroup.items.length) { setActiveItemIdx((i) => i + 1); setProgress(0); }
    else if (activeGroupIdx + 1 < groupedStories.length) { setActiveGroupIdx((g) => g + 1); setActiveItemIdx(0); setProgress(0); }
    else { setActiveGroupIdx(null); setActiveItemIdx(0); }
  }

  function goPrevStory() {
    if (!activeGroup) return;
    if (activeItemIdx > 0) { setActiveItemIdx((i) => i - 1); setProgress(0); }
    else if (activeGroupIdx > 0) {
      const prev = groupedStories[activeGroupIdx - 1];
      setActiveGroupIdx((g) => g - 1);
      setActiveItemIdx(Math.max(0, (prev?.items?.length || 1) - 1));
      setProgress(0);
    } else setProgress(0);
  }

  function handlePickMedia(e) {
    const file = (e.target.files && e.target.files.item(0)) || null;
    e.target.value = '';
    if (!file) return;
    if (file.type.startsWith('video/') && file.size > 4 * 1024 * 1024) { alert('Video exceeds 4MB limit. Please select a video under 4MB.'); return; }
    if (file.type.startsWith('video/') && file.size > 4 * 1024 * 1024) { alert('Video exceeds 4MB limit. Please select a video under 4MB.'); return; }
    setDraftText(''); setDraftAudio(null); setTrimRange({ start: 0, end: 15, duration: 0 });
    setDraftStory({ mode: 'media', file, previewUrl: URL.createObjectURL(file), isVideo: file.type.startsWith('video/') });
  }

  function handlePickAudio(e) {
    const af = (e.target.files && e.target.files.item(0)) || null;
    e.target.value = '';
    if (!af) return;
    setDraftAudio({ file: af, url: URL.createObjectURL(af), name: af.name.replace(/\.[^/.]+$/, '') || 'Story Music' });
  }

  async function handleShareStory() {
    if (!draftStory || sharing) return;
    if (draftStory.mode === 'text' && !draftText.trim()) return;
    setSharing(true);
    try {
      let mediaUrl = draftStory.mode === 'text' ? TEXT_BGS[draftBgIdx] : '';
      let audioUrl = '';
      const jobs = [];
      if (draftStory.mode === 'media' && draftStory.file) {
        let fileToUpload = draftStory.file;
        if (false) {
          fileToUpload = await trimVideoClip(draftStory.file, trimRange.start, trimRange.end);
        }
        if (draftStory.isVideo && fileToUpload.size > 4 * 1024 * 1024) {
          alert('Video exceeds 4MB limit. Please shorten the trim range.');
          setSharing(false);
          return;
        }
        const ext = (draftStory.file.name.split('.').pop() || (draftStory.isVideo ? 'mp4' : 'jpg')).toLowerCase();
        const mPath = `stories/media_${userProfile?.id || 'guest'}_${Date.now()}.${ext}`;
        jobs.push((async () => {
          let u = '';
          for (const b of (draftStory.isVideo ? ['reels', 'post-media', 'avatars', 'stories'] : ['post-media', 'avatars', 'stories'])) {
            u = await uploadFast(b, mPath, fileToUpload, 35000);
            if (u) break;
          }
          if (!u && fileToUpload.size <= 4 * 1024 * 1024) u = await fileToDataUrl(fileToUpload);
          if (!u && !draftStory.isVideo) u = await fileToDataUrl(draftStory.file);
          mediaUrl = u || (draftStory.isVideo ? '' : draftStory.previewUrl);
        })());
      }
      if (draftAudio?.file) {
        const aExt = (draftAudio.file.name.split('.').pop() || 'mp3').toLowerCase();
        const aPath = `stories/audio_${userProfile?.id || 'guest'}_${Date.now()}.${aExt}`;
        jobs.push((async () => {
          let au = '';
          for (const b of ['post-media', 'reels', 'avatars', 'stories']) {
            au = await uploadFast(b, aPath, draftAudio.file, 15000);
            if (au) break;
          }
          if (!au && draftAudio.file.size < 4 * 1024 * 1024) au = await fileToDataUrl(draftAudio.file);
          audioUrl = au || draftAudio.url;
        })());
      }
      await Promise.all(jobs);
      if (draftStory.mode === 'media' && !mediaUrl) { alert('Video upload failed or took too long. Please try a shorter video.'); setSharing(false); return; }

      const capWithMusic = draftAudio?.name ? `${draftText.trim() ? draftText.trim() + ' ' : ''}[🎵 ${draftAudio.name}]` : draftText.trim();
      const authorWithMusic = draftAudio?.name ? `${myName} [🎵 ${draftAudio.name}]` : (draftStory.mode === 'text' ? draftText.trim() : myName);
      const payload = {
        media_url: mediaUrl,
        media_type: draftStory.mode === 'text' ? 'text' : (draftStory.isVideo ? 'video' : 'image'),
        author_name: authorWithMusic,
        audio_url: audioUrl || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      if (userProfile?.id) payload.user_id = userProfile.id;

      const { data: ins } = await supabase.from('stories').insert(payload).select('*').single();
      setStories((prev) => [...prev, {
        id: ins?.id || `local-${Date.now()}`,
        user_id: userProfile?.id || null,
        author_name: myName,
        author_avatar: myAvatar,
        media_url: mediaUrl,
        media_type: payload.media_type,
        audio_url: audioUrl,
        music_title: draftAudio?.name || '',
        caption: draftText.trim(),
        created_at: ins?.created_at || new Date().toISOString()
      }]);
      if (draftStory?.previewUrl) { try { URL.revokeObjectURL(draftStory.previewUrl); } catch (_) {} } setDraftStory(null); setDraftText(''); setDraftAudio(null);
    } catch (_) {
      setDraftStory(null);
    } finally {
      setSharing(false);
    }
  }

  async function handleDeleteStory(id) {
    setStories((prev) => prev.filter((s) => String(s.id) !== String(id)));
    setActiveGroupIdx(null);
    try { await supabase.from('stories').delete().eq('id', id); } catch (_) {}
  }

  async function openViewersModal() {
    if (!activeStory?.id) return;
    setShowViewers(true); setViewersList([]);
    try {
      const { data } = await supabase.from('story_views').select('viewer_id').eq('story_id', activeStory.id);
      const ids = (data || []).map((v) => v.viewer_id).filter(Boolean);
      if (ids.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids);
        setViewersList((profs || []).map((p) => ({ id: p.id, name: p.full_name || 'Zuka User', avatar: p.avatar_url || '' })));
      }
    } catch (_) {}
  }

  async function sendStoryReply(txt) {
    const clean = String(txt || '').trim();
    if (!clean || !activeStory) return;
    setFloatingEmoji(clean.length <= 4 ? clean : '💌');
    setTimeout(() => setFloatingEmoji(null), 1200);
    setReplyText('');
    if (userProfile?.id && activeStory.user_id && String(userProfile.id) !== String(activeStory.user_id)) {
      try { await supabase.from('messages').insert({ sender_id: userProfile.id, receiver_id: activeStory.user_id, content: `Replied to your story: ${clean}` }); } catch (_) {}
    }
  }

  return (
    <>
      <input ref={mediaInputRef} type="file" accept="image/*,video/*" onChange={handlePickMedia} style={{ display: 'none' }} />
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handlePickAudio} style={{ display: 'none' }} />

      <div style={{ backgroundColor: '#FFF', padding: '10px 8px', marginBottom: '8px', borderBottom: '1px solid #E4E6EB', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ minWidth: '106px', width: '106px', height: '182px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #DADDE1', backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative' }}>
          <div onClick={() => mediaInputRef.current?.click()} style={{ height: '122px', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}>
            <img src={myAvatar} alt={myName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button type="button" onClick={(e) => { e.stopPropagation(); setDraftText(''); setDraftAudio(null); setDraftBgIdx(0); setDraftStory({ mode: 'text' }); }} style={{ position: 'absolute', top: '6px', right: '6px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.62)', color: '#FFF', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Aa</button>
          </div>
          <div onClick={() => mediaInputRef.current?.click()} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '8px', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: '-17px', width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#1877F2', border: '3px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}><Plus size={20} strokeWidth={3} /></div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#050505', textAlign: 'center', lineHeight: '1.15' }}>Create story</span>
          </div>
        </div>

        {groupedStories.map((grp, gIdx) => {
          const latest = grp.items[grp.items.length - 1];
          const isText = latest.media_type === 'text';
          return (
            <div key={grp.key} onClick={() => { setActiveGroupIdx(gIdx); setActiveItemIdx(0); setProgress(0); }} style={{ minWidth: '106px', width: '106px', height: '182px', borderRadius: '12px', overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: 'pointer', background: isText ? latest.media_url : '#111', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
              {isText ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', textAlign: 'center', color: '#FFF', fontWeight: 800, fontSize: '13px', lineHeight: 1.25 }}>{latest.caption}</div>
              ) : latest.media_type === 'video' ? (
                <video src={latest.media_url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={latest.media_url} alt={grp.author_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), transparent 40%, rgba(0,0,0,0.68))' }} />
              <div style={{ position: 'absolute', top: '8px', left: '8px', width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #1877F2', overflow: 'hidden', backgroundColor: '#FFF' }}>
                <img src={grp.author_avatar} alt={grp.author_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {grp.items.length > 1 && <span style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 6px', borderRadius: '10px', backgroundColor: '#1877F2', color: '#FFF', fontSize: '11px', fontWeight: 700 }}>{grp.items.length}</span>}
              <span style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', color: '#FFF', fontSize: '12px', fontWeight: 700, lineHeight: '1.2', textShadow: '0 1px 2px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{grp.author_name}</span>
            </div>
          );
        })}
      </div>

      {draftStory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', zIndex: 5 }}>
            <button type="button" onClick={() => !sharing && setDraftStory(null)} style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={22} /></button>
            <span style={{ color: '#FFF', fontWeight: 700, fontSize: '16px' }}>Create story</span>
            <button type="button" onClick={() => audioInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '20px', border: 'none', backgroundColor: draftAudio ? '#1877F2' : 'rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, fontSize: '13px', cursor: 'pointer', maxWidth: '145px' }}>
              <Music size={15} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draftAudio ? draftAudio.name : 'Music'}</span>
            </button>
          </div>

          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: draftStory.mode === 'text' ? TEXT_BGS[draftBgIdx] : '#000' }}>
            {draftAudio?.url && (
              <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderRadius: '20px', backgroundColor: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.28)', color: '#FFF', fontSize: '13px', fontWeight: 700, maxWidth: '85%' }}>
                <Music size={15} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draftAudio.name}</span>
                <button type="button" onClick={() => setDraftAudio(null)} style={{ background: 'none', border: 'none', color: '#FFF', fontWeight: 800, cursor: 'pointer', padding: 0 }}>✕</button>
                <audio src={draftAudio.url} autoPlay loop playsInline style={{ display: 'none' }} />
              </div>
            )}
            {draftStory.mode === 'text' ? (
              <div style={{ width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
                <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="Start typing your story..." rows={4} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: '26px', fontWeight: 800, textAlign: 'center', resize: 'none' }} />
                <div style={{ display: 'flex', gap: '10px' }}>{TEXT_BGS.map((bg, idx) => (<button key={idx} type="button" onClick={() => setDraftBgIdx(idx)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: bg, border: draftBgIdx === idx ? '3px solid #FFF' : '1px solid rgba(255,255,255,0.4)', cursor: 'pointer' }} />))}</div>
              </div>
            ) : draftStory.isVideo ? (
              <video
                src={draftStory.previewUrl}
                autoPlay
                loop
                muted={Boolean(draftAudio)}
                playsInline
                onLoadedMetadata={(e) => {
                  const d = Math.floor(e.currentTarget.duration || 0);
                  if (d > 0 && trimRange.duration === 0) {
                    const maxClip = d;
                    setTrimRange({ start: 0, end: Math.min(d, maxClip), duration: d });
                  }
                }}
                onTimeUpdate={(e) => {
                  if (trimRange.duration > 0 && e.currentTarget.currentTime >= trimRange.end) {
                    e.currentTarget.currentTime = trimRange.start;
                  }
                }}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <img src={draftStory.previewUrl} alt="Story preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>

          <div style={{ padding: '12px 16px 24px', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {draftStory.mode === 'media' && false && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF', fontSize: '12px', fontWeight: 700 }}>
                  <span>✂️ Trim Video: {trimRange.start}s – {trimRange.end}s ({trimRange.end - trimRange.start}s)</span>
                  <span>Est. ~{Math.max(0.5, Number((((trimRange.end - trimRange.start) / trimRange.duration) * (draftStory.file.size / (1024 * 1024))).toFixed(1)))} MB / 4 MB</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#CCC', fontSize: '11px' }}>Start</span>
                  <input type="range" min={0} max={Math.max(0, trimRange.duration - 1)} value={trimRange.start} onChange={(e) => { const v = Number(e.target.value); setTrimRange((r) => ({ ...r, start: v, end: Math.max(v + 1, r.end) })); }} style={{ flex: 1 }} />
                  <span style={{ color: '#CCC', fontSize: '11px' }}>End</span>
                  <input type="range" min={1} max={trimRange.duration} value={trimRange.end} onChange={(e) => { const v = Number(e.target.value); setTrimRange((r) => ({ ...r, end: Math.max(r.start + 1, v) })); }} style={{ flex: 1 }} />
                </div>
              </div>
            )}
            {draftStory.mode === 'media' && <input type="text" value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="Add a caption to your story..." style={{ width: '100%', padding: '10px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', fontSize: '14px', outline: 'none' }} />}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => !sharing && setDraftStory(null)} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>Discard</button>
              <button type="button" onClick={handleShareStory} disabled={sharing || (draftStory.mode === 'text' && !draftText.trim())} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700, fontSize: '14px', cursor: sharing ? 'wait' : 'pointer', opacity: sharing ? 0.75 : 1 }}>{sharing ? 'Sharing...' : 'Share to Story'}</button>
            </div>
          </div>
        </div>
      )}

      {activeStory && activeGroup && (
        <div onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', userSelect: 'none' }}>
          <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 30, display: 'flex', gap: '4px' }}>
            {activeGroup.items.map((it, idx) => (
              <div key={it.id} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: '#FFF', width: idx < activeItemIdx ? '100%' : idx === activeItemIdx ? `${progress}%` : '0%', transition: idx === activeItemIdx ? 'width 50ms linear' : 'none' }} />
              </div>
            ))}
          </div>

          <div style={{ position: 'relative', zIndex: 30, padding: '22px 12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }}>
            <div onClick={(e) => { e.stopPropagation(); setActiveGroupIdx(null); if (onOpenProfile && activeStory.user_id) onOpenProfile(activeStory.user_id); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0 }}>
              <img src={activeStory.author_avatar} alt={activeStory.author_name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FFF' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#FFF', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeStory.author_name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>{formatStoryTime(activeStory.created_at)}</span>
                </div>
                {(activeStory.music_title || activeStory.audio_url) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#E4E6EB', fontSize: '12px', fontWeight: 600 }}>
                    <Music size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeStory.music_title || 'Story Music'}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
              {(activeStory.audio_url || activeStory.media_type === 'video') && (
                <button type="button" onClick={() => setMuted((m) => !m)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
              {userProfile?.id && String(activeStory.user_id) === String(userProfile.id) && (
                <button type="button" onClick={() => handleDeleteStory(activeStory.id)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={17} />
                </button>
              )}
              <button type="button" onClick={() => setActiveGroupIdx(null)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: activeStory.media_type === 'text' ? activeStory.media_url : '#000' }}>
            {activeStory.audio_url && <audio ref={audioRef} src={activeStory.audio_url} autoPlay muted={muted} playsInline onTimeUpdate={(e) => { const d = e.currentTarget.duration; if (d > 0) setProgress(Math.min(100, (e.currentTarget.currentTime / d) * 100)); }} onTimeUpdate={(e) => { const d = e.currentTarget.duration; if (d > 0) setProgress(Math.min(100, (e.currentTarget.currentTime / d) * 100)); }} onEnded={goNextStory} />}
            {activeStory.media_type === 'text' ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#FFF', fontSize: '26px', fontWeight: 800, lineHeight: 1.3 }}>{activeStory.caption}</div>
            ) : activeStory.media_type === 'video' ? (
              <video ref={videoRef} src={activeStory.media_url} autoPlay playsInline muted={muted} onEnded={goNextStory} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <img src={activeStory.media_url} alt={activeStory.author_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
            <button type="button" onClick={(e) => { e.stopPropagation(); goPrevStory(); }} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 25, width: '34px', height: '34px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.45)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#FFF', fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <div onClick={(e) => { e.stopPropagation(); goPrevStory(); }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '32%', zIndex: 20, cursor: 'pointer' }} />
            <button type="button" onClick={(e) => { e.stopPropagation(); goNextStory(); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 25, width: '34px', height: '34px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.45)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#FFF', fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            <div onClick={(e) => { e.stopPropagation(); goNextStory(); }} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '68%', zIndex: 20, cursor: 'pointer' }} />
            {floatingEmoji && <div style={{ position: 'absolute', zIndex: 40, fontSize: '64px', pointerEvents: 'none' }}>{floatingEmoji}</div>}
          </div>

          <div style={{ position: 'relative', zIndex: 30, padding: '12px 14px 22px', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }} onClick={(e) => e.stopPropagation()}>
            {activeStory.media_type !== 'text' && activeStory.caption && (
              <p style={{ color: '#FFF', fontSize: '14px', textAlign: 'center', marginBottom: '12px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{activeStory.caption}</p>
            )}
            {userProfile?.id && String(activeStory.user_id) === String(userProfile.id) ? (
              <button type="button" onClick={openViewersModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFF', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                <Eye size={16} />
                <span>Viewers</span>
              </button>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: '8px' }}>
                  {['Good times 🙌', 'Love this ❤️', 'Nice shot 🔥', 'Haha 😂'].map((chip) => (
                    <button key={chip} type="button" onClick={() => sendStoryReply(chip)} style={{ padding: '6px 12px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.35)', backgroundColor: 'rgba(0,0,0,0.55)', color: '#FFF', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      {chip}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <form onSubmit={(e) => { e.preventDefault(); sendStoryReply(replyText); }} style={{ flex: 1, display: 'flex', alignItems: 'center', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.45)', padding: '6px 12px', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                  <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Send message..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: '14px' }} />
                  {replyText.trim() && <button type="submit" style={{ background: 'none', border: 'none', color: '#1877F2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Send size={18} /></button>}
                </form>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['❤️', '😂', '😮', '😢', '🔥'].map((emo) => (
                    <button key={emo} type="button" onClick={() => sendStoryReply(emo)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emo}</button>
                  ))}
                </div>
              </div>
              </div>
            )}
          </div>

          {showViewers && (
            <div onClick={() => setShowViewers(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }}>
              <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '55vh', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #E4E6EB', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '16px', color: '#050505' }}>Story viewers ({viewersList.length})</span>
                  <button type="button" onClick={() => setShowViewers(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                </div>
                {viewersList.length === 0 ? (
                  <p style={{ color: '#65676B', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>No viewers yet.</p>
                ) : (
                  viewersList.map((v) => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                      <img src={v.avatar || `https://ui-avatars.com{encodeURIComponent(v.name)}`} alt={v.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#050505' }}>{v.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
