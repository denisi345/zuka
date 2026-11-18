import { formatTimeAgo } from "./timeAgo";
import React, { useState } from 'react';
import { X, MoreVertical, ThumbsUp, MessageCircle, Share2, Download, EyeOff, AlertCircle } from 'lucide-react';
import ZukaBadge from './ZukaBadge';

export default function PhotoViewer({ post, liked, likesCount, commentsCount, onClose, onLike, onComment, onShare, onHidePost }) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState('');

  if (!post) return null;

  const authorName = post.author_name || 'ZUKA Member';
  const text = post.content || '';
  const isLong = text.length > 95;
  const shownText = expanded || !isLong ? text : `${text.slice(0, 95)}...`;

  function showNotice(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  function handleSavePhoto() {
    setOptionsOpen(false);
    try {
      const a = document.createElement('a');
      a.href = post.image_url;
      a.download = `zuka_${Date.now()}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (_) {}
    showNotice('Photo saved!');
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, backgroundColor: '#000000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', zIndex: 10 }}>
        <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '4px' }}>
          <X size={26} />
        </button>
        <button type="button" onClick={() => setOptionsOpen(true)} aria-label="Options" style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '4px' }}>
          <MoreVertical size={24} />
        </button>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 85, backgroundColor: '#1877F2', color: '#FFFFFF', padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
          {toast}
        </div>
      )}

      <div onClick={onClose} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={post.image_url} alt="" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '78vh', objectFit: 'contain' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '14px 14px 18px', background: 'linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.55), transparent)' }}>
        <div style={{ fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center' }}>
          <span>{authorName}</span>
          {post.is_verified && <ZukaBadge size={16} />}
        </div>
        <div style={{ fontSize: '12px', color: '#B0B3B8', marginBottom: '6px' }}>{formatTimeAgo(post.created_at, post.time_label)} · 🌐</div>

        {text && (
          <div style={{ fontSize: '14px', lineHeight: '1.4', marginBottom: '10px', whiteSpace: 'pre-line' }}>
            {shownText}
            {isLong && !expanded && (
              <button type="button" onClick={() => setExpanded(true)} style={{ background: 'none', border: 'none', color: '#B0B3B8', fontWeight: 700, fontSize: '14px', padding: '0 4px', cursor: 'pointer' }}>
                See more
              </button>
            )}
          </div>
        )}

        {likesCount > 0 && (
          <div style={{ fontSize: '13px', color: '#E4E6EB', marginBottom: '10px' }}>
            👍 {likesCount} {likesCount === 1 ? 'like' : 'others'}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={onLike} style={{ flex: 1, height: '38px', borderRadius: '20px', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: liked ? '#4599FF' : '#FFFFFF', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
            <ThumbsUp size={18} fill={liked ? '#4599FF' : 'none'} /> {likesCount || 'Like'}
          </button>
          <button type="button" onClick={() => { onClose(); onComment(); }} style={{ flex: 1, height: '38px', borderRadius: '20px', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFFFFF', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
            <MessageCircle size={18} /> {commentsCount || 'Comment'}
          </button>
          <button type="button" onClick={onShare} style={{ flex: 1, height: '38px', borderRadius: '20px', border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFFFFF', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
            <Share2 size={18} /> Share
          </button>
        </div>
      </div>
      {optionsOpen && (
        <div onClick={() => setOptionsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', color: '#050505', width: '100%', maxWidth: '680px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '10px 14px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#CED0D4', borderRadius: '2px', margin: '0 auto 10px' }} />
            <button type="button" onClick={handleSavePhoto} style={{ padding: '14px 6px', background: 'none', border: 'none', borderBottom: '1px solid #F0F2F5', fontWeight: 600, fontSize: '16px', color: '#050505', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <Download size={22} color="#050505" /> Save
            </button>
            <button type="button" onClick={() => { setOptionsOpen(false); onClose(); if (onHidePost) onHidePost(); }} style={{ padding: '14px 6px', background: 'none', border: 'none', borderBottom: '1px solid #F0F2F5', fontWeight: 600, fontSize: '16px', color: '#050505', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <EyeOff size={22} color="#050505" /> I don't want to see this
            </button>
            <button type="button" onClick={() => { setOptionsOpen(false); showNotice('Photo reported for review.'); }} style={{ padding: '14px 6px', background: 'none', border: 'none', fontWeight: 600, fontSize: '16px', color: '#050505', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left' }}>
              <AlertCircle size={22} color="#050505" /> Find support or report photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
