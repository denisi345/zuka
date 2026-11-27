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
