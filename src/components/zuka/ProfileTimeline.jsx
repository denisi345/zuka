import React, { useEffect, useState } from 'react';
import { Briefcase, MapPin, ShieldCheck, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Post from './Post';
import CreatePost from './CreatePost';

export default function ProfileTimeline({ profile, isOwnProfile }) {
  const [subTab, setSubTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    loadTimeline();
  }, [profile?.id]);

  async function loadTimeline() {
    setLoading(true);
    try {
      const { data: pData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (Array.isArray(pData)) {
        setUserPosts(
          pData.map((item) => ({
            ...item,
            author_name: profile.full_name || profile.username || item.author_name || 'ZUKA Member',
            avatar_url: profile.avatar_url || item.avatar_url || '',
            is_verified: Boolean(profile.is_verified || item.is_verified)
          }))
        );
      }
    } catch (_) {}

    try {
      const { data: rData } = await supabase
        .from('reels')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (Array.isArray(rData)) setUserReels(rData);
    } catch (_) {}
    setLoading(false);
  }

  async function handleProfileCreatePost(text, mediaUrl, mediaType = 'image') {
    const authorName = profile.full_name || profile.username || 'ZUKA Member';
    const temp = {
      id: `temp-${Date.now()}`,
      user_id: profile.id,
      author_name: authorName,
      avatar_url: profile.avatar_url || '',
      is_verified: Boolean(profile.is_verified),
      content: text,
      image_url: mediaUrl || '',
      media_type: mediaType,
      likes_count: 0,
      created_at: new Date().toISOString()
    };
    setUserPosts((prev) => [temp, ...prev]);
    try {
      const payload = { user_id: profile.id, content: text, author_name: authorName, is_verified: Boolean(profile.is_verified) };
      if (mediaUrl) payload.image_url = mediaUrl;
      await supabase.from('posts').insert(payload);
      loadTimeline();
    } catch (_) {}
  }

  const photosOnly = userPosts.filter((p) => p.image_url && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(p.image_url));

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB', backgroundColor: '#FFFFFF' }}>
        {[
          { id: 'posts', label: 'Posts' },
          { id: 'photos', label: 'Photos' },
          { id: 'reels', label: 'Reels' }
        ].map((t) => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: active ? '#E7F3FF' : 'transparent', color: active ? '#1877F2' : '#65676B', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {subTab === 'posts' && (
        <div style={{ backgroundColor: '#F0F2F5', paddingBottom: '24px' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderBottom: '1px solid #E4E6EB' }}>
            <div style={{ fontWeight: 800, fontSize: '17px', color: '#050505', marginBottom: '10px' }}>Details</div>
            {profile.bio && <div style={{ fontSize: '14px', color: '#050505', marginBottom: '10px' }}>{profile.bio}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#050505' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#65676B' }}>
                <Globe size={17} /> <span>Profile · Digital creator</span>
              </div>
              {profile.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={17} color="#65676B" /> <span>Lives in <strong>{profile.location}</strong></span>
                </div>
              )}
              {profile.is_verified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1877F2', fontWeight: 600 }}>
                  <ShieldCheck size={17} /> <span>Verified ZUKA Account</span>
                </div>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <div style={{ marginTop: '8px' }}>
              <CreatePost userProfile={profile} onCreatePost={handleProfileCreatePost} />
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#65676B', fontSize: '14px' }}>Loading posts...</div>
          ) : userPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: '#65676B', fontSize: '14px', backgroundColor: '#FFFFFF', marginTop: '8px' }}>
              No posts yet on this profile.
            </div>
          ) : (
            userPosts.map((p) => (
              <Post
                key={p.id}
                post={p}
                currentUserId={profile.id}
                onDeletePost={(id) => setUserPosts((prev) => prev.filter((x) => x.id !== id))}
              />
            ))
          )}
        </div>
      )}

      {subTab === 'photos' && (
        <div style={{ backgroundColor: '#FFFFFF', padding: '8px' }}>
          {photosOnly.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#65676B', fontSize: '14px' }}>No photos uploaded yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {photosOnly.map((ph) => (
                <img key={ph.id} src={ph.image_url} alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '4px' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'reels' && (
        <div style={{ backgroundColor: '#FFFFFF', padding: '8px' }}>
          {userReels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#65676B', fontSize: '14px' }}>No reels uploaded yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {userReels.map((rl) => (
                <video key={rl.id} src={rl.video_url} muted playsInline style={{ width: '100%', aspectRatio: '9 / 16', objectFit: 'cover', borderRadius: '6px', backgroundColor: '#000000' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
