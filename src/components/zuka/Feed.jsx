import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CreatePost from './CreatePost';
import Stories from './Stories';
import Post from './Post';

export default function Feed({ userProfile }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    loadFeedData();
  }, []);

  async function loadFeedData() {
    try {
      const { data: postRows } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (Array.isArray(postRows)) setPosts(postRows);
    } catch (_) {}

    try {
      const { data: storyRows } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      if (Array.isArray(storyRows)) setStories(storyRows);
    } catch (_) {}
  }

  async function handleCreatePost(text) {
    const authorName = userProfile?.full_name || userProfile?.username || 'ZUKA Member';
    const optimistic = {
      id: `temp-${Date.now()}`,
      author_name: authorName,
      content: text,
      time_label: 'Just now'
    };
    setPosts((prev) => [optimistic, ...prev]);

    try {
      const payload = { content: text, author_name: authorName };
      if (userProfile?.id) payload.user_id = userProfile.id;
      await supabase.from('posts').insert(payload);
    } catch (_) {}
  }

  return (
    <div className="w-full pb-12">
      <CreatePost userProfile={userProfile} onCreatePost={handleCreatePost} />
      <Stories userProfile={userProfile} stories={stories} />
      <div>
        {posts.length === 0 ? (
          <div className="bg-white border border-[#E4E6EB] rounded-lg p-6 text-center text-[#65676B] text-[15px]">
            No posts yet. Share the first update on ZUKA above!
          </div>
        ) : (
          posts.map((post) => <Post key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
