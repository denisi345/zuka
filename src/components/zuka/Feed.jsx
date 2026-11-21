import ZukaAdSlot from "./ZukaAdSlot";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CreatePost from './CreatePost';
import Stories from './Stories';
import Post from './Post';
import { fetchLiveNewsAndFunny } from './liveAutoFeed';

class FeedGuard extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: String(e?.message || e) }; }
  render() {
    if (this.state.err) return <div style={{ padding: 16, margin: 12, background: "#FFF3CD", color: "#856404", borderRadius: 8, fontSize: 13 }}>Feed notice: {this.state.err}</div>;
    return this.props.children;
  }
}
export default function Feed({ userProfile, onOpenProfile, onOpenUserProfile }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [activeProfileView, setActiveProfileView] = useState(null);
  const [profileFollowing, setProfileFollowing] = useState(false);
  const [profileTab, setProfileTab] = useState("all");
  const [profileReels, setProfileReels] = useState([]);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editNameVal, setEditNameVal] = useState("");
  const [editBioVal, setEditBioVal] = useState("");
  const [msgBoxOpen, setMsgBoxOpen] = useState(false);
  const [msgVal, setMsgVal] = useState("");
  useEffect(() => {
    if (!activeProfileView) return;
    window.history.pushState({ zukaFeedProfile: true }, "");
    const onPop = () => setActiveProfileView(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [activeProfileView]);
  async function openUserProfileSafe(target, fallbackName, fallbackAvatar) {
    const uid = typeof target === "string" ? target : (target?.id || target?.user_id || null);
    const baseName = fallbackName || (typeof target === "object" ? (target?.full_name || target?.author_name) : "") || "Zuka Member";
    const baseAvatar = fallbackAvatar || (typeof target === "object" ? (target?.avatar_url || target?.author_avatar) : "") || `https://ui-avatars.com${encodeURIComponent(baseName)}&background=1877F2&color=fff&bold=true`;
    setProfileTab("all"); loadUserReelsReal(uid); setActiveProfileView({ id: uid, full_name: baseName, avatar_url: baseAvatar, cover_url: "", bio: "", is_verified: false, followersCount: 0 });
    if (!uid) return;
    try {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      const { data: fRows } = await supabase.from("follows").select("follower_id").eq("following_id", uid);
      setProfileFollowing(Boolean(userProfile?.id && Array.isArray(fRows) && fRows.some((r) => String(r.follower_id) === String(userProfile.id))));
      setActiveProfileView((prev) => prev ? ({ ...prev, full_name: prof?.full_name || prof?.username || prev.full_name, avatar_url: prof?.avatar_url || prev.avatar_url, cover_url: prof?.cover_url || "", bio: prof?.bio || "", is_verified: Boolean(prof?.is_verified), followersCount: Array.isArray(fRows) ? fRows.length : 0 }) : null);
    } catch (_) {}
  }
    async function loadUserReelsReal(uid) { if (!uid) { setProfileReels([]); return; } try { const { data } = await supabase.from("reels").select("*").eq("user_id", uid).order("created_at", { ascending: false }); setProfileReels(Array.isArray(data) ? data : []); } catch (_) { setProfileReels([]); } }
  async function saveProfileEditsReal() { if (!userProfile?.id || !editNameVal.trim()) return; const nm = editNameVal.trim(); const bo = editBioVal.trim(); setActiveProfileView((prev) => prev ? ({ ...prev, full_name: nm, bio: bo }) : null); setEditProfileOpen(false); try { await supabase.from("profiles").update({ full_name: nm, bio: bo }).eq("id", userProfile.id); } catch (_) {} }
  async function sendDirectProfileMsg() { if (!userProfile?.id || !activeProfileView?.id || !msgVal.trim()) return; const txt = msgVal.trim(); setMsgVal(""); setMsgBoxOpen(false); try { await supabase.from("messages").insert({ sender_id: userProfile.id, receiver_id: activeProfileView.id, content: txt }); } catch (_) {} }
  async function toggleProfileFollow() {
    if (!userProfile?.id || !activeProfileView?.id || String(userProfile.id) === String(activeProfileView.id)) return;
    const next = !profileFollowing;
    setProfileFollowing(next);
    setActiveProfileView((prev) => prev ? ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 0) + (next ? 1 : -1)) }) : null);
    try {
      if (next) await supabase.from("follows").insert({ follower_id: userProfile.id, following_id: activeProfileView.id });
      else await supabase.from("follows").delete().eq("follower_id", userProfile.id).eq("following_id", activeProfileView.id);
    } catch (_) {}
  }

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
      if (ceoRow && typeof ceoRow.auto_feed_enabled === "boolean") autoEnabled = ceoRow.auto_feed_enabled;
      if (autoEnabled) {
        try {
          const aiRes = await fetch("/api/zuka-news");
          const aiJson = await aiRes.json();
          if (Array.isArray(aiJson.items) && aiJson.items.length > 0) {
            setPosts((prev) => {
              const userOnly = prev.filter((x) => !String(x.id).startsWith("live-news-") && !String(x.id).startsWith("funny-ai-"));
              return [...aiJson.items, ...userOnly];
            });
          }
        } catch (_) {}
      }
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
      <CreatePost userProfile={userProfile} onCreatePost={handleCreatePost} onOpenProfile={() => openUserProfileSafe(userProfile)} />
      <Stories userProfile={userProfile} stories={stories} onUploadStory={handleUploadStory} onDeleteStory={(id) => setStories((prev) => prev.filter((x) => x.id !== id))} />
      <div>
        {posts.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E6EB', borderRadius: '8px', padding: '24px', margin: '0 8px', textAlign: 'center', color: '#65676B', fontSize: '15px' }}>
            No posts yet. Share the first update on ZUKA above!
          </div>
        ) : (
          posts.map((post) => (
            <Post key={post.id} post={post} currentUserId={userProfile?.id} onOpenUserProfile={openUserProfileSafe}
              onOpenUserProfile={openUserProfileSafe}
              onDeletePost={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
            />
          ))
        )}
      </div>
      <FeedGuard><ZukaAdSlot /></FeedGuard>
      {activeProfileView && (<div style={{ position: "fixed", inset: 0, zIndex: 11000, backgroundColor: "#F0F2F5", overflowY: "auto" }}><div style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "#FFF", padding: "10px 14px", borderBottom: "1px solid #E4E6EB", display: "flex", alignItems: "center", justifyContent: "space-between" }}><button type="button" onClick={() => setActiveProfileView(null)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#F0F2F5", fontSize: "20px", fontWeight: 700, cursor: "pointer" }}>&lt;</button><span style={{ fontWeight: 700, fontSize: "16px", color: "#050505" }}>{activeProfileView.full_name}</span><div style={{ width: "36px" }} /></div><div style={{ backgroundColor: "#FFF", paddingBottom: "14px", marginBottom: "8px" }}><div style={{ height: "155px", backgroundColor: "#BCC0C4", backgroundImage: activeProfileView.cover_url ? `url(${activeProfileView.cover_url})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} /><div style={{ padding: "0 16px", marginTop: "-56px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}><img src={activeProfileView.avatar_url} alt={activeProfileView.full_name} style={{ width: "112px", height: "112px", borderRadius: "50%", objectFit: "cover", border: "4px solid #FFF", backgroundColor: "#FFF" }} /><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "8px" }}><h2 style={{ fontSize: "22px", fontWeight: 800, color: "#050505", margin: 0 }}>{activeProfileView.full_name}</h2>{activeProfileView.is_verified === true && <span style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#1877F2", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>✓</span>}</div><div style={{ fontSize: "14px", fontWeight: 600, color: "#65676B", marginTop: "4px" }}>{activeProfileView.followersCount} followers</div>{activeProfileView.bio && <p style={{ fontSize: "14px", color: "#050505", marginTop: "6px", maxWidth: "340px" }}>{activeProfileView.bio}</p>}<div style={{ display: "flex", gap: "8px", width: "100%", marginTop: "14px" }}>{userProfile?.id && activeProfileView.id && String(userProfile.id) === String(activeProfileView.id) ? (<><button type="button" onClick={() => setActiveProfileView(null)} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>+ Add to story</button><button type="button" onClick={() => { setEditNameVal(activeProfileView.full_name || ""); setEditBioVal(activeProfileView.bio || ""); setEditProfileOpen(true); }} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: "#E4E6EB", color: "#050505", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Edit profile</button></>) : (<><button type="button" onClick={toggleProfileFollow} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: profileFollowing ? "#E4E6EB" : "#1877F2", color: profileFollowing ? "#050505" : "#FFF", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>{profileFollowing ? "Following" : "Follow"}</button><button type="button" onClick={() => setMsgBoxOpen(true)} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: "#E4E6EB", color: "#050505", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Message</button></>)}</div></div></div><div style={{ display: "flex", backgroundColor: "#FFF", borderBottom: "1px solid #E4E6EB", padding: "0 12px" }}>{["all", "photos", "reels"].map((tb) => (<button key={tb} type="button" onClick={() => setProfileTab(tb)} style={{ flex: 1, padding: "12px 0", border: "none", borderBottom: profileTab === tb ? "3px solid #1877F2" : "3px solid transparent", backgroundColor: "transparent", color: profileTab === tb ? "#1877F2" : "#65676B", fontWeight: 700, fontSize: "14px", textTransform: "capitalize", cursor: "pointer" }}>{tb}</button>))}</div><div style={{ padding: "8px 0 32px" }}>{profileTab === "all" && posts.filter((pt) => activeProfileView.id ? String(pt.user_id) === String(activeProfileView.id) : pt.author_name === activeProfileView.full_name).map((pt) => (<Post key={pt.id} post={pt} currentUserId={userProfile?.id} onOpenUserProfile={openUserProfileSafe} onDeletePost={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />))}{profileTab === "photos" && (<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", backgroundColor: "#FFF", padding: "2px" }}>{posts.filter((pt) => (activeProfileView.id ? String(pt.user_id) === String(activeProfileView.id) : pt.author_name === activeProfileView.full_name) && pt.media_url && pt.media_type !== "video").map((pt) => (<img key={pt.id} src={pt.media_url} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />))}</div>)}{profileTab === "reels" && (<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", backgroundColor: "#FFF", padding: "2px" }}>{profileReels.map((rl) => (<video key={rl.id} src={rl.video_url} muted playsInline preload="metadata" style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", backgroundColor: "#000" }} />))}</div>)}</div>{editProfileOpen && (<div onClick={() => setEditProfileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 12000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "400px", backgroundColor: "#FFF", borderRadius: "12px", padding: "16px" }}><h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: 700 }}>Edit Profile</h3><input type="text" value={editNameVal} onChange={(e) => setEditNameVal(e.target.value)} placeholder="Full name" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CCD0D5", marginBottom: "10px", fontSize: "14px" }} /><textarea value={editBioVal} onChange={(e) => setEditBioVal(e.target.value)} placeholder="Bio" rows={3} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CCD0D5", marginBottom: "12px", fontSize: "14px" }} /><button type="button" onClick={saveProfileEditsReal} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700, cursor: "pointer" }}>Save</button></div></div>)}{msgBoxOpen && (<div onClick={() => setMsgBoxOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 12000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "400px", backgroundColor: "#FFF", borderRadius: "12px", padding: "16px" }}><h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: 700 }}>Message {activeProfileView.full_name}</h3><textarea value={msgVal} onChange={(e) => setMsgVal(e.target.value)} placeholder="Write a message..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CCD0D5", marginBottom: "12px", fontSize: "14px" }} /><button type="button" onClick={sendDirectProfileMsg} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700, cursor: "pointer" }}>Send</button></div></div>)}</div>)}
          
    </div>
  );
}
