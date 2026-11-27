import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CreatorGiftModal from './CreatorGiftModal';

export default function PublicSupportListener() {
  const [target, setTarget] = useState(null);
  const [senderId, setSenderId] = useState(null);

  useEffect(() => {
    const uid = new URLSearchParams(window.location.search).get('support');
    if (!uid) return;
    supabase.auth.getUser().then(({ data }) => setSenderId(data?.user?.id || null)).catch(() => {});
    supabase.from('profiles').select('id,full_name,username').eq('id', uid).maybeSingle().then(({ data }) => {
      if (data) setTarget(data);
    }).catch(() => {});
  }, []);

  if (!target) return null;
  return <CreatorGiftModal receiverId={target.id} receiverName={target.full_name || target.username || 'Creator'} senderId={senderId} onClose={() => { setTarget(null); window.history.replaceState({}, '', window.location.pathname); }} />;
}
