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
  return null;
}
