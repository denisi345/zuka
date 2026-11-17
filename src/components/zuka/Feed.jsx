import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CreatePost from './CreatePost';
import Stories from './Stories';
import Post from './Post';
import { fetchLiveNewsAndFunny } from './liveAutoFeed';

export default function Feed({ userProfile, onOpenProfile, onOpenUserProfile }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);

  useEffect(() => { loadFeedData(); const h = () => loadFeedData(); window.addEventListener("zuka:refresh-feed", h); return () => window.removeEventListener("zuka:refresh-feed", h); }, []);

  async function loadFeedData() {
    let profileMap = {};
    try {
      const { data: profRows } = await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified');
      if (Array.isArray(profRows)) {
        profRows.forEach((pr) => { profileMap[String(pr.id)] = pr; });
      }
    } catch (_) {}

    let userPosts = [];
    try {
      const { data: postRows } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
      if (Array.isArray(postRows)) {
        userPosts = postRows.map((p) => {
          const owner = p.user_id ? profileMap[String(p.user_id)] : null;
          const isOfficial = p.author_name === 'ZUKA Official';
          return {
            ...p,
            author_name: isOfficial ? 'ZUKA Official' : (owner?.full_name || owner?.username || p.author_name || 'ZUKA Member'),
            avatar_url: isOfficial ? '' : (owner?.avatar_url || p.avatar_url || ''),
            is_verified: isOfficial ? true : Boolean(owner?.is_verified || p.is_verified)
          };
        });
      }
    } catch (_) {}

    let autoEnabled = true;
    try {
      const { data: ceoRow } = await supabase.from('ceo_settings').select('auto_feed_enabled').limit(1).maybeSingle();
      if (ceoRow && typeof ceoRow.auto_feed_enabled === 'boolean') autoEnabled = ceoRow.auto_feed_enabled;
    } catch (_) {}

    if (autoEnabled) {
      const liveItems = await fetchLiveNewsAndFunny();
      setPosts([...userPosts, ...liveItems]);
    } else {
      setPosts(userPosts);
    }

    try {
      const { data: storyRows } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(15);
      if (Array.isArray(storyRows)) setStories(storyRows);
    } catch (_) {}
  }

  async function handleCreatePost(text, mediaUrl = '', mediaType = 'image') {
    const authorName = userProfile?.full_name || userProfile?.username || 'ZUKA Member';
    const optimistic = { id: `temp-${Date.now()}`, user_id: userProfile?.id, author_name: authorName, avatar_url: userProfile?.avatar_url, is_verified: userProfile?.is_verified, content: text, image_url: mediaUrl, media_type: mediaType, time_label: 'Just now' };
    setPosts((prev) => [optimistic, ...prev]);
    try {
      const payload = { content: text, author_name: authorName, is_verified: Boolean(userProfile?.is_verified) };
      if (mediaUrl) payload.image_url = mediaUrl;
      if (userProfile?.id) payload.user_id = userProfile.id;
      await supabase.from('posts').insert(payload);
    } catch (_) {}
  }

  async function handleUploadStory(file) {
    const clean = (file.name || 'story.jpg').replace(/[^a-zA-Z0-9._-]/g, '');
    const path = `stories/${Date.now()}_${clean}`;
    let mediaUrl = URL.createObjectURL(file);
    for (const bucket of ['media', 'stories', 'public']) {
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
      if (!upErr) {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        if (pub?.publicUrl) { mediaUrl = pub.publicUrl; break; }
      }
    }
    const authorName = userProfile?.full_name || userProfile?.username || 'ZUKA Member';
    setStories((prev) => [{ id: `st-${Date.now()}`, author_name: authorName, media_url: mediaUrl }, ...prev]);
    try {
      const payload = { media_url: mediaUrl, author_name: authorName };
      if (userProfile?.id) payload.user_id = userProfile.id;
      await supabase.from('stories').insert(payload);
    } catch (_) {}
  }

  return (
    <div style={{ width: '100%', paddingBottom: '48px' }}>
      <CreatePost userProfile={userProfile} onCreatePost={handleCreatePost} onOpenProfile={onOpenProfile} />
      <Stories userProfile={userProfile} stories={stories} onUploadStory={handleUploadStory} onDeleteStory={(id) => setStories((prev) => prev.filter((x) => x.id !== id))} />
      <div>
        {posts.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E6EB', borderRadius: '8px', padding: '24px', margin: '0 8px', textAlign: 'center', color: '#65676B', fontSize: '15px' }}>
            No posts yet. Share the first update on ZUKA above!
          </div>
        ) : (
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              currentUserId={userProfile?.id}
              onOpenUserProfile={onOpenUserProfile}
              onDeletePost={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
