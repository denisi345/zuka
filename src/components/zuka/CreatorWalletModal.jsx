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
    const { data: t } = await supabase.from('creator_tips').select('id,amount,creator_net,commission_amount,provider,created_at').eq('receiver_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
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
          <div style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Wallet size={18} color="#1877F2" /><span>Creator Wallet (Private)</span></div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#F0F2F5', borderRadius: '50%', width: '30px', height: '30px' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#E7F3FF', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#65676B' }}>Available Balance (Net after commission)</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1877F2' }}>TZS {balance.toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: '#65676B' }}>Total Earned: TZS {earned.toLocaleString()} | Min Payout: TZS {minPayout.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
