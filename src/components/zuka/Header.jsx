import React, { useState, useEffect } from 'react';
import { Home, Users, MessageCircle, Film, Bell, Store, Plus, Search, Menu, SquarePen, CirclePlus, Clapperboard, MessageSquareQuote, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Header({ activeTab, setActiveTab, onOpenMenu, unreadCount = 0, userProfile }) {
    const [badges, setBadges] = useState({ feed: 0, friends: 0, messenger: 0, reels: 0, notifications: 0, marketplace: 0 });
  useEffect(() => { const now = new Date().toISOString(); if (["feed", "reels", "marketplace"].includes(activeTab)) { try { localStorage.setItem("zuka_seen_" + activeTab, now); supabase.auth.getUser().then(({ data }) => { if (data?.user?.id) supabase.from("user_tab_views").upsert({ user_id: data.user.id, tab_name: activeTab, last_seen_at: now }); }).catch(() => {}); } catch (_) {} setBadges((b) => ({ ...b, [activeTab]: 0 })); } }, [activeTab]);
  useEffect(() => { try { let live = true; async function loadCounts() { try { const { data: au } = await supabase.auth.getUser(); const uid = au?.user?.id; const getSince = (k) => { try { return localStorage.getItem("zuka_seen_" + k) || new Date(Date.now() - 86400000).toISOString(); } catch (_) { return new Date(Date.now() - 86400000).toISOString(); } }; const [pRes, rRes, mRes] = await Promise.all([supabase.from("posts").select("id", { count: "exact", head: true }).gt("created_at", getSince("feed")), supabase.from("posts").select("id", { count: "exact", head: true }).eq("media_type", "video").gt("created_at", getSince("reels")), supabase.from("marketplace_items").select("id", { count: "exact", head: true }).gt("created_at", getSince("marketplace"))]); let frC = 0, msgC = 0, notC = unreadCount || 0; if (uid) { const [frRes, msRes, ntRes] = await Promise.all([supabase.from("friend_requests").select("id", { count: "exact", head: true }).eq("receiver_id", uid).eq("status", "pending"), supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", uid).eq("is_read", false), supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_read", false)]); frC = frRes.count || 0; msgC = msRes.count || 0; notC = Math.max(notC, ntRes.count || 0); } if (live) setBadges({ feed: pRes.count || 0, friends: frC, messenger: msgC, reels: rRes.count || 0, notifications: notC, marketplace: mRes.count || 0 }); } catch (_) {} } loadCounts(); const iv = setInterval(loadCounts, 12000); const ch = supabase.channel("zuka-hdr-" + Date.now()).on("postgres_changes", { event: "INSERT", schema: "public", table: "friend_requests" }, async (pl) => { loadCounts(); try { const { data: au } = await supabase.auth.getUser(); if (au?.user?.id && String(pl.new?.receiver_id) === String(au.user.id)) { const { data: pr } = await supabase.from("profiles").select("full_name,username").eq("id", pl.new.sender_id).maybeSingle(); firePhoneAlert("ZUKA", (pr?.full_name || pr?.username || "Someone") + " sent you a friend request.", "friends"); } } catch (_) {} }).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (pl) => { loadCounts(); try { const { data: au } = await supabase.auth.getUser(); if (au?.user?.id && String(pl.new?.receiver_id) === String(au.user.id)) firePhoneAlert("ZUKA • " + (pl.new?.sender_name || "New message"), pl.new?.content || "Sent you a message", "messenger"); } catch (_) {} }).on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => loadCounts()).subscribe(); return () => { live = false; clearInterval(iv); try { supabase.removeChannel(ch); } catch (_) {} }; } catch (_) {} }, [unreadCount]);
  useEffect(() => { try { const ask = () => { try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().catch(() => {}); } catch (_) {} window.removeEventListener("pointerdown", ask); }; window.addEventListener("pointerdown", ask, { once: true }); return () => window.removeEventListener("pointerdown", ask); } catch (_) {} }, []);
  function firePhoneAlert(title, body, tab) { try { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) { const ctx = new Ctx(); const osc = ctx.createOscillator(); const g = ctx.createGain(); osc.type = "sine"; osc.frequency.value = 880; g.gain.value = 0.08; osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.14); } } catch (_) {} try { if (typeof Notification !== "undefined" && Notification.permission === "granted") { const n = new Notification(title, { body }); n.onclick = () => { try { window.focus(); if (tab) setActiveTab(tab); n.close(); } catch (_) {} }; } } catch (_) {} }
  const [plusOpen, setPlusOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [postingNote, setPostingNote] = useState(false);

  const navItems = [
    { id: 'feed', icon: Home, label: 'Home', badge: badges.feed },
    { id: 'friends', icon: Users, label: 'Friends', badge: badges.friends },
    { id: 'messenger', icon: MessageCircle, label: 'Messenger', badge: badges.messenger },
    { id: 'reels', icon: Film, label: 'Reels', badge: badges.reels },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: badges.notifications },
    { id: 'marketplace', icon: Store, label: 'Marketplace', badge: badges.marketplace }
  ];

  function triggerAction(type) {
    setPlusOpen(false);
    if (type === 'post') {
      setActiveTab('feed');
      setTimeout(() => window.dispatchEvent(new CustomEvent('zuka:open-post')), 120);
    } else if (type === 'story') {
      setActiveTab('feed');
      setTimeout(() => window.dispatchEvent(new CustomEvent('zuka:open-story')), 120);
    } else if (type === 'reel') {
      setActiveTab('reels');
      setTimeout(() => window.dispatchEvent(new CustomEvent('zuka:open-reel')), 120);
    } else if (type === 'note') {
      setNoteOpen(true);
    }
  }

  async function handlePublishNote(e) {
    e.preventDefault();
    const txt = noteText.trim();
    if (!txt) return;
    setPostingNote(true);
    try {
      const authorName = userProfile?.full_name || userProfile?.username || 'ZUKA Member';
      const payload = { content: `💭 Note: ${txt}`, author_name: authorName, is_verified: Boolean(userProfile?.is_verified) };
      if (userProfile?.id) payload.user_id = userProfile.id;
      await supabase.from('posts').insert(payload);
    } catch (_) {}
    setNoteText('');
    setPostingNote(false);
    setNoteOpen(false);
    setActiveTab('feed');
    window.dispatchEvent(new CustomEvent('zuka:refresh-feed'));
  }
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, backgroundColor: activeTab === "reels" ? "#18191A" : "#FFFFFF", borderBottom: activeTab === "reels" ? "1px solid #242526" : "1px solid #E4E6EB" }}>
      <div style={{ display: activeTab === "reels" ? "none" : "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", height: "52px", position: "relative" }}>
        <button type="button" onClick={() => setActiveTab('feed')} style={{ background: 'none', border: 'none', padding: 0, fontSize: '28px', fontWeight: 800, color: '#1877F2', letterSpacing: '-0.8px', cursor: 'pointer' }}>
          ZUKA
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={() => setPlusOpen(!plusOpen)} aria-label="Create" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: plusOpen ? '#D8DADF' : '#E4E6EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050505', cursor: 'pointer' }}>
            <Plus size={20} />
          </button>
          <button type="button" onClick={() => setActiveTab('friends')} aria-label="Search" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E4E6EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050505', cursor: 'pointer' }}>
            <Search size={20} />
          </button>
          <button type="button" onClick={onOpenMenu} aria-label="Menu" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E4E6EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050505', cursor: 'pointer' }}>
            <Menu size={20} />
          </button>
        </div>

        {plusOpen && (
          <>
            <div onClick={() => setPlusOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 35 }} />
            <div style={{ position: 'absolute', top: '48px', right: '54px', zIndex: 40, width: '185px', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 18px rgba(0,0,0,0.18)', border: '1px solid #E4E6EB', overflow: 'hidden' }}>
              {[
                { id: 'post', label: 'Post', icon: <SquarePen size={20} color="#050505" /> },
                { id: 'story', label: 'Story', icon: <CirclePlus size={20} color="#050505" /> },
                { id: 'reel', label: 'Reel', icon: <Clapperboard size={20} color="#050505" /> },
                { id: 'note', label: 'Note', icon: <MessageSquareQuote size={20} color="#050505" /> }
              ].map((item, idx) => (
                <button key={item.id} type="button" onClick={() => triggerAction(item.id)} style={{ width: '100%', padding: '12px 14px', backgroundColor: '#FFFFFF', border: 'none', borderBottom: idx < 3 ? '1px solid #F0F2F5' : 'none', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 600, color: '#050505', cursor: 'pointer', textAlign: 'left' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <nav style={{ display: 'flex', height: '46px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id; const isReelsDark = activeTab === "reels";
          return (
            <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} aria-label={item.label} style={{ flex: 1, position: 'relative', background: 'none', border: 'none', borderBottom: isActive ? (isReelsDark ? "3px solid #FFFFFF" : "3px solid #1877F2") : "3px solid transparent", display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? (isReelsDark ? "#FFFFFF" : "#1877F2") : (isReelsDark ? "#B0B3B8" : "#65676B"), cursor: 'pointer' }}>
              <Icon size={23} strokeWidth={isActive ? 2.4 : 2} />
              {item.badge > 0 && <span style={{ position: 'absolute', top: '6px', right: '18%', backgroundColor: '#E41E3F', color: '#FFFFFF', fontSize: '10px', fontWeight: 700, borderRadius: '10px', padding: '1px 5px', lineHeight: '14px' }}>{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {noteOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={handlePublishNote} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '17px', color: '#050505' }}>Share a Note</strong>
              <button type="button" onClick={() => setNoteOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505' }}><X size={20} /></button>
            </div>
            <input type="text" maxLength={120} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Share a quick thought (up to 120 chars)..." style={{ padding: '12px', borderRadius: '10px', border: '1px solid #CED0D4', fontSize: '15px' }} />
            <button type="submit" disabled={postingNote} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
              {postingNote ? 'Sharing...' : 'Share Note'}
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
