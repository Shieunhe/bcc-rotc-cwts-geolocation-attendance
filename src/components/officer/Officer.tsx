"use client";

import { useState } from "react";
import OfficerSidebarItems from "@/components/officer/OfficerSidebarItems";
import ROTCBattalionOne from "@/components/officer/dashboard/ROTCBattalionOne";
import ROTCBattalionTwo from "@/components/officer/dashboard/ROTCBattalionTwo";
import CWTSCard from "@/components/officer/dashboard/CWTSCard";
import CreateAttendanceCard from "@/components/officer/dashboard/CreateAttendanceCard";
import ViewAttendanceCard from "@/components/officer/dashboard/ViewAttendanceCard";
import ViewRecordsCard from "@/components/officer/dashboard/ViewRecordsCard";
import SettingsDashboardCard from "@/components/settings/SettingsDashboardCard";
import AdvanceCourseCard from "@/components/officer/dashboard/AdvanceCourseCard";
import { useAutoCloseExpiredSessions } from "@/hooks/useAutoCloseExpiredSessions";
import PageIntroPanel from "@/components/common/PageIntroPanel";

export default function Officer() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useAutoCloseExpiredSessions();

  return (
    <div className="flex h-screen bg-[linear-gradient(180deg,_#f7faff_0%,_#eef5ff_100%)] overflow-hidden">
      <OfficerSidebarItems isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">BCC NSTP — Director</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PageIntroPanel
            title="Welcome, NSTP Director"
            subtitle="Manage CWTS/ROTC battalions and operations."
            variant="sky"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <ROTCBattalionOne />
            <ROTCBattalionTwo />
            <AdvanceCourseCard />
            <CWTSCard />
            <CreateAttendanceCard />
            <ViewAttendanceCard />
            <ViewRecordsCard />
            <SettingsDashboardCard href="/officer/settings" />
          </div>
        </main>
      </div>
    </div>
  );
}




