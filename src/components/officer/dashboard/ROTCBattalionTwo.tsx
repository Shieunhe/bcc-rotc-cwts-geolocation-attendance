import Link from "next/link";

export default function ROTCBattalionTwo() {
  return (
    <Link
      href="/officer/rotc/battalion-2"
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">ROTC — Battalion 2</h3>
          <p className="text-xs text-gray-400">Female cadettes battalion management</p>
        </div>
      </div>

      <div className="flex items-center justify-center py-6 rounded-xl bg-gray-50 border border-dashed border-gray-200">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-gray-500">Coming Soon</p>
        </div>
      </div>

      <div className="flex items-center justify-end mt-3">
        <span className="text-xs text-gray-400 group-hover:text-purple-500 transition-colors font-medium">
          View details →
        </span>
      </div>
    </Link>
  );
}
