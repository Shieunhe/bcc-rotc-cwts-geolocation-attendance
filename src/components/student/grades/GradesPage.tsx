"use client";

import { useEffect, useState } from "react";
import StudentPageLayout from "@/components/layout/StudentPageLayout";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { studentService } from "@/services/student.service";
import { StudentGrade } from "@/types";

export default function GradesPage() {
  const { profile, uid } = useStudentProfile();
  const [ms1, setMs1] = useState<StudentGrade | null>(null);
  const [ms2, setMs2] = useState<StudentGrade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    studentService.getStudentGrades(uid).then((grades) => {
      setMs1(grades.ms1);
      setMs2(grades.ms2);
    }).finally(() => setLoading(false));
  }, [uid]);

  const program = profile?.nstpComponent || "—";
  const programDesc = program === "ROTC"
    ? "Reserved Officers Training Corps"
    : program === "CWTS"
      ? "Civic Welfare Training Service"
      : "—";

  function getOverallStatus(): "Passed" | "Failed" | null {
    if (!ms1 && !ms2) return null;
    if (ms1?.status === "Failed" || ms2?.status === "Failed") return "Failed";
    if (ms1?.status === "Passed" && (!ms2 || ms2.status === "Passed")) return "Passed";
    if (ms1?.status === "Passed" && !ms2) return "Passed";
    return null;
  }

  const overallStatus = getOverallStatus();

  return (
    <StudentPageLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Grades</h1>
            <p className="text-sm text-gray-500 mt-0.5">View your MS 1 and MS 2 final grades.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading grades...</p>
          </div>
        </div>
      ) : !ms1 && !ms2 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-500">No grades released yet</p>
          <p className="text-xs text-gray-400 mt-1">Your grades will appear here once released by your instructor.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Student ID</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Full Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Subject</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Description</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">MS 1</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">MS 2</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Unit</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="px-5 py-3.5 text-xs text-gray-600">{profile?.studentId || "—"}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-gray-800">
                    {profile ? `${profile.lastName}, ${profile.firstName}${profile.middleName ? ` ${profile.middleName[0]}.` : ""}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">{program}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">{programDesc}</td>
                  <td className="px-5 py-3.5 text-center">
                    {ms1 ? (
                      <span className="text-sm font-bold text-gray-800">{ms1.grade}</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {ms2 ? (
                      <span className="text-sm font-bold text-gray-800">{ms2.grade}</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-sm font-bold text-gray-800">3</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {overallStatus ? (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        overallStatus === "Passed"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}>
                        {overallStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile card */}
          <div className="sm:hidden p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Student ID</p>
                <p className="text-xs font-semibold text-gray-700">{profile?.studentId || "—"}</p>
              </div>
              {overallStatus && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                  overallStatus === "Passed"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {overallStatus}
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Full Name</p>
              <p className="text-xs font-semibold text-gray-800">
                {profile ? `${profile.lastName}, ${profile.firstName}${profile.middleName ? ` ${profile.middleName[0]}.` : ""}` : "—"}
              </p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Subject</p>
                <p className="text-xs text-gray-600">{program}</p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Description</p>
                <p className="text-xs text-gray-600">{programDesc}</p>
              </div>
            </div>
            <div className="flex gap-4 pt-2 border-t border-gray-100">
              <div className="flex-1 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">MS 1</p>
                <p className="text-lg font-bold text-gray-800">{ms1?.grade ?? "—"}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">MS 2</p>
                <p className="text-lg font-bold text-gray-800">{ms2?.grade ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentPageLayout>
  );
}
