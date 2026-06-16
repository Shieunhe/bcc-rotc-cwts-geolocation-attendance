"use client";

import { useState } from "react";
import AdminSidebarItems from "@/components/admin/shared/AdminSidebarItems";
import { useAdminEnrollments } from "@/hooks/useAdminEnrollments";
import { NSTProgram } from "@/types";
import EnrollmentScheduleCard from "./dashboard/EnrollmentScheduleCard";
import EnrollmentList from "./dashboard/EnrollmentList";
import CWTSCompanyRosterCard from "@/components/admin/cwts/dashboard/CWTSCompanyRosterCard";
import ROTCPlatoonRosterCard from "@/components/admin/rotc/dashboard/ROTCPlatoonRosterCard";
import AttendanceSummaryCard from "./dashboard/AttendanceSummaryCard";
import ViewRecordsCard from "./dashboard/ViewRecordsCard";
import GradesCard from "./dashboard/GradesCard";
import OffensesCard from "./dashboard/OffensesCard";
import SerialNumberCard from "./dashboard/SerialNumberCard";
import SettingsDashboardCard from "@/components/settings/SettingsDashboardCard";
import { useAutoCloseExpiredSessions } from "@/hooks/useAutoCloseExpiredSessions";

interface AdminDashboardProps {
  program: NSTProgram;
}

export default function AdminDashboard({ program }: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { enrollments, isLoading } = useAdminEnrollments(program);
  useAutoCloseExpiredSessions();

  const base = `/admin/${program.toLowerCase()}`;
  const allMsRecords = enrollments.flatMap((e) => e.msRecords);
  const pending = allMsRecords.filter((r) => r.status === "pending").length;
  const approved = allMsRecords.filter((r) => r.status === "approved").length;
  const rejected = allMsRecords.filter((r) => r.status === "rejected").length;
  const total = allMsRecords.length;
  const shellClass =
    program === "ROTC"
      ? "bg-[linear-gradient(180deg,_#f7faff_0%,_#eef5ff_100%)]"
      : "bg-[linear-gradient(180deg,_#f7fbfa_0%,_#edf7f4_100%)]";
  const welcomePanelClass =
    program === "ROTC"
      ? "from-white via-sky-50/70 to-indigo-50/70 border-sky-100"
      : "from-white via-emerald-50/70 to-cyan-50/70 border-emerald-100";

  return (
    <div className={`flex h-screen overflow-hidden ${shellClass}`}>
      <AdminSidebarItems isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} program={program} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">BCC NSTP - {program} Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className={`mb-6 rounded-3xl border bg-gradient-to-r px-5 py-5 shadow-sm ${welcomePanelClass}`}>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Welcome, {program} Admin
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {program === "CWTS"
                ? "Manage CWTS enrollments and cadette records."
                : "Manage ROTC enrollments and cadette records."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <EnrollmentScheduleCard base={base} program={program} />
            <EnrollmentList base={base} program={program} isLoading={isLoading} total={total} pending={pending} approved={approved} rejected={rejected} />
            {program === "CWTS" && <CWTSCompanyRosterCard base={base} />}
            {program === "ROTC" && <ROTCPlatoonRosterCard base={base} />}
            <AttendanceSummaryCard base={base} />
            <ViewRecordsCard base={base} />
            <GradesCard base={base} />
            <OffensesCard base={base} />
            <SerialNumberCard base={base} />
            <SettingsDashboardCard href={`${base}/settings`} />
          </div>
        </main>
      </div>
    </div>
  );
}
