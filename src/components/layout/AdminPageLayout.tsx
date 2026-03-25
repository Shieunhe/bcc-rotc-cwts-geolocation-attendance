"use client";

import { useState } from "react";
import AdminSidebarItems from "@/components/admin/shared/AdminSidebarItems";
import { NSTProgram } from "@/types";

interface AdminPageLayoutProps {
  children: React.ReactNode;
  program: NSTProgram;
}

export default function AdminPageLayout({ children, program }: AdminPageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebarItems isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} program={program} />

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
          <span className="text-sm font-semibold text-gray-700">BCC NSTP — {program} Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
