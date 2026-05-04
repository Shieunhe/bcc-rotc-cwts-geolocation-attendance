import Link from "next/link";

interface SerialNumberCardProps {
  base: string;
}

export default function SerialNumberCard({ base }: SerialNumberCardProps) {
  return (
    <Link href={`${base}/serial-number`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-violet-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Serial Number</p>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-violet-100 text-violet-700 border-violet-200">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
        Student List
      </span>
      <p className="text-xs text-gray-500 mt-2">Tap to view and manage serial numbers.</p>
    </Link>
  );
}
