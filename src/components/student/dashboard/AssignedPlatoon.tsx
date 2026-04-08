import Link from "next/link";
import { CWTSCompany, EnrollmentStatus, NSTProgram, ROTCBattalion, ROTCCompany, ROTCPlatoon } from "@/types";

interface AssignedPlatoonProps {
    company: CWTSCompany | undefined;
    rotcCompany: ROTCCompany | undefined;
    battalion: ROTCBattalion | undefined;
    rotcPlatoon: ROTCPlatoon | undefined;
    program: NSTProgram | "";
    status: EnrollmentStatus;
    willingToTakeAdvanceCourse?: boolean;
}

export default function AssignedPlatoon({ company, rotcCompany, battalion, rotcPlatoon, program, status, willingToTakeAdvanceCourse }: AssignedPlatoonProps) {
  const isCWTS = program === "CWTS";
  const isAdvanceCourse = !isCWTS && status === "approved" && !!willingToTakeAdvanceCourse;
  const isAssigned = isCWTS ? !!company : !!rotcCompany;
  const label = isAdvanceCourse ? "Advance Course" : isCWTS ? "Assigned Company" : "Assigned Platoon";
  const groupWord = isAdvanceCourse ? "advance course" : isCWTS ? "company" : "platoon";

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
      {isAssigned ? (
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
