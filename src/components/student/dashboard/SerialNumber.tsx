import Link from "next/link";

interface SerialNumberProps {
    serialNumber: string | undefined
}

export default function SerialNumber({ serialNumber }: SerialNumberProps) {
  return (
    <Link href="/student/serial-number" className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Serial Number</p>
        {serialNumber ? (
        <p className="text-lg font-bold text-gray-800 font-mono tracking-wider">{serialNumber}</p>
        ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
            Not yet released
        </span>
        )}
        <p className="text-xs text-gray-500 mt-2">Issued upon completion of the program.</p>
    </Link>
  )
}
