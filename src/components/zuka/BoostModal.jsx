import React, { useState, useEffect } from 'react';
import { X, TrendingUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const FX = {
  USD: { symbol: '$', rate: 1 }, EUR: { symbol: '€', rate: 0.92 }, GBP: { symbol: '£', rate: 0.79 },
  TZS: { symbol: 'TZS ', rate: null }, KES: { symbol: 'KES ', rate: 129 }, UGX: { symbol: 'UGX ', rate: 3700 },
  NGN: { symbol: '₦', rate: 1550 }, ZAR: { symbol: 'R', rate: 18 }, INR: { symbol: '₹', rate: 84 }, AED: { symbol: 'AED ', rate: 3.67 }
};

const PROVIDERS = new Array(
  { id: 'M-Pesa', badge: 'M-PESA', bg: '#E60000', fg: '#FFF' },
  { id: 'Mixx by Yas', badge: 'yas', bg: '#FFD100', fg: '#002B49' },
  { id: 'Airtel Money', badge: 'airtel', bg: '#ED1C24', fg: '#FFF' },
  { id: 'Visa / Mastercard', badge: 'VISA / MC', bg: '#1A1F71', fg: '#FFF' },
  { id: 'PayPal', badge: 'PayPal', bg: '#003087', fg: '#FFF' },
  { id: 'Apple / Google Pay', badge: 'G /  Pay', bg: '#111827', fg: '#FFF' }
);

export default function BoostModal({ targetType = 'post', targetId, currentUserId, onClose }) {
  const [settings, setSettings] = useState({ boost_price_tzs: 0, boost_price_usd: 0 });
  const [currency, setCurrency] = useState('USD');
  const [days, setDays] = useState(3);
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
  const payTo = provider === 'M-Pesa' ? settings.mpesa_number : provider === 'Mixx by Yas' ? settings.tigopesa_number : provider === 'Airtel Money' ? settings.airtelmoney_number : settings.paypal_email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId || !account.trim() || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('payment_requests').insert({ user_id: currentUserId, request_type: 'boost', target_type: targetType, target_id: String(targetId || ''), duration_days: Number(days), amount, currency, payment_provider: provider, payer_account: account.trim() });
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
