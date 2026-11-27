import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';

const PROVIDERS = ['M-Pesa', 'Mixx by Yas', 'Airtel Money', 'Visa / Mastercard', 'PayPal'];
