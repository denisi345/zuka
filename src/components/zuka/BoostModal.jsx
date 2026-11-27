import React, { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function BoostModal({ targetType = 'post', targetId, currentUserId, onClose }) {
  const [settings, setSettings] = useState({ boost_price_tzs: 5000, boost_price_usd: 2 });
  const [currency, setCurrency] = useState('TZS');
  const [days, setDays] = useState(3);
  const [provider, setProvider] = useState('M-Pesa');
  const [account, setAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    supabase.from('system_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setSettings((prev) => ({ ...prev, ...data }));
    }).catch(() => {});
  }, []);

  const unit = currency === 'TZS' ? Number(settings.boost_price_tzs || 5000) : Number(settings.boost_price_usd || 2);
  const amount = unit * Number(days || 1);
  const payTo = provider === 'M-Pesa' ? settings.mpesa_number : provider === 'Tigo Pesa' ? settings.tigopesa_number : provider === 'Airtel Money' ? settings.airtelmoney_number : settings.paypal_email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId || !account.trim() || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('payment_requests').insert({ user_id: currentUserId, request_type: 'boost', target_type: targetType, target_id: String(targetId || ''), duration_days: Number(days), amount, currency, payment_provider: provider, payer_account: account.trim() });
      setSubmitted(true);
    } catch (err) {}
    setSubmitting(false);
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', backgroundColor: '#FFF', borderRadius: '14px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={18} color="#1877F2" /><span>Boost {targetType === 'reel' ? 'Reel' : 'Post'}</span></div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#F0F2F5', borderRadius: '50%', width: '30px', height: '30px' }}><X size={16} /></button>
        </div>
        {submitted ? <div style={{ textAlign: 'center', padding: '16px', color: '#1877F2', fontWeight: 700 }}>Boost request sent for approval.</div> : null}
      </div>
    </div>
  );
}
