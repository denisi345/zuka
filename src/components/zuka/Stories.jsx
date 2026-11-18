import { formatTimeAgo } from "./timeAgo";
import React, { useRef, useState, useEffect } from 'react';
import { Plus, X, Trash2, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Stories({ userProfile, stories = [], onUploadStory, onDeleteStory, onPauseChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => { const h = () => fileRef.current?.click(); window.addEventListener("zuka:open-story", h); return () => window.removeEventListener("zuka:open-story", h); }, []);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadStory) return;
    setUploading(true);
    try { await onUploadStory(file); } catch (_) {}
    setUploading(false);
  }

  useEffect(() => {
    if (activeIndex === null || isPaused) return;
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
  }, [activeIndex, stories.length, isPaused]);

  const activeStory = activeIndex !== null ? stories[activeIndex] : null;
  const myInitial = (userProfile?.full_name || userProfile?.username || 'Z').charAt(0).toUpperCase();

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E6EB', padding: '10px 8px', marginTop: '8px' }}>
      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          style={{ width: '108px', height: '186px', borderRadius: '12px', border: '1px solid #E4E6EB', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', cursor: 'pointer', position: 'relative' }}
        >
          <div style={{ height: '124px', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800, color: '#65676B', overflow: 'hidden' }}>
            {userProfile?.avatar_url ? <img src={userProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : myInitial}
          </div>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#1877F2', border: '3px solid #FFFFFF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-17px auto 0', zIndex: 2 }}>
            <Plus size={20} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#050505', padding: '0 4px', textAlign: 'center' }}>
            {uploading ? 'Posting...' : 'Create story'}
          </div>
        </div>
        {stories.map((st, idx) => {
          const name = st.author_name || 'Member';
          const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(st.media_url || '');
          return (
            <div
              key={st.id || idx}
              onClick={() => setActiveIndex(idx)}
              style={{ width: '108px', height: '186px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: '#1C1E21', cursor: 'pointer', border: '1px solid #E4E6EB' }}
            >
              {isVid ? <video src={st.media_url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={st.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', top: '8px', left: '8px', width: '34px', height: '34px', borderRadius: '50%', border: '3px solid #1877F2', backgroundColor: '#1877F2', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </div>
            </div>
          );
        })}
      </div>
      {activeStory && <StoryFullScreen story={activeStory} stories={stories} activeIndex={activeIndex} progress={progress} currentUser={userProfile} onClose={() => setActiveIndex(null)} onPrev={() => setActiveIndex((i) => Math.max(0, i - 1))} onNext={() => setActiveIndex((i) => (i + 1 < stories.length ? i + 1 : null))} onDeleteStory={onDeleteStory} onPauseChange={setIsPaused} />}
    </div>
  );
}
function StoryFullScreen({ story, stories, activeIndex, progress, currentUser, onClose, onPrev, onNext, onDeleteStory }) {
  const [replyText, setReplyText] = useState("");
  const [storyMuted, setStoryMuted] = useState(false);
  const storyVideoRef = React.useRef(null);
  const [floatingEmoji, setFloatingEmoji] = useState('');
  const [sentNotice, setSentNotice] = useState('');
  const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(story.media_url || '');
  const isOwner = currentUser?.id && String(story.user_id) === String(currentUser.id);
  const authorName = story.author_name || 'ZUKA Member';

  async function sendStoryReply(textToSend) {
    if (!textToSend) return;
    setSentNotice('Sent to Messenger!');
    setTimeout(() => setSentNotice(''), 1800);
    if (currentUser?.id && story.user_id && String(currentUser.id) !== String(story.user_id)) {
      try {
        await supabase.from('messages').insert({
          sender_id: currentUser.id,
          receiver_id: story.user_id,
          content: `Replied to your story: ${textToSend}`
        });
      } catch (_) {}
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: '#000000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ position: 'relative', zIndex: 10, padding: '10px 12px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {stories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: '#FFFFFF', width: i < activeIndex ? '100%' : i === activeIndex ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{authorName}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{formatTimeAgo(typeof story !== "undefined" ? story?.created_at : typeof n !== "undefined" ? n?.created_at : null)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isOwner && (
              <button type="button" onClick={async () => { if (story.id && !String(story.id).startsWith('st-')) { try { await supabase.from('stories').delete().eq('id', story.id); } catch (_) {} } if (onDeleteStory) onDeleteStory(story.id); onClose(); }} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <Trash2 size={20} />
              </button>
            )}
            {isVid && (
              <button type="button" onClick={(e) => { e.stopPropagation(); const next = !storyMuted; setStoryMuted(next); if (storyVideoRef.current) { storyVideoRef.current.muted = next; if (!next) storyVideoRef.current.play().catch(() => {}); } }} style={{ background: "none", border: "none", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center" }}>
                {storyMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
            )}
            <button type="button" onClick={() => { if (onPauseChange) onPauseChange(false); onClose(); }} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
              <X size={26} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isVid ? <video src={story.media_url} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <img src={story.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
        <div onClick={onPrev} style={{ position: 'absolute', left: 0, top: '70px', bottom: '80px', width: '32%', zIndex: 5 }} />
        <div onClick={onNext} style={{ position: 'absolute', right: 0, top: '70px', bottom: '80px', width: '68%', zIndex: 5 }} />
      </div>

      {floatingEmoji && <div style={{ position: 'relative', zIndex: 20, textAlign: 'center', fontSize: '58px', pointerEvents: 'none' }}>{floatingEmoji}</div>}
      {sentNotice && <div style={{ position: 'relative', zIndex: 20, alignSelf: 'center', backgroundColor: '#1877F2', color: '#FFFFFF', padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 700 }}>{sentNotice}</div>}

      <div style={{ position: 'relative', zIndex: 15, padding: '10px 12px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {['👍', '❤️', '😂', '😮', '😢', '😡'].map((em) => (
            <button key={em} type="button" onClick={() => { setFloatingEmoji(em); setTimeout(() => setFloatingEmoji(''), 1200); sendStoryReply(em); }} style={{ background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer', padding: '2px' }}>
              {em}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); const t = replyText.trim(); if (t) { setReplyText(''); sendStoryReply(t); } }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Send message..." onFocus={() => onPauseChange && onPauseChange(true)} onBlur={() => onPauseChange && onPauseChange(false)} style={{ flex: 1, padding: '10px 16px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.55)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#FFFFFF', fontSize: '14px', outline: 'none' }} />
          <button type="submit" style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '20px', padding: '9px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Send</button>
        </form>
      </div>
    </div>
  );
}
