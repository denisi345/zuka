import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, ArrowLeft, Search, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ZUKA_AI_CHAT = {
  id: 'zuka-ai',
  full_name: 'ZUKA AI',
  username: 'zuka_ai',
  isAI: true,
  subtitle: 'Active now · Intelligent Assistant'
};

export default function Messenger({ userProfile, initialChat = null }) {
  const [contacts, setContacts] = useState([ZUKA_AI_CHAT]);
  const [activeChat, setActiveChat] = useState(initialChat || ZUKA_AI_CHAT);
  const [search, setSearch] = useState('');
  const [aiMessages, setAiMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('zuka_ai_history') || '[]');
      if (saved.length > 0) return saved;
    } catch (_) {}
    return [{
      id: 'welcome-ai',
      sender: 'ai',
      text: 'Habari! Mimi ni ZUKA AI. Ninaweza kukusaidia kuchambua mazungumzo, kujibu maswali yoyote, kuandika maudhui, au kukuongoza kwenye ZUKA. Ungependa tuzungumzie nini leo?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
  });
  const [peerMessages, setPeerMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (initialChat?.id) {
      setActiveChat(initialChat);
      if (initialChat.prefill) setInput(initialChat.prefill);
    }
  }, [initialChat]);

  useEffect(() => {
    loadContacts();
  }, [userProfile?.id]);

  useEffect(() => {
    if (activeChat && !activeChat.isAI && userProfile?.id) {
      loadPeerMessages(activeChat.id);
    }
  }, [activeChat?.id, userProfile?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, peerMessages, aiTyping]);

  async function loadContacts() {
    const { data } = await supabase.from('profiles').select('id, username, full_name, avatar_url').limit(50);
    if (Array.isArray(data)) {
      const others = data.filter((p) => String(p.id) !== String(userProfile?.id));
      setContacts([ZUKA_AI_CHAT, ...others]);
    }
  }

  async function loadPeerMessages(peerId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userProfile.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userProfile.id})`)
      .order('created_at', { ascending: true })
      .limit(80);
    setPeerMessages(Array.isArray(data) ? data : []);
  }
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel('zuka-messenger-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (
          activeChat && !activeChat.isAI &&
          ((String(msg.sender_id) === String(activeChat.id) && String(msg.receiver_id) === String(userProfile.id)) ||
           (String(msg.sender_id) === String(userProfile.id) && String(msg.receiver_id) === String(activeChat.id)))
        ) {
          setPeerMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChat?.id, userProfile?.id]);

  async function askZukaAI(userText) {
    setAiTyping(true);
    const recent = aiMessages.slice(-8).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));
    try {
      const res = await fetch('https://pollinations.ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are ZUKA AI, a helpful, intelligent assistant built into ZUKA Messenger. Understand the user intent and conversation history, respond clearly in the user language (Swahili or English), and give practical, structured answers.'
            },
            ...recent,
            { role: 'user', content: userText }
          ],
          model: 'openai'
        })
      });
      const reply = (await res.text()).trim();
      if (reply) {
        setAiMessages((prev) => {
          const next = [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
          localStorage.setItem('zuka_ai_history', JSON.stringify(next.slice(-30)));
          return next;
        });
      }
    } catch (_) {
      setAiMessages((prev) => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: 'Samahani, mtandao umeyumba kidogo. Tafadhali jaribu kutuma ujumbe wako tena.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setAiTyping(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeChat) return;
    setInput('');

    if (activeChat.isAI) {
      const userMsg = { id: `u-${Date.now()}`, sender: 'user', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setAiMessages((prev) => {
        const next = [...prev, userMsg];
        localStorage.setItem('zuka_ai_history', JSON.stringify(next.slice(-30)));
        return next;
      });
      await askZukaAI(text);
    } else if (userProfile?.id) {
      const optimistic = { id: `tmp-${Date.now()}`, sender_id: userProfile.id, receiver_id: activeChat.id, content: text, created_at: new Date().toISOString() };
      setPeerMessages((prev) => [...prev, optimistic]);
      await supabase.from('messages').insert({ sender_id: userProfile.id, receiver_id: activeChat.id, content: text });
    }
  }
  const filteredContacts = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (c.full_name || '').toLowerCase().includes(q) || (c.username || '').toLowerCase().includes(q);
  });

  const activeName = activeChat?.full_name || activeChat?.username || 'ZUKA Member';

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100dvh - 98px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #E4E6EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ fontSize: '20px' }}>Chats</strong>
          <span style={{ fontSize: '12px', color: '#1877F2', fontWeight: 600 }}>ZUKA Messenger</span>
        </div>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#65676B' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends or ZUKA AI..."
            style={{ width: '100%', height: '36px', borderRadius: '18px', border: 'none', backgroundColor: '#F0F2F5', paddingLeft: '34px', paddingRight: '12px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {filteredContacts.map((c) => {
            const name = c.full_name || c.username || 'ZUKA Member';
            const selected = String(activeChat?.id) === String(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveChat(c)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '64px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: c.isAI ? '#1877F2' : '#E4E6EB', color: c.isAI ? '#FFFFFF' : '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '17px', border: selected ? '3px solid #1877F2' : '2px solid transparent' }}>
                  {c.isAI ? <Sparkles size={22} /> : name.charAt(0).toUpperCase()}
                  <span style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#31A24C', border: '2px solid #FFFFFF' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: selected ? 700 : 500, color: selected ? '#1877F2' : '#050505', maxWidth: '66px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!activeChat?.isAI && (
            <button type="button" onClick={() => setActiveChat(ZUKA_AI_CHAT)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#1877F2' }}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: activeChat?.isAI ? '#1877F2' : '#E4E6EB', color: activeChat?.isAI ? '#FFFFFF' : '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {activeChat?.isAI ? <Sparkles size={18} /> : activeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{activeName}</span>
              {activeChat?.isAI && <span style={{ backgroundColor: '#E7F3FF', color: '#1877F2', fontSize: '11px', padding: '1px 6px', borderRadius: '6px' }}>AI</span>}
            </div>
            <div style={{ fontSize: '12px', color: '#31A24C' }}>Active now</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#F0F2F5' }}>
        {activeChat?.isAI ? (
          <>
            {aiMessages.map((m) => {
              const isMe = m.sender === 'user';
              return (
                <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                  <div style={{ backgroundColor: isMe ? '#1877F2' : '#FFFFFF', color: isMe ? '#FFFFFF' : '#050505', padding: '9px 13px', borderRadius: '18px', fontSize: '14px', lineHeight: 1.45, whiteSpace: 'pre-wrap', boxShadow: '0 1px 1px rgba(0,0,0,0.06)' }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: '11px', color: '#65676B', marginTop: '2px', textAlign: isMe ? 'right' : 'left' }}>{m.time}</div>
                </div>
              );
            })}
            {aiTyping && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#FFFFFF', color: '#65676B', padding: '8px 14px', borderRadius: '18px', fontSize: '13px' }}>
                ZUKA AI is thinking...
              </div>
            )}
          </>
        ) : peerMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#65676B', fontSize: '14px', margin: 'auto 0', padding: '24px' }}>
            Say hello to <strong>{activeName}</strong> on ZUKA Messenger!
          </div>
        ) : (
          peerMessages.map((m) => {
            const isMe = String(m.sender_id) === String(userProfile?.id);
            return (
              <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <div style={{ backgroundColor: isMe ? '#1877F2' : '#FFFFFF', color: isMe ? '#FFFFFF' : '#050505', padding: '9px 13px', borderRadius: '18px', fontSize: '14px', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </div>
                <div style={{ fontSize: '11px', color: '#65676B', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '3px' }}>
                  <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                  {isMe && <CheckCheck size={13} color="#1877F2" />}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '8px 12px', borderTop: '1px solid #E4E6EB', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={activeChat?.isAI ? 'Ask ZUKA AI anything...' : `Message ${activeName}...`}
          style={{ flex: 1, height: '40px', borderRadius: '20px', border: 'none', backgroundColor: '#F0F2F5', padding: '0 16px', fontSize: '15px', outline: 'none' }}
        />
        <button type="submit" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
