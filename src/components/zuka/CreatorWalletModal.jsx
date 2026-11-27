import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CreatorWalletModal({ currentUser, onClose }) {
  const [tips, setTips] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [policy, setPolicy] = useState({ min_payout_tzs: 0, min_payout_usd: 0 });
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('M-Pesa');
  const [account, setAccount] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  return null;
}
