import Link from "next/link";

interface AttendanceProps {
    platoon: string | undefined
}

export default function Attendance() {
  return (
    <Link href="/student/attendance" className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-green-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Attendance</p>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
        No sessions yet
        </span>
        <p className="text-xs text-gray-500 mt-2">Tap to view and mark your attendance.</p>
    </Link>
  )
}
