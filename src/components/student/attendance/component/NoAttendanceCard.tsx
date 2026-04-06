interface NoAttendanceCardProps {
  program: string;
}

export default function NoAttendanceCard({ program }: NoAttendanceCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-blue-400 to-indigo-500">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{program} Attendance</h3>
            <p className="text-[11px] text-white/70 font-medium">No active sessions</p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">No Available Attendance</p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[260px]">
            There are no active attendance sessions for {program} right now. Please check back later.
          </p>
        </div>
      </div>
    </div>
  );
}
