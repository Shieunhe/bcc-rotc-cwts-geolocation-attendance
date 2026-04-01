"use client";

import Link from "next/link";
import { CWTS_COMPANIES, CWTS_COMPANY_SLOT_LIMIT } from "@/types";
import { useCWTSCompanyRoster } from "@/hooks/useCWTSCompanyRoster";

export default function CWTSCard() {
  const { companies, isLoading } = useCWTSCompanyRoster();

  const total = companies
    ? CWTS_COMPANIES.reduce((sum, c) => sum + companies[c].length, 0)
    : 0;
  const capacity = CWTS_COMPANIES.length * CWTS_COMPANY_SLOT_LIMIT;
  const pct = capacity > 0 ? Math.round((total / capacity) * 100) : 0;

  return (
    <Link
      href="/officer/cwts"
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">CWTS</h3>
          <p className="text-xs text-gray-400">Company roster overview</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-emerald-600">{isLoading ? "—" : total}</p>
          <p className="text-xs text-gray-400 font-medium tabular-nums">/ {capacity} slots</p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-gray-400">{CWTS_COMPANIES.length} companies • {CWTS_COMPANY_SLOT_LIMIT} slots each</p>
          <span className="text-xs text-gray-400 group-hover:text-emerald-500 transition-colors font-medium">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
