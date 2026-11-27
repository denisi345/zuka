import { compressImageFile } from "./imageCompressor";
import React, { useState, useRef, useEffect } from 'react';
import { Image, Video, Music, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CreatePost({ userProfile, onCreatePost }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState('');
  const [audioTitle, setAudioTitle] = useState('');
  const [posting, setPosting] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundTitle, setFundTitle] = useState('');
  const [fundGoal, setFundGoal] = useState('');

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('zuka:open-post', h);
    return () => window.removeEventListener('zuka:open-post', h);
  }, []);

  const name = userProfile?.full_name || userProfile?.username || 'Member';
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => { if (!open) return; window.history.pushState({ zukaCreatePost: true }, ''); const onPop = () => setOpen(false); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, [open]);

  function handlePickMedia(e, type) {
    const file = (e.target.files && e.target.files.item(0)) || null; e.target.value = '';
    if (!file) return;
    setMediaFile(file);
    setMediaType(type);
    setMediaPreview(URL.createObjectURL(file)); setOpen(true);
    setOpen(true);
  }

  function handlePickAudio(e) {
    const file = (e.target.files && e.target.files.item(0)) || null; e.target.value = '';
    if (!file) return;
    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file)); setOpen(true);
    setAudioTitle(file.name.replace(/\.[^/.]+$/, ''));
    setOpen(true);
  }

  const [bgUploading, setBgUploading] = useState(false);
  async function uploadToStorage(file, folder) { const clean = (file.name || "file").replace(/[^a-zA-Z0-9._-]/g, ""); const path = `${folder}/${Date.now()}_${clean}`; for (const bucket of ["media", "post-media", "stories", "public"]) { const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, cacheControl: "3600" }); if (!error) { const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path); if (pub?.publicUrl) return pub.publicUrl; } } return URL.createObjectURL(file); }
  async function handleSubmit(e) { e.preventDefault(); if (!text.trim() && !mediaFile && !audioFile) return; const tSnap = text.trim(); const mSnap = mediaFile; const mTypeSnap = mediaType; const aSnap = audioFile; const aTitleSnap = audioTitle; setText(""); setMediaFile(null); setMediaPreview(""); setAudioFile(null); setAudioTitle(""); setPosting(false); setOpen(false); if (mSnap || aSnap) setBgUploading(true); try { const [uMedia, uAudio] = await Promise.all([mSnap ? (async () => uploadToStorage(mTypeSnap === "image" ? await compressImageFile(mSnap) : mSnap, mTypeSnap === "video" ? "videos" : "images"))() : Promise.resolve(""), aSnap ? uploadToStorage(aSnap, "audio") : Promise.resolve("")]); const finalText = uAudio ? `${tSnap}\n[zuka_audio:${aTitleSnap || "Audio Track"}|${uAudio}]` : tSnap; const fObj = fundOpen && Number(fundGoal) > 0 ? { fundraiser_title: fundTitle.trim() || "Fundraiser", fundraiser_goal: Number(fundGoal), fundraiser_raised: 0 } : null;
      setFundOpen(false); setFundTitle(''); setFundGoal('');
      if (onCreatePost) await onCreatePost(finalText, uMedia, mTypeSnap, fObj); } catch (_) {} finally { setBgUploading(false); } }
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E6EB', padding: '12px' }}>{bgUploading && (<div style={{ backgroundColor: "#E7F3FF", color: "#1877F2", padding: "8px 12px", borderRadius: "8px", marginBottom: "8px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}><span>⏳</span><span>Uploading media in background...</span></div>)}
      <input ref={photoInputRef} type="file" accept="image/*" onChange={(e) => handlePickMedia(e, 'image')} style={{ display: 'none' }} />
      <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => handlePickMedia(e, 'video')} style={{ display: 'none' }} />
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handlePickAudio} style={{ display: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
            {userProfile?.avatar_url ? <img src={userProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
          </div>
          <span style={{ position: 'absolute', bottom: '0px', right: '0px', width: "13px", height: "13px", borderRadius: "50%", backgroundColor: "#31A24C", border: "2.5px solid #FFFFFF", zIndex: 5 }} />
        </div>
        <button type="button" onClick={() => setOpen(true)} style={{ flex: 1, height: '40px', borderRadius: '20px', border: '1px solid #CED0D4', backgroundColor: '#F0F2F5', color: '#65676B', textAlign: 'left', padding: '0 16px', fontSize: '15px', cursor: 'pointer' }}>
          What's on your mind?
        </button>
        <button type="button" onClick={() => photoInputRef.current?.click()} aria-label="Photo" style={{ background: 'none', border: 'none', color: '#45BD62', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
          <Image size={22} />
          <span style={{ color: '#65676B' }}>Photo</span>
        </button>
      </div>

      <div style={{ display: 'flex', borderTop: '1px solid #E4E6EB', marginTop: '10px', paddingTop: '8px' }}>
        <button type="button" onClick={() => videoInputRef.current?.click()} style={{ flex: 1, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#65676B', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <Video size={18} color="#F3425F" /> Video
        </button>
        <button type="button" onClick={() => photoInputRef.current?.click()} style={{ flex: 1, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#65676B', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <Image size={18} color="#45BD62" /> Photo
        </button>
        <button type="button" onClick={() => audioInputRef.current?.click()} style={{ flex: 1, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#65676B', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <Music size={18} color="#F7B928" /> Music
        </button>
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 65, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }}>
          <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '8px' }}>
              <strong style={{ fontSize: '17px', color: '#050505' }}>Create post</strong>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505' }}><X size={20} /></button>
            </div>
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={`What's on your mind, ${name}?`} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '16px', resize: 'none', boxSizing: 'border-box' }} />

            {mediaPreview && (
              <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E4E6EB' }}>
                {mediaType === 'video' ? <video src={mediaPreview} controls style={{ width: '100%', maxHeight: '220px' }} /> : <img src={mediaPreview} alt="" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover' }} />}
                <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(''); }} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}><X size={15} /></button>
              </div>
            )}

            {audioPreview && (
              <div style={{ backgroundColor: '#F0F2F5', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#050505' }}>🎵 {audioTitle}</span>
                  <button type="button" onClick={() => { setAudioFile(null); setAudioPreview(''); setAudioTitle(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                </div>
                <audio src={audioPreview} controls style={{ width: '100%', height: '32px' }} />
              </div>
            )}

            {fundOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "8px", borderRadius: "8px", backgroundColor: "#F0F2F5" }}>
                <input type="text" value={fundTitle} onChange={(e) => setFundTitle(e.target.value)} placeholder="Fundraiser Title (e.g. Community Support)" style={{ padding: "8px", borderRadius: "6px", border: "1px solid #CED0D4", fontSize: "13px" }} />
                <input type="number" value={fundGoal} onChange={(e) => setFundGoal(e.target.value)} placeholder="Target Goal (TZS)" style={{ padding: "8px", borderRadius: "6px", border: "1px solid #CED0D4", fontSize: "13px" }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => photoInputRef.current?.click()} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CED0D4', backgroundColor: '#FFFFFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>+ Photo</button>
              <button type="button" onClick={() => videoInputRef.current?.click()} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CED0D4', backgroundColor: '#FFFFFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>+ Video</button>
              <button type="button" onClick={() => audioInputRef.current?.click()} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CED0D4', backgroundColor: '#FFFFFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>+ Music</button>
              <button type="button" onClick={() => setFundOpen((v) => !v)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CED0D4', backgroundColor: fundOpen ? '#E7F3FF' : '#FFFFFF', color: fundOpen ? '#1877F2' : '#050505', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>+ Fundraiser</button>
            </div>

            <button type="submit" disabled={posting} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
              {posting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
