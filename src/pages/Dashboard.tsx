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
  const [activeTab, setActiveTab] = useState("feed");
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F0F2F5", color: "#050505" }}>
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setMenuOpen(false); }}
        onOpenMenu={() => setMenuOpen(!menuOpen)}
      />

      {menuOpen && (
        <div style={{ position: "fixed", top: "54px", right: "12px", zIndex: 50, width: "240px", backgroundColor: "#FFFFFF", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", border: "1px solid #E4E6EB", padding: "12px" }}>
          <button
            type="button"
            onClick={() => { setActiveTab("profile"); setMenuOpen(false); }}
            style={{ width: "100%", textAlign: "left", fontWeight: 700, fontSize: "16px", padding: "8px", borderBottom: "1px solid #E4E6EB", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", color: "#050505" }}
          >
            {profile?.full_name || profile?.username || "ZUKA Member"}
            <div style={{ fontSize: "12px", color: "#1877F2", fontWeight: 600, marginTop: "2px" }}>See your profile</div>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            style={{ width: "100%", textAlign: "left", padding: "10px 8px", marginTop: "4px", color: "#E41E3F", fontWeight: 600, background: "none", border: "none", borderRadius: "8px", cursor: "pointer" }}
          >
            Log Out
          </button>
        </div>
      )}

      <div style={{ maxWidth: "1440px", margin: "0 auto", display: "flex", justifyContent: "space-between", paddingTop: "4px" }}>
        <div className="hidden lg:block w-[320px] shrink-0">
          <LeftSidebar userProfile={profile} />
        </div>

        <main style={{ flex: 1, maxWidth: "680px", margin: "0 auto", width: "100%" }}>
          {activeTab === "feed" && <Feed userProfile={profile} onOpenProfile={() => setActiveTab("profile")} />}
          {activeTab === "profile" && (
            <Profile
              userProfile={profile}
              onBack={() => setActiveTab("feed")}
              onOpenMessenger={() => setActiveTab("messenger")}
              onProfileUpdated={(updated) => setLocalProfile(updated)}
            />
          )}
          {activeTab === "friends" && (
            <FriendsView
              userProfile={profile}
              onMessageUser={(person) => { setChatTarget(person); setActiveTab("messenger"); }}
            />
          )}
          {activeTab === "messenger" && <Messenger userProfile={profile} initialChat={chatTarget} />}
          {activeTab === "reels" && <Reels userProfile={profile} />}
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
