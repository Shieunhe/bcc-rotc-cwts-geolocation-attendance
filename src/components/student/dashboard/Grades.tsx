import Link from "next/link";

interface GradesProps {
    grades: number | undefined
}

export default function Grades({ grades }: GradesProps) {
  return (
    <Link href="/student/grades" className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Grades</p>
        {grades !== undefined && grades !== null ? (
        <p className="text-2xl font-bold text-gray-800">{grades}</p>
        ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
            Not yet released
        </span>
        )}
        <p className="text-xs text-gray-500 mt-2">Grades are released at the end of the semester.</p>
    </Link>
  )
}
