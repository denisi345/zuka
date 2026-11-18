import React, { useState } from 'react';
import { Flag, Plus, ArrowLeft, Check, BarChart2, Phone, Send } from 'lucide-react';

const PAGES_KEY = 'zuka_pages_data';

function loadPages() {
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function savePages(list) {
  try {
    localStorage.setItem(PAGES_KEY, JSON.stringify(list));
  } catch (_) {}
}

export default function ZukaPages({ currentUser, onBack }) {
  const [pages, setPages] = useState(() => loadPages());
  const [subTab, setSubTab] = useState('your');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Business & Brand');
  const [bio, setBio] = useState('');
  const [contact, setContact] = useState('');
  const [activePageId, setActivePageId] = useState(null);
  const [postText, setPostText] = useState('');

  const myId = String(currentUser?.id || 'guest');

  function handleCreatePage(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const newPage = {
      id: `pg-${Date.now()}`,
      ownerId: myId,
      name: name.trim(),
      category,
      bio: bio.trim(),
      contact: contact.trim(),
      followers: [myId],
      reach: 120,
      posts: []
    };
    const next = [newPage, ...pages];
    setPages(next);
    savePages(next);
    setName(''); setBio(''); setContact(''); setCreateOpen(false);
    setActivePageId(newPage.id);
  }

  function toggleFollow(pageId) {
    const next = pages.map((p) => {
      if (p.id !== pageId) return p;
      const following = p.followers.includes(myId);
      return {
        ...p,
        followers: following ? p.followers.filter((id) => id !== myId) : [...p.followers, myId],
        reach: p.reach + (following ? 0 : 15)
      };
    });
    setPages(next);
    savePages(next);
  }

  function handlePagePost(e) {
    e.preventDefault();
    if (!postText.trim() || !activePageId) return;
    const next = pages.map((p) => {
      if (p.id !== activePageId) return p;
      return {
        ...p,
        reach: p.reach + 45,
        posts: [{ id: `pp-${Date.now()}`, content: postText.trim(), time: 'Just now' }, ...p.posts]
      };
    });
    setPages(next);
    savePages(next);
    setPostText('');
  }
  const activePage = pages.find((p) => p.id === activePageId);

  if (activePage) {
    const isOwner = activePage.ownerId === myId;
    const isFollowing = activePage.followers.includes(myId);
    return (
      <div style={{ backgroundColor: '#F0F2F5', minHeight: 'calc(100vh - 98px)', paddingBottom: '28px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderBottom: '1px solid #E4E6EB' }}>
          <button type="button" onClick={() => setActivePageId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: 0, marginBottom: '10px' }}>
            <ArrowLeft size={20} /> Back to Pages
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#050505' }}>{activePage.name}</h2>
              <div style={{ fontSize: '13px', color: '#65676B', marginTop: '2px' }}>{activePage.category} · {activePage.followers.length} followers</div>
            </div>
            <button type="button" onClick={() => toggleFollow(activePage.id)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: isFollowing ? '#E4E6EB' : '#1877F2', color: isFollowing ? '#050505' : '#FFFFFF', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
          {activePage.bio && <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#050505' }}>{activePage.bio}</p>}
          {activePage.contact && <div style={{ marginTop: '6px', fontSize: '13px', color: '#1877F2', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={14} /> {activePage.contact}</div>}
        </div>

        <div style={{ backgroundColor: '#FFFFFF', marginTop: '8px', padding: '12px 14px', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <BarChart2 size={18} color="#1877F2" /> Page Insights
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#F0F2F5', padding: '8px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#050505' }}>{activePage.followers.length}</div>
              <div style={{ fontSize: '11px', color: '#65676B' }}>Followers</div>
            </div>
            <div style={{ backgroundColor: '#F0F2F5', padding: '8px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#050505' }}>{activePage.reach}</div>
              <div style={{ fontSize: '11px', color: '#65676B' }}>Post Reach</div>
            </div>
            <div style={{ backgroundColor: '#F0F2F5', padding: '8px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#050505' }}>{activePage.posts.length}</div>
              <div style={{ fontSize: '11px', color: '#65676B' }}>Posts</div>
            </div>
          </div>
        </div>

        {isOwner && (
          <form onSubmit={handlePagePost} style={{ backgroundColor: '#FFFFFF', padding: '12px', marginTop: '8px', display: 'flex', gap: '8px', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB' }}>
            <input type="text" value={postText} onChange={(e) => setPostText(e.target.value)} placeholder={`Post an update as ${activePage.name}...`} style={{ flex: 1, padding: '9px 14px', borderRadius: '20px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <button type="submit" style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={16} />
            </button>
          </form>
        )}

        {activePage.posts.map((p) => (
          <div key={p.id} style={{ backgroundColor: '#FFFFFF', marginTop: '8px', padding: '12px 14px', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#050505' }}>{activePage.name}</div>
            <div style={{ fontSize: '11px', color: '#65676B', marginBottom: '6px' }}>{p.time}</div>
            <div style={{ fontSize: '15px', color: '#050505', lineHeight: '1.4' }}>{p.content}</div>
          </div>
        ))}
      </div>
    );
  }
  const shown = subTab === 'your' ? pages.filter((p) => p.ownerId === myId || p.followers.includes(myId)) : pages;

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 98px)', paddingBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #E4E6EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', padding: 0, display: 'flex' }}><ArrowLeft size={22} /></button>}
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#050505' }}>Pages</h2>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: '#E7F3FF', color: '#1877F2', border: 'none', borderRadius: '18px', padding: '7px 14px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Plus size={16} /> Create
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderBottom: '1px solid #E4E6EB' }}>
        <button type="button" onClick={() => setSubTab('your')} style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: subTab === 'your' ? '#E7F3FF' : '#F0F2F5', color: subTab === 'your' ? '#1877F2' : '#050505', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Your Pages</button>
        <button type="button" onClick={() => setSubTab('discover')} style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: subTab === 'discover' ? '#E7F3FF' : '#F0F2F5', color: subTab === 'discover' ? '#1877F2' : '#050505', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Discover</button>
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '44px 20px', color: '#65676B' }}>
          <Flag size={42} color="#B0B3B8" style={{ marginBottom: '10px' }} />
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#050505', marginBottom: '4px' }}>No Pages yet</div>
          <div style={{ fontSize: '13px' }}>Tap + Create to launch a business, brand, or creator Page on ZUKA.</div>
        </div>
      ) : (
        shown.map((p) => {
          const following = p.followers.includes(myId);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', borderBottom: '1px solid #F0F2F5' }}>
              <div onClick={() => setActivePageId(p.id)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#65676B', marginTop: '2px' }}>{p.category} · {p.followers.length} followers</div>
              </div>
              <button type="button" onClick={() => toggleFollow(p.id)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: following ? '#E4E6EB' : '#1877F2', color: following ? '#050505' : '#FFFFFF', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                {following ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Following</span> : 'Follow'}
              </button>
            </div>
          );
        })
      )}

      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={handleCreatePage} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong style={{ fontSize: '17px', color: '#050505' }}>Create a Page</strong>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Page name (e.g. Business or Brand)" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }}>
              <option value="Business & Brand">Business & Brand</option>
              <option value="Artist & Public Figure">Artist & Public Figure</option>
              <option value="Community & Organization">Community & Organization</option>
              <option value="Shop & Retail">Shop & Retail</option>
            </select>
            <textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Describe your Page..." style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone or WhatsApp contact (optional)" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreateOpen(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#E4E6EB', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1877F2', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Create Page</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
