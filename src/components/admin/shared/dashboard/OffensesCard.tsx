import Link from "next/link";

interface OffensesCardProps {
  base: string;
}

export default function OffensesCard({ base }: OffensesCardProps) {
  return (
    <Link href={`${base}/offenses`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-red-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Attendance Offenses</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-amber-50 text-amber-600 border-amber-200">
          Warning
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-red-50 text-red-600 border-red-200">
          Settlement
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-2">Tap to view students with attendance violations.</p>
    </Link>
  );
}
