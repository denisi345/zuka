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
