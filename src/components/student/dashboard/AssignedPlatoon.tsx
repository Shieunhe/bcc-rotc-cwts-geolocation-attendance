import Link from "next/link";
import { CWTSCompany, EnrollmentStatus, NSTProgram, ROTCBattalion, ROTCCompany, ROTCPlatoon, SpecialUnit } from "@/types";

interface AssignedPlatoonProps {
    company: CWTSCompany | undefined;
    rotcCompany: ROTCCompany | undefined;
    battalion: ROTCBattalion | undefined;
    rotcPlatoon: ROTCPlatoon | undefined;
    program: NSTProgram | "";
    status: EnrollmentStatus;
    willingToTakeAdvanceCourse?: boolean;
    specialUnit?: SpecialUnit;
}

export default function AssignedPlatoon({ company, rotcCompany, battalion, rotcPlatoon, program, status, willingToTakeAdvanceCourse, specialUnit }: AssignedPlatoonProps) {
  const isCWTS = program === "CWTS";
  const isAdvanceCourse = !isCWTS && status === "approved" && !!willingToTakeAdvanceCourse;
  const isSpecialUnit = status === "approved" && !!specialUnit;
  const isAssigned = isCWTS ? !!company : !!rotcCompany;
  const label = isSpecialUnit ? `Special Unit — ${specialUnit}` : isAdvanceCourse ? "Advance Course" : isCWTS ? "Assigned Company" : "Assigned Platoon";
  const groupWord = isSpecialUnit ? "unit" : isAdvanceCourse ? "advance course" : isCWTS ? "company" : "platoon";

  return (
    <Link href="/student/assigned-platoon" className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      {isSpecialUnit ? (
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br ${specialUnit === "Medics" ? "from-red-500 to-red-600" : specialUnit === "HQ" ? "from-blue-500 to-blue-600" : "from-emerald-500 to-emerald-600"}`}>
            {specialUnit === "Medics" ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 2v4H6a2 2 0 00-2 2v4h4v4a2 2 0 002 2h4v-4h4a2 2 0 002-2V8h-4V4a2 2 0 00-2-2h-4z" />
              </svg>
            ) : specialUnit === "HQ" ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-base font-bold text-gray-800 leading-tight">{specialUnit}</p>
            <p className={`text-[11px] font-medium ${specialUnit === "Medics" ? "text-red-500" : specialUnit === "HQ" ? "text-blue-500" : "text-emerald-500"}`}>Special Unit Assignment</p>
          </div>
        </div>
      ) : isAssigned ? (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-sm font-bold text-white">{isCWTS ? company![0] : rotcCompany![0]}</span>
          </div>
          <div>
            {isCWTS ? (
              <>
                <p className="text-base font-bold text-gray-800 leading-tight">{company}</p>
                <p className="text-[11px] text-indigo-500 font-medium">CWTS</p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-gray-800 leading-tight">{rotcCompany} — Platoon {rotcPlatoon}</p>
                <p className="text-[11px] text-indigo-500 font-medium">Battalion {battalion}</p>
              </>
            )}
          </div>
        </div>
      ) : isAdvanceCourse ? (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-gray-800 leading-tight">Advance Course</p>
            <p className="text-[11px] text-amber-500 font-medium">ROTC — Advance</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="text-sm text-gray-300">?</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400">Not yet assigned</p>
            <p className="text-[11px] text-gray-300">Pending assignment</p>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">Tap to view your {groupWord} details.</p>
    </Link>
  )
}
