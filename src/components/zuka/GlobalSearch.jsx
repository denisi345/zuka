import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, X, Clock, User, FileText, Film, ShoppingBag, Flag, Users, MessageCircle, BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const RECENT_KEY = 'zuka_recent_searches_v1';

export default function GlobalSearch({ currentUser, onBack, onOpenUserProfile, onOpenMessenger, onOpenReel, onOpenTab }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  });
  const [results, setResults] = useState({ people: [], posts: [], reels: [], market: [], pages: [], groups: [] });

  const saveRecent = (term) => {
    const clean = term.trim();
    if (!clean) return;
    const next = [clean, ...recent.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };

  const removeRecent = (term) => {
    const next = recent.filter((x) => x !== term);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };

  const safeQuery = async (tables, buildFn) => {
    for (const tbl of tables) {
      try {
        const { data, error } = await buildFn(supabase.from(tbl));
        if (!error && Array.isArray(data)) return data;
      } catch {}
    }
    return [];
  };

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({ people: [], posts: [], reels: [], market: [], pages: [], groups: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const p = `%${q}%`;
      const [people, posts, reels, market, pages, groups] = await Promise.all([
        safeQuery(['profiles'], (tb) => tb.select('id, full_name, username, avatar_url, is_verified, bio').or(`full_name.ilike.${p},username.ilike.${p}`).limit(15)),
        safeQuery(['posts'], (tb) => tb.select('id, user_id, content, image_url, video_url, created_at, profiles:user_id(id, full_name, avatar_url, is_verified)').ilike('content', p).order('created_at', { ascending: false }).limit(15)),
        safeQuery(['reels'], (tb) => tb.select('id, user_id, caption, video_url, thumbnail_url, created_at, profiles:user_id(id, full_name, avatar_url, is_verified)').ilike('caption', p).order('created_at', { ascending: false }).limit(12)),
        safeQuery(['marketplace_items', 'marketplace_listings', 'marketplace'], (tb) => tb.select('*').or(`title.ilike.${p},description.ilike.${p}`).order('created_at', { ascending: false }).limit(12)),
        safeQuery(['pages', 'zuka_pages'], (tb) => tb.select('*').or(`name.ilike.${p},category.ilike.${p}`).limit(10)),
        safeQuery(['groups', 'zuka_groups'], (tb) => tb.select('*').or(`name.ilike.${p},description.ilike.${p}`).limit(10)),
      ]);
      setResults({ people, posts, reels, market, pages, groups });
      setLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const TABS = [
    { id: 'all', label: 'All' },
    { id: 'people', label: `People (${results.people.length})` },
    { id: 'posts', label: `Posts (${results.posts.length})` },
    { id: 'reels', label: `Reels (${results.reels.length})` },
    { id: 'market', label: `Marketplace (${results.market.length})` },
    { id: 'communities', label: `Pages & Groups (${results.pages.length + results.groups.length})` },
  ];
  const totalCount = results.people.length + results.posts.length + results.reels.length + results.market.length + results.pages.length + results.groups.length;

  return (
    <div style={{ backgroundColor: '#F0F2F5', minHeight: 'calc(100vh - 56px)', paddingBottom: '32px' }}>
      <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderBottom: '1px solid #E4E6EB', position: 'sticky', top: '56px', zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={onBack} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><ArrowLeft size={20} color="#050505" /></button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: '999px', padding: '0 12px', height: '40px' }}>
            <Search size={18} color="#65676B" style={{ flexShrink: 0 }} />
            <input type="text" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveRecent(query); }} placeholder="Search Zuka" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 8px', fontSize: '15px', color: '#050505' }} />
            {query && <button type="button" onClick={() => setQuery('')} style={{ border: 'none', background: '#CED0D4', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={13} color="#050505" /></button>}
          </div>
        </div>
        {query.trim() && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '10px', paddingBottom: '2px' }} className="no-scrollbar">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: '999px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: tab === t.id ? '#E7F3FF' : '#F0F2F5', color: tab === t.id ? '#1877F2' : '#050505' }}>{t.label}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '12px' }}>
        {!query.trim() ? (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#050505' }}>Recent searches</span>
              {recent.length > 0 && <button type="button" onClick={() => { setRecent([]); localStorage.removeItem(RECENT_KEY); }} style={{ border: 'none', background: 'none', color: '#1877F2', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Clear all</button>}
            </div>
            {recent.length === 0 ? <p style={{ color: '#65676B', fontSize: '14px', margin: '12px 0', textAlign: 'center' }}>No recent searches. Search for people, posts, reels, or items.</p> : recent.map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', borderBottom: '1px solid #F0F2F5' }}>
                <button type="button" onClick={() => setQuery(item)} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'none', cursor: 'pointer', flex: 1, textAlign: 'left', color: '#050505', fontSize: '15px' }}><Clock size={16} color="#65676B" /><span>{item}</span></button>
                <button type="button" onClick={() => removeRecent(item)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}><X size={16} color="#65676B" /></button>
              </div>
            ))}
          </div>
        ) : loading ? <div style={{ textAlign: 'center', padding: '36px', color: '#65676B', fontWeight: 600 }}>Searching Zuka...</div> : totalCount === 0 ? <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '28px 16px', textAlign: 'center', color: '#65676B' }}>No results found for <strong>"{query}"</strong></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(tab === 'all' || tab === 'people') && results.people.length > 0 && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={17} color="#1877F2" /> People</div>
                {results.people.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0F2F5' }}>
                    <div onClick={() => { saveRecent(query); onOpenUserProfile?.(p.id); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                      <img src={p.avatar_url || '/placeholder.svg'} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#E4E6EB' }} />
                      <div><div style={{ fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}>{p.full_name || p.username || 'Zuka User'}{p.is_verified && <BadgeCheck size={15} color="#1877F2" />}</div>{p.bio && <div style={{ fontSize: '12px', color: '#65676B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.bio}</div>}</div>
                    </div>
                    {p.id !== currentUser?.id && <button type="button" onClick={() => { saveRecent(query); onOpenMessenger?.(p); }} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#E7F3FF', color: '#1877F2', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><MessageCircle size={14} /> Message</button>}
                  </div>
                ))}
              </div>
            )}
