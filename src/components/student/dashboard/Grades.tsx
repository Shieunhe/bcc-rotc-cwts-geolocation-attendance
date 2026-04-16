"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { studentService } from "@/services/student.service";
import { StudentGrade } from "@/types";

export default function Grades() {
  const [ms1, setMs1] = useState<StudentGrade | null>(null);
  const [ms2, setMs2] = useState<StudentGrade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { setLoading(false); return; }
      studentService.getStudentGrades(user.uid).then((g) => {
        setMs1(g.ms1);
        setMs2(g.ms2);
      }).finally(() => setLoading(false));
    });
    return unsub;
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
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-gray-400 font-medium">MS 1</p>
            <p className="text-lg font-bold text-gray-800">{ms1?.grade ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">MS 2</p>
            <p className="text-lg font-bold text-gray-800">{ms2?.grade ?? "—"}</p>
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
