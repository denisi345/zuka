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
