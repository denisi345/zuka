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
        safeQuery(['reels'], (tb) => tb.select('id, user_id, caption, video_url, thumbnail_url, created_at, profiles:user_id(id, full_name, avatar_url, is_verified)').ilike('caption', p).order('created_at', { ascending: false }).limit(12)),
