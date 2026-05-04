"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminService } from "@/services/admin.service";
import { NSTProgram, MSLevel } from "@/types";

interface ReEnrollCardProps {
  currentMsLevel: MSLevel | "";
  nstpComponent: NSTProgram | "";
  enrollmentStatus: string;
}

export default function ReEnrollCard({ currentMsLevel, nstpComponent, enrollmentStatus }: ReEnrollCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const nextMs = currentMsLevel === "1" ? "2" : null;

  useEffect(() => {
    if (!nextMs || !nstpComponent || enrollmentStatus !== "approved") {
      setLoading(false);
      return;
    }
    adminService
      .getEnrollmentSchedule(nstpComponent as NSTProgram, nextMs)
      .then((schedule) => {
        if (!schedule) { setIsOpen(false); return; }
        const now = new Date();
        const open = new Date(schedule.openDate);
        const end = new Date(schedule.deadline);
        setIsOpen(now >= open && now <= end);
      })
      .catch(() => setIsOpen(false))
      .finally(() => setLoading(false));
  }, [nextMs, nstpComponent, enrollmentStatus]);

  if (loading || !nextMs || enrollmentStatus !== "approved" || !isOpen) return null;

  return (
    <Link href="/student/re-enrollment" className="group bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-300 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-indigo-300 group-hover:text-indigo-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">Re-enrollment Available</p>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-indigo-100 text-indigo-700 border-indigo-200">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        MS {nextMs} Enrollment Open
      </div>
      <p className="text-xs text-indigo-600/70 mt-2">Tap to enroll for MS {nextMs}. Your info will be pre-filled.</p>
    </Link>
  );
}
