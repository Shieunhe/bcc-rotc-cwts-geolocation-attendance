"use client";

import { useState } from "react";
import Link from "next/link";
import AdminSidebarItems from "@/components/admin/shared/AdminSidebarItems";
import { useAdminEnrollments } from "@/hooks/useAdminEnrollments";
import { NSTProgram } from "@/types";

interface AdminDashboardProps {
  program: NSTProgram;
}

export default function AdminDashboard({ program }: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { enrollments, isLoading } = useAdminEnrollments(program);

  const base = `/admin/${program.toLowerCase()}`;
  const pending = enrollments.filter((e) => e.status === "pending").length;
  const approved = enrollments.filter((e) => e.status === "approved").length;
  const total = enrollments.length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebarItems isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} program={program} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">BCC NSTP — {program} Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Welcome, {program} Admin
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage {program} enrollments and student records.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Enrollment List Card */}
            <Link href={`${base}/enrollment`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Enrollment List</p>
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
                  Loading...
                </span>
              ) : total > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">
                    {total} Total
                  </span>
                  {pending > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-yellow-100 text-yellow-700 border-yellow-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      {pending} Pending
                    </span>
                  )}
                  {approved > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-green-100 text-green-700 border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {approved} Approved
                    </span>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
                  No enrollments yet
                </span>
              )}
              <p className="text-xs text-gray-500 mt-2">Tap to view and manage all {program} enrollments.</p>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
