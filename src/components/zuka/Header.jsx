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
    <header className="sticky top-0 z-40 bg-white border-b border-[#E4E6EB]">
      <div className="max-w-[1200px] mx-auto h-[52px] px-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className="text-[#1877F2] text-[28px] font-extrabold tracking-tight leading-none cursor-pointer"
        >
          ZUKA
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setActiveTab('feed')} className="w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center text-[#050505] cursor-pointer">
            <Plus className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => setActiveTab('friends')} className="w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center text-[#050505] cursor-pointer">
            <Search className="w-5 h-5" />
          </button>
          <button type="button" onClick={onOpenMenu} className="w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center text-[#050505] cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="max-w-[680px] mx-auto h-[46px] grid grid-cols-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              className={`flex items-center justify-center border-b-[3px] cursor-pointer ${
                active ? 'border-[#1877F2] text-[#1877F2]' : 'border-transparent text-[#65676B]'
              }`}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </nav>
    </header>
  );
}
