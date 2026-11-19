import ZukaBadge from './ZukaBadge';
import React, { useEffect, useState } from 'react';
import { UserPlus, UserCheck, MessageCircle, Search, Bell, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function FriendsView({ userProfile, onMessageUser }) {
  const [subTab, setSubTab] = useState('suggestions');
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFriendsData(); }, [userProfile?.id]);

  async function loadFriendsData() {
    setLoading(true);
    const { data: profs } = await supabase.from('profiles').select('id, username, full_name, avatar_url, is_verified').limit(80);
    if (Array.isArray(profs)) {
      setProfiles(profs.filter((p) => String(p.id) !== String(userProfile?.id)));
    }
    if (userProfile?.id) {
      const { data: rels } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${userProfile.id},addressee_id.eq.${userProfile.id}`);
      if (Array.isArray(rels)) setFriendships(rels);
    }
    setLoading(false);
  }

  function getRelation(otherId) {
    if (!userProfile?.id) return null;
    return friendships.find(
      (f) => (String(f.requester_id) === String(otherId) && String(f.addressee_id) === String(userProfile.id)) ||
             (String(f.addressee_id) === String(otherId) && String(f.requester_id) === String(userProfile.id))
    );
  }

  async function handleAddFriend(otherId) {
    if (!userProfile?.id) return;
    const optimistic = { id: `tmp-${Date.now()}`, requester_id: userProfile.id, addressee_id: otherId, status: 'pending' };
    setFriendships((prev) => [...prev, optimistic]);
    const { data } = await supabase
      .from('friendships')
      .insert({ requester_id: userProfile.id, addressee_id: otherId, status: 'pending' })
      .select()
      .single();
    if (data) setFriendships((prev) => prev.map((x) => (x.id === optimistic.id ? data : x)));
  }

  async function handleAccept(relId) {
    setFriendships((prev) => prev.map((x) => (x.id === relId ? { ...x, status: 'accepted' } : x)));
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', relId);
  }

  async function handleDecline(relId) {
    setFriendships((prev) => prev.filter((x) => x.id !== relId));
    await supabase.from('friendships').delete().eq('id', relId);
  }
  const incomingRequests = friendships.filter(
    (f) => f.status === 'pending' && String(f.addressee_id) === String(userProfile?.id)
  );
  const acceptedFriends = friendships.filter((f) => f.status === 'accepted');

  const visibleProfiles = profiles.filter((p) => {
    const q = search.trim().toLowerCase();
    if (q && !(p.full_name || '').toLowerCase().includes(q) && !(p.username || '').toLowerCase().includes(q)) {
      return false;
    }
    const rel = getRelation(p.id);
    if (subTab === 'requests') return rel && rel.status === 'pending' && String(rel.addressee_id) === String(userProfile?.id);
    if (subTab === 'friends') return rel && rel.status === 'accepted';
    return !rel || rel.status !== 'accepted';
  });

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100dvh - 98px)', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <strong style={{ fontSize: '22px' }}>Friends</strong>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '10px' }}>
        {[
          { id: 'suggestions', label: 'Suggestions' },
          { id: 'requests', label: `Requests (${incomingRequests.length})` },
          { id: 'friends', label: `Your friends (${acceptedFriends.length})` }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            style={{
              padding: '7px 14px', borderRadius: '18px', border: 'none', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
              backgroundColor: subTab === t.id ? '#E7F3FF' : '#E4E6EB',
              color: subTab === t.id ? '#1877F2' : '#050505'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#65676B' }} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people on ZUKA..."
          style={{ width: '100%', height: '38px', borderRadius: '20px', border: 'none', backgroundColor: '#F0F2F5', paddingLeft: '36px', paddingRight: '14px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#65676B' }}>Loading people...</div>
      ) : visibleProfiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#65676B', fontSize: '14px' }}>
          No people found in this section.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {visibleProfiles.map((person) => {
            const name = person.full_name || person.username || 'ZUKA Member';
            const rel = getRelation(person.id);
            const isIncoming = rel && rel.status === 'pending' && String(rel.addressee_id) === String(userProfile?.id);
            const isOutgoing = rel && rel.status === 'pending' && String(rel.requester_id) === String(userProfile?.id);
            const isFriend = rel && rel.status === 'accepted';

            return (
              <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                  {person.avatar_url ? <img src={person.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}><span>{name}</span>{person.is_verified && <ZukaBadge size={15} />}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isIncoming ? (
                      <>
                        <button type="button" onClick={() => handleAccept(rel.id)} style={{ flex: 1, backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
                        <button type="button" onClick={() => handleDecline(rel.id)} style={{ flex: 1, backgroundColor: '#E4E6EB', color: '#050505', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                      </>
                    ) : isFriend ? (
                      <button type="button" onClick={() => onMessageUser && onMessageUser(person)} style={{ flex: 1, backgroundColor: '#E7F3FF', color: '#1877F2', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                        <MessageCircle size={16} /> Message
                      </button>
                    ) : isOutgoing ? (
                      <button type="button" onClick={() => handleDecline(rel.id)} style={{ flex: 1, backgroundColor: '#E4E6EB', color: '#050505', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                        Request Sent (Cancel)
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={() => handleAddFriend(person.id)} style={{ flex: 1, backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                          <UserPlus size={16} /> Add Friend
                        </button>
                        <button type="button" onClick={() => onMessageUser && onMessageUser(person)} style={{ backgroundColor: '#E4E6EB', color: '#050505', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                          Message
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export function NotificationsView({ userProfile, onOpenTab }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, [userProfile?.id]);

  async function loadNotifications() {
    setLoading(true);
    const list = [];
    if (userProfile?.id) {
      const { data: reqs } = await supabase
        .from('friendships')
        .select('id, requester_id, created_at')
        .eq('addressee_id', userProfile.id)
        .eq('status', 'pending');
      if (Array.isArray(reqs)) {
        reqs.forEach((r) => {
          list.push({ id: `req-${r.id}`, text: 'You have a new friend request on ZUKA.', tab: 'friends', unread: true, time: r.created_at });
        });
      }
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, content, created_at')
        .eq('receiver_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (Array.isArray(msgs)) {
        msgs.forEach((m) => {
          list.push({ id: `msg-${m.id}`, text: `New message: ${(m.content || '').slice(0, 60)}`, tab: 'messenger', unread: true, time: m.created_at });
        });
      }
    }
    setNotifs(list);
    setLoading(false);
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100dvh - 98px)', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <strong style={{ fontSize: '22px' }}>Notifications</strong>
        {notifs.length > 0 && (
          <button
            type="button"
            onClick={() => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })))}
            style={{ background: 'none', border: 'none', color: '#1877F2', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          >
            <Check size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#65676B' }}>Loading notifications...</div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#65676B' }}>
          <Bell size={40} style={{ margin: '0 auto 10px', color: '#1877F2' }} />
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#050505', marginBottom: '4px' }}>No notifications yet</div>
          <p style={{ fontSize: '14px', margin: 0 }}>Friend requests and new message alerts will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifs.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onOpenTab && onOpenTab(n.tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', border: 'none', textAlign: 'left', cursor: 'pointer',
                backgroundColor: n.unread ? '#E7F3FF' : '#F0F2F5'
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: n.unread ? 700 : 500, color: '#050505' }}>{n.text}</div>
                <div style={{ fontSize: '12px', color: '#1877F2', marginTop: '2px' }}>
                  {n.time ? new Date(n.time).toLocaleString() : 'Just now'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
