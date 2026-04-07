import Link from "next/link";

interface AttendanceSummaryCardProps {
  base: string;
}

export default function AttendanceSummaryCard({ base }: AttendanceSummaryCardProps) {
  return (
    <Link href={`${base}/attendance-summary`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Attendance Summary</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-green-100 text-green-700 border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Present
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-amber-100 text-amber-700 border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Late
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-red-100 text-red-700 border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Absent
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-2">Tap to view daily attendance records.</p>
    </Link>
  );
}
