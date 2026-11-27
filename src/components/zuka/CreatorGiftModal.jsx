import React, { useState, useEffect } from 'react';
import { X, Sparkles, EyeOff, Eye, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CURRENCIES = {
  USD: { symbol: "$", amounts:, min: 1 },
  EUR: { symbol: "€", amounts:, min: 1 },
  GBP: { symbol: "£", amounts:, min: 1 },
  TZS: { symbol: "TZS ", amounts:, min: 100 },
  KES: { symbol: "KES ", amounts:, min: 10 },
  UGX: { symbol: "UGX ", amounts:, min: 500 },
  NGN: { symbol: "₦", amounts:, min: 100 },
  ZAR: { symbol: "R", amounts:, min: 5 },
  INR: { symbol: "₹", amounts:, min: 10 },
  AED: { symbol: "AED ", amounts:, min: 1 }
};

const PROVIDERS = ['Visa / Mastercard', 'PayPal', 'Apple Pay / Google Pay', 'M-Pesa', 'Mixx by Yas', 'Airtel Money'];

export default function CreatorGiftModal({ post, currentUserId, isOwner, hideGifts, onTogglePrivacy, onSent, onClose }) {
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState(5);
  const [provider, setProvider] = useState('Visa / Mastercard');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [policy, setPolicy] = useState({ gifts_enabled: true, gift_commission_percent: 0 });

  useEffect(() => {
    supabase.from('system_settings').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data) setPolicy((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, []);

  const curr = CURRENCIES[currency] || CURRENCIES.USD;
  const handleCurrencyChange = (c) => { setCurrency(c); setAmount(CURRENCIES[c].amounts[1]); };
