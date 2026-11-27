import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function ZukaDiagnostics() {
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState([]);
  const [running, setRunning] = useState(false);

  const logErr = (source, message) => {
    supabase.from('zuka_error_logs').insert({ source, message: String(message || '').slice(0, 500), page_url: window.location.href }).catch(() => {});
  };

  useEffect(() => {
    const onErr = (e) => logErr('window.error', e?.message || 'Unknown error');
    const onRej = (e) => logErr('promise.rejection', e?.reason?.message || e?.reason || 'Rejection');
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    if (new URLSearchParams(window.location.search).get('diag') === '1') setOpen(true);
    return () => { window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onRej); };
  }, []);

  const runAll = async () => {
    setRunning(true);
    const tables = ['profiles', 'posts', 'reels', 'comments', 'reel_comments', 'creator_tips', 'payment_requests', 'payout_requests', 'system_settings', 'zuka_error_logs'];
    const out = [];
    for (const t of tables) {
      const { error } = await supabase.from(t).select('*').limit(1);
      out.push({ name: `Table: ${t}`, ok: !error, msg: error ? error.message : 'OK' });
    }
    const { error: stErr } = await supabase.storage.from('voice-comments').list('', { limit: 1 });
    out.push({ name: 'Storage: voice-comments', ok: !stErr, msg: stErr ? stErr.message : 'OK' });
    setChecks(out);
    setRunning(false);
  };

  useEffect(() => { if (open) runAll(); }, [open]);
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10001, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto', backgroundColor: '#FFF', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <b style={{ fontSize: '16px' }}>ZUKA System Health Check</b>
          <button type="button" onClick={() => setOpen(false)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#E4E6EB', fontWeight: 700 }}>Close</button>
        </div>
        <button type="button" onClick={runAll} disabled={running} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#1877F2', color: '#FFF', fontWeight: 700, marginBottom: '10px' }}>{running ? 'Scanning ZUKA...' : 'Re-run All Tests'}</button>
        {checks.map((c) => <div key={c.name} style={{ fontSize: '12.5px', padding: '6px 0', borderBottom: '1px solid #F0F2F5', color: c.ok ? '#16A34A' : '#DC2626' }}><b>{c.ok ? '[PASS]' : '[FAIL]'}</b> {c.name}: {c.msg}</div>)}
      </div>
    </div>
  );
}
