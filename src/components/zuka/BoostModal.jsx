import React, { useState, useEffect } from 'react';
import { X, TrendingUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const FX = {
  USD: { symbol: '$', rate: 1 }, EUR: { symbol: '€', rate: 0.92 }, GBP: { symbol: '£', rate: 0.79 },
  TZS: { symbol: 'TZS ', rate: null }, KES: { symbol: 'KES ', rate: 129 }, UGX: { symbol: 'UGX ', rate: 3700 },
  NGN: { symbol: '₦', rate: 1550 }, ZAR: { symbol: 'R', rate: 18 }, INR: { symbol: '₹', rate: 84 }, AED: { symbol: 'AED ', rate: 3.67 }
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

export default function BoostModal({ targetType = 'post', targetId, currentUserId, onClose }) {
  const [settings, setSettings] = useState({ boost_price_tzs: 0, boost_price_usd: 0 });
  const [currency, setCurrency] = useState('USD');
  const [days, setDays] = useState(3);
  const [goal, setGoal] = useState('Reach & Engagement');
  const [audience, setAudience] = useState('AI Advantage+ (Tanzania & Global)');
  const [provider, setProvider] = useState('M-Pesa');
  const [account, setAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.from('system_settings').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data) setSettings((prev) => ({ ...prev, ...data })); }).catch(() => {});
  }, new Array());

  const fx = FX[currency] || FX.USD;
  const unit = currency === 'TZS' ? Number(settings.boost_price_tzs || 0) : Math.round(Number(settings.boost_price_usd || 0) * fx.rate * 100) / 100;
  const amount = Math.round(unit * Number(days || 1) * 100) / 100;
  const payTo = provider === "M-Pesa" ? settings.mpesa_number : provider === "Mixx by Yas" ? settings.tigopesa_number : provider === "Airtel Money" ? settings.airtelmoney_number : provider === "HaloPesa" ? settings.halopesa_number : provider === "T-Pesa" ? settings.tpesa_number : provider === "AzamPesa" ? settings.azampesa_number : settings.paypal_email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId || !account.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data: reqRow } = await supabase.from('payment_requests').insert({ user_id: currentUserId, request_type: 'boost', target_type: targetType, target_id: String(targetId || ''), duration_days: Number(days), amount, currency, payment_provider: provider, payer_account: account.trim() }).select('id').single();
      const isCard = !/M-Pesa|Mixx|Airtel|HaloPesa|T-Pesa|AzamPesa/i.test(provider);
      const { data: fw, error: fwErr } = await supabase.functions.invoke('gift-stk-push', { body: { reqId: reqRow?.id, payType: `ZUKA AI Boost (${goal})`, amount, currency, provider, phone: account.trim(), isCard } });
      if (fwErr) throw fwErr;
      if (fw?.checkoutUrl) { window.location.href = fw.checkoutUrl; return; }
      setSubmitted(true);
    } catch (_) {} finally { setSubmitting(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 14000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', backgroundColor: '#FFF', borderRadius: '16px', padding: '16px', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '16px' }}><TrendingUp size={18} color="#1877F2" /><span>Boost {targetType}</span></div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#F0F2F5', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={40} color="#16A34A" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Boost Request Submitted!</div>
            <div style={{ fontSize: '13px', color: '#65676B', marginBottom: '12px' }}>Amount: <b>{fx.symbol}{amount.toLocaleString()}</b> ({days} days).{payTo ? ` Send to: ${payTo}` : ''}</div>
            <button type="button" onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700 }}>Done</button>
          </div>
        ) : (
          <><div style={{ backgroundColor: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px', marginBottom: '10px', fontSize: '12px' }}><div style={{ fontWeight: 700, color: '#1877F2', marginBottom: '4px' }}>✨ ZUKA Ads AI (Advantage+)</div><div>Est. Reach: <b>{(days * 1850).toLocaleString()} – {(days * 4200).toLocaleString()} people</b> • Auto-Review: <b>Active</b></div></div><form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #CCD0D5', fontSize: '14px', fontWeight: 700 }}>{Object.keys(FX).map((c) => <option key={c} value={c}>{c}</option>)}</select>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #CCD0D5', fontSize: '14px', fontWeight: 600 }}>{new Array(1, 3, 7, 14, 30).map((d) => <option key={d} value={d}>{d} {d === 1 ? 'Day' : 'Days'}</option>)}</select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PROVIDERS.map((p) => (
                <button key={p.id} type="button" onClick={() => setProvider(p.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '10px', border: provider === p.id ? '2px solid #1877F2' : '1px solid #CCD0D5', backgroundColor: provider === p.id ? '#E7F3FF' : '#FFF', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ backgroundColor: p.bg, color: p.fg, fontWeight: 800, fontSize: '10px', padding: '3px 6px', borderRadius: '6px', flexShrink: 0 }}>{p.badge}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.id}</span>
                </button>
              ))}
            </div>
            <input type="text" required value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Your Phone Number or Account Email" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CCD0D5', fontSize: '14px', boxSizing: 'border-box' }} />
            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>{submitting ? 'Submitting...' : `Pay ${fx.symbol}${amount.toLocaleString()}`}</button>
          </form></>
        )}
      </div>
    </div>
  );
}
