import Link from "next/link";
import {
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
  ROTC_PLATOONS_PER_COMPANY, ROTC_PLATOON_SLOT_LIMIT,
  ROTCCompany, EnrollmentDocument,
} from "@/types";
import { useROTCPlatoonRoster } from "@/hooks/useROTCPlatoonRoster";

type BattalionData = Record<ROTCCompany, Record<number, EnrollmentDocument[]>>;

function countMembers(data: BattalionData, companies: ROTCCompany[]): number {
  let count = 0;
  for (const c of companies) {
    for (let p = 1; p <= ROTC_PLATOONS_PER_COMPANY; p++) {
      count += data[c]?.[p]?.length ?? 0;
    }
  }
  return count;
}

interface ROTCPlatoonRosterCardProps {
  base: string;
}

export default function ROTCPlatoonRosterCard({ base }: ROTCPlatoonRosterCardProps) {
  const { roster, isLoading } = useROTCPlatoonRoster();

  const battalion1 = roster ? countMembers(roster.battalion1, ROTC_BATTALION_1_COMPANIES) : 0;
  const battalion2 = roster ? countMembers(roster.battalion2, ROTC_BATTALION_2_COMPANIES) : 0;
  const total = battalion1 + battalion2;
  const capacity = (ROTC_BATTALION_1_COMPANIES.length + ROTC_BATTALION_2_COMPANIES.length) * ROTC_PLATOONS_PER_COMPANY * ROTC_PLATOON_SLOT_LIMIT;

  return (
    <Link href={`${base}/platoon-roster`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
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
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Platoon List</p>
      {isLoading ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
          Loading...
        </span>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-indigo-100 text-indigo-700 border-indigo-200">
            {total}/{capacity} Assigned
          </span>
          {battalion1 > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">
              Battalion 1: {battalion1}
            </span>
          )}
          {battalion2 > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-rose-100 text-rose-700 border-rose-200">
              Battalion 2: {battalion2}
            </span>
          )}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">Tap to manage ROTC platoon assignments.</p>
    </Link>
  );
}
