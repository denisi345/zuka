import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';

const PROVIDERS = ['M-Pesa', 'Mixx by Yas', 'Airtel Money', 'Visa / Mastercard', 'PayPal'];

export default function BlueTickModal({ currentUser, onClose }) {
  const [prices, setPrices] = useState({ tzs: 15000, usd: 6 });
  const [currency, setCurrency] = useState('TZS');
  const [provider, setProvider] = useState('M-Pesa');
  const [account, setAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    supabase.from('platform_settings').select('blue_tick_price_tzs, blue_tick_price_usd').eq('id', 1).maybeSingle().then(({ data }) => { if (data) setPrices({ tzs: Number(data.blue_tick_price_tzs || 15000), usd: Number(data.blue_tick_price_usd || 6) }); });
  }, []);
  const amount = currency === 'TZS' ? prices.tzs : prices.usd;
  const handlePay = async (e) => {
    e.preventDefault();
    if (!currentUser?.id || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('payment_transactions').insert({ user_id: currentUser.id, item_type: 'blue_tick', amount, currency, provider, reference: `BT-${Date.now()}`, status: 'pending' });
      setSubmitted(true);
    } catch {}
    setSubmitting(false);
  };
      setSubmitted(true);
    } catch {}
    setSubmitting(false);
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 13900, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
