import React, { useEffect, useState } from 'react';
import { Camera, Edit3, MessageCircle, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Post from './Post';

export default function Profile({ userProfile, onBack, onOpenMessenger, onProfileUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.full_name || userProfile?.username || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(userProfile?.cover_url || '');
  const [myPosts, setMyPosts] = useState([]);
  const [friendsCount, setFriendsCount] = useState(0);

  useEffect(() => {
    setFullName(userProfile?.full_name || userProfile?.username || '');
    setBio(userProfile?.bio || '');
    setAvatarUrl(userProfile?.avatar_url || '');
    setCoverUrl(userProfile?.cover_url || '');
    loadProfileExtras();
  }, [userProfile?.id]);

  async function loadProfileExtras() {
    if (!userProfile?.id) return;
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false });
    if (Array.isArray(postsData)) setMyPosts(postsData);

    const { data: rels } = await supabase
      .from('friendships')
      .select('id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userProfile.id},addressee_id.eq.${userProfile.id}`);
    if (Array.isArray(rels)) setFriendsCount(rels.length);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!userProfile?.id) return;
    setSaving(true);
    const updates = { full_name: fullName.trim(), bio: bio.trim(), avatar_url: avatarUrl.trim(), cover_url: coverUrl.trim() };
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userProfile.id).select().single();
    if (!error && data && onProfileUpdated) onProfileUpdated(data);
    setSaving(false);
    setEditing(false);
  }

  const displayName = fullName || userProfile?.username || 'ZUKA Member';

  return (
    <div style={{ backgroundColor: '#F0F2F5', minHeight: 'calc(100dvh - 98px)', paddingBottom: '40px' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E6EB' }}>
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#050505', display: 'flex' }}>
            <ArrowLeft size={22} />
          </button>
          <strong style={{ fontSize: '18px' }}>{displayName}</strong>
        </div>

        {/* Cover Photo */}
        <div style={{ position: 'relative', height: '170px', background: coverUrl ? `url(${coverUrl}) center/cover` : 'linear-gradient(135deg, #1877F2, #42B72A)' }}>
          <button type="button" onClick={() => setEditing(true)} style={{ position: 'absolute', right: '12px', bottom: '12px', backgroundColor: '#FFFFFF', color: '#050505', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <Camera size={15} /> Edit cover
          </button>
        </div>

        {/* Avatar & Info */}
        <div style={{ padding: '0 16px 16px', position: 'relative' }}>
          <div style={{ width: '104px', height: '104px', borderRadius: '50%', border: '4px solid #FFFFFF', backgroundColor: '#1877F2', color: '#FFFFFF', marginTop: '-52px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', fontWeight: 800, overflow: 'hidden' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName.charAt(0).toUpperCase()}
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '8px 0 2px' }}>{displayName}</h1>
          <div style={{ fontSize: '14px', color: '#65676B', fontWeight: 600 }}>{friendsCount} Friends</div>
          {bio && <p style={{ fontSize: '15px', margin: '8px 0 0', lineHeight: 1.4 }}>{bio}</p>}

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button type="button" onClick={() => setEditing(!editing)} style={{ flex: 1, backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 14px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
              <Edit3 size={16} /> Edit Profile
            </button>
            <button type="button" onClick={onOpenMessenger} style={{ flex: 1, backgroundColor: '#E4E6EB', color: '#050505', border: 'none', borderRadius: '8px', padding: '9px 14px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
              <MessageCircle size={16} /> Messenger
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSaveProfile} style={{ backgroundColor: '#FFFFFF', margin: '10px', padding: '14px', borderRadius: '10px', border: '1px solid #E4E6EB', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <strong style={{ fontSize: '16px' }}>Edit Profile Details</strong>
          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
          <textarea rows={2} placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
          <input type="url" placeholder="Avatar Image URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
          <input type="url" placeholder="Cover Photo URL" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
          <button type="submit" disabled={saving} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
            <Check size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      <div style={{ marginTop: '10px' }}>
        {myPosts.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '24px', margin: '0 10px', borderRadius: '8px', textAlign: 'center', color: '#65676B', fontSize: '14px' }}>
            No posts on your profile yet.
          </div>
        ) : (
          myPosts.map((p) => <Post key={p.id} post={p} />)
        )}
      </div>
    </div>
  );
}
