import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Globe, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Post({ post, currentUserId, onOpenUserProfile, onDeletePost }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post.likes_count || 0));
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function toggleLike() {
    const nextLiked = !liked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setLiked(nextLiked);
    setLikesCount(nextCount);
    if (post.id && !String(post.id).startsWith('temp-')) {
      try { await supabase.from('posts').update({ likes_count: nextCount }).eq('id', post.id); } catch (_) {}
    }
  }

  async function handleToggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && post.id && !String(post.id).startsWith('temp-')) {
      try {
        const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true });
        if (Array.isArray(data)) setComments(data);
      } catch (_) {}
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    setComments((prev) => [...prev, { id: `c-${Date.now()}`, author_name: 'You', content: text }]);
    if (post.id && !String(post.id).startsWith('temp-')) {
      try { await supabase.from('comments').insert({ post_id: post.id, user_id: currentUserId || null, content: text }); } catch (_) {}
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (onDeletePost) onDeletePost(post.id);
    if (post.id && !String(post.id).startsWith('temp-')) {
      try { await supabase.from('posts').delete().eq('id', post.id); } catch (_) {}
    }
  }

  const author = post.author_name || 'ZUKA Member';
  const isOwner = currentUserId && post.user_id && String(currentUserId) === String(post.user_id);
  const mediaSrc = post.video_url || post.image_url || '';
  const isVideo = post.media_type === 'video' || Boolean(post.video_url) || /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(mediaSrc);

  return (
    <article style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E4E6EB', borderBottom: '1px solid #E4E6EB', marginBottom: '8px', position: 'relative' }}>
      <div style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          onClick={() => post.user_id && onOpenUserProfile && onOpenUserProfile({ id: post.user_id, full_name: author, is_verified: post.is_verified })}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: post.user_id ? 'pointer' : 'default' }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
            {author.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{author}</span>
              {post.is_verified && <CheckCircle2 size={15} color="#1877F2" fill="#E7F3FF" />}
            </div>
            <div style={{ fontSize: '12px', color: '#65676B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span>{post.time_label || (post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now')}</span>
              <span>&middot;</span>
              <Globe size={12} />
            </div>
          </div>
        </div>

        {isOwner && (
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', padding: '6px', color: '#65676B', cursor: 'pointer' }}>
              <MoreHorizontal size={20} />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '32px', zIndex: 20, backgroundColor: '#FFFFFF', border: '1px solid #E4E6EB', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', padding: '4px', minWidth: '140px' }}>
                <button type="button" onClick={handleDelete} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: 'none', border: 'none', color: '#E41E3F', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  <Trash2 size={15} /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.content && (
        <p style={{ padding: '0 12px 10px', margin: 0, fontSize: '15px', color: '#050505', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>
      )}

      {mediaSrc && (
        <div style={{ width: '100%', backgroundColor: '#000000' }}>
          {isVideo ? (
            <video src={mediaSrc} controls playsInline preload="metadata" style={{ width: '100%', maxHeight: '520px', display: 'block', backgroundColor: '#000000' }} />
          ) : (
            <img src={mediaSrc} alt="" style={{ width: '100%', maxHeight: '520px', objectFit: 'cover', display: 'block' }} />
          )}
        </div>
      )}

      {(likesCount > 0 || comments.length > 0) && (
        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#65676B', borderBottom: '1px solid #E4E6EB' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {likesCount > 0 && (
              <>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThumbsUp size={11} fill="#FFFFFF" />
                </span>
                <span>{likesCount}</span>
              </>
            )}
          </span>
          <span>{comments.length > 0 ? `${comments.length} Comments` : ''}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '4px 0', borderTop: '1px solid #E4E6EB' }}>
        <button type="button" onClick={toggleLike} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 0', background: 'none', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: liked ? '#1877F2' : '#65676B' }}>
          <ThumbsUp size={18} color={liked ? '#1877F2' : '#65676B'} fill={liked ? '#1877F2' : 'none'} />
          <span>Like</span>
        </button>
        <button type="button" onClick={handleToggleComments} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 0', background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, color: '#65676B', cursor: 'pointer' }}>
          <MessageSquare size={18} />
          <span>Comment</span>
        </button>
        <button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 0', background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, color: '#65676B', cursor: 'pointer' }}>
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #E4E6EB', backgroundColor: '#F0F2F5' }}>
          {comments.map((c) => (
            <div key={c.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '6px 12px', fontSize: '14px', marginBottom: '6px' }}>
              <strong>{c.author_name || 'ZUKA Member'}: </strong>{c.content || c.text}
            </div>
          ))}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #CED0D4', padding: '7px 12px', fontSize: '14px', outline: 'none' }} />
            <button type="submit" style={{ background: 'none', border: 'none', color: '#1877F2', fontWeight: 700, fontSize: '14px', padding: '0 8px', cursor: 'pointer' }}>Send</button>
          </form>
        </div>
      )}
    </article>
  );
}
