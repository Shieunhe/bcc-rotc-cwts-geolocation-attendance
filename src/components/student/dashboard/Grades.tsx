"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { studentService } from "@/services/student.service";
import { StudentGrade } from "@/types";

export default function Grades() {
  const [ms1, setMs1] = useState<StudentGrade | null>(null);
  const [ms2, setMs2] = useState<StudentGrade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (cancelled) return;
        if (!data?.user) { setLoading(false); return; }
        try {
          const g = await studentService.getStudentGrades(String(data.user.id));
          if (!cancelled) { setMs1(g.ms1); setMs2(g.ms2); }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const hasGrades = ms1 || ms2;

  return (
    <Link href="/student/grades" className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Grades</p>
      {loading ? (
        <p className="text-xs text-gray-400">Loading...</p>
      ) : hasGrades ? (
        <div className="space-y-2">
          <div>
            <p className="text-[10px] text-gray-400 font-medium mb-0.5">NSTP 1</p>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-[9px] text-gray-400">Mid</p>
                <p className="text-sm font-bold text-gray-800">{ms1?.midterm ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-gray-400">Final</p>
                <p className="text-sm font-bold text-gray-800">{ms1?.finalTerm ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-gray-400">Avg</p>
                <p className="text-sm font-bold text-gray-800">{ms1?.grade ?? "—"}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium mb-0.5">NSTP 2</p>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-[9px] text-gray-400">Mid</p>
                <p className="text-sm font-bold text-gray-800">{ms2?.midterm ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-gray-400">Final</p>
                <p className="text-sm font-bold text-gray-800">{ms2?.finalTerm ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-gray-400">Avg</p>
                <p className="text-sm font-bold text-gray-800">{ms2?.grade ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
          Not yet released
        </span>
      )}
      <p className="text-xs text-gray-500 mt-2">Grades are released at the end of the semester.</p>
    </Link>
  );
}
