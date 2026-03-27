"use client";

import StudentPageLayout from "@/components/layout/StudentPageLayout";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { EnrollmentStatus } from "@/types";

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; className: string; dot: string }> = {
  pending: { label: "Pending Review", className: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  approved: { label: "Approved", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

export default function AssignedPlatoon() {
  const { profile, authLoading, dataLoading } = useStudentProfile();
  const isLoading = authLoading || dataLoading;

  const isCWTS = profile?.nstpComponent === "CWTS";
  const isAssigned = isCWTS ? !!profile?.company : !!profile?.rotcCompany;
  const groupLabel = isCWTS ? "Company" : "Platoon";
  const statusConfig = STATUS_CONFIG[profile?.status ?? "pending"];

  return (
    <StudentPageLayout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My {groupLabel}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your assigned {groupLabel.toLowerCase()} for {profile?.nstpComponent || "NSTP"}.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Assignment header */}
          <div className="p-6 flex items-center gap-4">
            {isAssigned ? (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                <span className="text-xl font-bold text-white">
                  {isCWTS ? profile!.company![0] : profile!.rotcCompany![0]}
                </span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
            <div>
              {isAssigned ? (
                isCWTS ? (
                  <>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Company</p>
                    <h2 className="text-xl font-bold text-gray-800">{profile!.company}</h2>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Assignment</p>
                    <h2 className="text-xl font-bold text-gray-800">{profile!.rotcCompany} — Platoon {profile!.rotcPlatoon}</h2>
                    <p className="text-xs text-indigo-500 font-medium">Battalion {profile!.battalion}</p>
                  </>
                )
              ) : (
                <>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">{groupLabel}</p>
                  <h2 className="text-base font-semibold text-gray-400">Not yet assigned</h2>
                </>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="border-t border-gray-100 px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Program</p>
                <p className="text-sm font-semibold text-gray-700">{profile?.nstpComponent}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusConfig.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Course</p>
                <p className="text-sm font-semibold text-gray-700">{profile?.course}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Year Level</p>
                <p className="text-sm font-semibold text-gray-700">{profile?.yearLevel}</p>
              </div>
              {!isCWTS && isAssigned && (
                <>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Battalion</p>
                    <p className="text-sm font-semibold text-gray-700">Battalion {profile?.battalion}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Company</p>
                    <p className="text-sm font-semibold text-gray-700">{profile?.rotcCompany}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </StudentPageLayout>
  );
}
