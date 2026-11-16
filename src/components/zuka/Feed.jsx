import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CreatePost from './CreatePost';
import Stories from './Stories';
import Post from './Post';

export default function Feed({ userProfile, onOpenProfile, onOpenUserProfile }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => { loadFeedData(); }, []);

  async function loadFeedData() {
    try {
      const { data: postRows } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
      if (Array.isArray(postRows)) setPosts(postRows);
    } catch (_) {}
    try {
      const { data: storyRows } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(15);
      if (Array.isArray(storyRows)) setStories(storyRows);
    } catch (_) {}
    try {
      const { data: ceoRow } = await supabase.from('ceo_settings').select('announcement').limit(1).maybeSingle();
      if (ceoRow?.announcement) setAnnouncement(ceoRow.announcement);
    } catch (_) {}
  }

  async function handleCreatePost(text, imageUrl = '') {
    const authorName = userProfile?.full_name || userProfile?.username || 'ZUKA Member';
    const optimistic = { id: `temp-${Date.now()}`, user_id: userProfile?.id, author_name: authorName, is_verified: userProfile?.is_verified, content: text, image_url: imageUrl, time_label: 'Just now' };
    setPosts((prev) => [optimistic, ...prev]);
    try {
      const payload = { content: text, author_name: authorName };
      if (imageUrl) payload.image_url = imageUrl;
      if (userProfile?.id) payload.user_id = userProfile.id;
      await supabase.from('posts').insert(payload);
    } catch (_) {}
  }

  async function handleUploadStory(file) {
    const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
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
      {announcement && (
        <div style={{ backgroundColor: '#E7F3FF', borderBottom: '1px solid #1877F2', color: '#050505', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Megaphone size={18} color="#1877F2" style={{ flexShrink: 0 }} />
          <span><strong>ZUKA CEO:</strong> {announcement}</span>
        </div>
      )}
      <CreatePost userProfile={userProfile} onCreatePost={handleCreatePost} onOpenProfile={onOpenProfile} />
      <Stories userProfile={userProfile} stories={stories} onUploadStory={handleUploadStory} />
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
