import React from 'react';
import { Home, Users, MessageCircle, Clapperboard, Bell, Store, Plus, Search, Menu } from 'lucide-react';

export default function Header({ activeTab = 'feed', setActiveTab = () => {}, onOpenMenu = () => {} }) {
  const tabs = [
    { id: 'feed', icon: Home, label: 'Home' },
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'messenger', icon: MessageCircle, label: 'Messenger' },
    { id: 'reels', icon: Clapperboard, label: 'Reels' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'marketplace', icon: Store, label: 'Marketplace' }
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E6EB' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', height: '52px', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          style={{ color: '#1877F2', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ZUKA
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={() => setActiveTab('feed')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E4E6EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050505', cursor: 'pointer' }}>
            <Plus size={20} />
          </button>
          <button type="button" onClick={() => setActiveTab('friends')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E4E6EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050505', cursor: 'pointer' }}>
            <Search size={20} />
          </button>
          <button type="button" onClick={onOpenMenu} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E4E6EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050505', cursor: 'pointer' }}>
            <Menu size={20} />
          </button>
        </div>
      </div>

      <nav style={{ maxWidth: '680px', margin: '0 auto', height: '46px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                borderBottom: active ? '3px solid #1877F2' : '3px solid transparent',
                color: active ? '#1877F2' : '#65676B',
                cursor: 'pointer'
              }}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </nav>
    </header>
  );
}
