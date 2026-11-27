import PeopleYouMayKnow from "./PeopleYouMayKnow";
import ZukaBadge from './ZukaBadge';
import ZukaAdSlot from "./ZukaAdSlot";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CreatePost from './CreatePost';
import Stories from './Stories';
import Post from './Post';
import { fetchLiveNewsAndFunny } from './liveAutoFeed';

class FeedGuard extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: String((e?.message || e) + "\n" + (e?.stack || "")).slice(0, 420) }; }
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
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [reelMuted, setReelMuted] = useState(false);
  const [reelLiked, setReelLiked] = useState(false);
  const [reelLikesCount, setReelLikesCount] = useState(0);
  const [reelCommentsOpen, setReelCommentsOpen] = useState(false);
  const [reelCommentsList, setReelCommentsList] = useState([]);
  const [reelCommentInput, setReelCommentInput] = useState("");
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editNameVal, setEditNameVal] = useState("");
  const [editBioVal, setEditBioVal] = useState("");
  const [msgBoxOpen, setMsgBoxOpen] = useState(false);
  const [msgVal, setMsgVal] = useState("");
  const [activeProfileReel, setActiveProfileReel] = useState(null);
    useEffect(() => { if (!userProfile?.id) return; const ping = () => { if (userProfile?.show_active_status !== false) { supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userProfile.id).then(() => {}).catch(() => {}); } }; ping(); const iv = setInterval(ping, 30000); return () => clearInterval(iv); }, [userProfile?.id, userProfile?.show_active_status]);
  const [activeProfilePhoto, setActiveProfilePhoto] = useState(null);
  const [photoLiked, setPhotoLiked] = useState(false);
  const [photoLikesCount, setPhotoLikesCount] = useState(0);
  const [photoCommentsOpen, setPhotoCommentsOpen] = useState(false);
  const [photoCommentsList, setPhotoCommentsList] = useState([]);
  const [photoCommentInput, setPhotoCommentInput] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = React.useRef(null);
  const avatarInputRef = React.useRef(null);
  useEffect(() => {
    if (!activeProfileView) return;
    window.history.pushState({ zukaFeedProfile: true }, "");
    const onPop = () => setActiveProfileView(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [activeProfileView]);
  async function openUserProfileSafe(target, fallbackName, fallbackAvatar) {
    if (onOpenUserProfile) { onOpenUserProfile(target, fallbackName, fallbackAvatar); return; }
    const uid = typeof target === "string" ? target : (target?.id || target?.user_id || null);
    const baseName = fallbackName || (typeof target === "object" ? (target?.full_name || target?.author_name) : "") || "Zuka Member";
    const baseAvatar = fallbackAvatar || (typeof target === "object" ? (target?.avatar_url || target?.author_avatar) : "") || `https://ui-avatars.com${encodeURIComponent(baseName)}&background=1877F2&color=fff&bold=true`;
    setProfileTab("all"); loadUserReelsReal(uid); loadUserPhotosReal(uid, baseAvatar, "", baseName); setActiveProfileView({ id: uid, full_name: baseName, avatar_url: baseAvatar, cover_url: "", bio: "", is_verified: false, followersCount: 0 });
    if (!uid) return;
    try {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      const { data: fRows } = await supabase.from("follows").select("follower_id").eq("following_id", uid);
      setProfileFollowing(Boolean(userProfile?.id && Array.isArray(fRows) && fRows.some((r) => String(r.follower_id) === String(userProfile.id))));
      setActiveProfileView((prev) => prev ? ({ ...prev, full_name: prof?.full_name || prof?.username || prev.full_name, avatar_url: prof?.avatar_url || prev.avatar_url, cover_url: prof?.cover_url || "", _sync: loadUserPhotosReal(uid, prof?.avatar_url || prev.avatar_url, prof?.cover_url || "", prof?.full_name || prev.full_name), bio: prof?.bio || "", is_verified: Boolean(prof?.is_verified), followersCount: Array.isArray(fRows) ? fRows.length : 0 }) : null);
    } catch (_) {}
  }
      async function loadUserPhotosReal(uid, av, cv, uname) { const list = []; const pushU = (u, pid, cap) => { if (!u) return; const ex = list.find((x) => x.url === u); if (ex) { if (!ex.postId && pid) ex.postId = pid; return; } list.push({ url: u, postId: pid || null, caption: cap || "" }); }; pushU(av, null, "Profile picture"); pushU(cv, null, "Cover photo"); posts.forEach((x) => { if ((uid && String(x.user_id) === String(uid)) || (uname && x.author_name === uname)) { const u = x.media_url || x.image_url; if (u && x.media_type !== "video") pushU(u, x.id, x.content || x.caption || ""); } }); if (uid) { try { const { data } = await supabase.from("posts").select("*").eq("user_id", uid).order("created_at", { ascending: false }); if (Array.isArray(data)) data.forEach((x) => { const u = x.media_url || x.image_url; if (u && x.media_type !== "video") pushU(u, x.id, x.content || x.caption || ""); }); } catch (_) {} } setProfilePhotos(list); }
  async function getAuthUidSafe() { if (userProfile?.id) return userProfile.id; try { const { data } = await supabase.auth.getUser(); return data?.user?.id || null; } catch (_) { return null; } } async function ensurePhotoPostId(item) { if (item?.postId) return item.postId; if (!item?.url) return null; try { const { data: ex } = await supabase.from("posts").select("id").eq("media_url", item.url).limit(1); if (Array.isArray(ex) && ex[0]?.id) { setActiveProfilePhoto((prev) => prev ? ({ ...prev, postId: ex[0].id }) : null); return ex[0].id; } const ownerId = activeProfileView?.id || await getAuthUidSafe(); if (!ownerId) return null; const { data: ins } = await supabase.from("posts").insert({ user_id: ownerId, author_name: activeProfileView?.full_name || "User", content: item.caption || "", media_url: item.url, media_type: "image" }).select("id").single(); if (ins?.id) { setActiveProfilePhoto((prev) => prev ? ({ ...prev, postId: ins.id }) : null); return ins.id; } } catch (_) {} return null; }
  async function openProfilePhotoViewer(item) { const obj = typeof item === "string" ? { url: item, postId: null, caption: "" } : item; setActiveProfilePhoto(obj); setPhotoLiked(false); setPhotoLikesCount(0); setPhotoCommentsList([]); setPhotoCommentsOpen(false); let pid = obj?.postId || null; if (!pid && obj?.url) { try { const { data: ex } = await supabase.from("posts").select("id").eq("media_url", obj.url).limit(1); if (Array.isArray(ex) && ex[0]?.id) { pid = ex[0].id; setActiveProfilePhoto((prev) => prev ? ({ ...prev, postId: pid }) : null); } } catch (_) {} } if (!pid) return; try { const uid = await getAuthUidSafe(); const [{ data: lk }, { data: cm }] = await Promise.all([supabase.from("post_likes").select("user_id").eq("post_id", pid), supabase.from("comments").select("*").eq("post_id", pid).order("created_at", { ascending: true })]); if (Array.isArray(lk)) { setPhotoLikesCount(lk.length); if (uid) setPhotoLiked(lk.some((x) => String(x.user_id) === String(uid))); } if (Array.isArray(cm)) setPhotoCommentsList(cm); } catch (_) {} }
  async function toggleProfilePhotoLike() { const uid = await getAuthUidSafe(); const pid = await ensurePhotoPostId(activeProfilePhoto); if (!uid || !pid) return; const nx = !photoLiked; setPhotoLiked(nx); setPhotoLikesCount((c) => Math.max(0, c + (nx ? 1 : -1))); try { if (nx) await supabase.from("post_likes").upsert({ post_id: pid, user_id: uid }, { onConflict: "post_id,user_id" }); else await supabase.from("post_likes").delete().eq("post_id", pid).eq("user_id", uid); } catch (_) {} }
  async function addProfilePhotoComment(e) { e.preventDefault(); const uid = await getAuthUidSafe(); const cpid = await ensurePhotoPostId(activeProfilePhoto); if (!uid || !cpid || !photoCommentInput.trim()) return; const txt = photoCommentInput.trim(); setPhotoCommentInput(""); const row = { post_id: cpid, user_id: uid, author_name: userProfile?.full_name || userProfile?.username || "User", content: txt }; setPhotoCommentsList((prev) => [...prev, { ...row, id: Date.now() }]); try { await supabase.from("comments").insert(row); } catch (_) {} }
  async function openProfileReelPlayer(rl) { setActiveProfileReel(rl); setReelLiked(false); setReelLikesCount(rl?.likes_count || 0); setReelCommentsList([]); setReelCommentsOpen(false); if (!rl?.id) return; try { const [{ data: lk }, { data: cm }] = await Promise.all([supabase.from("reel_likes").select("user_id").eq("reel_id", rl.id), supabase.from("reel_comments").select("*").eq("reel_id", rl.id).order("created_at", { ascending: true })]); if (Array.isArray(lk)) { setReelLikesCount(lk.length); if (userProfile?.id) setReelLiked(lk.some((x) => String(x.user_id) === String(userProfile.id))); } if (Array.isArray(cm)) setReelCommentsList(cm); } catch (_) {} }
  async function toggleProfileReelLike() { if (!userProfile?.id || !activeProfileReel?.id) return; const nx = !reelLiked; setReelLiked(nx); setReelLikesCount((c) => Math.max(0, c + (nx ? 1 : -1))); try { if (nx) await supabase.from("reel_likes").insert({ reel_id: activeProfileReel.id, user_id: userProfile.id }); else await supabase.from("reel_likes").delete().eq("reel_id", activeProfileReel.id).eq("user_id", userProfile.id); } catch (_) {} }
  async function addProfileReelComment(e) { e.preventDefault(); if (!userProfile?.id || !activeProfileReel?.id || !reelCommentInput.trim()) return; const txt = reelCommentInput.trim(); setReelCommentInput(""); const row = { reel_id: activeProfileReel.id, user_id: userProfile.id, author_name: userProfile.full_name || userProfile.username || "User", content: txt }; setReelCommentsList((prev) => [...prev, { ...row, id: Date.now() }]); try { await supabase.from("reel_comments").insert(row); } catch (_) {} }
  async function loadUserReelsReal(uid) { if (!uid) { setProfileReels([]); return; } try { const { data } = await supabase.from("reels").select("*").eq("user_id", uid).order("created_at", { ascending: false }); setProfileReels(Array.isArray(data) ? data : []); } catch (_) { setProfileReels([]); } }
  async function saveProfileEditsReal() { if (!userProfile?.id || !editNameVal.trim()) return; const nm = editNameVal.trim(); const bo = editBioVal.trim(); setActiveProfileView((prev) => prev ? ({ ...prev, full_name: nm, bio: bo }) : null); setEditProfileOpen(false); try { await supabase.from("profiles").update({ full_name: nm, bio: bo }).eq("id", userProfile.id); } catch (_) {} }
    async function handleProfileImgUpload(e, field) { const f = (e.target.files && e.target.files.item(0)) || null; e.target.value = ""; if (!f || !userProfile?.id || uploadingCover) return; setUploadingCover(true); try { const ext = (f.name.split(".").pop() || "jpg").toLowerCase(); const path = `${field}_${userProfile.id}_${Date.now()}.${ext}`; for (const b of ["avatars", "post-media", "stories"]) { const { error } = await supabase.storage.from(b).upload(path, f, { upsert: true }); if (!error) { const { data } = supabase.storage.from(b).getPublicUrl(path); if (data?.publicUrl) { await supabase.from("profiles").update({ [field]: data.publicUrl }).eq("id", userProfile.id); await supabase.from("posts").insert({ user_id: userProfile.id, author_name: userProfile.full_name || userProfile.username || "User", content: field === "cover_url" ? "Updated cover photo" : "Updated profile picture", media_url: data.publicUrl, media_type: "image" }); setActiveProfileView((prev) => prev ? ({ ...prev, [field]: data.publicUrl }) : null); break; } } } } catch (_) {} setUploadingCover(false); }
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

    if (userPosts.length > 0) setPosts(userPosts);
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

  async function handleCreatePost(text, mediaUrl = '', mediaType = 'image', fObj = null) {
    const authorName = userProfile?.full_name || userProfile?.username || 'ZUKA Member';
    const optimistic = { id: `temp-${Date.now()}`, user_id: userProfile?.id, author_name: authorName, avatar_url: userProfile?.avatar_url, is_verified: userProfile?.is_verified, content: text, image_url: mediaUrl, media_type: mediaType, time_label: 'Just now', ...(fObj || {}) };
    setPosts((prev) => [optimistic, ...prev]);
    try {
      const payload = { content: text, author_name: authorName, is_verified: Boolean(userProfile?.is_verified), ...(fObj || {}) };
      if (mediaUrl && !String(mediaUrl).startsWith("blob:")) { payload.image_url = mediaUrl; payload.media_type = mediaType; }
      if (userProfile?.id) payload.user_id = userProfile.id;
      const ins = await supabase.from('posts').insert(payload); if (ins.error && payload.media_type) { delete payload.media_type; await supabase.from('posts').insert(payload); }
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
    <FeedGuard><div style={{ width: '100%', paddingBottom: '48px' }}>
      <CreatePost userProfile={userProfile} onCreatePost={handleCreatePost} onOpenProfile={() => openUserProfileSafe(userProfile)} />
      <Stories userProfile={userProfile} stories={stories} onUploadStory={handleUploadStory} onDeleteStory={(id) => setStories((prev) => prev.filter((x) => x.id !== id))} />
      <div>
        {posts.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E6EB', borderRadius: '8px', padding: '24px', margin: '0 8px', textAlign: 'center', color: '#65676B', fontSize: '15px' }}>
            No posts yet. Share the first update on ZUKA above!
          </div>
        ) : (
          [...posts].sort((a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned))).map((post, idx) => (
            <FeedGuard key={post.id}><Post key={post.id} post={post} currentUserId={userProfile?.id}
              onOpenUserProfile={openUserProfileSafe}
              onDeletePost={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
            /></FeedGuard>
          ))
        )}
      </div>
      <FeedGuard><ZukaAdSlot /></FeedGuard>
      {false && activeProfileView && (<div style={{ position: "fixed", inset: 0, zIndex: 11000, backgroundColor: "#F0F2F5", overflowY: "auto" }}><div style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "#FFF", padding: "10px 14px", borderBottom: "1px solid #E4E6EB", display: "flex", alignItems: "center", justifyContent: "space-between" }}><button type="button" onClick={() => setActiveProfileView(null)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#F0F2F5", fontSize: "20px", fontWeight: 700, cursor: "pointer" }}>&lt;</button><span style={{ fontWeight: 700, fontSize: "16px", color: "#050505" }}>{activeProfileView.full_name}</span><div style={{ width: "36px" }} /></div><div style={{ backgroundColor: "#FFF", paddingBottom: "14px", marginBottom: "8px" }}><div style={{ height: "155px", backgroundColor: "#BCC0C4", backgroundImage: activeProfileView.cover_url ? `url(${activeProfileView.cover_url})` : "none", backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>{userProfile?.id && activeProfileView.id && String(userProfile.id) === String(activeProfileView.id) && (<><input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleProfileImgUpload(e, "cover_url")} style={{ display: "none" }} /><button type="button" onClick={() => coverInputRef.current?.click()} style={{ position: "absolute", bottom: "10px", right: "12px", width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#E4E6EB", fontSize: "16px", cursor: "pointer" }}>📷</button></>)}</div><div style={{ padding: "0 16px", marginTop: "-56px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}><div style={{ position: "relative", display: "inline-block" }}><img src={activeProfileView.avatar_url} alt={activeProfileView.full_name} onClick={() => openProfilePhotoViewer({ url: activeProfileView.avatar_url, postId: null, caption: "Profile picture" })} style={{ width: "112px", height: "112px", borderRadius: "50%", objectFit: "cover", border: "4px solid #FFF", backgroundColor: "#FFF", cursor: "pointer" }} />{userProfile?.id && activeProfileView.id && String(userProfile.id) === String(activeProfileView.id) && (<><input ref={avatarInputRef} type="file" accept="image/*" onChange={(e) => handleProfileImgUpload(e, "avatar_url")} style={{ display: "none" }} /><button type="button" onClick={() => avatarInputRef.current?.click()} style={{ position: "absolute", bottom: "4px", right: "2px", width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #FFF", backgroundColor: "#E4E6EB", fontSize: "14px", cursor: "pointer" }}>📷</button></>)}</div><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "8px" }}><h2 style={{ fontSize: "22px", fontWeight: 800, color: "#050505", margin: 0 }}>{activeProfileView.full_name}</h2>{activeProfileView.is_verified === true && <ZukaBadge size={18} />}</div><div style={{ fontSize: "14px", fontWeight: 600, color: "#65676B", marginTop: "4px" }}>{activeProfileView.followersCount} followers</div>{activeProfileView.bio && <p style={{ fontSize: "14px", color: "#050505", marginTop: "6px", maxWidth: "340px" }}>{activeProfileView.bio}</p>}<div style={{ display: "flex", gap: "8px", width: "100%", marginTop: "14px" }}>{userProfile?.id && activeProfileView.id && String(userProfile.id) === String(activeProfileView.id) ? (<><button type="button" onClick={() => { setActiveProfileView(null); window.dispatchEvent(new CustomEvent("zuka:open-create-story")); }} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>+ Add to story</button><button type="button" onClick={() => { setEditNameVal(activeProfileView.full_name || ""); setEditBioVal(activeProfileView.bio || ""); setEditProfileOpen(true); }} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: "#E4E6EB", color: "#050505", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Edit profile</button></>) : (<><button type="button" onClick={toggleProfileFollow} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: profileFollowing ? "#E4E6EB" : "#1877F2", color: profileFollowing ? "#050505" : "#FFF", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>{profileFollowing ? "Following" : "Follow"}</button><button type="button" onClick={() => setMsgBoxOpen(true)} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: "#E4E6EB", color: "#050505", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Message</button></>)}</div></div></div><div style={{ display: "flex", backgroundColor: "#FFF", borderBottom: "1px solid #E4E6EB", padding: "0 12px" }}>{["all", "photos", "reels"].map((tb) => (<button key={tb} type="button" onClick={() => setProfileTab(tb)} style={{ flex: 1, padding: "12px 0", border: "none", borderBottom: profileTab === tb ? "3px solid #1877F2" : "3px solid transparent", backgroundColor: "transparent", color: profileTab === tb ? "#1877F2" : "#65676B", fontWeight: 700, fontSize: "14px", textTransform: "capitalize", cursor: "pointer" }}>{tb}</button>))}</div><div style={{ padding: "8px 0 32px" }}>{profileTab === "all" && posts.filter((pt) => activeProfileView.id ? String(pt.user_id) === String(activeProfileView.id) : pt.author_name === activeProfileView.full_name).map((pt) => (<Post key={pt.id} post={pt} currentUserId={userProfile?.id} onOpenUserProfile={openUserProfileSafe} onDeletePost={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />))}{profileTab === "photos" && (<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", backgroundColor: "#FFF", padding: "2px" }}>{profilePhotos.map((item, idx) => (<img key={idx} src={item.url} alt="" onClick={() => openProfilePhotoViewer(item)} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", cursor: "pointer" }} />))}</div>)}{profileTab === "reels" && (<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", backgroundColor: "#FFF", padding: "2px" }}>{profileReels.map((rl) => (<video key={rl.id} src={rl.video_url} muted playsInline preload="metadata" onClick={() => openProfileReelPlayer(rl)} style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", backgroundColor: "#000", cursor: "pointer" }} />))}</div>)}</div>{editProfileOpen && (<div onClick={() => setEditProfileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 12000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "400px", backgroundColor: "#FFF", borderRadius: "12px", padding: "16px" }}><h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: 700 }}>Edit Profile</h3><input type="text" value={editNameVal} onChange={(e) => setEditNameVal(e.target.value)} placeholder="Full name" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CCD0D5", marginBottom: "10px", fontSize: "14px" }} /><textarea value={editBioVal} onChange={(e) => setEditBioVal(e.target.value)} placeholder="Bio" rows={3} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CCD0D5", marginBottom: "12px", fontSize: "14px" }} /><button type="button" onClick={saveProfileEditsReal} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700, cursor: "pointer" }}>Save</button></div></div>)}{msgBoxOpen && (<div onClick={() => setMsgBoxOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 12000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "400px", backgroundColor: "#FFF", borderRadius: "12px", padding: "16px" }}><h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: 700 }}>Message {activeProfileView.full_name}</h3><textarea value={msgVal} onChange={(e) => setMsgVal(e.target.value)} placeholder="Write a message..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CCD0D5", marginBottom: "12px", fontSize: "14px" }} /><button type="button" onClick={sendDirectProfileMsg} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700, cursor: "pointer" }}>Send</button></div></div>)}{activeProfilePhoto && (<div style={{ position: "fixed", inset: 0, zIndex: 12500, backgroundColor: "#000", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#FFF" }}><div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><img src={activeProfileView.avatar_url} alt="" style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover" }} /><span style={{ fontWeight: 700, fontSize: "14px" }}>{activeProfileView.full_name}</span>{activeProfileView.is_verified === true && <ZukaBadge size={15} />}</div><button type="button" onClick={() => setActiveProfilePhoto(null)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "rgba(255,255,255,0.18)", color: "#FFF", fontSize: "18px", cursor: "pointer" }}>✕</button></div><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}><img src={activeProfilePhoto.url} alt="" style={{ maxWidth: "100%", maxHeight: "72dvh", objectFit: "contain" }} /></div><div style={{ padding: "10px 14px 18px", backgroundColor: "rgba(0,0,0,0.85)", borderTop: "1px solid rgba(255,255,255,0.12)" }}>{activeProfilePhoto.caption && <div style={{ fontSize: "13.5px", marginBottom: "8px" }}>{activeProfilePhoto.caption}</div>}{(<><div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#B0B3B8", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}><span>👍 {photoLikesCount}</span><span>{photoCommentsList.length} comments</span></div><div style={{ display: "flex", paddingTop: "8px" }}><button type="button" onClick={toggleProfilePhotoLike} style={{ flex: 1, background: "none", border: "none", color: photoLiked ? "#2D88FF" : "#E4E6EB", fontWeight: 700, fontSize: "13.5px", cursor: "pointer" }}>{photoLiked ? "👍 Liked" : "👍 Like"}</button><button type="button" onClick={() => setPhotoCommentsOpen(true)} style={{ flex: 1, background: "none", border: "none", color: "#E4E6EB", fontWeight: 700, fontSize: "13.5px", cursor: "pointer" }}>💬 Comment</button><button type="button" onClick={() => { if (navigator.share) { navigator.share({ title: activeProfileView.full_name, url: activeProfilePhoto.url }).catch(() => {}); } else if (navigator.clipboard) { navigator.clipboard.writeText(activeProfilePhoto.url); } }} style={{ flex: 1, background: "none", border: "none", color: "#E4E6EB", fontWeight: 700, fontSize: "13.5px", cursor: "pointer" }}>↗ Share</button></div></>)}</div>{photoCommentsOpen && (<div onClick={() => setPhotoCommentsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 13000, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", color: "#050505" }}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxHeight: "65dvh", backgroundColor: "#FFF", borderRadius: "16px 16px 0 0", padding: "14px", display: "flex", flexDirection: "column" }}><div style={{ fontWeight: 700, fontSize: "15px", textAlign: "center", paddingBottom: "10px", borderBottom: "1px solid #E4E6EB" }}>Comments ({photoCommentsList.length})</div><div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>{photoCommentsList.map((c) => (<div key={c.id} style={{ marginBottom: "8px", backgroundColor: "#F0F2F5", padding: "8px 12px", borderRadius: "12px" }}><div style={{ fontWeight: 700, fontSize: "12.5px" }}>{c.author_name || "User"}<ZukaBadge userId={c.user_id} size={13} /></div><div style={{ fontSize: "13.5px" }}>{c.content}</div></div>))}</div><form onSubmit={addProfilePhotoComment} style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #E4E6EB" }}><input type="text" value={photoCommentInput} onChange={(e) => setPhotoCommentInput(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, padding: "9px 12px", borderRadius: "20px", border: "1px solid #CCD0D5", fontSize: "13.5px" }} /><button type="submit" style={{ padding: "8px 14px", borderRadius: "20px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700 }}>Send</button></form></div></div>)}</div>)}{activeProfileReel && (<div style={{ position: "fixed", inset: 0, zIndex: 12500, backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}><video src={activeProfileReel.video_url} autoPlay loop muted={reelMuted} playsInline onClick={(e) => { if (e.currentTarget.paused) e.currentTarget.play(); else e.currentTarget.pause(); }} style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", top: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}><button type="button" onClick={() => setActiveProfileReel(null)} style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none", backgroundColor: "rgba(0,0,0,0.45)", color: "#FFF", fontSize: "20px", fontWeight: 700, cursor: "pointer" }}>&lt;</button><span style={{ color: "#FFF", fontWeight: 700, fontSize: "16px", textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>Reels</span><button type="button" onClick={() => setReelMuted((m) => !m)} style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none", backgroundColor: "rgba(0,0,0,0.45)", color: "#FFF", fontSize: "16px", cursor: "pointer" }}>{reelMuted ? "🔇" : "🔊"}</button></div><div style={{ position: "absolute", right: "12px", bottom: "92px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", zIndex: 10 }}><button type="button" onClick={toggleProfileReelLike} style={{ background: "none", border: "none", color: "#FFF", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}><span style={{ fontSize: "26px" }}>{reelLiked ? "❤️" : "👍"}</span><span style={{ fontSize: "12px", fontWeight: 700 }}>{reelLikesCount}</span></button><button type="button" onClick={() => setReelCommentsOpen(true)} style={{ background: "none", border: "none", color: "#FFF", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}><span style={{ fontSize: "25px" }}>💬</span><span style={{ fontSize: "12px", fontWeight: 700 }}>{reelCommentsList.length}</span></button><button type="button" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(window.location.href); }} style={{ background: "none", border: "none", color: "#FFF", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}><span style={{ fontSize: "25px" }}>↗</span><span style={{ fontSize: "12px", fontWeight: 700 }}>Share</span></button></div><div style={{ position: "absolute", left: "14px", right: "76px", bottom: "24px", zIndex: 10, color: "#FFF", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}><div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}><img src={activeProfileView.avatar_url} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #FFF" }} /><span style={{ fontWeight: 700, fontSize: "14.5px" }}>{activeProfileView.full_name}</span>{activeProfileView.is_verified === true && <ZukaBadge size={15} />}</div>{activeProfileReel.caption && <div style={{ fontSize: "13.5px", marginBottom: "4px" }}>{activeProfileReel.caption}</div>}<div style={{ fontSize: "12px", opacity: 0.9 }}>🎵 Original audio</div></div>{reelCommentsOpen && (<div onClick={() => setReelCommentsOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 20, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxHeight: "65dvh", backgroundColor: "#FFF", borderRadius: "16px 16px 0 0", padding: "14px", display: "flex", flexDirection: "column" }}><div style={{ fontWeight: 700, fontSize: "15px", textAlign: "center", paddingBottom: "10px", borderBottom: "1px solid #E4E6EB" }}>Comments ({reelCommentsList.length})</div><div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>{reelCommentsList.map((c) => (<div key={c.id} style={{ marginBottom: "8px", backgroundColor: "#F0F2F5", padding: "8px 12px", borderRadius: "12px" }}><div style={{ fontWeight: 700, fontSize: "12.5px" }}>{c.author_name || "User"}<ZukaBadge userId={c.user_id} size={13} /></div><div style={{ fontSize: "13.5px" }}>{c.content}</div></div>))}</div><form onSubmit={addProfileReelComment} style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #E4E6EB" }}><input type="text" value={reelCommentInput} onChange={(e) => setReelCommentInput(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, padding: "9px 12px", borderRadius: "20px", border: "1px solid #CCD0D5", fontSize: "13.5px" }} /><button type="submit" style={{ padding: "8px 14px", borderRadius: "20px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700 }}>Send</button></form></div></div>)}</div>)}</div>)}
          
    </div></FeedGuard>
  );
}