import React from "react";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/zuka/Header";
import LeftSidebar from "@/components/zuka/LeftSidebar";
import Feed from "@/components/zuka/Feed";
import RightSidebar from "@/components/zuka/RightSidebar";

const Dashboard = () => {
  const profile = useAuthStore((s) => s.profile);

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#050505]">
      <Header userProfile={profile} />
      <div className="max-w-[1440px] mx-auto flex justify-between pt-2">
        <div className="hidden lg:block w-[320px] shrink-0">
          <LeftSidebar userProfile={profile} />
        </div>
        <main className="flex-1 max-w-[680px] mx-auto px-2 sm:px-4">
          <Feed userProfile={profile} />
        </main>
        <div className="hidden xl:block w-[320px] shrink-0">
          <RightSidebar userProfile={profile} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
