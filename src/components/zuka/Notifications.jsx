import React, { useEffect, useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Notifications({ currentUser, onClearUnread }) {
  const [items, setItems] = useState([]);
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');

  useEffect(() => {
    if (onClearUnread) onClearUnread();
    loadNotifications();

    if (!currentUser?.id) return;
    const channel = supabase
      .channel(`notif-live-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          if (payload?.new) {
            setItems((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  async function loadNotifications() {
    if (!currentUser?.id) return;
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(40);
      if (Array.isArray(data)) setItems(data);
    } catch (_) {}
  }

  async function requestDevicePush() {
    if (typeof Notification === 'undefined') return;
    const res = await Notification.requestPermission();
    setPerm(res);
    if (res === 'granted') {
      new Notification('ZUKA Notifications Active', {
        body: 'Utapokea arifa za moja kwa moja kwenye simu yako sasa!'
      });
    }
  }

  function renderIcon(type) {
    if (type === 'like') return <Heart size={18} color="#1877F2" fill="#1877F2" />;
    if (type === 'comment' || type === 'message') return <MessageCircle size={18} color="#42B72A" />;
    if (type === 'friend') return <UserPlus size={18} color="#1877F2" />;
    return <Bell size={18} color="#1877F2" />;
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 98px)', padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#050505' }}>Notifications</h2>
        {items.length > 0 && (
          <button type="button" onClick={loadNotifications} style={{ background: 'none', border: 'none', color: '#1877F2', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <CheckCheck size={16} /> Refresh
          </button>
        )}
      </div>

      {perm !== 'granted' && (
        <div style={{ backgroundColor: '#E7F3FF', borderRadius: '10px', padding: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: '#050505', fontWeight: 600 }}>
            Washa arifa za moja kwa moja kwenye skrini ya simu yako.
          </div>
          <button type="button" onClick={requestDevicePush} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 12px', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
            Washa Arifa
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#65676B', padding: '40px 16px', fontSize: '15px' }}>
          Hakuna arifa mpya kwa sasa. Mtu akiku-like, ku-comment, au kukutumia ujumbe utaona hapa papo hapo!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((n) => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '10px', backgroundColor: '#F0F2F5' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {renderIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: '#050505', fontWeight: 600 }}>{n.message || n.content || 'New activity on ZUKA'}</div>
                <div style={{ fontSize: '12px', color: '#65676B', marginTop: '2px' }}>Just now</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
