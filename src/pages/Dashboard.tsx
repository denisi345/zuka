import ZukaCallModal from "@/components/zuka/ZukaCallModal";
import FacebookMenu from "@/components/zuka/FacebookMenu";
import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/zuka/Header";
import LeftSidebar from "@/components/zuka/LeftSidebar";
import Feed from "@/components/zuka/Feed";
import { FriendsView, NotificationsView } from "@/components/zuka/FriendsAndNotifs";
import Messenger from "@/components/zuka/Messenger";
import Reels from "@/components/zuka/Reels";
import Marketplace from "@/components/zuka/Marketplace";
import Profile from "@/components/zuka/Profile";
import RightSidebar from "@/components/zuka/RightSidebar";

const Dashboard = () => {
  const storeProfile = useAuthStore((s) => s.profile);
  const [localProfile, setLocalProfile] = useState(null);
  const profile = localProfile || storeProfile;
  React.useEffect(() => { if (!storeProfile?.id) return; import("@/integrations/supabase/client").then(({ supabase }) => { supabase.from("profiles").select("*").eq("id", storeProfile.id).maybeSingle().then(({ data }) => { if (data) setLocalProfile(data); }); }); }, [storeProfile?.id]);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [viewedProfile, setViewedProfile] = useState(null);

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

      {menuOpen && (
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
              onOpenUserProfile={(person) => { setViewedProfile(person); setActiveTab("profile"); }}
            />
          )}
          {activeTab === "profile" && (
            <Profile
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
              userProfile={profile}
              onMessageUser={(person) => { setChatTarget(person); setActiveTab("messenger"); }}
            />
          )}
          {activeTab === "messenger" && <Messenger currentUser={profile} initialPeer={chatTarget} onOpenUserProfile={(u) => { setViewedProfile(u); setActiveTab("profile"); }} />}
          {activeTab === "reels" && <Reels userProfile={profile} onOpenUserProfile={(u) => { setViewedProfile(u); setActiveTab("profile"); }} />}
          {activeTab === "notifications" && <NotificationsView userProfile={profile} onOpenTab={(tab) => setActiveTab(tab)} />}
          {activeTab === "marketplace" && (
            <Marketplace
              userProfile={profile}
              onMessageSeller={(sellerId, sellerName, msg) => {
                if (sellerId) setChatTarget({ id: sellerId, full_name: sellerName, prefill: msg });
                setActiveTab("messenger");
              }}
            />
          )}
        </main>

        <div className="hidden xl:block w-[320px] shrink-0">
          <RightSidebar userProfile={profile} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
