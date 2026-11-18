import React, { useEffect } from 'react';

export const ZUKA_ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || '';
export const ZUKA_ADSENSE_SLOT = import.meta.env.VITE_ADSENSE_SLOT || '';

export default function ZukaAdSlot() {
  const isConfigured = ZUKA_ADSENSE_CLIENT.startsWith('ca-pub-') && Boolean(ZUKA_ADSENSE_SLOT);

  useEffect(() => {
    if (!isConfigured) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  }, [isConfigured]);

  if (!isConfigured) return null;

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB', marginTop: '8px', padding: '10px 12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#65676B', marginBottom: '6px' }}>Sponsored</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ZUKA_ADSENSE_CLIENT}
        data-ad-slot={ZUKA_ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
