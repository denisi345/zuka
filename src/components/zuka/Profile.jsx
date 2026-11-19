import ProfileTimeline from "./ProfileTimeline";
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Edit3, MessageCircle, ArrowLeft, Check, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ZukaBadge from './ZukaBadge';

export default function Profile({ currentUser, targetProfile, onBack, onOpenMessenger, onProfileUpdated }) {
  const targetId = typeof targetProfile === 'string' ? targetProfile : targetProfile?.id;
  const isOwn = !targetId || String(targetId) === String(currentUser?.id);
  const initialData = isOwn ? (currentUser || {}) : (typeof targetProfile === 'object' && targetProfile ? targetProfile : { id: targetId });

  const [profile, setProfile] = useState(initialData);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(initialData.full_name || initialData.username || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(initialData.cover_url || '');
  const [saving, setSaving] = useState(false);
  const [viewMedia, setViewMedia] = useState(null);
  const [friendSent, setFriendSent] = useState(false);

  const avatarInputRef = useRef(null);
  useEffect(() => { if (!initialData?.id) return; supabase.from("profiles").select("*").eq("id", initialData.id).maybeSingle().then(({ data }) => { if (data) { setProfile(data); setFullName(data.full_name || data.username || ""); setBio(data.bio || ""); setAvatarUrl(data.avatar_url || ""); setCoverUrl(data.cover_url || ""); } }); }, [initialData?.id]);
  const coverInputRef = useRef(null);

  async function uploadImageFile(file, folder) {
    if (!file) return '';
    let finalUrl = URL.createObjectURL(file);
    const clean = (file.name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '');
    const path = `${folder}/${Date.now()}_${clean}`;
    for (const bucket of ['media', 'avatars', 'posts', 'public']) {
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
      if (!upErr) {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        if (pub?.publicUrl) { finalUrl = pub.publicUrl; break; }
      }
    }
    return finalUrl;
  }

  async function handlePickMedia(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const url = await uploadImageFile(file, type === 'avatar' ? 'avatars' : 'covers');
    const field = type === 'avatar' ? 'avatar_url' : 'cover_url';
    if (type === 'avatar') setAvatarUrl(url); else setCoverUrl(url);
    const updated = { ...profile, [field]: url };
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
    if (profile.id) {
      try { await supabase.from('profiles').update({ [field]: url }).eq('id', profile.id); } catch (_) {}
    }
    setSaving(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const updated = { ...profile, full_name: fullName.trim() || profile.full_name, bio: bio.trim(), avatar_url: avatarUrl, cover_url: coverUrl };
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
    if (profile.id) {
      try {
        await supabase.from('profiles').update({ full_name: updated.full_name, bio: updated.bio, avatar_url: updated.avatar_url, cover_url: updated.cover_url }).eq('id', profile.id);
      } catch (_) {}
    }
    setSaving(false);
    setEditing(false);
  }

  async function handleAddFriend() {
    setFriendSent(true);
    if (currentUser?.id && profile.id) {
      try { await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: profile.id, status: 'pending' }); } catch (_) {}
    }
  }
  const displayName = profile.full_name || profile.username || 'ZUKA Member';

  return (
    <div style={{ backgroundColor: '#F0F2F5', minHeight: 'calc(100vh - 98px)', paddingBottom: '48px' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E6EB' }}>
        {!isOwn && (
          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #E4E6EB' }}>
            <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '15px', color: '#050505' }}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>
        )}

        <div onClick={() => { if (coverUrl) setViewMedia({ url: coverUrl, label: 'Cover photo' }); }} style={{ position: 'relative', height: '170px', cursor: coverUrl ? 'pointer' : 'default', background: coverUrl ? `url(${coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1877F2 0%, #42B72A 100%)' }}>
          {isOwn && (
            <>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handlePickMedia(e, 'cover')} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
                style={{ position: 'absolute', bottom: '10px', right: '12px', zIndex: 10, backgroundColor: '#FFFFFF', color: '#050505', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', cursor: 'pointer' }}
              >
                <Camera size={16} /> Edit cover
              </button>
            </>
          )}
        </div>

        <div style={{ padding: '0 16px 16px', position: 'relative' }}>
          <div style={{ position: 'relative', width: '104px', height: '104px', marginTop: '-52px', zIndex: 12 }}>
            <div onClick={() => { if (avatarUrl) setViewMedia({ url: avatarUrl, label: 'Profile picture' }); }} style={{ width: '104px', height: '104px', borderRadius: '50%', border: '4px solid #FFFFFF', backgroundColor: '#1877F2', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', fontWeight: 800, cursor: avatarUrl ? 'pointer' : 'default' }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName.charAt(0).toUpperCase()}
            </div>
            {isOwn && (
              <>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={(e) => handlePickMedia(e, 'avatar')} style={{ display: 'none' }} />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Upload profile photo"
                  style={{ position: 'absolute', bottom: '2px', right: '2px', zIndex: 15, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E4E6EB', color: '#050505', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Camera size={16} />
                </button>
              </>
            )}
          </div>

          <h1 style={{ margin: '10px 0 2px', fontSize: '22px', fontWeight: 800, color: '#050505', display: 'flex', alignItems: 'center' }}>
            <span>{displayName}</span>
            {profile.is_verified && <ZukaBadge size={20} />}
          </h1>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#65676B', marginBottom: '6px' }}>0 Friends</div>
          {profile.bio && <p style={{ margin: '0 0 12px', fontSize: '15px', color: '#050505' }}>{profile.bio}</p>}

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {isOwn ? (
              <>
                <button type="button" onClick={() => setEditing(!editing)} style={{ flex: 1, backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Edit3 size={16} /> {editing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent("zuka:open-story")); }} style={{ flex: 1, backgroundColor: "#1877F2", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "10px", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>+ Add to story</button>
              </>
            ) : (
              <>
                <button type="button" onClick={handleAddFriend} disabled={friendSent} style={{ flex: 1, backgroundColor: friendSent ? '#E4E6EB' : '#1877F2', color: friendSent ? '#050505' : '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                  <UserPlus size={16} /> {friendSent ? 'Request Sent' : 'Add Friend'}
                </button>
                <button type="button" onClick={() => onOpenMessenger && onOpenMessenger(profile)} style={{ flex: 1, backgroundColor: '#E4E6EB', color: '#050505', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                  <MessageCircle size={16} /> Message
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isOwn && editing && (
        <form onSubmit={handleSave} style={{ backgroundColor: '#FFFFFF', margin: '10px', borderRadius: '10px', padding: '14px', border: '1px solid #E4E6EB', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: 800, fontSize: '16px' }}>Edit Profile Details</div>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '15px' }} />
          <textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '15px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => avatarInputRef.current?.click()} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #1877F2', backgroundColor: '#E7F3FF', color: '#1877F2', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              Choose Profile Photo
            </button>
            <button type="button" onClick={() => coverInputRef.current?.click()} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #1877F2', backgroundColor: '#E7F3FF', color: '#1877F2', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              Choose Cover Photo
            </button>
          </div>
          <button type="submit" disabled={saving} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
            <Check size={18} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
      <ProfileTimeline profile={profile} isOwnProfile={isOwn} />
      {viewMedia && (
        <div onClick={() => setViewMedia(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.96)', zIndex: 150, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}><span>{displayName}</span>{profile?.is_verified && <ZukaBadge size={14} />}</div>
              <span style={{ fontSize: '12px', color: '#B0B3B8' }}>· {viewMedia.label}</span>
            </div>
            <button type="button" onClick={() => setViewMedia(null)} style={{ border: 'none', backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFFFFF', borderRadius: '50%', width: '34px', height: '34px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={viewMedia.url} alt={viewMedia.label} style={{ maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain', borderRadius: '6px' }} />
          </div>
          <div style={{ textAlign: 'center', color: '#B0B3B8', fontSize: '12px' }}>Tap anywhere outside photo to close</div>
        </div>
      )}
    </div>
  );
}
