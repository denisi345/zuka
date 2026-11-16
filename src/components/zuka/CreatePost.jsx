import React, { useState } from 'react';
import { Image } from 'lucide-react';

export default function CreatePost({ userProfile, onCreatePost }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    if (onCreatePost) onCreatePost(text.trim());
    setText('');
    setOpen(false);
  }

  return (
    <div className="bg-white border-b border-[#E4E6EB] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-[#E4E6EB] overflow-hidden flex items-center justify-center font-bold text-[#050505] shrink-0">
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            (userProfile?.username || 'Z').charAt(0).toUpperCase()
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 h-10 px-4 rounded-full border border-[#CED0D4] bg-white text-left text-[15px] text-[#65676B] cursor-pointer"
        >
          What's on your mind?
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center justify-center px-1.5 text-[#45BD62] cursor-pointer"
        >
          <Image className="w-6 h-6" />
          <span className="text-[11px] font-medium text-[#65676B] leading-tight">Photo</span>
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-2.5 pt-2.5 border-t border-[#E4E6EB] flex flex-col gap-2">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-2.5 rounded-lg border border-[#CED0D4] text-[15px] focus:outline-none"
          />
          <button type="submit" className="self-end bg-[#1877F2] text-white font-semibold px-4 py-1.5 rounded-md text-sm cursor-pointer">
            Post
          </button>
        </form>
      )}
    </div>
  );
}
