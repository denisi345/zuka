import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, Share2, Trash2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';

export default function Post({ post, currentUserId, onOpenUserProfile, onDeletePost }) {
  const storageKey = `zuka_liked_${post.id}`;
  const [liked, setLiked] = useState(() => localStorage.getItem(storageKey) === '1');
  const [likesCount, setLikesCount] = useState(Number(post.likes_count || 0));
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [sharedBanner, setSharedBanner] = useState(false);

  const isLiveOrDemo = String(post.id).startsWith('live-') || String(post.id).startsWith('funny-') || String(post.id).startsWith('temp-');

  function handleLike() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    if (nextLiked) localStorage.setItem(storageKey, '1');
    else localStorage.removeItem(storageKey);
    const nextCount = Math.max(0, likesCount + (nextLiked ? 1 : -1));
    setLikesCount(nextCount);
    if (!isLiveOrDemo) {
      try { supabase.from('posts').update({ likes_count: nextCount }).eq('id', post.id); } catch (_) {}
    }
  }

  async function handleToggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && !isLiveOrDemo) {
      try {
        const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true });
        if (Array.isArray(data)) setComments(data);
      } catch (_) {}
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    const txt = commentText.trim();
    if (!txt) return;
    setCommentText('');
    setComments((prev) => [...prev, { id: `c-${Date.now()}`, author_name: 'You', content: txt }]);
    if (!isLiveOrDemo) {
      try {
        await supabase.from('comments').insert({ post_id: post.id, user_id: currentUserId, content: txt });
      } catch (_) {}
    }
  }

  async function handleShare() {
    const shareText = `${post.author_name || 'ZUKA'}: ${post.content || ''}`.slice(0, 200);
    if (navigator.share) {
      try { await navigator.share({ title: 'ZUKA', text: shareText, url: window.location.href }); return; } catch (_) {}
    }
    try { await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`); } catch (_) {}
    setSharedBanner(true);
    setTimeout(() => setSharedBanner(false), 2200);
  }

  const authorName = post.author_name || 'ZUKA Member';
  const isOwner = currentUserId && String(post.user_id) === String(currentUserId);
  const isVideo = post.media_type === 'video' || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(post.image_url || '');

  return (
    <article style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB', marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 6px' }}>
        <div
          onClick={() => post.user_id && onOpenUserProfile && onOpenUserProfile({ id: post.user_id, full_name: authorName, avatar_url: post.avatar_url, is_verified: post.is_verified })}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: post.user_id ? 'pointer' : 'default' }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
            {post.avatar_url ? <img src={post.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center' }}>
              <span>{authorName}</span>
              {post.is_verified && <ZukaBadge size={16} />}
            </div>
            <div style={{ fontSize: '12px', color: '#65676B' }}>{post.time_label || 'Just now'} · 🌐</div>
          </div>
        </div>
        {isOwner && (
          <button type="button" onClick={async () => { if (!isLiveOrDemo) await supabase.from('posts').delete().eq('id', post.id); if (onDeletePost) onDeletePost(post.id); }} style={{ background: 'none', border: 'none', color: '#65676B', cursor: 'pointer', padding: '4px' }}>
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {post.content && <div style={{ padding: '4px 12px 10px', fontSize: '15px', color: '#050505', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{post.content}</div>}

      {post.image_url && (
        isVideo
          ? <video src={post.image_url} autoPlay loop muted playsInline controls style={{ width: '100%', maxHeight: '420px', backgroundColor: '#000000', display: 'block' }} />
          : <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: '460px', objectFit: 'cover', display: 'block' }} />
      )}

      {(likesCount > 0 || comments.length > 0 || sharedBanner) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: '13px', color: '#65676B', borderBottom: '1px solid #E4E6EB' }}>
          <span>{likesCount > 0 ? `👍 ${likesCount}` : ''}</span>
          <span>{sharedBanner ? 'Link copied to share!' : comments.length > 0 ? `${comments.length} Comments` : ''}</span>
        </div>
      )}

      <div style={{ display: 'flex', height: '42px' }}>
        <button type="button" onClick={handleLike} style={{ flex: 1, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, fontSize: '14px', color: liked ? '#1877F2' : '#65676B', cursor: 'pointer' }}>
          <ThumbsUp size={18} fill={liked ? '#1877F2' : 'none'} /> Like
        </button>
        <button type="button" onClick={handleToggleComments} style={{ flex: 1, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, fontSize: '14px', color: '#65676B', cursor: 'pointer' }}>
          <MessageCircle size={18} /> Comment
        </button>
        <button type="button" onClick={handleShare} style={{ flex: 1, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, fontSize: '14px', color: '#65676B', cursor: 'pointer' }}>
          <Share2 size={18} /> Share
        </button>
      </div>

      {commentsOpen && (
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #E4E6EB', backgroundColor: '#F7F8FA' }}>
          {comments.map((c) => (
            <div key={c.id} style={{ backgroundColor: '#E4E6EB', borderRadius: '12px', padding: '7px 12px', marginBottom: '6px', fontSize: '13px' }}>
              <strong>{c.author_name || 'Member'}: </strong>{c.content}
            </div>
          ))}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, padding: '8px 12px', borderRadius: '18px', border: '1px solid #CED0D4', fontSize: '13px' }} />
            <button type="submit" style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
