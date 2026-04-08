"use client";

import { useState } from "react";
import Link from "next/link";
import StudentSidebarItems from "@/components/student/StudentSidebarItems";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import EnrollmentStatus from "./dashboard/EnrollmentStatus";
import AssignedPlatoon from "./dashboard/AssignedPlatoon";
import Attendance from "./dashboard/Attendance";
import Grades from "./dashboard/Grades";
import SerialNumber from "./dashboard/SerialNumber";

const statusConfig = {
  pending: {  
    label: "Pending Approval",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-400",
    desc: "Your enrollment is under review. Please wait for admin approval.",
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    desc: "Your enrollment has been approved.",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    desc: "Your enrollment was rejected. Please contact your coordinator.",
  },
};

export default function Student() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, authLoading, dataLoading, error, uid } = useStudentProfile();
  useAuthGuard({ authLoading, uid });

  const isLoading = authLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <StudentSidebarItems isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <StudentSidebarItems isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
          <p className="text-base font-semibold text-red-500">Could not load your profile.</p>
          <p className="text-sm text-gray-400">
            {error instanceof Error ? error.message : "Your account data was not found."}
          </p>
        </div>
      </div>
    );
  }

  const status = statusConfig[profile.status] ?? statusConfig.pending;
  const lastName = profile.lastName ?? "Student";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebarItems isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar — mobile only */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">BCC NSTP</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Welcome back, {lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile.studentId} • {profile.course} • {profile.yearLevel} • {profile.nstpComponent}
            </p>
          </div>
          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Enrollment Status */}
            <EnrollmentStatus status={status} />
            {/* Assigned Platoon */}
            <AssignedPlatoon company={profile.company} rotcCompany={profile.rotcCompany} battalion={profile.battalion} rotcPlatoon={profile.rotcPlatoon} program={profile.nstpComponent} status={profile.status} willingToTakeAdvanceCourse={profile.willingToTakeAdvanceCourse} />
            {/* Attendance */}
            <Attendance/>
            {/* <Link href="/student/attendance" className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-green-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Attendance</p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
                No sessions yet
              </span>
              <p className="text-xs text-gray-500 mt-2">Tap to view and mark your attendance.</p>
            </Link> */}

            {/* Grades */}
            <Grades grades={profile.grades}/>
            {/* Serial Number */}
            <SerialNumber serialNumber={profile.serialNumber}/>
          </div>
        </main>
      </div>
    </div>
  );
}
