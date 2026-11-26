import ZukaBadge from './ZukaBadge';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const FB_BLUE = '#1877F2';
const BG_GRADIENTS = [
  'linear-gradient(135deg,#1877F2,#0A499E)',
  'linear-gradient(135deg,#F50057,#FF6D00)',
  'linear-gradient(135deg,#00B09B,#96C93D)',
  'linear-gradient(135deg,#6A11CB,#2575FC)',
  'linear-gradient(135deg,#141E30,#243B55)'
];
const FONT_STYLES = [
  'system-ui,sans-serif',
  'Georgia,serif',
  'monospace',
  'cursive'
];
const COLOR_FILTERS = [
  'none',
  'sepia(0.28) saturate(1.35)',
  'hue-rotate(15deg) saturate(1.2)',
  'saturate(1.6) contrast(1.1)',
  'grayscale(1)'
];
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
function formatAge(iso) {
  if (!iso) return 'Just now';
  const m = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Just now';
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h`;
}
async function uploadFile(path, file, ms = 45000) {
  const buckets = ['stories', 'post-media', 'avatars', 'reels'];
  for (const b of buckets) {
    const res = await Promise.race([
      (async () => {
        const { error } = await supabase.storage.from(b).upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: true
        });
        if (error) return '';
        return supabase.storage.from(b).getPublicUrl(path)?.data?.publicUrl || '';
      })(),
      new Promise((r) => setTimeout(() => r(''), ms))
    ]);
    if (res) return res;
  }
  return '';
}
const BG_PRESETS = [
  { id: "fb-blue", bg: "linear-gradient(135deg, #1877F2 0%, #0D47A1 100%)", color: "#ffffff" },
  { id: "sunset", bg: "linear-gradient(135deg, #FF512F 0%, #DD2476 100%)", color: "#ffffff" },
  { id: "emerald", bg: "linear-gradient(135deg, #11998E 0%, #38EF7D 100%)", color: "#ffffff" },
  { id: "royal", bg: "linear-gradient(135deg, #654EA3 0%, #EAAFC8 100%)", color: "#ffffff" },
  { id: "midnight", bg: "linear-gradient(135deg, #141E30 0%, #243B55 100%)", color: "#ffffff" }
];

export default function Stories({
  userProfile, stories: propStories, onUploadStory, onDeleteStory
}) {
  const [stories, setStories] = useState([]);
  const [viewedIds, setViewedIds] = useState(() => new Set());
  const [mutedUsers, setMutedUsers] = useState(() => new Set());
  const [activeGroupIdx, setActiveGroupIdx] = useState(null);
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState('media');
  const [draftFile, setDraftFile] = useState(null);
  const [draftPreview, setDraftPreview] = useState('');
  const [draftIsVideo, setDraftIsVideo] = useState(false);
  const [draftAudioFile, setDraftAudioFile] = useState(null);
  const [draftAudioUrl, setDraftAudioUrl] = useState('');
  const [draftText, setDraftText] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [bgIdx, setBgIdx] = useState(0);
  const [fontIdx, setFontIdx] = useState(0);
  const [filterIdx, setFilterIdx] = useState(0);
  const [stickers, setStickers] = useState([]);
  const [drawMode, setDrawMode] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [floatingEmoji, setFloatingEmoji] = useState('');
  const [viewersOpen, setViewersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewsMap, setViewsMap] = useState({});
  const [highlights, setHighlights] = useState([]);
  const mediaRef = useRef(null);
  const audioRef = useRef(null);
  const storyAudioRef = useRef(null);
  const myName = userProfile?.full_name || userProfile?.username || 'User';
  const myAvatar = userProfile?.avatar_url ||
    `https://ui-avatars.com{encodeURIComponent(myName)}&background=1877F2&color=fff`;
  useEffect(() => {
    let alive = true;
    (async () => {
      const pm = {};
      const { data: ps } = await supabase
        .from('profiles')
        .select('id,full_name,username,avatar_url,is_verified');
      (ps || []).forEach((p) => { pm[String(p.id).trim()] = p; });
      const cutoff = new Date(Date.now() - 86400000).toISOString(); await supabase.from("stories").delete().lt("created_at", cutoff);
      const { data } = await supabase.from('stories').select('*')
        .gte('created_at', cutoff).order('created_at', { ascending: true });
      if (!alive) return;
      const rows = (data || []).filter((r) =>
        r.media_type === 'text' || String(r.media_url || '').trim()
      );
      setStories(rows.map((r) => {
        const pf = pm[String(r.user_id || '').trim()] || {};
        const raw = String(r.author_name || '');
        const mm = raw.match(/\[🎵\s*([^\]]+)\]/);
        let meta = {};
        if (r.media_type === 'text') {
          try { meta = JSON.parse(r.media_url || '{}'); } catch (_) {}
        }
        return {
          ...r,
          author_name: pf.full_name || pf.username || raw.replace(/\s*\[🎵[^\]]+\]/g, '') || myName,
          author_avatar: pf.avatar_url || myAvatar,
          verified: Boolean(pf.is_verified),
          music_title: mm ? mm[1] : '',
          meta
        };
      }));
    })();
    return () => { alive = false; };
  }, [userProfile?.id]);
  const groupedStories = useMemo(() => {
    const map = new Map();
    const myId = String(userProfile?.id || '');
    stories.forEach((s) => {
      const k = String(s.author_name || s.user_id || 'u').replace(/\s+/g, '').toLowerCase();
      if (mutedUsers.has(k)) return;
      if (!map.has(k)) {
        map.set(k, {
          key: k, user_id: s.user_id,
          author_name: s.author_name,
          author_avatar: s.author_avatar,
          verified: s.verified, items: []
        });
      }
      map.get(k).items.push(s);
    });
    const arr = Array.from(map.values());
    arr.sort((a, b) =>
      String(a.user_id) === myId ? -1 :
      String(b.user_id) === myId ? 1 : 0
    );
    return arr;
  }, [stories, mutedUsers, userProfile?.id]);
  const activeGroup = activeGroupIdx !== null
    ? groupedStories[activeGroupIdx] || null : null;
  const activeStory = activeGroup
    ? activeGroup.items[activeItemIdx] || null : null;

  const goNext = () => {
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
  };
  const goPrev = () => {
    if (!activeGroup) return;
    if (activeItemIdx > 0) {
      setActiveItemIdx((i) => i - 1);
      setProgress(0);
    } else if (activeGroupIdx > 0) {
      const pg = groupedStories[activeGroupIdx - 1];
      setActiveGroupIdx((g) => g - 1);
      setActiveItemIdx(Math.max(0, pg.items.length - 1));
      setProgress(0);
    } else {
      setProgress(0);
    }
  };
  useEffect(() => {
    if (!activeStory) return;
    setViewedIds((p) => new Set(p).add(activeStory.id));
    setViewsMap((p) => {
      const arr = p[activeStory.id] || [];
      if (arr.some((x) => x.name === myName)) return p;
      return {
        ...p,
        [activeStory.id]: [...arr, { name: myName, avatar: myAvatar, reaction: '' }]
      };
    });
  }, [activeStory?.id]);

  useEffect(() => {
    if (!activeStory || paused || viewersOpen || menuOpen) return;
    if (activeStory?.media_type === 'video' || activeStory?.audio_url) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p + 1 >= 100) { goNext(); return 100; }
        return p + 1;
      });
    }, 50);
    return () => clearInterval(t);
  }, [activeStory?.id, paused, viewersOpen, menuOpen]);
  useEffect(() => {
    const a = storyAudioRef.current;
    if (!a) return;
    a.muted = muted;
    if (paused || viewersOpen || menuOpen) a.pause();
    else a.play().catch(() => {});
  }, [activeStory?.id, paused, muted, viewersOpen, menuOpen]);

  useEffect(() => {
    if (!draftAudioFile) { setDraftAudioUrl(''); return; }
    const u = URL.createObjectURL(draftAudioFile);
    setDraftAudioUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [draftAudioFile]);
  const resetDraft = () => {
    if (draftPreview) try { URL.revokeObjectURL(draftPreview); } catch (_) {}
    setDraftFile(null); setDraftPreview(''); setDraftIsVideo(false);
    setDraftText(''); setDraftCaption(''); setDraftAudioFile(null);
    setDraftAudioUrl(''); setStickers([]); setFilterIdx(0);
  };

  const pickMedia = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (draftPreview) try { URL.revokeObjectURL(draftPreview); } catch (_) {}
    setDraftFile(f);
    setDraftIsVideo(f.type.startsWith('video/'));
    const r=new FileReader();r.onload=()=>setDraftPreview(String(r.result||""));r.readAsDataURL(f);
    setCreateMode('media'); setCreateOpen(true);
    e.target.value = '';
  };

  const pickAudio = (e) => {
    const f = e.target.files?.[0];
    if (f) { setDraftAudioFile(f); const nm = f.name.replace(/\.[^.]+$/, ""); addSticker("music", "🎵 " + nm); const r = new FileReader(); r.onload = () => { const a = new Audio(String(r.result || "")); a.loop = true; a.play().catch(() => {}); window.__zukaDraftAudio = a; }; r.readAsDataURL(f); }
    e.target.value = '';
  };
  const addSticker = (type, label) => {
    if (!label) return;
    setStickers((p) => [...p, { id: Date.now() + Math.random(), type, label, x: 50, y: 42 }]);
  };
  const removeSticker = (id) => setStickers((p) => p.filter((x) => x.id !== id));

  const shareStory = async () => {
    if (sharing) return;
    if (createMode === 'media' && !draftFile && !draftText.trim()) return;
    if (createMode === 'text' && !draftText.trim()) return;
    setSharing(true);
    try {
      let mediaUrl = null;
      let mediaType = createMode === 'text' ? 'text' : 'image';
      if (draftFile && createMode === 'media') {
        const ext = (draftFile.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${user.id}/story_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('stories')
          .upload(path, draftFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('stories').getPublicUrl(path);
        mediaUrl = pub?.publicUrl || null;
        mediaType = draftFile.type?.startsWith('video') ? 'video' : 'image';
      }
      const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const payload = {
        user_id: user.id,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: draftText.trim() || null,
        bg_gradient: createMode === 'text' ? BG_PRESETS[bgIdx].bg : null,
        text_color: BG_PRESETS[bgIdx].color,
        font_family: FONT_STYLES[fontIdx].family,
        music_title: selectedTrack ? selectedTrack.title : null,
        music_artist: selectedTrack ? selectedTrack.artist : null,
        music_url: selectedTrack ? selectedTrack.url : null,
        stickers,
        privacy,
        expires_at: exp
      };
      const { error: insErr } = await supabase.from('stories').insert(payload);
      if (insErr) throw insErr;
      if (draftPreview) URL.revokeObjectURL(draftPreview);
      setCreateOpen(false);
      setDraftFile(null);
      setDraftPreview('');
      setDraftText('');
      setStickers([]);
      setSelectedTrack(null);
      await loadStories();
    } catch (e) {
      alert(e?.message || 'Failed to share story');
    } finally {
      setSharing(false);
    }
  };
  const deleteStory = async (storyId) => {
    if (!storyId || !user) return;
    await supabase.from('stories').delete().eq('id', storyId).eq('user_id', user.id);
    setViewOpen(false);
    await loadStories();
  };

  const openViewer = (gIdx, sIdx = 0) => {
    setActiveGroupIdx(gIdx);
    setActiveItemIdx(sIdx);
    setProgress(0);
    setPaused(false);
    setReplyText('');
    setViewOpen(true);
  };
  const nextStory = () => {
    const grp = groups[activeGroupIdx];
    if (!grp) return setViewOpen(false);
    if (activeStoryIdx < grp.items.length - 1) {
      setActiveStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (activeGroupIdx < groups.length - 1) {
      setActiveGroupIdx((g) => g + 1);
      setActiveStoryIdx(0);
      setProgress(0);
    } else {
      setViewOpen(false);
    }
  };
  const prevStory = () => {
    if (activeStoryIdx > 0) {
      setActiveStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (activeGroupIdx > 0) {
      const prevGrp = groups[activeGroupIdx - 1];
      const lastIdx = (prevGrp?.items?.length || 1) - 1;
      setActiveGroupIdx((g) => g - 1);
      setActiveStoryIdx(Math.max(0, lastIdx));
      setProgress(0);
    } else {
      setProgress(0);
    }
  };
  const sendReply = async (customText) => {
    const grp = groups[activeGroupIdx];
    const st = grp?.items?.[activeStoryIdx];
    const body = (customText ?? replyText).trim();
    if (!st || !user || !body || sendingReply) return;
    setSendingReply(true);
    try {
      await supabase.from('story_replies').insert({
        story_id: st.id,
        sender_id: user.id,
        receiver_id: st.user_id,
        message: body
      });
      if (customText === undefined) setReplyText('');
    } finally {
      setSendingReply(false);
    }
  };
  const openInsights = async (storyId) => {
    if (!storyId) return;
    setInsightsOpen(true);
    setPaused(true);
    const { data: vData } = await supabase
      .from('story_views')
      .select('viewer_id, created_at, profiles(full_name, avatar_url)')
      .eq('story_id', storyId);
    const { data: rData } = await supabase
      .from('story_replies')
      .select('id, message, created_at, profiles:sender_id(full_name, avatar_url)')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });
    setViewersList(vData || []);
    setRepliesList(rData || []);
  };
  const closeInsights = () => {
    setInsightsOpen(false);
    setPaused(false);
  };

  
  const { Plus, Music, Play, Pause, VolumeX, Volume2, Trash2, X, Eye, Send, Image: ImageIcon } = Icons;
  const user = userProfile;
  const profile = userProfile;
  const groups = groupedStories;
  const activeStoryIdx = activeItemIdx;
  const setActiveStoryIdx = setActiveItemIdx;
  const [viewOpen, setViewOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [repliesList, setRepliesList] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [privacy, setPrivacy] = useState("public");
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const timeAgo = formatAge;
  const openCreator = () => { resetDraft(); setCreateOpen(true); };
  const handleFileChange = pickMedia;
  const loadStories = async () => {};

  const isOwnStory = Boolean(user && activeGroup && activeGroup.user_id === user.id);

  return (
    <div className="w-full bg-white border-b border-gray-200 py-3 px-2 select-none">
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
        {user && (
          <button
            type="button"
            onClick={openCreator}
            className="relative flex-shrink-0 w-[112px] h-[200px] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm flex flex-col text-left group"
          >
            <div className="relative w-full h-[146px] bg-gray-100 overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile?.full_name || 'User'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-2xl font-bold">
                  {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="relative flex-1 w-full bg-white flex flex-col items-center justify-end pb-2.5 px-1">
              <div className="absolute -top-5 w-9 h-9 rounded-full bg-[#1877F2] border-4 border-white flex items-center justify-center text-white shadow">
                <Plus className="w-5 h-5 stroke-[2.75]" />
              </div>
              <span className="text-[12px] font-semibold text-gray-900 leading-tight text-center">
                Create story
            </span>
          </div>
        </button>
      )}
        

        {groups.map((grp, gIdx) => {
          const latest = grp.items[grp.items.length - 1];
          const hasUnseen = grp.items.some((it) => !viewedIds.has(it.id));
          return (
            <button
              key={grp.user_id}
              type="button"
              onClick={() => openViewer(gIdx, 0)}
              className="relative flex-shrink-0 w-[112px] h-[200px] rounded-xl overflow-hidden bg-gray-900 shadow-sm group text-left"
            >
              {latest.media_type === 'video' && latest.media_url ? (
                <video
                  src={latest.media_url}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : latest.media_url ? (
                <img
                  src={latest.media_url}
                  alt={grp.author_name || 'Story'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
                <div
                  style={{ background: latest.bg_gradient || '#1877F2', color: latest.text_color || '#fff' }}
                  className="w-full h-full p-2.5 flex items-center justify-center text-center text-[11px] font-bold leading-snug"
                >
                  <span className="line-clamp-5">{latest.caption || ''}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65 pointer-events-none" />
              <div
                className={`absolute top-2.5 left-2.5 w-9 h-9 rounded-full p-[2px] ${
                  hasUnseen ? 'bg-[#1877F2]' : 'bg-gray-300'
                }`}
              >
                {grp.items.length > 1 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1877F2] text-white text-[10px] font-bold flex items-center justify-center border border-white">{grp.items.length}</span>}{grp.author_avatar ? (
                  <img
                    src={grp.author_avatar}
                    alt={grp.author_name || 'User'}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
                  <div className="w-full h-full rounded-full bg-gray-700 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    {(grp.author_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute bottom-2 left-2 right-2 text-white text-[12px] font-semibold leading-tight line-clamp-2 drop-shadow">
                {grp.user_id === user?.id ? 'Your story' : grp.author_name || 'User'}
              </span>
            </button>
          );
        })}
      </div>
      {viewOpen && activeStory && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#6e5d56] via-[#1c1917] to-[#5e5244] flex flex-col justify-between select-none">
          <div className="relative z-20 pt-3 px-3 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex gap-1 mb-2.5">
              {activeGroup.items.map((item, idx) => {
                const w = idx < activeStoryIdx ? 100 : idx === activeStoryIdx ? progress : 0;
                return (
                  <div key={item.id} className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-75" style={{ width: `${w}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {activeGroup.author_avatar ? (
                  <img
                    src={activeGroup.author_avatar}
                    alt={activeGroup.author_name || 'User'}
                    className="w-9 h-9 rounded-full object-cover border border-white/40"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm">
                    {(activeGroup.author_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-sm truncate">
                      {activeGroup.author_name || 'User'}
                    </span>
                    <span className="text-xs text-white/75 flex-shrink-0">
                      {timeAgo(activeStory.created_at)}
                    </span>
                  </div>
                  {activeStory.music_title && (
                    <div className="flex items-center gap-1 text-[11px] text-white/85 truncate">
                      <Music className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {activeStory.music_title}
                        {activeStory.music_artist ? ` · ${activeStory.music_artist}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
                >
                  {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                {isOwnStory && (
                  <button
                    type="button"
                    onClick={() => deleteStory(activeStory.id)}
                    className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewOpen(false)}
                  className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
          <div
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            className="fixed inset-0 z-10 flex items-center justify-center overflow-hidden"
          >
            {activeStory.audio_url && <audio ref={audioRef} src={activeStory.audio_url} autoPlay loop muted={muted} />}<button type="button" onClick={(e) => { e.stopPropagation(); prevStory(); }} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/35 border border-white/50 text-white text-3xl flex items-center justify-center">‹</button><button type="button" onClick={(e) => { e.stopPropagation(); nextStory(); }} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/35 border border-white/50 text-white text-3xl flex items-center justify-center">›</button>{activeStory.media_type === 'video' && activeStory.media_url ? (
              <video
                ref={videoRef}
                src={activeStory.media_url}
                autoPlay
                playsInline
                muted={muted}
                onEnded={nextStory}
                className="max-h-full max-w-full object-contain"
              />
            ) : activeStory.media_url ? (
              <img
                src={activeStory.media_url}
                alt="Story"
                className="max-h-full max-w-full object-contain"
              />
            <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
              <div
                style={{
                  background: activeStory.bg_gradient || '#1877F2',
                  color: activeStory.text_color || '#fff',
                  fontFamily: activeStory.font_family || 'inherit'
                }}
                className="w-full h-full flex items-center justify-center p-8 text-center text-2xl font-bold"
              >
                {activeStory.caption || ''}
              </div>
            )}
            {Array.isArray(activeStory.stickers) &&
              activeStory.stickers.map((st) => (
                <div
                  key={st.id}
                  style={{ left: `${st.x}%`, top: `${st.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-white/95 text-gray-900 font-bold text-sm shadow-lg pointer-events-none"
                >
                  {st.label}
                </div>
              ))}

            {activeStory.media_url && activeStory.caption && (
              <div className="absolute bottom-4 inset-x-4 text-center text-white text-sm bg-black/55 backdrop-blur-sm px-3.5 py-2 rounded-xl">
                {activeStory.caption}
              </div>
            )}

            <button
              type="button"
              aria-label="Previous"
              onClick={prevStory}
              className="absolute inset-y-0 left-0 w-1/3 z-10"
            />
            <button
              type="button"
              aria-label="Next"
              onClick={nextStory}
              className="absolute inset-y-0 right-0 w-2/3 z-10"
            />
          </div>
          <div className="relative z-20 p-3 bg-gradient-to-t from-black/85 to-transparent">
            {isOwnStory ? (<div className="flex items-end justify-between w-full px-1">
              <button
                type="button"
                onClick={() => openInsights(activeStory.id)} className="flex flex-col items-start text-white"
                className="flex items-center gap-2 text-white text-sm font-medium flex-col items-start py-1"
              >
                <span className="text-lg font-bold leading-none">^</span>
                <span>{(activeStory.views_count || 0) > 0 ? `${activeStory.views_count} viewers` : "No viewers yet"}</span>
              </button>
            <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
              <div className="flex items-center gap-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendReply();
                  }}
                  className="flex-1 flex items-center bg-black/25 border border-white/60 rounded-full px-4 py-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Send message..."
                    className="flex-1 bg-transparent text-white placeholder-white/70 text-sm focus:outline-none"
                  />
                  {replyText.trim() && (
                    <button
                      type="submit"
                      disabled={sendingReply}
                      className="text-white pl-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </form>
                <div className="flex items-center gap-1">
                  {['❤️', '👍', '😂', '😮'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => sendReply(emoji)}
                      className="w-9 h-9 rounded-full bg-black/35 border border-white/35 hover:bg-black/55 flex items-center justify-center text-lg active:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {insightsOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[75vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="font-bold text-gray-900 text-base">
                Story details ({viewersList.length} views)
              </span>
              <button
                type="button"
                onClick={closeInsights}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Viewers ({viewersList.length})
                </h4>
                {viewersList.length === 0 ? (
                  <p className="text-sm text-gray-500">No viewers yet.</p>
                <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
                  <div className="space-y-2.5">
                    {viewersList.map((v) => (
                      <div key={v.viewer_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {v.profiles?.avatar_url ? (
                            <img
                              src={v.profiles.avatar_url}
                              alt={v.profiles?.full_name || 'Viewer'}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
                              {(v.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {v.profiles?.full_name || 'User'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{timeAgo(v.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Replies ({repliesList.length})
                </h4>
                {repliesList.length === 0 ? (
                  <p className="text-sm text-gray-500">No replies yet.</p>
                <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
                  <div className="space-y-2.5">
                    {repliesList.map((r) => (
                      <div key={r.id} className="flex items-start gap-2.5 bg-gray-50 p-2.5 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-gray-900 truncate">
                              {r.profiles?.full_name || 'User'}
                            </span>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              {timeAgo(r.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 mt-0.5 break-words">{r.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
{createOpen && (
  <div className="fixed inset-0 z-50 bg-[#18191A] text-white flex flex-col">
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <button type="button" onClick={() => setCreateOpen(false)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><X className="w-5 h-5" /></button>
      <span className="text,[17px] font-bold">Create story</span>
      <button type="button" onClick={handleCreateStory} disabled={creating} className="px-4 py-1.5 rounded-lg bg-[#1877F2] disabled:opacity-50 text-sm font-semibold">{creating ? 'Sharing...' : 'Share'}</button>
    </div>
    <div className="grid grid-cols-3 gap-2 px-4 pt-3 pb-2">
      <button type="button" onClick={() => { setCreateMode('media'); if (!draftPreview) fileInputRef.current?.click(); }} className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold ${createMode === 'media' ? 'bg-[ #1877F2]/20 border-[ #1877F2]' : 'bg-[ #242526] border-white/10 text-white/80'}`}>
        <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center"><ImageIcon className="w-4 h-4 text-white" /></div>
        <span>Photo / Video</span>
      </button>
      <button type="button" onClick={() => setCreateMode('text')} className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold ${createMode === 'text' ? 'bg-purple-500/20 border-purple-400' : 'bg-[#242526] border-white/10 text-white/80'}`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-sm font-bold">Aa</div>
        <span>Text</span>
      </button>
      <label className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border bg-[ #242526] border-white/10 text-white/80 text-xs font-semibold cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center"><Music className="w-4 h-4 text-white" /></div>
        <span>Music</span>
        <input type="file" accept="audio/*" onChange={pickAudio} className="hidden" />
      </label>
    </div>
    <div className="grid grid-cols-3 gap-2 px-4 pt-3 pb-2">
      <button type="button" onClick={() => { setCreateMode('media'); if (!draftPreview) fileInputRef.current?.click(); }} className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold ${createMode === 'media' ? 'bg-[ #1877F2]/20 border-[ #1877F2]' : 'bg-[ #242526] border-white/10 text-white/80'}`}>
        <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center"><ImageIcon className="w-4 h-4 text-white" /></div>
        <span>Photo / Video</span>
      </button>
      <button type="button" onClick={() => setCreateMode('text')} className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold ${createMode === 'text' ? 'bg-purple-500/20 border-purple-400' : 'bg-[ #242526] border-white/10 text-white/80'}`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-sm font-bold">Aa</div>
        <span>Text</span>
      </button>
      <label className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border bg-[ #242526] border-white/10 text-white/80 text-xs font-semibold cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center"><Music className="w-4 h-4 text-white" /></div>
        <span>Music</span>
        <input type="file" accept="audio/*" onChange={pickAudio} className="hidden" />
      </label>
    </div>
    <div className="flex-1 flex items-center justify-center px-4 py-2 overflow-hidden">
      <div className="relative w-full max-w-[340px] aspect-[9/16] max-h-full rounded-2xl overflow-hidden bg-[ #242526] border border-white/10 shadow-2xl flex items-center justify-center">
        {createMode === 'media' ? (
          draftPreview ? (
            draftFile?.type?.startsWith('video') ? (
              <video src={draftPreview} controls playsInline className="max-h-full max-w-full object-contain" />
            <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
              <img src={draftPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
            )
          <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[ #1877F2]/20 flex items-center justify-center"><ImageIcon className="w-7 h-7 text-[#1877F2]" /></div>
              <span className="text-sm font-semibold">Select photo or video</span>
            </button>
          )
        <button type="button" onClick={() => { setViewOpen(false); setCreateOpen(true); }} className="flex flex-col items-center gap-1 text-white"><span className="w-9 h-9 rounded-full border-2 border-dashed border-white flex items-center justify-center text-xl font-bold leading-none">+</span><span className="text-xs font-semibold">Add story</span></button></div>) : (
          <div style={{ background: BG_PRESETS[bgIdx].bg, color: BG_PRESETS[bgIdx].color, fontFamily: FONT_STYLES[fontIdx].family }} className="w-full h-full p-6 flex items-center justify-center">
            <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="Start typing..." rows={5} className="w-full bg-transparent text-center text-2xl font-bold placeholder-white/60 focus:outline-none resize-none" />
          </div>
        )}
        {selectedMusic && (
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 bg-black/70 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 text-white shadow-lg">
            <div className="flex items-center gap-2 min-w-0"><Music className="w-4 h-4 text-[#1877F2] shrink-0" /><div className="truncate text-xs"><div className="font-semibold truncate">{selectedMusic.title}</div><div className="text-white/70 truncate">{selectedMusic.artist}</div></div></div>
            <button type="button" onClick={() => setSelectedMusic(null)} className="p-1 rounded-full hover:bg-white/15 text-white/80"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {stickers.map((st) => (
          <button key={st.id} type="button" onClick={() => removeSticker(st.id)} style={{ left: `${st.x}%`, top: `${st.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-white text-gray-900 font-bold text-sm shadow-lg">{st.label} ×</button>
        ))}
        {createMode === 'media' && draftPreview && (
          <input type="text" value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="Add a caption..." className="absolute bottom-3 inset-x-3 bg-black/65 backdrop-blur-sm text-white placeholder-white/70 text-sm px-4 py-2 rounded-full border border-white/20 focus:outline-none" />
        )}
      </div>
    </div>
    <div className="px-4 py-3 bg-[#242526] border-t border-white/10 space-y-2.5">
      {createMode === 'text' && (
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex flex-col leading-tight">{BG_PRESETS.map((p, idx) => (<button key={p.id} type="button" onClick={() => setBgIdx(idx)} style={{ background: p.bg }} className={`w-7 h-7 rounded-full border-2 flex-shrink-0 ${bgIdx === idx ? 'border-white scale-110' : 'border-transparent'}`} />))}</div>
          <button type="button" onClick={() => setFontIdx((f) => (f + 1) % FONT_STYLES.length)} className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold flex-shrink-0">{FONT_STYLES[fontIdx].label}</button>
        </div>
      )}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {['📍 Location', '😊 Feeling', '🔥 Mood', '💬 Ask me'].map((lbl) => (<button key={lbl} type="button" onClick={() => addSticker(lbl)} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium flex-shrink-0">{lbl}</button>))}
        {createMode === 'media' && draftPreview && (<button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium flex-shrink-0">Change media</button>)}
      </div>
    </div>


            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={sharing}
              onClick={shareStory}
              className="w-full py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 text-white font-semibold text-sm shadow"
            >
              {sharing ? 'Sharing...' : 'Share to story'}
            </button>
          </div>
      )}
    </div>
  );
}
