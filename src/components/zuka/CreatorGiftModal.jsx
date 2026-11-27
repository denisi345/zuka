import React, { useState, useEffect } from 'react';
import { X, Sparkles, EyeOff, Eye, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CURRENCIES = {
  USD: { symbol: '$', amounts: new Array(1, 5, 10, 25, 50), min: 1 },
  EUR: { symbol: '€', amounts: new Array(1, 5, 10, 25, 50), min: 1 },
  GBP: { symbol: '£', amounts: new Array(1, 5, 10, 25, 50), min: 1 },
  TZS: { symbol: 'TZS ', amounts: new Array(500, 1000, 2000, 5000, 10000), min: 100 },
  KES: { symbol: 'KES ', amounts: new Array(50, 100, 250, 500, 1000), min: 10 },
  UGX: { symbol: 'UGX ', amounts: new Array(1000, 2000, 5000, 10000, 20000), min: 500 },
  NGN: { symbol: '₦', amounts: new Array(500, 1000, 2500, 5000, 10000), min: 100 },
  ZAR: { symbol: 'R', amounts: new Array(10, 25, 50, 100, 250), min: 5 },
  INR: { symbol: '₹', amounts: new Array(50, 100, 250, 500, 1000), min: 10 },
  AED: { symbol: 'AED ', amounts: new Array(5, 10, 25, 50, 100), min: 1 }
};

const PROVIDERS = new Array(
  { id: "M-Pesa", badge: "M-PESA", bg: "#E60000", fg: "#FFF" },
  { id: "Mixx by Yas", badge: "yas", bg: "#FFD100", fg: "#002B49" },
  { id: "Airtel Money", badge: "airtel", bg: "#ED1C24", fg: "#FFF" },
  { id: "HaloPesa", badge: "HaloPesa", bg: "#FF6B00", fg: "#FFF" },
  { id: "T-Pesa", badge: "T-PESA", bg: "#0054A6", fg: "#FFF" },
  { id: "AzamPesa", badge: "AzamPesa", bg: "#0072CE", fg: "#FFF" },
  { id: "Visa / Mastercard", badge: "VISA / MC", bg: "#1A1F71", fg: "#FFF" },
  { id: "PayPal", badge: "PayPal", bg: "#003087", fg: "#FFF" },
  { id: "Apple / Google Pay", badge: "G /  Pay", bg: "#111827", fg: "#FFF" }
);

export default function CreatorGiftModal({ post, currentUserId, isOwner, hideGifts, onTogglePrivacy, onSent, onClose }) {
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState(5);
  const [provider, setProvider] = useState('M-Pesa');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState("form"); const [err, setErr] = useState(""); const [tipId, setTipId] = useState(null);
  const [policy, setPolicy] = useState({ gifts_enabled: true, gift_commission_percent: 0 });
  const curr = CURRENCIES[currency] || CURRENCIES.USD;
  const pickCurr = (c) => { setCurrency(c); setAmount(CURRENCIES[c].amounts.at(1)); };

  useEffect(() => {
    supabase.from('system_settings').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data) setPolicy((p) => ({ ...p, ...data })); }).catch(() => {});
  }, new Array());

  const handleSend = async (e) => {
    e.preventDefault();
    if (policy.gifts_enabled === false || !amount || Number(amount) < curr.min || sending) return;
    const feePct = Number(policy.gift_commission_percent || 0);
    const commission_amount = Math.round((Number(amount) * feePct) / 100);
    setSending(true);
    try {
      await supabase.from('creator_tips').insert({ post_id: String(post.id), sender_id: currentUserId || null, receiver_id: post.user_id, amount: Number(amount), currency, provider, phone, message, commission_percent: feePct, commission_amount, creator_net: Number(amount) - commission_amount });
      setDone(true); if (onSent) onSent();
    } catch (_) {} finally { setSending(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 14000, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', backgroundColor: '#FFF', borderRadius: '16px', padding: '16px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '16px', color: '#050505' }}>
            <Sparkles size={18} color="#F59E0B" /><span>Send Creator Gift</span>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#F0F2F5', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        {isOwner && (
          <button type="button" onClick={onTogglePrivacy} style={{ width: '100%', marginBottom: '12px', padding: '10px', borderRadius: '10px', border: '1px solid #FDE68A', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#92400E', boxSizing: 'border-box' }}>
            <span>{hideGifts ? '✨✨✨ Hidden (Tap to show)' : 'Public count (Tap to hide)'}</span>
            {hideGifts ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={42} color="#16A34A" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>Gift Sent!</div>
            <div style={{ fontSize: '13px', color: '#65676B', marginBottom: '14px' }}>You sent {curr.symbol}{amount} to {post.author_name || 'Creator'}.</div>
            <button type="button" onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700 }}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={currency} onChange={(e) => pickCurr(e.target.value)} style={{ width: '95px', padding: '10px 8px', borderRadius: '10px', border: '1px solid #CCD0D5', fontSize: '14px', fontWeight: 700, backgroundColor: '#F0F2F5' }}>
                {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min={curr.min} value={amount} onChange={(e) => setAmount(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '10px', border: '1px solid #CCD0D5', fontSize: '15px', fontWeight: 600 }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {curr.amounts.map((v) => (
                <button key={v} type="button" onClick={() => setAmount(v)} style={{ flex: '1 1 auto', padding: '7px 10px', borderRadius: '20px', border: Number(amount) === v ? '1.5px solid #F59E0B' : '1px solid #CCD0D5', backgroundColor: Number(amount) === v ? '#FEF3C7' : '#FFF', fontWeight: 700, fontSize: '13px' }}>
                  {curr.symbol}{v.toLocaleString()}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PROVIDERS.map((p) => (
                <button key={p.id} type="button" onClick={() => setProvider(p.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '10px', border: provider === p.id ? '2px solid #1877F2' : '1px solid #CCD0D5', backgroundColor: provider === p.id ? '#E7F3FF' : '#FFF', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ backgroundColor: p.bg, color: p.fg, fontWeight: 800, fontSize: '10px', padding: '3px 6px', borderRadius: '6px', letterSpacing: '0.3px', flexShrink: 0 }}>{p.badge}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.id}</span>
                </button>
              ))}
            </div>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone, Card Last 4, or PayPal Email" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CCD0D5', fontSize: '14px', boxSizing: 'border-box' }} />
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a note (optional)" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CCD0D5', fontSize: '14px', boxSizing: 'border-box' }} />
            <button type="submit" disabled={sending} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#F59E0B', color: '#FFF', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
              {sending ? 'Sending...' : `Send Gift (${curr.symbol}${Number(amount || 0).toLocaleString()}) ✨`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
