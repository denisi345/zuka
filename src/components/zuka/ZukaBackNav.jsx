import React, { useEffect, useRef } from "react";
const T = { friends: "Friends", messenger: "Messages", notifications: "Notifications", marketplace: "Marketplace", saved: "Saved", events: "Events" };
export default function ZukaBackNav({ activeTab = "feed", menuOpen = false, initialReel = null, onBack, showBar = true }) {
  const isSub = Boolean(menuOpen || initialReel || (activeTab && activeTab !== "feed"));
  const p = useRef(false);
  useEffect(() => {
    if (isSub && !p.current) { window.history.pushState({ z: 1 }, ""); p.current = true; }
    if (!isSub) p.current = false;
  }, [isSub]);
  useEffect(() => {
    const f = () => { if (isSub && onBack) { p.current = false; onBack(); } };
    window.addEventListener("popstate", f);
    return () => window.removeEventListener("popstate", f);
  }, [isSub, onBack]);
  if (!showBar || !isSub || menuOpen || initialReel || activeTab === "reels" || activeTab === "profile") return null;
  return (
    <div style={{position:"sticky",top:0,zIndex:1100,height:48,background:"#fff",borderBottom:"1px solid #E4E6EB",display:"flex",alignItems:"center",gap:8,padding:"0 8px"}}>
      <button type="button" onClick={onBack} style={{width:36,height:36,borderRadius:"50%",border:"none",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#050505"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>
      <span style={{fontSize:17,fontWeight:700,color:"#050505"}}>{T[activeTab]||"Back"}</span>
    </div>
  );
}
