import React, { useState } from 'react';
import { Users, Plus, ArrowLeft, Globe, Lock, Check, Send } from 'lucide-react';

const GROUPS_KEY = 'zuka_groups_data';

function loadGroups() {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveGroups(list) {
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(list));
  } catch (_) {}
}

export default function ZukaGroups({ currentUser, onBack }) {
  const [groups, setGroups] = useState(() => loadGroups());
  const [subTab, setSubTab] = useState('your');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [privacy, setPrivacy] = useState('Public');
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [postText, setPostText] = useState('');

  const myId = String(currentUser?.id || 'guest');
  const myName = currentUser?.full_name || currentUser?.username || 'ZUKA Member';

  function handleCreateGroup(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const newGroup = {
      id: `grp-${Date.now()}`,
      name: name.trim(),
      description: desc.trim() || 'Community group on ZUKA',
      privacy,
      members: [myId],
      posts: []
    };
    const next = [newGroup, ...groups];
    setGroups(next);
    saveGroups(next);
    setName(''); setDesc(''); setCreateOpen(false);
    setActiveGroupId(newGroup.id);
  }

  function toggleJoin(groupId) {
    const next = groups.map((g) => {
      if (g.id !== groupId) return g;
      const isMember = g.members.includes(myId);
      return {
        ...g,
        members: isMember ? g.members.filter((id) => id !== myId) : [...g.members, myId]
      };
    });
    setGroups(next);
    saveGroups(next);
  }

  function handleGroupPost(e) {
    e.preventDefault();
    if (!postText.trim() || !activeGroupId) return;
    const next = groups.map((g) => {
      if (g.id !== activeGroupId) return g;
      return {
        ...g,
        posts: [{ id: `gp-${Date.now()}`, author: myName, content: postText.trim(), time: 'Just now' }, ...g.posts]
      };
    });
    setGroups(next);
    saveGroups(next);
    setPostText('');
  }
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  if (activeGroup) {
    const isMember = activeGroup.members.includes(myId);
    return (
      <div style={{ backgroundColor: '#F0F2F5', minHeight: 'calc(100vh - 98px)', paddingBottom: '28px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderBottom: '1px solid #E4E6EB' }}>
          <button type="button" onClick={() => setActiveGroupId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: 0, marginBottom: '10px' }}>
            <ArrowLeft size={20} /> Back to Groups
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#050505' }}>{activeGroup.name}</h2>
              <div style={{ fontSize: '13px', color: '#65676B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {activeGroup.privacy === 'Private' ? <Lock size={14} /> : <Globe size={14} />}
                <span>{activeGroup.privacy} group · {activeGroup.members.length} {activeGroup.members.length === 1 ? 'member' : 'members'}</span>
              </div>
            </div>
            <button type="button" onClick={() => toggleJoin(activeGroup.id)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: isMember ? '#E4E6EB' : '#1877F2', color: isMember ? '#050505' : '#FFFFFF', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              {isMember ? 'Joined' : 'Join group'}
            </button>
          </div>
          {activeGroup.description && <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#050505' }}>{activeGroup.description}</p>}
        </div>

        {isMember && (
          <form onSubmit={handleGroupPost} style={{ backgroundColor: '#FFFFFF', padding: '12px', marginTop: '8px', display: 'flex', gap: '8px', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB' }}>
            <input type="text" value={postText} onChange={(e) => setPostText(e.target.value)} placeholder={`Write something in ${activeGroup.name}...`} style={{ flex: 1, padding: '9px 14px', borderRadius: '20px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <button type="submit" style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={16} />
            </button>
          </form>
        )}

        {activeGroup.posts.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', marginTop: '8px', padding: '28px 16px', textAlign: 'center', color: '#65676B', fontSize: '14px' }}>
            No posts in this group yet. Start the first discussion!
          </div>
        ) : (
          activeGroup.posts.map((p) => (
            <div key={p.id} style={{ backgroundColor: '#FFFFFF', marginTop: '8px', padding: '12px 14px', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#050505' }}>{p.author}</div>
              <div style={{ fontSize: '11px', color: '#65676B', marginBottom: '6px' }}>{p.time}</div>
              <div style={{ fontSize: '15px', color: '#050505', lineHeight: '1.4' }}>{p.content}</div>
            </div>
          ))
        )}
      </div>
    );
  }
  const shown = subTab === 'your' ? groups.filter((g) => g.members.includes(myId)) : groups;

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 98px)', paddingBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #E4E6EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', padding: 0, display: 'flex' }}><ArrowLeft size={22} /></button>}
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#050505' }}>Groups</h2>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: '#E7F3FF', color: '#1877F2', border: 'none', borderRadius: '18px', padding: '7px 14px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Plus size={16} /> Create
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderBottom: '1px solid #E4E6EB' }}>
        <button type="button" onClick={() => setSubTab('your')} style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: subTab === 'your' ? '#E7F3FF' : '#F0F2F5', color: subTab === 'your' ? '#1877F2' : '#050505', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Your groups</button>
        <button type="button" onClick={() => setSubTab('discover')} style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: subTab === 'discover' ? '#E7F3FF' : '#F0F2F5', color: subTab === 'discover' ? '#1877F2' : '#050505', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Discover</button>
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '44px 20px', color: '#65676B' }}>
          <Users size={42} color="#B0B3B8" style={{ marginBottom: '10px' }} />
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#050505', marginBottom: '4px' }}>No groups yet</div>
          <div style={{ fontSize: '13px' }}>Tap + Create to start a community group on ZUKA.</div>
        </div>
      ) : (
        shown.map((g) => {
          const joined = g.members.includes(myId);
          return (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', borderBottom: '1px solid #F0F2F5' }}>
              <div onClick={() => setActiveGroupId(g.id)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505' }}>{g.name}</div>
                <div style={{ fontSize: '12px', color: '#65676B', marginTop: '2px' }}>{g.privacy} · {g.members.length} {g.members.length === 1 ? 'member' : 'members'}</div>
              </div>
              <button type="button" onClick={() => toggleJoin(g.id)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: joined ? '#E4E6EB' : '#1877F2', color: joined ? '#050505' : '#FFFFFF', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                {joined ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Joined</span> : 'Join'}
              </button>
            </div>
          );
        })
      )}

      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={handleCreateGroup} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong style={{ fontSize: '17px', color: '#050505' }}>Create a Group</strong>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe what this group is about..." style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <select value={privacy} onChange={(e) => setPrivacy(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }}>
              <option value="Public">Public Group</option>
              <option value="Private">Private Group</option>
            </select>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreateOpen(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#E4E6EB', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1877F2', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
