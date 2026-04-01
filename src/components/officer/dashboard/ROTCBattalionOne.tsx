"use client";

import Link from "next/link";
import { ROTC_BATTALION_1_COMPANIES, ROTC_PLATOONS_PER_COMPANY, ROTC_PLATOON_SLOT_LIMIT } from "@/types";
import { useROTCPlatoonRoster } from "@/hooks/useROTCPlatoonRoster";
import { countBattalionMembers } from "@/components/admin/rotc/platoon-roster/components/ROTCBattalionSection";

export default function ROTCBattalionOne() {
  const { roster, isLoading } = useROTCPlatoonRoster();

  const total = roster ? countBattalionMembers(roster.battalion1, ROTC_BATTALION_1_COMPANIES) : 0;
  const capacity = ROTC_BATTALION_1_COMPANIES.length * ROTC_PLATOONS_PER_COMPANY * ROTC_PLATOON_SLOT_LIMIT;
  const pct = capacity > 0 ? Math.round((total / capacity) * 100) : 0;

  return (
    <Link
      href="/officer/rotc/battalion-1"
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">ROTC — Battalion 1</h3>
          <p className="text-xs text-gray-400">Male cadets battalion</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-blue-600">{isLoading ? "—" : total}</p>
          <p className="text-xs text-gray-400 font-medium tabular-nums">/ {capacity} slots</p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-gray-400">{ROTC_BATTALION_1_COMPANIES.length} companies • {ROTC_PLATOONS_PER_COMPANY} platoons each</p>
          <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors font-medium">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
