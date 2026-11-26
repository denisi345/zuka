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
      setDone(true); onSent?.();
    } catch {}
    setSending(false);
  };
  return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 13800, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', backgroundColor: '#FFF', borderRadius: '18px 18px 0 0', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={18} color="#F59E0B" /><span>Send Creator Gift</span></div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#F0F2F5', borderRadius: '50%', width: '30px', height: '30px' }}><X size={16} /></button>
        </div>
