export default function NoProgramCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-gray-400 to-gray-500">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-white">No Program Enrolled</h3>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">You&apos;re not enrolled in any NSTP program</p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[260px]">
            Please enroll in ROTC or CWTS first to access attendance sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
