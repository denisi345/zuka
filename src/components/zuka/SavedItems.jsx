import React, { useState } from 'react';
import { Bookmark, MoreHorizontal, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { getSavedPosts, toggleSavePost } from './savedHelper';
import Post from './Post';

export default function SavedItems({ currentUserId, onBack, onOpenUserProfile }) {
  const [items, setItems] = useState(() => getSavedPosts());
  const [filter, setFilter] = useState('all');
  const [menuId, setMenuId] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);

  const filtered = items.filter((p) => {
    if (filter === 'photos') return Boolean(p.image_url);
    if (filter === 'posts') return !p.image_url;
    return true;
  });

  function handleUnsave(post) {
    toggleSavePost(post);
    setItems(getSavedPosts());
    setMenuId(null);
  }

  if (viewingPost) {
    return (
      <div style={{ backgroundColor: '#F0F2F5', minHeight: 'calc(100vh - 98px)', paddingBottom: '24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderBottom: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={() => setViewingPost(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', display: 'flex' }}>
            <ArrowLeft size={22} />
          </button>
          <strong style={{ fontSize: '17px', color: '#050505' }}>Saved Post</strong>
        </div>
        <Post post={viewingPost} currentUserId={currentUserId} onOpenUserProfile={onOpenUserProfile} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 98px)', paddingBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '1px solid #E4E6EB' }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', display: 'flex', padding: 0 }}>
            <ArrowLeft size={22} />
          </button>
        )}
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#050505' }}>Saved</h2>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderBottom: '1px solid #E4E6EB' }}>
        {[
          { id: 'all', label: `All (${items.length})` },
          { id: 'photos', label: 'Photos' },
          { id: 'posts', label: 'Posts' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            style={{ padding: '7px 14px', borderRadius: '18px', border: 'none', backgroundColor: filter === t.id ? '#E7F3FF' : '#F0F2F5', color: filter === t.id ? '#1877F2' : '#050505', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#65676B' }}>
          <Bookmark size={42} color="#B0B3B8" style={{ marginBottom: '10px' }} />
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#050505', marginBottom: '4px' }}>No saved items yet</div>
          <div style={{ fontSize: '13px' }}>Tap the three dots (•••) on any post and choose Save post to view it here later.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((item) => {
            const cleanText = String(item.content || '').replace(/\n?\[zuka_audio:[^\]]+\]/g, '').trim();
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderBottom: '1px solid #F0F2F5' }}>
                <div onClick={() => setViewingPost(item)} style={{ width: '76px', height: '76px', borderRadius: '10px', backgroundColor: '#F0F2F5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Bookmark size={28} color="#1877F2" />
                  )}
                </div>
                <div onClick={() => setViewingPost(item)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cleanText || `${item.author_name || 'ZUKA'}'s post`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#65676B', marginTop: '3px' }}>
                    Saved from {item.author_name || 'ZUKA Feed'}
                  </div>
                </div>
                <button type="button" onClick={() => setMenuId(item)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'none', border: 'none', color: '#65676B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <MoreHorizontal size={20} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {menuId && (
        <div onClick={() => setMenuId(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', width: '100%', maxWidth: '680px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '12px 14px 22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button type="button" onClick={() => { setViewingPost(menuId); setMenuId(null); }} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#F0F2F5', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#050505' }}>
              <Eye size={19} /> View post
            </button>
            <button type="button" onClick={() => handleUnsave(menuId)} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#FFEBEE', color: '#D32F2F', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <Trash2 size={19} /> Unsave
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
