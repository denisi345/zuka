import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Globe } from 'lucide-react';

export default function Post({ post }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  function toggleLike() {
    setLiked(!liked);
    setLikesCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
  }

  function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([...comments, { id: Date.now(), text: commentText.trim() }]);
    setCommentText('');
  }

  const author = post.author_name || 'ZUKA Member';

  return (
    <article className="bg-white border-y sm:border border-[#E4E6EB] sm:rounded-lg mb-2.5 overflow-hidden">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-base shrink-0">
            {author.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[15px] text-[#050505] leading-tight">{author}</div>
            <div className="text-[12px] text-[#65676B] flex items-center gap-1 mt-0.5">
              <span>{post.time_label || 'Just now'}</span>
              <span>&middot;</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>
        <button type="button" className="p-1.5 text-[#65676B] rounded-full hover:bg-[#F0F2F5]">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {post.content && (
        <p className="px-3 pb-2.5 text-[15px] text-[#050505] leading-snug whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {post.image_url && (
        <div className="w-full bg-black">
          <img src={post.image_url} alt="" className="w-full max-h-[520px] object-cover block" />
        </div>
      )}

      <div className="px-3 py-1.5 flex items-center justify-between text-[13px] text-[#65676B] border-b border-[#E4E6EB]">
        <span>{likesCount > 0 ? `${likesCount} Likes` : ''}</span>
        <span>{comments.length > 0 ? `${comments.length} Comments` : ''}</span>
      </div>

      <div className="grid grid-cols-3 py-1">
        <button
          type="button"
          onClick={toggleLike}
          className={`flex items-center justify-center gap-1.5 py-2 text-[14px] font-semibold cursor-pointer ${
            liked ? 'text-[#1877F2]' : 'text-[#65676B]'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Like</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center justify-center gap-1.5 py-2 text-[14px] font-semibold text-[#65676B] cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
          className="flex items-center justify-center gap-1.5 py-2 text-[14px] font-semibold text-[#65676B] cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <div className="px-3 pb-3 pt-1 border-t border-[#E4E6EB] bg-[#F0F2F5]/50">
          {comments.map((c) => (
            <div key={c.id} className="bg-[#F0F2F5] rounded-2xl px-3 py-1.5 text-[14px] mb-1.5">
              <span className="font-semibold mr-1.5">ZUKA Member:</span>
              {c.text}
            </div>
          ))}
          <form onSubmit={handleAddComment} className="flex gap-2 mt-1.5">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-[#F0F2F5] rounded-full px-3.5 py-1.5 text-[14px] focus:outline-none"
            />
            <button type="submit" className="text-[#1877F2] font-semibold text-sm px-2 cursor-pointer">
              Send
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
