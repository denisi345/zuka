import React, { useState, useEffect } from 'react';
import { X, Wallet, Copy, Share2, ArrowDownToLine, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CreatorWalletModal({ currentUser, onClose }) {
  const [tips, setTips] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [policy, setPolicy] = useState({ min_payout_tzs: 5000, min_payout_usd: 2 });
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('M-Pesa');
  const [account, setAccount] = useState('');
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const loadWallet = async () => {
    if (!currentUser?.id) return;
    const { data: s } = await supabase.from('system_settings').select('min_payout_tzs,min_payout_usd').eq('id', 1).maybeSingle();
    if (s) setPolicy({ min_payout_tzs: Number(s.min_payout_tzs) > 0 ? Number(s.min_payout_tzs) : 5000, min_payout_usd: Number(s.min_payout_usd) > 0 ? Number(s.min_payout_usd) : 2 });
    const { data: t } = await supabase.from('creator_tips').select('id,amount,creator_net,created_at').eq('receiver_id', currentUser.id).eq('payment_status', 'paid').order('created_at', { ascending: false }).limit(20);
    if (t) setTips(t);
    const { data: p } = await supabase.from('payout_requests').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
    if (p) setPayouts(p);
  };
  useEffect(() => { loadWallet(); }, [currentUser?.id]);
  const earned = tips.reduce((sum, x) => sum + Number(x.creator_net ?? x.amount ?? 0), 0);
  const withdrawn = payouts.filter((x) => x.status !== 'rejected').reduce((sum, x) => sum + Number(x.amount || 0), 0);
  const balance = Math.max(0, earned - withdrawn);
  const minPayout = Number(policy.min_payout_tzs || 5000);
  const canWithdraw = !loading && balance >= minPayout && balance > 0;
  const supportUrl = `${window.location.origin}/?support=${currentUser?.id || ''}`;
  const whatsappUrl = `https://wa.me{encodeURIComponent('Support me on ZUKA: ' + supportUrl)}`;
  const handleRequest = async (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!currentUser?.id || loading) return;
    if (val < minPayout) return setMsg({ text: `Minimum payout is TZS ${minPayout.toLocaleString()}`, type: 'error' });
    if (val > balance) return setMsg({ text: 'Amount exceeds your available balance.', type: 'error' });
    if (!account.trim()) return setMsg({ text: 'Enter your mobile money number or PayPal email.', type: 'error' });
    setLoading(true); setMsg({ text: '', type: 'info' });
    try {
      const { error } = await supabase.from('payout_requests').insert({ user_id: currentUser.id, amount: val, currency: 'TZS', payment_provider: provider, payout_account: account.trim() });
      if (error) throw error;
      setAmount(''); setMsg({ text: 'Payout request submitted successfully!', type: 'success' }); await loadWallet();
    } catch (err) { setMsg({ text: err?.message || 'Failed to submit payout request.', type: 'error' }); }
    setLoading(false);
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '430px', maxHeight: '88vh', overflowY: 'auto', backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #E4E6EB', position: 'sticky', top: 0, backgroundColor: '#FFF', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#E7F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1877F2' }}><Wallet size={18} /></div>
            <div><div style={{ fontWeight: 800, fontSize: '16px', color: '#050505' }}>Creator Wallet</div><div style={{ fontSize: '11px', color: '#65676B' }}>Earnings & Payouts</div></div>
          </div>
          <button type="button" onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#050505' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #1877F2, #0D5BD3)', borderRadius: '14px', padding: '16px', color: '#FFF', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 600 }}>Available Balance</div>
            <div style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0 10px' }}>TZS {balance.toLocaleString()}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.14)', padding: '8px 10px', borderRadius: '8px' }}>
              <span>Earned: <b>TZS {earned.toLocaleString()}</b></span><span>Withdrawn: <b>TZS {withdrawn.toLocaleString()}</b></span><span>Min: <b>TZS {minPayout.toLocaleString()}</b></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(supportUrl); setMsg({ text: 'Support link copied!', type: 'success' }); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #1877F2', backgroundColor: '#E7F3FF', color: '#1877F2', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Copy size={14} /> Copy Support Link</button>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: '#25D366', color: '#FFF', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}><Share2 size={14} /> Share WhatsApp</a>
          </div>
        <form onSubmit={handleRequest} style={{ display: "flex", flexDirection: "column", gap: "9px", backgroundColor: "#F7F8FA", padding: "12px", borderRadius: "12px", border: "1px solid #E4E6EB", marginBottom: "14px" }}><div style={{ fontSize: "13px", fontWeight: 700, color: "#050505" }}>Withdraw Funds</div><div style={{ display: "flex", gap: "6px" }}><input type="number" min={minPayout} max={balance || undefined} required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={"Amount (Min " + minPayout.toLocaleString() + " TZS)"} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #CED0D4", fontSize: "13px" }} />{balance > 0 && <button type="button" onClick={() => setAmount(String(balance))} style={{ padding: "0 12px", borderRadius: "8px", border: "1px solid #1877F2", backgroundColor: "#FFF", color: "#1877F2", fontWeight: 700, fontSize: "12px" }}>Max</button>}</div><select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #CED0D4", fontSize: "13px", backgroundColor: "#FFF" }}><option>M-Pesa</option><option>Mixx by Yas</option><option>Airtel Money</option><option>HaloPesa</option><option>T-Pesa</option><option>AzamPesa</option><option>PayPal</option></select><input type="text" required value={account} onChange={(e) => setAccount(e.target.value)} placeholder={provider === "PayPal" ? "Your PayPal Email" : "Mobile Number (e.g. 07XXXXXXXX)"} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #CED0D4", fontSize: "13px" }} /><button type="submit" disabled={!canWithdraw} style={{ padding: "11px", borderRadius: "8px", border: "none", backgroundColor: canWithdraw ? "#1877F2" : "#BCC0C4", color: "#FFF", fontWeight: 700, fontSize: "14px", cursor: canWithdraw ? "pointer" : "not-allowed" }}>{loading ? "Sending..." : balance < minPayout ? "Min Balance TZS " + minPayout.toLocaleString() + " Required" : "Request Payout"}</button>{msg.text && <div style={{ padding: "8px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, backgroundColor: msg.type === "error" ? "#FFEBEE" : "#E8F5E9", color: msg.type === "error" ? "#C62828" : "#2E7D32" }}>{msg.text}</div>}</form></div></div></div>
  );
}
