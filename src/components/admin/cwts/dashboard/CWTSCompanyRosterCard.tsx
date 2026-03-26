import Link from "next/link";
import { CWTS_COMPANIES, CWTS_COMPANY_SLOT_LIMIT } from "@/types";
import { useCWTSCompanyRoster } from "@/hooks/useCWTSCompanyRoster";

interface CWTSCompanyRosterCardProps {
  base: string;
}

export default function CWTSCompanyRosterCard({ base }: CWTSCompanyRosterCardProps) {
  const { companies, isLoading } = useCWTSCompanyRoster();

  const totalAssigned = companies
    ? CWTS_COMPANIES.reduce((sum, c) => sum + companies[c].length, 0)
    : 0;
  const totalSlots = CWTS_COMPANIES.length * CWTS_COMPANY_SLOT_LIMIT;
  const fullCount = companies
    ? CWTS_COMPANIES.filter((c) => companies[c].length >= CWTS_COMPANY_SLOT_LIMIT).length
    : 0;

  return (
    <Link href={`${base}/company-roster`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Company List</p>
      {isLoading ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
          Loading...
        </span>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-indigo-100 text-indigo-700 border-indigo-200">
            {totalAssigned}/{totalSlots} Filled
          </span>
          {fullCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-red-100 text-red-700 border-red-200">
              {fullCount} Full
            </span>
          )}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">Tap to view CWTS company assignments.</p>
    </Link>
  );
}
