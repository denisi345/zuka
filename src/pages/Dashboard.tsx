import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/zuka/Header";
import LeftSidebar from "@/components/zuka/LeftSidebar";
import Feed from "@/components/zuka/Feed";
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
    <div className="min-h-screen bg-[#F0F2F5] text-[#050505]">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setMenuOpen(false); }}
        onOpenMenu={() => setMenuOpen(!menuOpen)}
      />

      {menuOpen && (
        <div className="fixed top-[54px] right-3 z-50 w-64 bg-white rounded-xl shadow-lg border border-[#E4E6EB] p-3">
          <div className="font-bold text-[16px] px-2 py-1.5 border-b border-[#E4E6EB]">
            {profile?.full_name || profile?.username || "ZUKA Member"}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-2 py-2.5 mt-1 text-[#E41E3F] font-semibold rounded-lg hover:bg-[#F0F2F5] cursor-pointer"
          >
            Log Out
          </button>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto flex justify-between pt-2">
        <div className="hidden lg:block w-[320px] shrink-0">
          <LeftSidebar userProfile={profile} />
        </div>

        <main className="flex-1 max-w-[680px] mx-auto">
          {activeTab === "feed" && <Feed userProfile={profile} />}
          {activeTab !== "feed" && (
            <div className="bg-white border border-[#E4E6EB] rounded-lg p-6 m-2 text-center">
              <h2 className="text-lg font-bold capitalize mb-1">ZUKA {activeTab}</h2>
              <p className="text-sm text-[#65676B] mb-4">Ready to connect {activeTab} module.</p>
              <button
                type="button"
                onClick={() => setActiveTab("feed")}
                className="bg-[#1877F2] text-white font-semibold px-4 py-2 rounded-md text-sm cursor-pointer"
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
