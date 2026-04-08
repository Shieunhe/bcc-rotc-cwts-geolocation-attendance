"use client";

import Link from "next/link";
import { useROTCPlatoonRoster } from "@/hooks/useROTCPlatoonRoster";

export default function AdvanceCourseCard() {
  const { roster, isLoading } = useROTCPlatoonRoster();

  const maleCount = roster?.advanceCourseMale.length ?? 0;
  const femaleCount = roster?.advanceCourseFemale.length ?? 0;
  const total = maleCount + femaleCount;

  return (
    <Link
      href="/officer/rotc/advance-course"
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">Advance Course</h3>
          <p className="text-xs text-gray-400">Cadets for advance ROTC</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-amber-600">{isLoading ? "—" : total}</p>
          <p className="text-xs text-gray-400 font-medium tabular-nums">cadets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[11px] text-gray-500">Male: {isLoading ? "—" : maleCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <span className="text-[11px] text-gray-500">Female: {isLoading ? "—" : femaleCount}</span>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <span className="text-xs text-gray-400 group-hover:text-amber-500 transition-colors font-medium">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
