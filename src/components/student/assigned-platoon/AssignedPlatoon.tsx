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
  const isAdvanceCourse = !isCWTS && profile?.status === "approved" && !!profile?.willingToTakeAdvanceCourse;
  const isSpecialUnit = profile?.status === "approved" && !!profile?.specialUnit;
  const isAssigned = isCWTS ? !!profile?.company : !!profile?.rotcCompany;
  const groupLabel = isSpecialUnit ? "Special Unit" : isAdvanceCourse ? "Assignment" : isCWTS ? "Company" : "Platoon";
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
            {isSpecialUnit ? (
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm shrink-0 bg-gradient-to-br ${profile!.specialUnit === "Medics" ? "from-red-500 to-red-600" : profile!.specialUnit === "HQ" ? "from-blue-500 to-blue-600" : "from-emerald-500 to-emerald-600"}`}>
                {profile!.specialUnit === "Medics" ? (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 2v4H6a2 2 0 00-2 2v4h4v4a2 2 0 002 2h4v-4h4a2 2 0 002-2V8h-4V4a2 2 0 00-2-2h-4z" />
                  </svg>
                ) : profile!.specialUnit === "HQ" ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
              </div>
            ) : isAdvanceCourse ? (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            ) : isAssigned ? (
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
              {isSpecialUnit ? (
                <>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Special Unit</p>
                  <h2 className="text-xl font-bold text-gray-800">{profile!.specialUnit}</h2>
                  <p className={`text-xs font-medium ${profile!.specialUnit === "Medics" ? "text-red-500" : profile!.specialUnit === "HQ" ? "text-blue-500" : "text-emerald-500"}`}>Medical Assignment</p>
                </>
              ) : isAdvanceCourse ? (
                <>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Assignment</p>
                  <h2 className="text-xl font-bold text-gray-800">Advance Course</h2>
                  <p className="text-xs text-amber-500 font-medium">ROTC — Advance</p>
                </>
              ) : isAssigned ? (
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
              {isSpecialUnit && (
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Designation</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${profile!.specialUnit === "Medics" ? "bg-red-50 text-red-700 border-red-200" : profile!.specialUnit === "HQ" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile!.specialUnit === "Medics" ? "bg-red-500" : profile!.specialUnit === "HQ" ? "bg-blue-500" : "bg-emerald-500"}`} />
                    {profile!.specialUnit} — Medical Assignment
                  </span>
                </div>
              )}
              {isAdvanceCourse && !isSpecialUnit && (
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Designation</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Advance Course Cadet
                  </span>
                </div>
              )}
              {!isCWTS && !isAdvanceCourse && isAssigned && (
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
