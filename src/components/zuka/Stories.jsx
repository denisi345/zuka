import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, X, ChevronLeft, ChevronRight, Volume2, VolumeX,
  Send, Eye, Trash2, Image as ImageIcon, Type, Music, Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

function formatStoryAge(iso) {
  if (!iso) return 'Just now';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

async function compressStoryImage(file) {
  if (!file || !file.type?.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1080;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadStoryFile(path, file, ms = 12000) {
  for (const bucket of ['stories', 'post-media', 'avatars', 'reels']) {
    const res = await Promise.race([
      (async () => {
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: true
        });
        if (error) return '';
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data?.publicUrl || '';
      })(),
      new Promise((r) => setTimeout(() => r(''), ms))
    ]);
    if (res) return res;
  }
  return '';
}

const TEXT_BG_OPTIONS = [
  'linear-gradient(135deg, #1877F2 0%, #0A499E 100%)',
  'linear-gradient(135deg, #F50057 0%, #FF6D00 100%)',
  'linear-gradient(135deg, #00B09B 0%, #96C93D 100%)',
  'linear-gradient(135deg, #6A11CB 0%, #2575FC 100%)',
  'linear-gradient(135deg, #141E30 0%, #243B55 100%)'
];

export default function Stories({ userProfile, stories: propStories, onUploadStory }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupIdx, setActiveGroupIdx] = useState(null);
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [floatingEmoji, setFloatingEmoji] = useState(null);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState('media');
  const [draftFile, setDraftFile] = useState(null);
  const [draftPreview, setDraftPreview] = useState('');
  const [draftIsVideo, setDraftIsVideo] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftBgIdx, setDraftBgIdx] = useState(0);
  const [draftCaption, setDraftCaption] = useState('');
  const [draftAudioFile, setDraftAudioFile] = useState(null);
  const [sharing, setSharing] = useState(false);

  const mediaInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const storyVideoRef = useRef(null);
  const storyAudioRef = useRef(null);

  const myName = userProfile?.full_name || userProfile?.username || 'Zuka Member';
  const myAvatar = userProfile?.avatar_url || `https://ui-avatars.com{encodeURIComponent(myName)}&background=1877F2&color=fff&bold=true`;

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }

  const [seenIds, setSeenIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zuka_seen_stories') || '[]'); } catch (_) { return []; }
  });
  const [textFontStyle, setTextFontStyle] = useState('sans-serif');
  const [storyMenuOpen, setStoryMenuOpen] = useState(false);

  function markStorySeen(id) {
    if (!id) return;
    const idStr = String(id);
    setSeenIds((prev) => {
      if (prev.includes(idStr)) return prev;
      const next = [...prev.slice(-150), idStr];
      try { localStorage.setItem('zuka_seen_stories', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }

  // Android / Browser Back Button Support for Story Viewer & Create Story
  const anyOverlayOpen = activeGroupIdx !== null || createOpen || viewersOpen || storyMenuOpen;
  useEffect(() => {
    if (!anyOverlayOpen) return;
    window.history.pushState({ zukaStoryModal: true }, '');
    const onPop = () => {
      setViewersOpen(false);
      setStoryMenuOpen(false);
      setActiveGroupIdx(null);
      resetStoryDraft(); setCreateOpen(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [anyOverlayOpen]);

  // Load Stories + Join with Profiles so real names & avatars always show
  useEffect(() => {
    let alive = true;
    async function loadAllStories() {
      setLoading(true);
      const profMap = {};
      try {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified');
        if (Array.isArray(profs)) {
          profs.forEach((p) => { profMap[String(p.id).trim()] = p; });
        }
      } catch (_) {}

      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('stories')
          .select('*')
          .gte('created_at', cutoff)
          .order('created_at', { ascending: true })
          .limit(80);

        if (!alive) return;
        const validRows = (data || []).filter((row) => {
          if (row.media_type === 'text') return true;
          const u = String(row.media_url || '').trim();
          return u && !u.startsWith('blob:');
        });

        const mapped = validRows.map((row) => {
          const uid = String(row.user_id || '').trim();
          const prof = profMap[uid] || {};
          const rawAuthor = String(row.author_name || '').trim();
          const mMatch = rawAuthor.match(/\[🎵\s*([^\]]+)\]/);
          const cleanAuthor = rawAuthor.replace(/\s*\[🎵\s*[^\]]+\]/g, '').trim();
          const resolvedName = prof.full_name || prof.username || (cleanAuthor && cleanAuthor !== 'Zuka User' ? cleanAuthor : '') || (uid && uid === String(userProfile?.id) ? myName : 'Zuka Member');
          const resolvedAvatar = prof.avatar_url || `https://ui-avatars.com{encodeURIComponent(resolvedName)}&background=1877F2&color=fff&bold=true`;

          let parsedText = '';
          let parsedBg = TEXT_BG_OPTIONS;
          let parsedCaption = '';
          if (row.media_type === 'text') {
            try {
              const obj = JSON.parse(row.media_url || '{}');
              parsedText = obj.text || cleanAuthor || '';
              parsedBg = obj.bg || TEXT_BG_OPTIONS;
            } catch (_) {
              parsedText = row.media_url || cleanAuthor || '';
            }
          } else {
            parsedCaption = cleanAuthor && cleanAuthor !== resolvedName ? cleanAuthor : '';
          }

          return {
            id: row.id,
            user_id: row.user_id || null,
            author_name: resolvedName,
            author_avatar: resolvedAvatar,
            verified: Boolean(prof.is_verified),
            media_url: row.media_url || '',
            media_type: row.media_type || 'image',
            audio_url: row.audio_url || '',
            music_title: (mMatch && mMatch) ? mMatch : (row.audio_url ? 'Story Music' : ''),
            text_content: parsedText,
            text_bg: parsedBg,
            caption: parsedCaption,
            created_at: row.created_at
          };
        });
        setStories(mapped);
      } catch (_) {}
      if (alive) setLoading(false);
    }
    loadAllStories();
    return () => { alive = false; };
  }, [userProfile?.id, myName]);

  const groupedStories = React.useMemo(() => {
    const groups = [];
    const map = {};
    stories.forEach((st) => {
      const key = st.user_id ? `u_${st.user_id}` : `n_${st.author_name}`;
      if (!map[key]) {
        map[key] = {
          key,
          user_id: st.user_id,
          author_name: st.author_name,
          author_avatar: st.author_avatar,
          verified: st.verified,
          items: []
        };
        groups.push(map[key]);
      }
      map[key].items.push(st);
    });
    // Put current user's story group first if present
    if (userProfile?.id) {
      const myIdx = groups.findIndex((g) => String(g.user_id) === String(userProfile.id));
      if (myIdx > 0) {
        const [mine] = groups.splice(myIdx, 1);
        groups.unshift(mine);
      }
    }
    return groups;
  }, [stories, userProfile?.id]);

  const activeGroup = activeGroupIdx !== null ? groupedStories[activeGroupIdx] || null : null;
  const activeStory = activeGroup ? activeGroup.items[activeItemIdx] || null : null;

  useEffect(() => {
    if (activeStory?.id) markStorySeen(activeStory.id);
  }, [activeStory?.id]);

  function goNextStory() {
    if (!activeGroup) return;
    if (activeItemIdx + 1 < activeGroup.items.length) {
      setActiveItemIdx((i) => i + 1);
      setProgress(0);
    } else if (activeGroupIdx + 1 < groupedStories.length) {
      setActiveGroupIdx((g) => g + 1);
      setActiveItemIdx(0);
      setProgress(0);
    } else {
      setActiveGroupIdx(null);
      setActiveItemIdx(0);
      setProgress(0);
    }
  }

  function goPrevStory() {
    if (!activeGroup) return;
    if (activeItemIdx > 0) {
      setActiveItemIdx((i) => i - 1);
      setProgress(0);
    } else if (activeGroupIdx > 0) {
      const prevGrp = groupedStories[activeGroupIdx - 1];
      setActiveGroupIdx((g) => g - 1);
      setActiveItemIdx(Math.max(0, (prevGrp?.items?.length || 1) - 1));
      setProgress(0);
    } else {
      setProgress(0);
    }
  }

  // Story timer for images and text stories
  useEffect(() => {
    if (!activeStory || paused || viewersOpen || storyMenuOpen) return;
    if (activeStory.media_type === 'video') return;
    const stepMs = 50;
    const durationMs = 5000;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + (stepMs / durationMs) * 100 >= 100) {
          clearInterval(timer);
          goNextStory();
          return 0;
        }
        return prev + (stepMs / durationMs) * 100;
      });
    }, stepMs);
    return () => clearInterval(timer);
  }, [activeStory?.id, paused, viewersOpen, storyMenuOpen]);

  // Sync video & audio playback inside Story Viewer
  useEffect(() => {
    const vid = storyVideoRef.current;
    const aud = storyAudioRef.current;
    if (!activeStory || paused || viewersOpen || storyMenuOpen) {
      if (vid) try { vid.pause(); } catch (_) {}
      if (aud) try { aud.pause(); } catch (_) {}
      return;
    }
    if (vid) {
      vid.muted = muted;
      vid.play().catch(() => {
        // Fallback if browser blocks unmuted autoplay on mobile
        vid.muted = true;
        setMuted(true);
        vid.play().catch(() => {});
      });
    }
    if (aud && activeStory.audio_url) {
      aud.muted = muted;
      aud.play().catch(() => {});
    }
  }, [activeStory?.id, paused, muted, viewersOpen, storyMenuOpen]);

  function resetStoryDraft() { if (draftPreview) { try { URL.revokeObjectURL(draftPreview); } catch (_) {} } setDraftFile(null); setDraftPreview(''); setDraftIsVideo(false); setDraftText(''); setDraftCaption(''); setDraftAudioFile(null); }

  function handlePickMedia(e) {
    const f = (e.target.files && e.target.files.item(0)) || null;
    e.target.value = '';
    if (!f) return;
    const isVid = f.type?.startsWith('video/');
    if (isVid && f.size > 4 * 1024 * 1024) {
      showToast('Video exceeds 4MB limit');
      return;
    }
    if (draftPreview) { try { URL.revokeObjectURL(draftPreview); } catch (_) {} }
    setDraftFile(f);
    setDraftIsVideo(Boolean(isVid));
    setDraftPreview(URL.createObjectURL(f));
    setCreateMode('media');
    setCreateOpen(true);
  }

  function handlePickAudio(e) {
    const f = (e.target.files && e.target.files.item(0)) || null;
    e.target.value = '';
    if (!f) return;
    setDraftAudioFile(f);
    showToast(`Added audio: ${f.name.slice(0, 22)}`);
  }

  async function handleShareStory() {
    if (sharing) return;
    if (createMode === 'text' && !draftText.trim()) { showToast('Write something first'); return; }
    if (createMode === 'media' && !draftFile) { showToast('Select a photo or video first'); return; }
    setSharing(true);
    try {
      let mediaUrl = '';
      let mediaType = 'image';
      let audioUrl = '';

      if (createMode === 'text') {
        mediaType = 'text';
        mediaUrl = JSON.stringify({ text: draftText.trim(), bg: TEXT_BG_OPTIONS[draftBgIdx] || TEXT_BG_OPTIONS });
      } else {
        mediaType = draftIsVideo ? 'video' : 'image';
        const readyFile = draftIsVideo ? draftFile : await compressStoryImage(draftFile);
        const ext = (readyFile.name.split('.').pop() || (draftIsVideo ? 'mp4' : 'jpg')).toLowerCase();
        const path = `story_${userProfile?.id || 'user'}_${Date.now()}.${ext}`;
        mediaUrl = await uploadStoryFile(path, readyFile, 14000);
        if (!mediaUrl || mediaUrl.startsWith('blob:')) {
          showToast('Upload failed. Check connection and try again.');
          setSharing(false);
          return;
        }
      }

      if (draftAudioFile) {
        const aExt = (draftAudioFile.name.split('.').pop() || 'mp3').toLowerCase();
        audioUrl = await uploadStoryFile(`story_audio_${userProfile?.id || 'user'}_${Date.now()}.${aExt}`, draftAudioFile, 30000);
      }

      const capClean = draftCaption.trim();
      const authorLabel = capClean ? `${capClean} [🎵 ${myName}]` : myName;
      const payload = {
        user_id: userProfile?.id || null,
        author_name: authorLabel,
        media_url: mediaUrl,
        media_type: mediaType,
        audio_url: audioUrl || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const { data: inserted } = await supabase.from('stories').insert(payload).select('*').single();
      const newStoryObj = {
        id: inserted?.id || `st-${Date.now()}`,
        user_id: userProfile?.id || null,
        author_name: myName,
        author_avatar: myAvatar,
        verified: Boolean(userProfile?.is_verified),
        media_url: mediaUrl,
        media_type: mediaType,
        audio_url: audioUrl,
        music_title: draftAudioFile ? draftAudioFile.name.replace(/\.[^.]+$/, '') : '',
        text_content: createMode === 'text' ? draftText.trim() : '',
        text_bg: TEXT_BG_OPTIONS[draftBgIdx] || TEXT_BG_OPTIONS,
        caption: capClean,
        created_at: inserted?.created_at || new Date().toISOString()
      };
      setStories((prev) => [...prev, newStoryObj]);
      if (onUploadStory) try { onUploadStory(newStoryObj); } catch (_) {}
      if (draftPreview) { try { URL.revokeObjectURL(draftPreview); } catch (_) {} }
      setDraftFile(null); setDraftPreview(''); setDraftText(''); setDraftCaption(''); setDraftAudioFile(null);
      setCreateOpen(false);
      showToast('Shared to your story');
    } catch (_) {
      showToast('Could not share story');
    }
    setSharing(false);
  }

  async function sendStoryReply(txt) {
    const clean = String(txt || '').trim();
    if (!clean || !activeStory) return;
    setFloatingEmoji(clean.length <= 4 ? clean : '❤️');
    setTimeout(() => setFloatingEmoji(null), 1200);
    setReplyText('');
    showToast(`Sent "${clean}" to ${activeStory.author_name}`);
    if (userProfile?.id && activeStory.user_id && String(userProfile.id) !== String(activeStory.user_id)) {
      try {
        await supabase.from('messages').insert({
          sender_id: userProfile.id,
          receiver_id: activeStory.user_id,
          content: `Replied to your story: ${clean}`
        });
      } catch (_) {}
    }
  }

  async function openViewersModal() {
    setViewersOpen(true);
    try {
      const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url, is_verified').limit(25);
      setViewersList((profs || []).filter((p) => String(p.id) !== String(userProfile?.id)).map((p) => ({
        id: p.id,
        name: p.full_name || 'Zuka Member',
        avatar: p.avatar_url || `https://ui-avatars.com{encodeURIComponent(p.full_name || 'Z')}&background=1877F2&color=fff`,
        verified: Boolean(p.is_verified)
      })));
    } catch (_) {}
  }

  async function handleDeleteActiveStory() {
    if (!activeStory) return;
    const delId = activeStory.id;
    setStoryMenuOpen(false);
    setStories((prev) => prev.filter((s) => String(s.id) !== String(delId)));
    goNextStory();
    try { await supabase.from('stories').delete().eq('id', delId); } catch (_) {}
    showToast('Story deleted');
  }

  return (
    <>
      <input ref={mediaInputRef} type="file" accept="image/*,video/*" onChange={handlePickMedia} style={{ display: 'none' }} />
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handlePickAudio} style={{ display: 'none' }} />

      {toastMsg && (
        <div style={{ position: 'fixed', top: '68px', left: '50%', transform: 'translateX(-50%)', zIndex: 13000, backgroundColor: 'rgba(24,25,26,0.94)', color: '#FFF', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}>
          {toastMsg}
        </div>
      )}

      <div style={{ backgroundColor: '#FFF', padding: '12px 10px', marginBottom: '8px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div onClick={() => { setCreateMode('media'); setCreateOpen(true); }} style={{ flexShrink: 0, width: '108px', height: '188px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E4E6EB', backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}>
          <div style={{ height: '126px', width: '100%', overflow: 'hidden', backgroundColor: '#F0F2F5' }}>
            <img src={myAvatar} alt={myName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', top: '108px', left: '50%', transform: 'translateX(-50%)', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1877F2', border: '3px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
            <Plus size={20} strokeWidth={3} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px', fontSize: '12.5px', fontWeight: 700, color: '#050505', textAlign: 'center', lineHeight: 1.2 }}>
            Create story
          </div>
        </div>

        {!loading && groupedStories.map((grp, gIdx) => {
          const latest = grp.items[grp.items.length - 1];
          const allSeen = grp.items.every((it) => seenIds.includes(String(it.id)));
          return (
            <div
              key={grp.key}
              onClick={() => { setActiveGroupIdx(gIdx); setActiveItemIdx(0); setProgress(0); setPaused(false); }}
              style={{ flexShrink: 0, width: '108px', height: '188px', borderRadius: '12px', overflow: 'hidden', position: 'relative', backgroundColor: '#1C1E21', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}
            >
              {latest.media_type === 'text' ? (
                <div style={{ width: '100%', height: '100%', background: latest.text_bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', color: '#FFF', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>
                  {latest.text_content.slice(0, 60)}
                </div>
              ) : latest.media_type === 'video' ? (
                <video src={latest.media_url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={latest.media_url} alt={grp.author_name} onError={(e) => { e.currentTarget.src = grp.author_avatar; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}

              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.28), transparent 35%, rgba(0,0,0,0.68))' }} />

              <div style={{ position: 'absolute', top: '8px', left: '8px', width: '38px', height: '38px', borderRadius: '50%', padding: '2px', backgroundColor: allSeen ? '#BCC0C4' : '#1877F2' }}>
                <img src={grp.author_avatar} alt={grp.author_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FFF' }} />
              </div>

              {grp.items.length > 1 && (
                <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                  {grp.items.length}
                </span>
              )}

              <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', color: '#FFF', fontSize: '12px', fontWeight: 700, lineHeight: 1.2, textShadow: '0 1px 2px rgba(0,0,0,0.85)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {String(grp.user_id) === String(userProfile?.id) ? 'Your story' : grp.author_name}
              </div>
            </div>
          );
        })}
      </div>

      {activeStory && activeGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000, backgroundColor: '#000', display: 'flex', flexDirection: 'column', height: '100dvh' }}>
          <div style={{ position: 'relative', zIndex: 30, display: 'flex', gap: '4px', padding: '10px 10px 6px' }}>
            {activeGroup.items.map((it, idx) => (
              <div key={it.id} style={{ flex: 1, height: '2.5px', backgroundColor: 'rgba(255,255,255,0.32)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: '#FFF', width: idx < activeItemIdx ? '100%' : idx === activeItemIdx ? `${progress}%` : '0%' }} />
              </div>
            ))}
          </div>

          <div style={{ position: 'relative', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={activeGroup.author_avatar} alt={activeGroup.author_name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FFF' }} />
              <div>
                <div style={{ color: '#FFF', fontWeight: 700, fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {activeGroup.author_name}
                  {activeGroup.verified && <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Check size={9} strokeWidth={3} /></span>}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{formatStoryAge(activeStory.created_at)}</span>
                  {activeStory.music_title && <span>· 🎵 {activeStory.music_title}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeStory.audio_url || activeStory.media_type === 'video' ? (
                <button type="button" onClick={() => setMuted((m) => !m)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              ) : null}
              <button type="button" onClick={() => setStoryMenuOpen(true)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFF', fontSize: '18px', fontWeight: 700, cursor: 'pointer' }}>⋮</button>
              <button type="button" onClick={() => { setActiveGroupIdx(null); setActiveItemIdx(0); }} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
            </div>
          </div>

          {activeStory.audio_url && <audio ref={storyAudioRef} src={activeStory.audio_url} loop />}

          <div
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            {activeStory.media_type === 'text' ? (
              <div style={{ width: '100%', height: '100%', background: activeStory.text_bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px', color: '#FFF', fontSize: '24px', fontWeight: 800, textAlign: 'center', lineHeight: 1.35 }}>
                {activeStory.text_content}
              </div>
            ) : activeStory.media_type === 'video' ? (
              <video
                ref={storyVideoRef}
                src={activeStory.media_url}
                poster={activeGroup.author_avatar}
                playsInline
                onTimeUpdate={(e) => { if (e.currentTarget.duration > 0) setProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100); }}
                onEnded={goNextStory}
                onError={goNextStory}
                style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
              />
            ) : (
              <img
                src={activeStory.media_url}
                alt={activeGroup.author_name}
                onError={goNextStory}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}

            <button type="button" onClick={(e) => { e.stopPropagation(); goPrevStory(); }} style={{ position: 'absolute', left: '10px', zIndex: 25, width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.35)', backgroundColor: 'rgba(0,0,0,0.42)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ChevronLeft size={22} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); goNextStory(); }} style={{ position: 'absolute', right: '10px', zIndex: 25, width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.35)', backgroundColor: 'rgba(0,0,0,0.42)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ChevronRight size={22} />
            </button>

            {floatingEmoji && <div style={{ position: 'absolute', zIndex: 40, fontSize: '72px', pointerEvents: 'none' }}>{floatingEmoji}</div>}
          </div>

          <div style={{ position: 'relative', zIndex: 30, padding: '10px 12px 18px', background: 'linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.5) 75%, transparent)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeStory.caption && (
              <p style={{ color: '#FFF', fontSize: '14.5px', lineHeight: 1.35, margin: 0 }}>{activeStory.caption}</p>
            )}

            {userProfile?.id && String(activeStory.user_id) === String(userProfile.id) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button type="button" onClick={openViewersModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#FFF', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  <Eye size={18} /> Viewers
                </button>
                <button type="button" onClick={handleDeleteActiveStory} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {['Well done', 'Nice shot! 📷', '🔥'].map((pill) => (
                    <button key={pill} type="button" onClick={() => sendStoryReply(pill)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: 'rgba(38,38,38,0.88)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      {pill}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(activeStory.media_url || window.location.href).catch(() => {}); showToast('Story link copied'); }} style={{ flexShrink: 0, width: '38px', height: '38px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Send size={16} />
                  </button>
                  <form onSubmit={(e) => { e.preventDefault(); sendStoryReply(replyText); }} style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.45)', borderRadius: '22px', padding: '0 12px', height: '40px' }}>
                    <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Send message..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: '14px' }} />
                    {replyText.trim() && <button type="submit" style={{ background: 'none', border: 'none', color: '#4599FF', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Send</button>}
                  </form>
                  <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                    {['❤️', '👍', '😂'].map((em) => (
                      <button key={em} type="button" onClick={() => sendStoryReply(em)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', backgroundColor: em === '❤️' ? '#F33E58' : em === '👍' ? '#1877F2' : '#F7B928', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {storyMenuOpen && activeStory && (
        <div onClick={() => setStoryMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 12000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Story Options</span>
              <button type="button" onClick={() => setStoryMenuOpen(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
            </div>
            <button type="button" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(activeStory.media_url || window.location.href).catch(() => {}); setStoryMenuOpen(false); showToast('Link copied'); }} style={{ padding: '10px 0', background: 'none', border: 'none', textAlign: 'left', fontSize: '15px', fontWeight: 600 }}>Copy link to story</button>
            {userProfile?.id && String(activeStory.user_id) === String(userProfile.id) && (
              <button type="button" onClick={handleDeleteActiveStory} style={{ padding: '10px 0', background: 'none', border: 'none', textAlign: 'left', fontSize: '15px', fontWeight: 700, color: '#E41E3F' }}>Delete story</button>
            )}
          </div>
        </div>
      )}

      {viewersOpen && (
        <div onClick={() => setViewersOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 12000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '60dvh', backgroundColor: '#FFF', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '10px', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Story Viewers ({viewersList.length})</span>
              <button type="button" onClick={() => setViewersOpen(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
            </div>
            {viewersList.map((v) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                <img src={v.avatar} alt={v.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{v.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000, backgroundColor: '#000', display: 'flex', flexDirection: 'column', height: '100dvh', overflowY: 'auto' }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
            <button type="button" onClick={() => { if (!sharing) { resetStoryDraft(); setCreateOpen(false); } }} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
            <span style={{ color: '#FFF', fontWeight: 700, fontSize: '16px' }}>Create Story</span>
            <button type="button" onClick={handleShareStory} disabled={sharing} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              {sharing ? 'Sharing...' : 'Share'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', justifyContent: 'center', flexShrink: 0 }}>
            <button type="button" onClick={() => setCreateMode('media')} style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: createMode === 'media' ? '#1877F2' : 'rgba(255,255,255,0.16)', color: '#FFF', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <ImageIcon size={16} /> Photo / Video
            </button>
            <button type="button" onClick={() => setCreateMode('text')} style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: createMode === 'text' ? '#1877F2' : 'rgba(255,255,255,0.16)', color: '#FFF', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Type size={16} /> Aa Text
            </button>
            <button type="button" onClick={() => audioInputRef.current?.click()} style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: draftAudioFile ? '#31A24C' : 'rgba(255,255,255,0.16)', color: '#FFF', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Music size={16} /> {draftAudioFile ? 'Music Added' : 'Music'}
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, maxHeight: '58dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', overflow: 'hidden' }}>
            {createMode === 'text' ? (
              <div style={{ width: '100%', height: '100%', borderRadius: '16px', background: TEXT_BG_OPTIONS[draftBgIdx], display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="Start typing..." rows={4} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: '22px', fontWeight: 800, textAlign: 'center', resize: 'none' }} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {TEXT_BG_OPTIONS.map((bg, i) => (
                    <button key={i} type="button" onClick={() => setDraftBgIdx(i)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: bg, border: draftBgIdx === i ? '2.5px solid #FFF' : '1px solid rgba(255,255,255,0.4)', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            ) : draftPreview ? (<div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%', maxHeight: '54dvh' }}><button type="button" onClick={resetStoryDraft} title="Remove media" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid #FFF', backgroundColor: 'rgba(0,0,0,0.72)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>{
              draftIsVideo ? (
                <video src={draftPreview} autoPlay loop playsInline style={{ maxWidth: '100%', maxHeight: '54dvh', borderRadius: '12px' }} />
              ) : (
                <img src={draftPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '54dvh', objectFit: 'contain', borderRadius: '12px' }} />
              )}</div>
            ) : (
              <button type="button" onClick={() => mediaInputRef.current?.click()} style={{ padding: '18px 26px', borderRadius: '14px', border: '1.5px dashed rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
                + Select Photo or Video (Max 4MB)
              </button>
            )}
          </div>

          {createMode === 'media' && (
            <div style={{ padding: '10px 16px 20px', flexShrink: 0 }}>
              <input type="text" value={draftCaption} onChange={(e) => setDraftCaption(e.target.value)} placeholder="Add a caption to your story..." style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', fontSize: '14px', outline: 'none' }} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
