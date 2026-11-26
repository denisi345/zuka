import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Search, X, Clock, MoreHorizontal,
  UserPlus, Check, FileText, Film, ShoppingBag,
  Flag, Users, MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const RECENT_KEY = 'zuka_recent_searches_v2';

export default function GlobalSearch(props) {
  const {
    currentUser, onBack, onOpenUserProfile,
    onOpenMessenger, onOpenReel, onOpenTab
  } = props;
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState([]);
  const [sentIds, setSentIds] = useState({});
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [results, setResults] = useState({
    people: [], posts: [], reels: [],
    market: [], pages: [], groups: []
  });

export default function GlobalSearch(props) {
  const { currentUser, onBack, onOpenUserProfile, onOpenMessenger, onOpenReel, onOpenTab } = props;
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState([]);
  const [sentIds, setSentIds] = useState({});
;
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
    catch { return []; }
  });
  const [results, setResults] = useState({ people: [], posts: [], reels: [], market: [], pages: [], groups: [] });
  useEffect(() => {
    supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified').neq('id', currentUser?.id || '').limit(8).then(({ data }) => { if (data) setSuggested(data); });
  }, [currentUser?.id]);
  const saveRecent = (term) => {
    const c = term.trim(); if (!c) return;
    const next = [c, ...recent.filter((x) => x.toLowerCase() !== c.toLowerCase())].slice(0, 8);
    setRecent(next); try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {} };
  };
  const removeRecent = (term) => {
    const next = recent.filter((x) => x !== term);
    setRecent(next); try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };
  const safeQuery = async (tables, fn) => {
    for (const t of tables) {
      try { const { data, error } = await fn(supabase.from(t)); if (!error && Array.isArray(data)) return data; } catch {}
    }
    return [];
  };
    for (const t of tables) {
      try { const { data, error } = await fn(supabase.from(t)); if (!error && Array.isArray(data)) return data; } catch {}
    }
    return [];
  };
  const sendFriendReq = async (targetId) => {
    setSentIds((prev) => ({ ...prev, [targetId]: true }));
    try { await supabase.from('friendships').insert({ requester_id: currentUser?.id, addressee_id: targetId, status: 'pending' }); } catch {}
  };
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults({ people: [], posts: [], reels: [], market: [], pages: [], groups: [] }); setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const p = `%${q}%`;
      const [people, posts, reels, market, pages, groups] = await Promise.all([
        safeQuery(['profiles'], (tb) => tb.select('id, full_name, username, avatar_url, is_verified, bio').or(`full_name.ilike.${p},username.ilike.${p}`).limit(15)),
        safeQuery(['posts'], (tb) => tb.select('id, user_id, content, image_url, video_url, created_at, profiles:user_id(id, full_name, avatar_url, is_verified)').ilike('content', p).order('created_at', { ascending: false }).limit(15)),
                safeQuery(['reels'], (tb) => tb.select('id, user_id, caption, video_url, thumbnail_url, created_at').ilike('caption', p).limit(12)),
        safeQuery(['marketplace_items', 'marketplace_listings'], (tb) => tb.select('*').or(`title.ilike.${p},description.ilike.${p}`).limit(12)),
        safeQuery(['pages', 'zuka_pages'], (tb) => tb.select('*').or(`name.ilike.${p},category.ilike.${p}`).limit(10)),
        safeQuery(['groups', 'zuka_groups'], (tb) => tb.select('*').or(`name.ilike.${p},description.ilike.${p}`).limit(10)),
      ]);
      setResults({ people, posts, reels, market, pages, groups }); setLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);
      ]);
      setResults({ people, posts, reels, market, pages, groups });
      setLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);
  const VerifiedTick = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2" style={{ flexShrink: 0 }}><path d="M12 2L14.8 4.2L18.4 4L19.6 7.4L22.4 9.6L21.4 13L22.4 16.4L19.6 18.6L18.4 22L14.8 21.8L12 24L9.2 21.8L5.6 22L4.4 18.6L1.6 16.4L2.6 13L1.6 9.6L4.4 7.4L5.6 4L9.2 4.2L12 2Z"/><path d="M9.5 12.5L11.2 14.2L15 10.2" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
  );
  const TABS = [
        { id: 'all', label: 'All' }, { id: 'people', label: 'People' }, { id: 'posts', label: 'Posts' }, { id: 'reels', label: 'Reels' }, { id: 'market', label: 'Marketplace' }, { id: 'communities', label: 'Pages { id: 'all', label: 'All' }, { id: 'people', label: `People (${results.people.length})` }, { id: 'posts', label: `Posts (${results.posts.length})` }, { id: 'reels', label: `Reels (${results.reels.length})` }, { id: 'market', label: `Marketplace (${results.market.length})` }, { id: 'communities', label: `Pages & Groups (${results.pages.length + results.groups.length})` } Groups' } ];
  ];
  const totalCount = results.people.length + results.posts.length + results.reels.length + results.market.length + results.pages.length + results.groups.length;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, backgroundColor: '#FFFFFF', overflowY: 'auto', paddingBottom: '32px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#FFFFFF', padding: '10px 12px', borderBottom: '1px solid #E4E6EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={onBack} style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer' }}><ChevronLeft size={26} color="#050505" /></button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: '999px', padding: '0 14px', height: '38px' }}>
            <input type="text" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveRecent(query); }} placeholder="Search..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: '#050505' }} />
                        {query && <button type="button" onClick={() => setQuery("")} style={{ border: "none", background: "#CED0D4", borderRadius: "50%", width: "18px", height: "18px" }}><X size={12} /></button>}
          </div>
          <button type="button" onClick={() => saveRecent(query)} style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer' }}><Search size={21} color="#050505" /></button>
        </div>
          </div>
          <button type="button" onClick={() => saveRecent(query)} style={{ border: 'none', background: 'none', padding: '4px' }}><Search size={21} color="#050505" /></button>
        </div>
        {query.trim() && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '10px' }}>
            {TABS.map((t) => <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: '999px', border: 'none', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: tab === t.id ? '#E7F3FF' : '#F0F2F5', color: tab === t.id ? '#1877F2' : '#050505' }}>{t.label}</button>)}
          </div>
        )}
      </div>
      <div style={{ padding: '12px' }}>
        {!query.trim() ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '17px', color: '#050505' }}>Recent</span>
                            {recent.length > 0 && <button type="button" onClick={() => { setRecent([]); localStorage.removeItem(RECENT_KEY); }} style={{ border: "none", background: "none", color: "#1877F2", fontWeight: 600 }}>Clear all</button>}
            </div>
            </div>
            {recent.map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <button type="button" onClick={() => setQuery(item)} style={{ display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'none', flex: 1, textAlign: 'left', fontSize: '15px', fontWeight: 500 }}><Clock size={18} color="#65676B" /><span>{item}</span></button>
                <button type="button" onClick={() => removeRecent(item)} style={{ border: 'none', background: 'none', padding: '4px' }}><MoreHorizontal size={18} color="#65676B" /></button>
              </div>
            ))}
