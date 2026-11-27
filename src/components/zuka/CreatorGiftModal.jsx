import React, { useState, useEffect } from 'react';
import { X, Sparkles, EyeOff, Eye, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CURRENCIES = {
  USD: { symbol: '$', amounts: new Array(1, 5, 10, 25, 50), min: 1 },
  EUR: { symbol: '€', amounts: new Array(1, 5, 10, 25, 50), min: 1 },
  GBP: { symbol: '£', amounts: new Array(1, 5, 10, 25, 50), min: 1 },
  TZS: { symbol: 'TZS ', amounts: new Array(500, 1000, 2000, 5000, 10000), min: 100 },
  KES: { symbol: 'KES ', amounts: new Array(50, 100, 250, 500, 1000), min: 10 },
  UGX: { symbol: 'UGX ', amounts: new Array(1000, 2000, 5000, 10000, 20000), min: 500 },
  NGN: { symbol: '₦', amounts: new Array(500, 1000, 2500, 5000, 10000), min: 100 },
  ZAR: { symbol: 'R', amounts: new Array(10, 25, 50, 100, 250), min: 5 },
  INR: { symbol: '₹', amounts: new Array(50, 100, 250, 500, 1000), min: 10 },
  AED: { symbol: 'AED ', amounts: new Array(5, 10, 25, 50, 100), min: 1 }
};

const PROVIDERS = new Array(
  { id: 'M-Pesa', badge: 'M-PESA', bg: '#E60000', fg: '#FFF' },
  { id: 'Mixx by Yas', badge: 'yas', bg: '#FFD100', fg: '#002B49' },
  { id: 'Airtel Money', badge: 'airtel', bg: '#ED1C24', fg: '#FFF' },
  { id: 'Visa / Mastercard', badge: 'VISA / MC', bg: '#1A1F71', fg: '#FFF' },
  { id: 'PayPal', badge: 'PayPal', bg: '#003087', fg: '#FFF' },
  { id: 'Apple / Google Pay', badge: 'G /  Pay', bg: '#111827', fg: '#FFF' }
);
