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
