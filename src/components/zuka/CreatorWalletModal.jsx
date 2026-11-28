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
  return null;
}
