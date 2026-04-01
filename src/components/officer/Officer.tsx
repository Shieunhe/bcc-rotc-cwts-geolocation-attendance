"use client";

import { useState } from "react";
import OfficerSidebarItems from "@/components/officer/OfficerSidebarItems";
import ROTCBattalionOne from "@/components/officer/dashboard/ROTCBattalionOne";
import CWTSCard from "@/components/officer/dashboard/CWTSCard";
import ROTCBattalionTwo from "@/components/officer/dashboard/ROTCBattalionTwo";

export default function Officer() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
          <span className="text-sm font-semibold text-gray-700">BCC NSTP — Officer</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome, Officer</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage CWTS/ROTC battalions and operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <ROTCBattalionOne />
            <ROTCBattalionTwo />
            <CWTSCard />
          </div>
        </main>
      </div>
    </div>
  );
}
