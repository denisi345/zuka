import ZukaBackNav from "../components/zuka/ZukaBackNav";
const ZukaEvents = lazy(() => import("@/components/zuka/ZukaEvents"));
const ZukaPages = lazy(() => import("@/components/zuka/ZukaPages"));
const ZukaGroups = lazy(() => import("@/components/zuka/ZukaGroups"));
const SavedItems = lazy(() => import("@/components/zuka/SavedItems"));
import ZukaCallModal from "@/components/zuka/ZukaCallModal";
import FacebookMenu from "@/components/zuka/FacebookMenu";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/zuka/Header";
import LeftSidebar from "@/components/zuka/LeftSidebar";
import Feed from "@/components/zuka/Feed";
import { FriendsView, NotificationsView } from "@/components/zuka/FriendsAndNotifs";
const Messenger = lazy(() => import("@/components/zuka/Messenger"));
import Reels from "@/components/zuka/Reels";
const Marketplace = lazy(() => import("@/components/zuka/Marketplace"));
import Profile from "@/components/zuka/Profile";
import RightSidebar from "@/components/zuka/RightSidebar";

const Dashboard = (props: any) => {
  const storeProfile = useAuthStore((s) => s.profile);
  const [localProfile, setLocalProfile] = useState(null);
  const profile = localProfile || storeProfile;
  React.useEffect(() => { if (!storeProfile?.id) return; import("@/integrations/supabase/client").then(({ supabase }) => { supabase.from("profiles").select("*").eq("id", storeProfile.id).maybeSingle().then(({ data }) => { if (data) setLocalProfile(data); }); }); }, [storeProfile?.id]);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("feed"); (window as any).__ZUKA_SET_TAB__ = setActiveTab;
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [initialReel, setInitialReel] = useState<any>(null);
  useEffect(() => { (window as any).__ZUKA_SET_TAB__ = setActiveTab; const h = (e: any) => { if (e?.detail) { setInitialReel(e.detail); } }; window.addEventListener("zuka:open-reel", h); const navH = (ev: any) => { if (ev?.detail) setActiveTab(ev.detail); }; window.addEventListener("zuka:navigate-tab", navH); return () => window.removeEventListener("zuka:open-reel", h); window.removeEventListener("zuka:navigate-tab", navH); }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  useEffect(() => {
    if (!profile?.id) return;
    const ringCh = supabase.channel(`ring-${profile.id}`)
      .on("broadcast", { event: "incoming-call" }, ({ payload }) => {
        if (payload?.caller && payload?.offer) {
          setIncomingCall(payload);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ringCh); };
  }, [profile?.id]);

const openAnyProfile = (person: any, fallbackName?: string, fallbackAvatar?: string) => {
    const uid = typeof person === "string" ? person : (person?.id || person?.user_id || person?.author_id || null);
    if (!uid) return;
    const obj = typeof person === "object" && person !== null
      ? { ...person, id: uid, full_name: person.full_name || fallbackName || "", avatar_url: person.avatar_url || fallbackAvatar || "" }
      : { id: uid, full_name: fallbackName || "", avatar_url: fallbackAvatar || "" };
    setInitialReel(null);
    setViewedProfile(obj);
    setActiveTab("profile");
  };
  useEffect(() => { if (props?.initialFriendId) openAnyProfile(props.initialFriendId); else if (props?.initialOpenOwnProfile) { setViewedProfile(null); setActiveTab("profile"); } }, [props?.initialFriendId, props?.initialOpenOwnProfile]);
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F0F2F5", color: "#050505" }}>
      {incomingCall && profile && (
        <ZukaCallModal
          currentUser={profile}
          peer={incomingCall.caller}
          mode={incomingCall.mode || "audio"}
          incomingOffer={incomingCall.offer}
          onClose={() => setIncomingCall(null)}
        />
      )}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setMenuOpen(false); }}
        onOpenMenu={() => setMenuOpen(!menuOpen)}
      />

      <ZukaBackNav activeTab={activeTab} menuOpen={menuOpen} initialReel={!!initialReel} onBack={()=>{if(initialReel)setInitialReel(null);else if(menuOpen)setMenuOpen(false);else setActiveTab("feed")}}/>{menuOpen && (
    <FacebookMenu
      profile={profile}
      onClose={() => setMenuOpen(false)}
      onNavigateTab={(tab) => setActiveTab(tab)}
      onOpenProfile={() => { setViewedProfile(null); setActiveTab("profile"); }}
      onOpenAI={() => { setChatTarget({ id: "zuka-ai", full_name: "ZUKA AI", username: "zuka_ai", is_ai: true, is_verified: true }); setActiveTab("messenger"); }}
      onLogout={handleLogout}
    />
  )}

      <div style={{ maxWidth: "1440px", margin: "0 auto", display: "flex", justifyContent: "space-between", paddingTop: "4px" }}>
        <div className="hidden lg:block w-[320px] shrink-0">
          <LeftSidebar userProfile={profile} />
        </div>

        <main style={{ flex: 1, maxWidth: "680px", margin: "0 auto", width: "100%" }}>
          {activeTab === "feed" && (
            <Feed
              userProfile={profile}
              onOpenProfile={() => { setViewedProfile(null); setActiveTab("profile"); }}
              onOpenUserProfile={openAnyProfile}
            />
          )}
{activeTab === "profile" && (
            <Profile
              onOpenUserProfile={openAnyProfile}
              currentUser={profile}
              targetProfile={viewedProfile}
              onBack={() => setActiveTab("feed")}
              onOpenMessenger={(person) => {
                if (person) setChatTarget(person);
                setActiveTab("messenger");
              }}
              onProfileUpdated={(updated) => setLocalProfile(updated)}
            />
          )}
          {activeTab === "friends" && (
            <FriendsView
              onOpenUserProfile={openAnyProfile}
              userProfile={profile}
              onMessageUser={(person) => { setChatTarget(person); setActiveTab("messenger"); }}
            />
          )}
          <Suspense fallback={<div style={{ padding: "32px", textAlign: "center", color: "#65676B", fontWeight: 600 }}>Loading...</div>}>
        {activeTab === "messenger" && <Messenger currentUser={profile} onOpenUserProfile={openAnyProfile} initialPeer={chatTarget} />}
          {activeTab === "reels" && <Reels userProfile={profile} onOpenUserProfile={openAnyProfile} initialReel={initialReel} onBackToFeed={undefined} />}
          {activeTab === "notifications" && <NotificationsView userProfile={profile} onOpenUserProfile={openAnyProfile} onOpenTab={(tab) => setActiveTab(tab)} />}
          {activeTab === "marketplace" && (
          <Marketplace onOpenUserProfile={openAnyProfile}
            userProfile={profile}
            onMessageSeller={(sellerId, sellerName, msg) => {
              if (sellerId) setChatTarget({ id: sellerId, full_name: sellerName, prefill: msg });
              setActiveTab("messenger");
            }}
          />
        )}
        {activeTab === "saved" && <SavedItems onOpenUserProfile={openAnyProfile} currentUserId={profile?.id} onBack={() => setActiveTab("feed")} />}
        {activeTab === "groups" && <ZukaGroups currentUser={profile} onBack={() => setActiveTab("feed")} />}
        {activeTab === "pages" && <ZukaPages currentUser={profile} onBack={() => setActiveTab("feed")} />}
        {activeTab === "events" && <ZukaEvents currentUser={profile} onBack={() => setActiveTab("feed")} />}
        </Suspense>
      </main>

        <div className="hidden xl:block w-[320px] shrink-0">
          <RightSidebar userProfile={profile} />
        </div>

      {initialReel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "#000" }}>
          <Reels userProfile={profile} onOpenUserProfile={openAnyProfile} initialReel={initialReel} onBackToFeed={() => { (window as any).__ZUKA_OPEN_REEL__ = null; setInitialReel(null); }} onOpenUserProfile={(uid: any) => { setInitialReel(null); setViewedProfile(uid); }} />
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
