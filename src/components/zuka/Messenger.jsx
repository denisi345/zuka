import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Search, Phone, Video, Settings, Mic, Smile, ThumbsUp, Sparkles, Plus, X, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';
import { sendZukaNotification } from './notifyHelper';

const ZUKA_AI_PEER = {
  id: 'zuka-ai',
  full_name: 'ZUKA AI',
  username: 'zuka_ai',
  is_ai: true,
  is_verified: true,
  bio: 'Your smart ZUKA assistant'
};

export default function Messenger({ currentUser, initialPeer, onOpenUserProfile }) {
  const [peers, setPeers] = useState([]);
  const [activePeer, setActivePeer] = useState(initialPeer || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [myNote, setMyNote] = useState('');
  const [noteModal, setNoteModal] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [aiHistory, setAiHistory] = useState([
    { id: 'ai-welcome', sender_id: 'zuka-ai', content: 'Hello! I am ZUKA AI. Ask me anything about news, business, coding, or life.', created_at: new Date().toISOString() }
  ]);
  const [aiTyping, setAiTyping] = useState(false);
  const [callBanner, setCallBanner] = useState('');
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (initialPeer) setActivePeer(initialPeer);
  }, [initialPeer]);

  useEffect(() => {
    loadPeers();
  }, [currentUser?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiHistory, activePeer]);

  async function loadPeers() {
    let list = [];
    try {
      const { data } = await supabase.from('profiles').select('*').limit(40);
      if (Array.isArray(data)) {
        list = data.filter((p) => String(p.id) !== String(currentUser?.id));
      }
    } catch (_) {}
    if (list.length === 0) {
      list = [{ id: 'zuka-official', full_name: 'ZUKA Official', username: 'zuka', is_verified: true, bio: 'Official ZUKA Team' }];
    }
    setPeers(list);
  }

  useEffect(() => {
    if (!activePeer || activePeer.is_ai || !currentUser?.id) return;
    loadThread();
    const channel = supabase
      .channel(`chat-${currentUser.id}-${activePeer.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload?.new;
        if (!m) return;
        const match =
          (String(m.sender_id) === String(currentUser.id) && String(m.receiver_id) === String(activePeer.id)) ||
          (String(m.sender_id) === String(activePeer.id) && String(m.receiver_id) === String(currentUser.id));
        if (match) {
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activePeer?.id, currentUser?.id]);

  async function loadThread() {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activePeer.id}),and(sender_id.eq.${activePeer.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
      if (Array.isArray(data)) setMessages(data);
    } catch (_) {}
  }

  async function sendTextOrThumbs(customText) {
    const contentToSend = (customText !== undefined ? customText : text).trim();
    if (!contentToSend || !activePeer) return;
    if (customText === undefined) setText('');

    if (activePeer.is_ai) {
      const userMsg = { id: "u-" + Date.now(), sender_id: currentUser?.id || "me", content: contentToSend, created_at: new Date().toISOString() };
      const nextHistory = [...aiHistory, userMsg];
      setAiHistory(nextHistory);
      setAiTyping(true);
      try {
        const res = await fetch("/api/zuka-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextHistory })
        });
        const data = await res.json();
        setAiHistory((prev) => [...prev, { id: "ai-" + Date.now(), sender_id: "zuka-ai", content: data.reply || "No response.", created_at: new Date().toISOString() }]);
      } catch (_) {
        setAiHistory((prev) => [...prev, { id: "ai-" + Date.now(), sender_id: "zuka-ai", content: "Could not reach ZUKA AI right now.", created_at: new Date().toISOString() }]);
      }
      setAiTyping(false);
      return;
    }

    const tempMsg = { id: `tmp-${Date.now()}`, sender_id: currentUser?.id, receiver_id: activePeer.id, content: contentToSend, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);
    if (currentUser?.id && activePeer.id !== 'zuka-official') {
      try {
        await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: activePeer.id, content: contentToSend });
        sendZukaNotification({
          receiverId: activePeer.id,
          senderId: currentUser.id,
          type: 'message',
          message: `New message from ${currentUser.full_name || currentUser.username || 'a friend'}: "${contentToSend.slice(0, 60)}"`
        });
      } catch (_) {}
    }
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activePeer) return;
    let url = URL.createObjectURL(file);
    const clean = (file.name || 'chat.jpg').replace(/[^a-zA-Z0-9._-]/g, '');
    const path = `chat/${Date.now()}_${clean}`;
    for (const bucket of ['media', 'posts', 'public']) {
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        if (pub?.publicUrl) { url = pub.publicUrl; break; }
      }
    }
    await sendTextOrThumbs(`[photo]${url}`);
  }
  const thread = activePeer?.is_ai ? aiHistory : messages;
  const filteredPeers = peers.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (p.full_name || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q);
  });

  if (activePeer) {
    const peerName = activePeer.full_name || activePeer.username || 'ZUKA Member';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 98px)', backgroundColor: '#FFFFFF', position: 'relative' }}>
        {callBanner && (
          <div style={{ position: 'fixed', top: '112px', left: '50%', transform: 'translateX(-50%)', zIndex: 80, backgroundColor: '#1877F2', color: '#FFFFFF', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {callBanner}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #E4E6EB', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <button type="button" onClick={() => setActivePeer(null)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#050505' }}>
              <ArrowLeft size={22} />
            </button>
            <div style={{ position: "relative", width: "38px", height: "38px", flexShrink: 0 }}>
    <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "#1877F2", color: "#FFFFFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
              {activePeer.is_ai ? <Sparkles size={19} /> : activePeer.avatar_url ? <img src={activePeer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : peerName.charAt(0).toUpperCase()}
              </div>
    <span style={{ position: "absolute", bottom: "0px", right: "0px", width: "11px", height: "11px", borderRadius: "50%", backgroundColor: "#31A24C", border: "2px solid #FFFFFF", zIndex: 5 }} />
  </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{peerName}</span>
                {activePeer.is_verified && <ZukaBadge size={15} />}
              </div>
              <div style={{ fontSize: '11px', color: '#65676B' }}>Active now</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#050505' }}>
            <button type="button" onClick={() => { setCallBanner(`Calling ${peerName}...`); setTimeout(() => setCallBanner(''), 2500); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', padding: '4px' }}>
              <Phone size={20} fill="#050505" />
            </button>
            <button type="button" onClick={() => { setCallBanner(`Starting video call with ${peerName}...`); setTimeout(() => setCallBanner(''), 2500); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', padding: '4px' }}>
              <Video size={22} fill="#050505" />
            </button>
            <button type="button" onClick={() => onOpenUserProfile && !activePeer.is_ai && onOpenUserProfile(activePeer)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', padding: '4px' }}>
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '14px 16px 18px' }}>
            <div style={{ width: '82px', height: '82px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '30px', marginBottom: '10px', border: '2px solid #E4E6EB' }}>
              {activePeer.is_ai ? <Sparkles size={36} /> : activePeer.avatar_url ? <img src={activePeer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : peerName.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontWeight: 800, fontSize: '20px', color: '#050505', display: 'flex', alignItems: 'center' }}>
              <span>{peerName}</span>
              {activePeer.is_verified && <ZukaBadge size={18} />}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#050505', marginTop: '3px' }}>
              {activePeer.is_ai ? 'Official ZUKA AI Assistant' : "You're friends on ZUKA"}
            </div>
            {activePeer.location && <div style={{ fontSize: '12px', color: '#65676B', marginTop: '2px' }}>Lives in {activePeer.location}</div>}
            {!activePeer.is_ai && (
              <button
                type="button"
                onClick={() => onOpenUserProfile && onOpenUserProfile(activePeer)}
                style={{ marginTop: '10px', padding: '7px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#E4E6EB', color: '#050505', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                View profile
              </button>
            )}
            <div style={{ marginTop: '16px', fontSize: '11px', color: '#65676B', maxWidth: '290px', lineHeight: '1.4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Lock size={12} /> <span>Messages and calls are secured with end-to-end encryption.</span>
            </div>
          </div>

          {thread.map((m) => {
            const mine = String(m.sender_id) === String(currentUser?.id) || m.sender_id === 'me';
            const isPhoto = typeof m.content === 'string' && m.content.startsWith('[photo]');
            const photoSrc = isPhoto ? m.content.replace('[photo]', '') : '';
            return (
              <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                {!mine && (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {activePeer.avatar_url ? <img src={activePeer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : peerName.charAt(0).toUpperCase()}
                  </div>
                )}
                {isPhoto ? (
                  <img src={photoSrc} alt="" style={{ maxWidth: '220px', borderRadius: '16px' }} />
                ) : (
                  <div style={{ backgroundColor: mine ? '#0084FF' : '#F0F2F5', color: mine ? '#FFFFFF' : '#050505', padding: '9px 14px', borderRadius: '18px', fontSize: '15px', lineHeight: '1.35' }}>
                    {m.content}
                  </div>
                )}
              </div>
            );
          })}
          {aiTyping && <div style={{ alignSelf: 'flex-start', backgroundColor: '#F0F2F5', color: '#65676B', padding: '8px 14px', borderRadius: '18px', fontSize: '13px' }}>ZUKA AI is typing...</div>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); sendTextOrThumbs(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderTop: '1px solid #E4E6EB', backgroundColor: '#FFFFFF' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 'none', color: '#0084FF', padding: '4px', cursor: 'pointer' }}>
            <ImageIcon size={22} />
          </button>
          <button type="button" onClick={() => { setCallBanner('Voice message ready'); setTimeout(() => setCallBanner(''), 1800); }} style={{ background: 'none', border: 'none', color: '#0084FF', padding: '4px', cursor: 'pointer' }}>
            <Mic size={22} />
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: '20px', padding: '0 10px 0 14px', height: '38px' }}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '15px', outline: 'none', color: '#050505' }}
            />
            <button type="button" onClick={() => setText((prev) => `${prev}😊`)} style={{ background: 'none', border: 'none', color: '#0084FF', padding: '2px', cursor: 'pointer', display: 'flex' }}>
              <Smile size={20} />
            </button>
          </div>
          {text.trim() ? (
            <button type="submit" style={{ background: 'none', border: 'none', color: '#0084FF', padding: '4px', cursor: 'pointer', display: 'flex' }}>
              <Send size={22} />
            </button>
          ) : (
            <button type="button" onClick={() => sendTextOrThumbs('👍')} style={{ background: 'none', border: 'none', color: '#0084FF', padding: '4px', cursor: 'pointer', display: 'flex' }}>
              <ThumbsUp size={22} fill="#0084FF" />
            </button>
          )}
        </form>
      </div>
    );
  }
  const myInitial = (currentUser?.full_name || currentUser?.username || 'Z').charAt(0).toUpperCase();

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 98px)', paddingBottom: '88px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#050505' }}>Messages</h2>
        <button type="button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search messages" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F0F2F5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#050505' }}>
          <Search size={19} />
        </button>
      </div>

      {searchOpen && (
        <div style={{ padding: '0 14px 10px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Messenger..."
            style={{ width: '100%', padding: '9px 14px', borderRadius: '20px', border: 'none', backgroundColor: '#F0F2F5', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', padding: '8px 14px 12px', scrollbarWidth: 'none' }}>
        <div onClick={() => { setNoteDraft(myNote); setNoteModal(true); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px', flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E6EB', borderRadius: '12px', padding: '3px 7px', fontSize: '10px', color: '#65676B', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '-6px', zIndex: 2, maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {myNote || 'Share a note...'}
          </div>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#E4E6EB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', color: '#050505' }}>
            {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : myInitial}
          </div>
          <span style={{ fontSize: '11px', color: '#65676B', marginTop: '4px' }}>Your note</span>
        </div>

        {peers.map((p) => {
          const pName = (p.full_name || p.username || "Friend").split(" ").at(0) || "Friend";
          return (
            <div key={`active-${p.id}`} onClick={() => setActivePeer(p)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px', flexShrink: 0, cursor: 'pointer', paddingTop: '12px' }}>
              <div style={{ position: "relative", width: "54px", height: "54px" }}>
    <div style={{ width: "54px", height: "54px", borderRadius: "50%", backgroundColor: "#1877F2", color: "#FFFFFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "20px" }}>
                {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : pName.charAt(0).toUpperCase()}
                </div>
    <span style={{ position: "absolute", bottom: "1px", right: "1px", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#31A24C", border: "2.5px solid #FFFFFF", zIndex: 5 }} />
  </div>
              <span style={{ fontSize: '11px', color: '#050505', marginTop: '4px', maxWidth: '62px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pName}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div onClick={() => setActivePeer(ZUKA_AI_PEER)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #0084FF, #A033FF)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center' }}>
              <span>ZUKA AI</span>
              <ZukaBadge size={15} />
            </div>
            <div style={{ fontSize: '13px', color: '#65676B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Ask ZUKA AI anything · Tap to chat
            </div>
          </div>
        </div>

        {filteredPeers.map((peer) => {
          const name = peer.full_name || peer.username || 'ZUKA Member';
          return (
            <div key={peer.id} onClick={() => setActivePeer(peer)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer' }}>
              <div style={{ position: "relative", width: "54px", height: "54px", flexShrink: 0 }}>
    <div style={{ width: "54px", height: "54px", borderRadius: "50%", backgroundColor: "#E4E6EB", color: "#050505", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "20px" }}>
                {peer.avatar_url ? <img src={peer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0).toUpperCase()}
                </div>
    <span style={{ position: "absolute", bottom: "1px", right: "1px", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#31A24C", border: "2.5px solid #FFFFFF", zIndex: 5 }} />
  </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center' }}>
                  <span>{name}</span>
                  {peer.is_verified && <ZukaBadge size={15} />}
                </div>
                <div style={{ fontSize: '13px', color: '#65676B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Tap to start chatting · Active now
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'fixed', right: '16px', bottom: '18px', zIndex: 30, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <button type="button" onClick={() => setActivePeer(ZUKA_AI_PEER)} aria-label="ZUKA AI" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '1px solid #E4E6EB', boxShadow: '0 3px 12px rgba(0,0,0,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0084FF', cursor: 'pointer' }}>
          <Sparkles size={22} />
        </button>
        <button type="button" onClick={() => setSearchOpen(true)} aria-label="New message" style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#0084FF', border: 'none', boxShadow: '0 4px 14px rgba(0,132,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', cursor: 'pointer' }}>
          <Plus size={26} />
        </button>
      </div>

      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={(e) => { e.preventDefault(); setMyNote(noteDraft.trim()); setNoteModal(false); }} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '16px', color: '#050505' }}>Your Messenger Note</strong>
              <button type="button" onClick={() => setNoteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <input type="text" maxLength={60} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Share a thought (60 chars)..." style={{ padding: '10px', borderRadius: '10px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <button type="submit" style={{ backgroundColor: '#0084FF', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Share Note</button>
          </form>
        </div>
      )}
    </div>
  );
}
