import React, { useState } from 'react';
import { Users, Film, Store, MessageCircle, Sparkles, Newspaper, Calendar, Flag, Bookmark, Settings, HelpCircle, ChevronDown, ChevronUp, Moon, Sun, LogOut, X } from 'lucide-react';
import ZukaBadge from './ZukaBadge';

export default function FacebookMenu({ profile, onClose, onNavigateTab, onOpenProfile, onOpenAI, onLogout }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.body.style.filter === 'invert(0.92) hue-rotate(180deg)');
  const [infoNotice, setInfoNotice] = useState('');

  const name = profile?.full_name || profile?.username || 'ZUKA Member';

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.body.style.filter = next ? 'invert(0.92) hue-rotate(180deg)' : '';
  }

  const shortcuts = [
    { label: 'Friends', desc: 'Find & manage friends', icon: <Users size={22} color="#1877F2" />, action: () => { onNavigateTab('friends'); onClose(); } },
    { label: 'Reels', desc: 'Short vertical videos', icon: <Film size={22} color="#F3425F" />, action: () => { onNavigateTab('reels'); onClose(); } },
    { label: 'Marketplace', desc: 'Buy & sell near you', icon: <Store size={22} color="#1877F2" />, action: () => { onNavigateTab('marketplace'); onClose(); } },
    { label: 'Messenger', desc: 'Chat with friends', icon: <MessageCircle size={22} color="#A033FF" />, action: () => { onNavigateTab('messenger'); onClose(); } },
    { label: 'ZUKA AI', desc: 'Ask anything instantly', icon: <Sparkles size={22} color="#42B72A" />, action: () => { if (onOpenAI) onOpenAI(); else onNavigateTab('messenger'); onClose(); } },
    { label: 'Feeds', desc: 'Latest posts & news', icon: <Newspaper size={22} color="#F7B928" />, action: () => { onNavigateTab('feed'); onClose(); } },
    { label: "Saved", desc: "Saved posts & photos", icon: <Bookmark size={22} color="#A033FF" />, action: () => { onNavigateTab("saved"); onClose(); } },
    { label: "Groups", desc: "Connect with communities", icon: <Users size={22} color="#1877F2" />, action: () => { onNavigateTab("groups"); onClose(); } },
    { label: "Pages", desc: "Business & creator pages", icon: <Flag size={22} color="#F3425F" />, action: () => { onNavigateTab("pages"); onClose(); } },
    { label: "Events", desc: "Upcoming events & meetups", icon: <Calendar size={22} color="#F3425F" />, action: () => { onNavigateTab("events"); onClose(); } }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, backgroundColor: '#F0F2F5', overflowY: 'auto', paddingBottom: '36px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#050505' }}>Menu</h2>
          <button type="button" onClick={onClose} aria-label="Close Menu" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E4E6EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#050505' }}>
            <X size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => { onOpenProfile(); onClose(); }}
          style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '12px', border: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '14px' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', flexShrink: 0 }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#050505', display: 'flex', alignItems: 'center' }}>
              <span>{name}</span>
              {profile?.is_verified && <ZukaBadge size={16} />}
            </div>
            <div style={{ fontSize: '13px', color: '#65676B', marginTop: '2px' }}>See your profile</div>
          </div>
        </button>

        <div style={{ fontSize: '14px', fontWeight: 700, color: '#65676B', marginBottom: '8px', paddingLeft: '2px' }}>All shortcuts</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {shortcuts.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={s.action}
              style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '12px', border: '1px solid #E4E6EB', textAlign: 'left', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <div>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: '#65676B' }}>{s.desc}</div>
            </button>
          ))}
        </div>
        {infoNotice && (
          <div style={{ backgroundColor: '#E7F3FF', color: '#1877F2', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
            {infoNotice}
          </div>
        )}
        <div style={{ borderTop: '1px solid #CED0D4', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button type="button" onClick={() => setHelpOpen(!helpOpen)} style={{ width: '100%', padding: '12px 6px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', color: '#050505', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><HelpCircle size={22} color="#65676B" /> Help & support</span>
            {helpOpen ? <ChevronUp size={20} color="#65676B" /> : <ChevronDown size={20} color="#65676B" />}
          </button>
          {helpOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '6px' }}>
              <button type="button" onClick={() => setInfoNotice('ZUKA Help Center: Kwa msaada wowote wasiliana na ZUKA AI au timu ya ZUKA Official.')} style={{ backgroundColor: '#FFFFFF', padding: '11px 14px', borderRadius: '10px', border: '1px solid #E4E6EB', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#050505', cursor: 'pointer' }}>Help Center</button>
              <button type="button" onClick={() => setInfoNotice('ZUKA Terms & Privacy: Data zako zinalindwa kwa usalama wa hali ya juu.')} style={{ backgroundColor: '#FFFFFF', padding: '11px 14px', borderRadius: '10px', border: '1px solid #E4E6EB', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#050505', cursor: 'pointer' }}>Terms & Policies</button>
            </div>
          )}
          <button type="button" onClick={() => setSettingsOpen(!settingsOpen)} style={{ width: '100%', padding: '12px 6px', borderTop: '1px solid #CED0D4', background: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', color: '#050505', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Settings size={22} color="#65676B" /> Settings & privacy</span>
            {settingsOpen ? <ChevronUp size={20} color="#65676B" /> : <ChevronDown size={20} color="#65676B" />}
          </button>
          {settingsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '6px' }}>
              <button type="button" onClick={() => { onOpenProfile(); onClose(); }} style={{ backgroundColor: '#FFFFFF', padding: '11px 14px', borderRadius: '10px', border: '1px solid #E4E6EB', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#050505', cursor: 'pointer' }}>Account Settings & Profile</button>
              <button type="button" onClick={toggleDarkMode} style={{ backgroundColor: '#FFFFFF', padding: '11px 14px', borderRadius: '10px', border: '1px solid #E4E6EB', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span>Dark Mode</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1877F2', fontWeight: 700 }}>{darkMode ? <><Sun size={16} /> On</> : <><Moon size={16} /> Off</>}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#E4E6EB', color: '#050505', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
