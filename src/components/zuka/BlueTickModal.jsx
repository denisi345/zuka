import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';

const PROVIDERS = ['M-Pesa', 'Mixx by Yas', 'Airtel Money', 'Visa / Mastercard', 'PayPal'];

export default function BlueTickModal({ currentUser, onClose }) {
  const [prices, setPrices] = useState({ tzs: 0, usd: 6 });
  const [currency, setCurrency] = useState('TZS');
  const [provider, setProvider] = useState('M-Pesa');
  const [account, setAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    supabase.from('system_settings').select('blue_tick_price_tzs, blue_tick_price_usd').eq('id', 1).maybeSingle().then(({ data }) => { if (data) setPrices({ tzs: Number(data.blue_tick_price_tzs || 0), usd: Number(data.blue_tick_price_usd || 0) }); });
  }, []);
  const amount = currency === 'TZS' ? prices.tzs : prices.usd;
  const handlePay = async (e) => {
    e.preventDefault();
    if (!currentUser?.id || submitting) return;
    setSubmitting(true);
    try {
      const { data: reqRow } = await supabase.from('payment_requests').insert({ user_id: currentUser.id, request_type: 'blue_tick', amount, currency, payment_provider: provider, payment_account: account.trim(), status: 'pending' }).select('id').single();
      const isCard = currency === 'USD' || /Visa|PayPal/i.test(provider);
      const { data: fw } = await supabase.functions.invoke('gift-stk-push', { body: { reqId: reqRow?.id, payType: 'Blue Tick', amount, currency, provider, phone: account.trim(), isCard } });
      if (fw?.checkoutUrl) { window.location.href = fw.checkoutUrl; return; }
      setSubmitted(true);
    } catch (e) {}
    setSubmitting(false);
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 13900, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', backgroundColor: '#FFF', borderRadius: '18px 18px 0 0', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><ZukaBadge size={18} /><span>Get Verified (Blue Tick)</span></div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#F0F2F5', borderRadius: '50%', width: '30px', height: '30px' }}><X size={16} /></button>
        </div>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '18px 0' }}>
            <CheckCircle2 size={42} color="#16A34A" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, fontSize: '16px' }}>Payment Submitted!</div>
            <div style={{ fontSize: '13px', color: '#65676B', marginTop: '4px' }}>Your Blue Tick will activate automatically once payment is confirmed.</div>
            <button type="button" onClick={onClose} style={{ marginTop: '14px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700 }}>Done</button>
          </div>
        ) : (
                    <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setCurrency('TZS')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: currency === 'TZS' ? '2px solid #1877F2' : '1px solid #CED0D4', fontWeight: 700 }}>TZS {prices.tzs.toLocaleString()}</button>
              <button type="button" onClick={() => setCurrency('USD')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: currency === 'USD' ? '2px solid #1877F2' : '1px solid #CED0D4', fontWeight: 700 }}>USD ${prices.usd}</button>
            </div>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #CED0D4', backgroundColor: '#FFF' }}>{PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            <input type="text" required value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Phone or Account Email" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #CED0D4' }} />
            <button type="submit" disabled={submitting} style={{ padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700 }}>{submitting ? 'Processing...' : `Pay ${currency} ${amount.toLocaleString()}`}</button>
          </form>
        )}
      </div>
    </div>
  );
}
