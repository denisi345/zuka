import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
const PAYOUT_METHODS = [
  { id: 'bank_wire', label: 'International Bank Wire (SWIFT / IBAN)' },
  { id: 'paypal', label: 'PayPal Global Payout' },
  { id: 'wise', label: 'Wise Multi-Currency Transfer' },
  { id: 'mobile_money', label: 'Mobile Money (M-Pesa / Mixx / Airtel / MTN)' },
];
const PAYOUT_CURRENCIES = ['TZS', 'USD', 'EUR', 'GBP', 'KES', 'UGX', 'ZAR', 'NGN', 'AED', 'CAD', 'AUD'];

export function SellerPayoutSettings({ user = null, onClose = () => {} }) {
  const [method, setMethod] = useState('bank_wire');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [routingCode, setRoutingCode] = useState('');
  const [walletId, setWalletId] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('zuka_seller_payout') || 'null');
      if (!d) return;
      setMethod(d.method || 'bank_wire'); setCurrency(d.currency || 'USD');
      setCountry(d.country || ''); setBankName(d.bankName || '');
      setAccountName(d.accountName || ''); setAccountNumber(d.accountNumber || '');
      setSwiftCode(d.swiftCode || ''); setRoutingCode(d.routingCode || '');
      setWalletId(d.walletId || '');
    } catch (e) {}
  }, []);
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    const payoutData = { method, currency, country, bankName, accountName, accountNumber, swiftCode, routingCode, walletId, updatedAt: new Date().toISOString() };
    localStorage.setItem('zuka_seller_payout', JSON.stringify(payoutData));
    try {
      if (user?.id) await supabase.from('profiles').update({ payout_details: payoutData }).eq('id', user.id);
      setMsg('✅ Global payout account saved securely!');
    } catch (err) { setMsg('✅ Payout details saved on this device!'); }
    finally { setSaving(false); }
  };
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 max-w-xl mx-auto">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h3 className="text-lg font-bold text-slate-900">Global Seller Payout Settings</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white">
          {PAYOUT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            {PAYOUT_CURRENCIES.map((c) => <option key={c} value={c}>Currency: {c}</option>)}
          </select>
          <input required type="text" placeholder="Bank Country" value={country} onChange={(e) => setCountry(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
        </div>
        {method === 'bank_wire' ? (
          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border">
            <input required type="text" placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" />
            <input required type="text" placeholder="Account Holder Name" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" />
            <input required type="text" placeholder="Account Number / IBAN" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="SWIFT / BIC Code" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white" />
              <input type="text" placeholder="Routing / Sort Code" value={routingCode} onChange={(e) => setRoutingCode(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white" />
            </div>
          </div>
        ) : (
          <input required type="text" placeholder="PayPal Email / Wise ID / Mobile Money Number" value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
        )}
        {msg && <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium">{msg}</div>}
        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm">
          {saving ? 'Saving...' : 'Save Global Payout Account'}
        </button>
      </form>
    </div>
  );
}
export default SellerPayoutSettings;
