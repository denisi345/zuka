import React, { useEffect, useState, useRef } from 'react';
import { Send, Sparkles, ArrowLeft, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';

const AI_CONTACT = { id: 'zuka-ai', full_name: 'ZUKA AI', username: 'zuka_ai', is_ai: true, is_verified: true };

export default function Messenger({ currentUser, initialPeer }) {
  const [contacts, setContacts] = useState([AI_CONTACT]);
  const [activePeer, setActivePeer] = useState(initialPeer || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const photoRef = useRef(null);

  useEffect(() => {
    if (initialPeer) setActivePeer(initialPeer);
  }, [initialPeer]);

  useEffect(() => {
    loadContacts();
  }, [currentUser?.id]);

  useEffect(() => {
    if (activePeer) loadChatMessages(activePeer);
  }, [activePeer?.id]);

  async function loadContacts() {
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified').limit(40);
      if (Array.isArray(data)) {
        const others = data.filter((u) => String(u.id) !== String(currentUser?.id));
        setContacts([AI_CONTACT, ...others]);
      }
    } catch (_) {}
  }

  async function loadChatMessages(peer) {
    if (peer.is_ai) {
      setMessages([{ id: 'ai-welcome', sender_id: 'zuka-ai', content: 'Habari! Mimi ni ZUKA AI. Niulize chochote kuhusu habari, biashara, au maisha!' }]);
      return;
    }
    if (!currentUser?.id) return;
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${peer.id}),and(sender_id.eq.${peer.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true })
        .limit(60);
      if (Array.isArray(data)) setMessages(data);
    } catch (_) {
      setMessages([]);
    }
  }

  async function handleSend(e, imageUrl = '') {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text && !imageUrl) return;
    if (!activePeer) return;
    setInput('');
    setSending(true);

    const myMsg = { id: `m-${Date.now()}`, sender_id: currentUser?.id || 'me', receiver_id: activePeer.id, content: text, image_url: imageUrl };
    setMessages((prev) => [...prev, myMsg]);

    if (activePeer.is_ai) {
      const reply = text.toLowerCase().includes('habari') || text.toLowerCase().includes('news')
        ? 'Habari mpya za leo kutoka BBC Swahili, Al Jazeera, na Millard Ayo zimechapishwa moja kwa moja kwenye ukurasa wako wa Feed!'
        : `Nimekupata kuhusu "${text}". Unaweza kuchapisha picha, Reels, au kuwasiliana na marafiki zako hapa hapa ZUKA!`;
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, sender_id: 'zuka-ai', content: reply }]);
        setSending(false);
      }, 350);
      return;
    }

    try {
      if (currentUser?.id) {
        const payload = { sender_id: currentUser.id, receiver_id: activePeer.id, content: text };
        if (imageUrl) payload.image_url = imageUrl;
        await supabase.from('messages').insert(payload);
      }
    } catch (_) {}
    setSending(false);
  }

  async function handlePickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    let url = URL.createObjectURL(file);
    const clean = (file.name || 'chat.jpg').replace(/[^a-zA-Z0-9._-]/g, '');
    const path = `messages/${Date.now()}_${clean}`;
    for (const bucket of ['media', 'public']) {
      const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        if (pub?.publicUrl) { url = pub.publicUrl; break; }
      }
    }
    await handleSend(null, url);
  }
  if (!activePeer) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 98px)', padding: '12px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 800, color: '#050505' }}>Chats</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {contacts.map((c) => {
            const name = c.full_name || c.username || 'ZUKA Member';
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActivePeer(c)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', borderRadius: '10px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: c.is_ai ? '#1877F2' : '#E4E6EB', color: c.is_ai ? '#FFFFFF' : '#050505', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', flexShrink: 0 }}>
                  {c.is_ai ? <Sparkles size={24} /> : c.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#050505', display: 'flex', alignItems: 'center' }}>
                    <span>{name}</span>
                    {c.is_verified && <ZukaBadge size={15} />}
                  </div>
                  <div style={{ fontSize: '13px', color: '#65676B', marginTop: '2px' }}>
                    {c.is_ai ? 'Msaidizi wako wa AI · Gusa kuuliza' : 'Gusa kuanza mazungumzo'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const peerName = activePeer.full_name || activePeer.username || 'ZUKA Member';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 98px)', backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderBottom: '1px solid #E4E6EB' }}>
        <button type="button" onClick={() => setActivePeer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1877F2', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: activePeer.is_ai ? '#1877F2' : '#E4E6EB', color: activePeer.is_ai ? '#FFFFFF' : '#050505', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
          {activePeer.is_ai ? <Sparkles size={18} /> : activePeer.avatar_url ? <img src={activePeer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : peerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center' }}>
            <span>{peerName}</span>
            {activePeer.is_verified && <ZukaBadge size={15} />}
          </div>
          <div style={{ fontSize: '12px', color: '#42B72A', fontWeight: 600 }}>Active now</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#F0F2F5' }}>
        {messages.map((m) => {
          const isMe = String(m.sender_id) === String(currentUser?.id || 'me');
          return (
            <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '78%', backgroundColor: isMe ? '#1877F2' : '#FFFFFF', color: isMe ? '#FFFFFF' : '#050505', padding: '10px 14px', borderRadius: '16px', fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
              {m.image_url && <img src={m.image_url} alt="" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '10px', marginBottom: m.content ? '6px' : 0 }} />}
              {m.content && <div>{m.content}</div>}
            </div>
          );
        })}
      </div>

      <form onSubmit={(e) => handleSend(e)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderTop: '1px solid #E4E6EB', backgroundColor: '#FFFFFF' }}>
        {!activePeer.is_ai && (
          <>
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePickPhoto} style={{ display: 'none' }} />
            <button type="button" onClick={() => photoRef.current?.click()} style={{ background: 'none', border: 'none', color: '#1877F2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Image size={22} />
            </button>
          </>
        )}
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${peerName}...`} style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #CED0D4', fontSize: '14px', outline: 'none' }} />
        <button type="submit" disabled={sending} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
