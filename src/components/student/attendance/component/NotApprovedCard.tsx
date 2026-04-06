interface NotApprovedCardProps {
  status: string;
}

export default function NotApprovedCard({ status }: NotApprovedCardProps) {
  const isRejected = status === "rejected";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-4 ${isRejected ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-yellow-400 to-amber-500"}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            {isRejected ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-sm font-bold text-white">
            {isRejected ? "Enrollment Rejected" : "Enrollment Pending"}
          </h3>
        </div>
      </div>
      <div className="p-5">
        <div className="flex flex-col items-center text-center py-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isRejected ? "bg-red-50" : "bg-amber-50"}`}>
            {isRejected ? (
              <svg className="w-7 h-7 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {isRejected ? "You cannot access attendance" : "Waiting for approval"}
          </p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[260px]">
            {isRejected
              ? "Your enrollment has been rejected. Please contact your administrator for more information."
              : "Your enrollment is still being reviewed. Attendance will be available once your enrollment is approved."}
          </p>
        </div>
      </div>
    </div>
  );
}
