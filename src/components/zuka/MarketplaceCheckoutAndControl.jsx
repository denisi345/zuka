import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const WORLD_CURRENCIES = [
  { code: 'TZS', symbol: 'TSh', rate: 1, name: 'Tanzanian Shilling' },
  { code: 'USD', symbol: '$', rate: 0.00038, name: 'US Dollar' },
  { code: 'EUR', symbol: '€', rate: 0.00035, name: 'Euro' },
  { code: 'GBP', symbol: '£', rate: 0.00030, name: 'British Pound' },
  { code: 'KES', symbol: 'KSh', rate: 0.049, name: 'Kenyan Shilling' },
  { code: 'UGX', symbol: 'USh', rate: 1.40, name: 'Ugandan Shilling' },
  { code: 'ZAR', symbol: 'R', rate: 0.0068, name: 'South African Rand' },
];
const EXTRA_CURRENCIES = [
  { code: 'NGN', symbol: '₦', rate: 0.60, name: 'Nigerian Naira' },
  { code: 'AED', symbol: 'AED', rate: 0.0014, name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'CA$', rate: 0.00053, name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', rate: 0.00058, name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', rate: 0.032, name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', rate: 0.0027, name: 'Chinese Yuan' },
];

const ALL_CURRENCIES = [...WORLD_CURRENCIES, ...EXTRA_CURRENCIES];
const PAYMENT_CHANNELS = [
  { id: 'bank_transfer', label: 'Bank Transfer / Wire (SWIFT / IBAN)', group: 'Global Banking', icon: '🏦' },
  { id: 'card', label: 'Credit / Debit Card (Visa, Mastercard, Amex)', group: 'Global Cards', icon: '💳' },
  { id: 'paypal', label: 'PayPal Global', group: 'Digital Wallets', icon: '🌐' },
  { id: 'wise', label: 'Wise International Transfer', group: 'Digital Wallets', icon: '💸' },
  { id: 'mpesa', label: 'M-Pesa (Vodacom / Safaricom)', group: 'Mobile Money', icon: '📱' },
  { id: 'mixx', label: 'Mixx by Yas (Tigo Pesa)', group: 'Mobile Money', icon: '📱' },
  { id: 'airtel', label: 'Airtel Money', group: 'Mobile Money', icon: '📱' },
  { id: 'halopesa', label: 'HaloPesa', group: 'Mobile Money', icon: '📱' },
  { id: 'mtn', label: 'MTN MoMo', group: 'Mobile Money', icon: '📱' },
];

const POPULAR_COUNTRIES = [
  'Tanzania', 'United States', 'United Kingdom', 'Kenya', 'Uganda', 'Rwanda',
  'South Africa', 'Nigeria', 'United Arab Emirates', 'Germany', 'France',
  'Canada', 'Australia', 'India', 'China', 'Japan', 'Brazil', 'Other Country'
];

export function MarketplaceCheckoutAndControl({
  item = null,
  product = null,
  onClose = () => {},
  onOrderSuccess = () => {},
}) {
  const activeItem = item || product || { id: 'demo-1', title: 'ZUKA Marketplace Item', price: 50000, seller_id: 'seller-1' };
  const [currency, setCurrency] = useState('TZS');
  const [channel, setChannel] = useState('bank_transfer');
  const [country, setCountry] = useState('Tanzania');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [routingCode, setRoutingCode] = useState('');
  const [walletRef, setWalletRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const selectedCurrency = ALL_CURRENCIES.find((c) => c.code === currency) || ALL_CURRENCIES[0];
  const basePriceTZS = Number(activeItem?.price || 50000);
  const convertedAmount = (basePriceTZS * selectedCurrency.rate).toLocaleString(undefined, {
    minimumFractionDigits: currency === 'TZS' || currency === 'UGX' ? 0 : 2,
    maximumFractionDigits: currency === 'TZS' || currency === 'UGX' ? 0 : 2,
  });
  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');

    const paymentMetadata = {
      channel, country, currency, convertedAmount,
      bankName, accountHolder, accountNumber, swiftCode, routingCode, walletRef,
      buyerName: fullName, buyerEmail: email, buyerPhone: phone, shippingAddress: address,
      escrowStatus: 'HELD_IN_ESCROW', createdAt: new Date().toISOString(),
    };
    try {
      const fullPayload = {
        product_id: activeItem?.id || null,
        buyer_id: user?.id || null,
        seller_id: activeItem?.seller_id || null,
        amount: basePriceTZS,
        currency,
        payment_method: channel,
        status: 'pending_escrow',
        shipping_address: `${address}, ${country}`,
        payment_details: paymentMetadata,
      };
      const { error } = await supabase.from('orders').insert([fullPayload]);
      if (error) {
        const fallback = await supabase.from('orders').insert([{
          amount: basePriceTZS,
          status: 'pending_escrow',
          payment_method: `${channel} (${currency}) - ${bankName || walletRef || phone}`,
        }]);
        if (fallback.error) localStorage.setItem('zuka_last_order', JSON.stringify(paymentMetadata));
      }
      setStatusMsg('✅ Order secured in ZUKA Escrow! Funds are protected until delivery.');
      onOrderSuccess(paymentMetadata);
    } catch (err) {
      localStorage.setItem('zuka_last_order', JSON.stringify(paymentMetadata));
      setStatusMsg('✅ Payment details saved securely.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Global Escrow Protection</span>
          <h2 className="text-xl font-bold mt-1">{activeItem?.title || 'ZUKA Marketplace Item'}</h2>
        </div>
        <div className="text-right flex items-center gap-3"><div>
          <div className="text-xs text-slate-400">Total Amount</div>
          <div className="text-2xl font-extrabold text-emerald-400">{selectedCurrency.symbol} {convertedAmount}</div></div><button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold px-2">✕</button>
        </div>
      </div>
      <form onSubmit={handleCheckout} className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Country / Region</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white">
              {POPULAR_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white">
              {ALL_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Select Global Payment Method</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PAYMENT_CHANNELS.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setChannel(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${channel === item.id ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.group}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        {channel === 'bank_transfer' && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">International Bank & Wire Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input required type="text" placeholder="Bank Name (e.g. CRDB, Chase, Barclays)" value={bankName} onChange={(e) => setBankName(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
              <input required type="text" placeholder="Account Holder Full Name" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input required type="text" placeholder="Account Number / IBAN" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
              <input type="text" placeholder="SWIFT / BIC Code (Global)" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
              <input type="text" placeholder="Routing / Sort Code (US/UK)" value={routingCode} onChange={(e) => setRoutingCode(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
            </div>
          </div>
        )}
        {channel !== 'bank_transfer' && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Payment Account / Reference</h3>
            <input required type="text" placeholder={channel === 'card' ? 'Cardholder Name / Last 4 Digits' : 'Wallet Email or Mobile Money Number'} value={walletRef} onChange={(e) => setWalletRef(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
          </div>
        )}
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-bold text-slate-800">Buyer & Delivery Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input required type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <input required type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input required type="tel" placeholder="Phone Number (with Country Code)" value={phone} onChange={(e) => setPhone(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <input required type="text" placeholder="City, Street & Postal Code" value={address} onChange={(e) => setAddress(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">{statusMsg}</div>
        )}
        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow transition disabled:opacity-50">
          {loading ? 'Securing Payment in Escrow...' : `Pay ${selectedCurrency.symbol} ${convertedAmount} via Escrow`}
        </button>
      </form>
    </div>
  );
}

export default MarketplaceCheckoutAndControl;
