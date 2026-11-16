import React, { useRef } from 'react';
import { Plus } from 'lucide-react';

export default function Stories({ userProfile, stories = [], onUploadStory }) {
  const fileRef = useRef(null);
  const initial = (userProfile?.full_name || userProfile?.username || 'Z').charAt(0).toUpperCase();

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E6EB', padding: '12px 10px', margin: '8px 0', display: 'flex', gap: '8px', overflowX: 'auto' }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files ? e.target.files : null;
          if (f && onUploadStory) onUploadStory(f);
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        style={{ width: '105px', height: '175px', borderRadius: '12px', border: '1px solid #CED0D4', backgroundColor: '#FFFFFF', flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', padding: 0, cursor: 'pointer' }}
      >
        <div style={{ height: '115px', width: '100%', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '30px', fontWeight: 800, color: '#65676B' }}>{initial}</span>
          )}
        </div>
        <div style={{ position: 'absolute', top: '97px', left: '50%', transform: 'translateX(-50%)', width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#1877F2', border: '3px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
          <Plus size={18} />
        </div>
        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#050505' }}>Create story</span>
        </div>
      </button>

      {stories.map((st) => (
        <div key={st.id} style={{ width: '105px', height: '175px', borderRadius: '12px', backgroundColor: '#1877F2', flexShrink: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px', color: '#FFFFFF' }}>
          {st.media_url && <img src={st.media_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'relative', zIndex: 2, width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #1877F2', backgroundColor: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
            {(st.author_name || 'Z').charAt(0).toUpperCase()}
          </div>
          <span style={{ position: 'relative', zIndex: 2, fontSize: '12px', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            {st.author_name || 'ZUKA Member'}
          </span>
        </div>
      ))}
    </div>
  );
}
