import React from 'react';
import { Plus } from 'lucide-react';

export default function Stories({ userProfile, stories = [], onCreateStory = () => {} }) {
  return (
    <div className="bg-white border-b border-[#E4E6EB] py-3 px-2.5 my-2 flex gap-2 overflow-x-auto no-scrollbar">
      {/* Create Story Card */}
      <button
        type="button"
        onClick={onCreateStory}
        className="w-[105px] h-[180px] rounded-xl border border-[#CED0D4] bg-[#F0F2F5] shrink-0 overflow-hidden flex flex-col justify-between relative cursor-pointer"
      >
        <div className="h-[120px] w-full bg-[#E4E6EB] flex items-center justify-center overflow-hidden">
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-[#65676B]">
              {(userProfile?.username || 'Z').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="absolute top-[102px] left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#1877F2] border-4 border-white flex items-center justify-center text-white">
          <Plus className="w-5 h-5" />
        </div>
        <div className="h-[60px] bg-white flex items-end justify-center pb-2 px-1">
          <span className="text-[13px] font-semibold text-[#050505] leading-tight text-center">
            Create story
          </span>
        </div>
      </button>

      {/* Active Stories */}
      {stories.map((st) => (
        <div
          key={st.id}
          className="w-[105px] h-[180px] rounded-xl bg-[#65676B] shrink-0 overflow-hidden relative flex flex-col justify-between p-2 text-white"
        >
          {st.media_url && (
            <img src={st.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="relative z-10 w-8 h-8 rounded-full border-2 border-[#1877F2] bg-[#1877F2] flex items-center justify-center text-xs font-bold overflow-hidden">
            {(st.author_name || 'Z').charAt(0).toUpperCase()}
          </div>
          <span className="relative z-10 text-[12px] font-semibold leading-tight line-clamp-2 drop-shadow">
            {st.author_name || 'ZUKA Member'}
          </span>
        </div>
      ))}
    </div>
  );
}
