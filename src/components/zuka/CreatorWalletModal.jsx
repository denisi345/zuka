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
  return null;
}
