import React, { useState } from 'react';
import { Calendar, Plus, ArrowLeft, MapPin, Star, Check } from 'lucide-react';

const EVENTS_KEY = 'zuka_events_data';

function loadEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveEvents(list) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(list));
  } catch (_) {}
}

export default function ZukaEvents({ currentUser, onBack }) {
  const [events, setEvents] = useState(() => loadEvents());
  const [subTab, setSubTab] = useState('upcoming');
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [venue, setVenue] = useState('');
  const [details, setDetails] = useState('');

  const myId = String(currentUser?.id || 'guest');
  const myName = currentUser?.full_name || currentUser?.username || 'ZUKA Member';

  function handleCreateEvent(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const newEv = {
      id: `ev-${Date.now()}`,
      hostName: myName,
      title: title.trim(),
      dateTime: dateTime.trim() || 'Upcoming',
      venue: venue.trim() || 'Online / Venue TBA',
      details: details.trim(),
      interested: [],
      going: [myId]
    };
    const next = [newEv, ...events];
    setEvents(next);
    saveEvents(next);
    setTitle(''); setDateTime(''); setVenue(''); setDetails(''); setCreateOpen(false);
  }

  function toggleStatus(evId, field) {
    const next = events.map((ev) => {
      if (ev.id !== evId) return ev;
      const list = Array.isArray(ev[field]) ? ev[field] : [];
      const exists = list.includes(myId);
      return {
        ...ev,
        [field]: exists ? list.filter((id) => id !== myId) : [...list, myId]
      };
    });
    setEvents(next);
    saveEvents(next);
  }
  const shown = subTab === 'your'
    ? events.filter((ev) => ev.going.includes(myId) || ev.interested.includes(myId))
    : events;

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 98px)', paddingBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #E4E6EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', padding: 0, display: 'flex' }}><ArrowLeft size={22} /></button>}
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#050505' }}>Events</h2>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: '#E7F3FF', color: '#1877F2', border: 'none', borderRadius: '18px', padding: '7px 14px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Plus size={16} /> Create
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderBottom: '1px solid #E4E6EB' }}>
        <button type="button" onClick={() => setSubTab('upcoming')} style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: subTab === 'upcoming' ? '#E7F3FF' : '#F0F2F5', color: subTab === 'upcoming' ? '#1877F2' : '#050505', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Upcoming</button>
        <button type="button" onClick={() => setSubTab('your')} style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: subTab === 'your' ? '#E7F3FF' : '#F0F2F5', color: subTab === 'your' ? '#1877F2' : '#050505', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Your Events</button>
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '44px 20px', color: '#65676B' }}>
          <Calendar size={42} color="#B0B3B8" style={{ marginBottom: '10px' }} />
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#050505', marginBottom: '4px' }}>No events yet</div>
          <div style={{ fontSize: '13px' }}>Tap + Create to host a concert, meetup, or celebration on ZUKA.</div>
        </div>
      ) : (
        shown.map((ev) => {
          const isInterested = ev.interested.includes(myId);
          const isGoing = ev.going.includes(myId);
          return (
            <div key={ev.id} style={{ padding: '14px', borderBottom: '1px solid #E4E6EB', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#F3425F', textTransform: 'uppercase' }}>{ev.dateTime}</div>
              <div style={{ fontWeight: 800, fontSize: '17px', color: '#050505' }}>{ev.title}</div>
              <div style={{ fontSize: '13px', color: '#65676B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} /> <span>{ev.venue} · Hosted by {ev.hostName}</span>
              </div>
              {ev.details && <div style={{ fontSize: '14px', color: '#050505', marginTop: '2px' }}>{ev.details}</div>}
              <div style={{ fontSize: '12px', color: '#65676B', marginTop: '2px' }}>
                {ev.interested.length} interested · {ev.going.length} going
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => toggleStatus(ev.id, 'interested')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: isInterested ? '#E7F3FF' : '#F0F2F5', color: isInterested ? '#1877F2' : '#050505', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                  <Star size={15} fill={isInterested ? '#1877F2' : 'none'} /> Interested
                </button>
                <button type="button" onClick={() => toggleStatus(ev.id, 'going')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: isGoing ? '#1877F2' : '#F0F2F5', color: isGoing ? '#FFFFFF' : '#050505', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                  <Check size={15} /> Going
                </button>
              </div>
            </div>
          );
        })
      )}

      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={handleCreateEvent} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong style={{ fontSize: '17px', color: '#050505' }}>Create an Event</strong>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <input type="text" required value={dateTime} onChange={(e) => setDateTime(e.target.value)} placeholder="Date & Time (e.g. Sat, Nov 21 at 7:00 PM)" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Location or Online link" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <textarea rows={2} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Event details..." style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreateOpen(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#E4E6EB', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1877F2', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Create Event</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
