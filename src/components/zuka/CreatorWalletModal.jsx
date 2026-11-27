import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CreatorWalletModal({ currentUser, onClose }) {
  const [tips, setTips] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [policy, setPolicy] = useState({ min_payout_tzs: 0, min_payout_usd: 0 });
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('M-Pesa');
  const [account, setAccount] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const loadWallet = async () => {
    if (!currentUser?.id) return;
    const { data: s } = await supabase.from('system_settings').select('min_payout_tzs,min_payout_usd').eq('id', 1).maybeSingle();
    if (s) setPolicy((p) => ({ ...p, ...s }));
    const { data: t } = await supabase.from('creator_tips').select('id,amount,creator_net,commission_amount,provider,created_at').eq('receiver_id', currentUser.id).eq('payment_status', 'paid').order('created_at', { ascending: false }).limit(20);
    if (t) setTips(t);
    const { data: p } = await supabase.from('payout_requests').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
    if (p) setPayouts(p);
  };

  useEffect(() => { loadWallet(); }, [currentUser?.id]);

  const earned = tips.reduce((sum, x) => sum + Number(x.creator_net ?? x.amount ?? 0), 0);
  const withdrawn = payouts.filter((x) => x.status !== 'rejected').reduce((sum, x) => sum + Number(x.amount || 0), 0);
  const balance = Math.max(0, earned - withdrawn);
  const minPayout = Number(policy.min_payout_tzs || 0);

  const handleRequest = async (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!currentUser?.id || loading || val <= 0 || val > balance || val < minPayout || !account.trim()) return;
    setLoading(true);
    try {
      await supabase.from('payout_requests').insert({ user_id: currentUser.id, amount: val, currency: 'TZS', payment_provider: provider, payout_account: account.trim() });
      setAmount(''); setMsg('Payout request sent!'); loadWallet();
    } catch (err) {}
    setLoading(false);
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto', backgroundColor: '#FFF', borderRadius: '14px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#65676B' }}>Total Earned: TZS {earned.toLocaleString()} | Min Payout: TZS {minPayout.toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/?support=${currentUser?.id}`); setMsg("Support link copied!"); }} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #1877F2", backgroundColor: "#FFF", color: "#1877F2", fontWeight: 700, fontSize: "12px" }}>Copy Support Link</button>
          <a href={`https://wa.me${encodeURIComponent("Support me on ZUKA: " + window.location.origin + "/?support=" + (currentUser?.id || ""))}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "8px", borderRadius: "8px", backgroundColor: "#25D366", color: "#FFF", fontWeight: 700, fontSize: "12px", textAlign: "center", textDecoration: "none" }}>Share WhatsApp</a>
        </div>
        <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Withdraw Amount (TZS)" style={{ padding: '9px', borderRadius: '8px', border: '1px solid #CED0D4' }} />
          <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ padding: '9px', borderRadius: '8px', border: '1px solid #CED0D4' }}>
            <option>M-Pesa</option><option>Mixx by Yas</option><option>Airtel Money</option><option>HaloPesa</option><option>T-Pesa</option><option>AzamPesa</option><option>PayPal</option>
          </select>
          <input type="text" required value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Your Phone or PayPal Email" style={{ padding: '9px', borderRadius: '8px', border: '1px solid #CED0D4' }} />
          <button type="submit" disabled={loading || balance < minPayout || balance <= 0} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700 }}>{loading ? 'Sending...' : 'Request Payout'}</button>
          {msg && <div style={{ color: 'green', fontSize: '12px', fontWeight: 700 }}>{msg}</div>}
        </form>
        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>Payout History ({payouts.length})</div>
        {payouts.map((p) => <div key={p.id} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #F0F2F5' }}>TZS {Number(p.amount).toLocaleString()} ({p.payment_provider}) — <b>{p.status}</b></div>)}
      </div>
    </div>
  );
}
