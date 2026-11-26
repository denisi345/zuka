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
