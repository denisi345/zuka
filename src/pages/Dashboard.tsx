import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/zuka/Header";
import LeftSidebar from "@/components/zuka/LeftSidebar";
import Feed from "@/components/zuka/Feed";
import Marketplace from "@/components/zuka/Marketplace";
import Reels from "@/components/zuka/Reels";
import RightSidebar from "@/components/zuka/RightSidebar";

const Dashboard = () => {
  const profile = useAuthStore((s) => s.profile);
  const [activeTab, setActiveTab] = useState("feed");
  const [menuOpen, setMenuOpen] = useState(false);

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
          <div style={{ fontWeight: 700, fontSize: "16px", padding: "6px 8px 10px", borderBottom: "1px solid #E4E6EB" }}>
            {profile?.full_name || profile?.username || "ZUKA Member"}
          </div>
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
          {activeTab === "feed" && <Feed userProfile={profile} />}
          {activeTab === "reels" && <Reels userProfile={profile} />}
          {activeTab === "marketplace" && (
            <Marketplace
              userProfile={profile}
              onMessageSeller={() => setActiveTab("messenger")}
            />
          )}
          {activeTab !== "feed" && activeTab !== "marketplace" && activeTab !== "reels" && (
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E6EB", borderRadius: "8px", padding: "24px", margin: "12px", textAlign: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, textTransform: "capitalize", marginBottom: "6px" }}>ZUKA {activeTab}</h2>
              <p style={{ fontSize: "14px", color: "#65676B", marginBottom: "14px" }}>Ready to connect {activeTab} module.</p>
              <button
                type="button"
                onClick={() => setActiveTab("feed")}
                style={{ backgroundColor: "#1877F2", color: "#FFFFFF", fontWeight: 600, padding: "8px 16px", borderRadius: "6px", border: "none", fontSize: "14px", cursor: "pointer" }}
              >
                Back to Feed
              </button>
            </div>
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
