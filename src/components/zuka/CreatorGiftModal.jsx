import React, { useState } from 'react';
import { X, Sparkles, EyeOff, Eye, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AMOUNTS = Array.of(500, 1000, 2000, 5000, 10000);
const PROVIDERS = ['M-Pesa', 'Mixx by Yas', 'Airtel Money', 'Halopesa'];

export default function CreatorGiftModal({ post, currentUserId, isOwner, hideGifts, onTogglePrivacy, onSent, onClose }) {
  const [amount, setAmount] = useState(1000);
  const [provider, setProvider] = useState('M-Pesa');
  const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const handleSend = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 100 || sending) return;
    setSending(true);
    try {
      await supabase.from('creator_tips').insert({ post_id: String(post.id), sender_id: currentUserId || null, receiver_id: post.user_id, amount: Number(amount), provider, phone, message });
      setDone(true); onSent?.();
    } catch {}
    setSending(false);
  };
