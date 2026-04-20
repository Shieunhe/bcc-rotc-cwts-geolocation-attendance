"use client";

import { useEffect, useState, useCallback } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import { adminService } from "@/services/admin.service";
import { EnrollmentDocument, NSTProgram, StudentGrade } from "@/types";

interface AdminGradesProps {
  program: NSTProgram;
}

function getPassFail(grade: number | undefined) {
  if (grade === undefined || grade === null) return null;
  return grade >= 1.0 && grade <= 3.0 ? "Passed" : "Failed";
}

export default function AdminGrades({ program }: AdminGradesProps) {
  const [students, setStudents] = useState<EnrollmentDocument[]>([]);
  const [ms1Map, setMs1Map] = useState<Map<string, StudentGrade>>(new Map());
  const [ms2Map, setMs2Map] = useState<Map<string, StudentGrade>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [filterYear, setFilterYear] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<EnrollmentDocument | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, ms1Grades, ms2Grades] = await Promise.all([
        adminService.getApprovedEnrollmentsByProgram(program),
        adminService.getStudentGradesByMs("ms1", program),
        adminService.getStudentGradesByMs("ms2", program),
      ]);
      setStudents(data);
      setMs1Map(ms1Grades);
      setMs2Map(ms2Grades);
    } finally {
      setIsLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = students.filter((s) => {
    if (filterYear && s.yearLevel !== filterYear) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${s.lastName} ${s.firstName} ${s.middleName ?? ""} ${s.studentId ?? ""} ${s.course ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const gradedCount = filtered.filter((s) => ms1Map.has(s.uid) || ms2Map.has(s.uid)).length;
  const ungradedCount = filtered.length - gradedCount;

  const handleGradeSaved = (uid: string, ms: "ms1" | "ms2", grade: number) => {
    const setMap = ms === "ms1" ? setMs1Map : setMs2Map;
    const status: "Passed" | "Failed" = grade >= 1.0 && grade <= 3.0 ? "Passed" : "Failed";
    const now = new Date().toISOString();
    setMap((prev) => {
      const existing = prev.get(uid);
      const next = new Map(prev);
      next.set(uid, { student_uid: uid, grade, status, program, createdAt: existing?.createdAt || now, updatedAt: now });
      return next;
    });
  };

  return (
    <AdminPageLayout program={program}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Encode Grades</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {program === "ROTC"
                ? "Assign MS 1 and MS 2 final grades for ROTC cadets."
                : "Assign MS 1 and MS 2 final grades for CWTS students."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Total Students</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{isLoading ? "—" : filtered.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <p className="text-[11px] text-emerald-600 uppercase tracking-wide font-medium">Graded</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{isLoading ? "—" : gradedCount}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <p className="text-[11px] text-amber-600 uppercase tracking-wide font-medium">Ungraded</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{isLoading ? "—" : ungradedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 space-y-3 border-b border-gray-100">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Filters</p>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                <option value="">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
              <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, student ID, or course..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Loading students...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-500">No students found.</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">#</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Student ID</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Student Name</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Course & Year</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((s, i) => {
                    const hasGrade = ms1Map.has(s.uid) || ms2Map.has(s.uid);
                    return (
                      <tr key={s.uid} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-2.5 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-5 py-2.5 text-xs text-gray-600">{s.studentId}</td>
                        <td className="px-5 py-2.5">
                          <p className="text-xs font-semibold text-gray-800">
                            {s.lastName}, {s.firstName} {s.middleName ? `${s.middleName[0]}.` : ""}
                          </p>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-gray-600">{s.course} &middot; {s.yearLevel}</td>
                        <td className="px-5 py-2.5 text-center">
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
                              hasGrade
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            {hasGrade ? "View / Edit" : "Encode"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filtered.map((s, i) => {
                const hasGrade = ms1Map.has(s.uid) || ms2Map.has(s.uid);
                return (
                  <div key={s.uid} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 font-medium w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {s.lastName}, {s.firstName} {s.middleName ? `${s.middleName[0]}.` : ""}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {s.studentId} &middot; {s.course} &middot; {s.yearLevel}
                        {program === "ROTC" ? ` · MS ${s.msLevel || "—"}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
                        hasGrade
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {hasGrade ? "View" : "Encode"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-right">{filtered.length} student{filtered.length !== 1 ? "s" : ""} shown</p>
            </div>
          </>
        )}
      </div>

      {selectedStudent && (
        <GradeModal
          student={selectedStudent}
          program={program}
          ms1Grade={ms1Map.get(selectedStudent.uid)?.grade}
          ms2Grade={ms2Map.get(selectedStudent.uid)?.grade}
          onClose={() => setSelectedStudent(null)}
          onSaved={handleGradeSaved}
        />
      )}
    </AdminPageLayout>
  );
}

interface GradeModalProps {
  student: EnrollmentDocument;
  program: NSTProgram;
  ms1Grade?: number;
  ms2Grade?: number;
  onClose: () => void;
  onSaved: (uid: string, ms: "ms1" | "ms2", grade: number) => void;
}

function GradeModal({ student, program, ms1Grade, ms2Grade, onClose, onSaved }: GradeModalProps) {
  const [ms1Input, setMs1Input] = useState(ms1Grade !== undefined ? String(ms1Grade) : "");
  const [ms2Input, setMs2Input] = useState(ms2Grade !== undefined ? String(ms2Grade) : "");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<string | null>(null);

  const ms2Disabled = student.msLevel === "1";

  const isValid = (val: string) => {
    if (!val) return false;
    const n = parseFloat(val);
    return !isNaN(n) && n >= 1 && n <= 5;
  };

  const handleInputChange = (val: string, setter: (v: string) => void) => {
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) setter(val);
  };

  const ms1Val = parseFloat(ms1Input);
  const ms2Val = parseFloat(ms2Input);
  const ms1Changed = isValid(ms1Input) && ms1Grade !== ms1Val;
  const ms2Changed = !ms2Disabled && isValid(ms2Input) && ms2Grade !== ms2Val;
  const hasChanges = ms1Changed || ms2Changed;

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      if (ms1Changed) {
        await adminService.saveStudentGrade(student.uid, program, "ms1", ms1Val);
        onSaved(student.uid, "ms1", ms1Val);
      }
      if (ms2Changed) {
        await adminService.saveStudentGrade(student.uid, program, "ms2", ms2Val);
        onSaved(student.uid, "ms2", ms2Val);
      }
      setSaveResult("Grades saved successfully.");
      setTimeout(() => setSaveResult(null), 3000);
    } catch {
      setSaveResult("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  function statusDisplay(val: string, disabled?: boolean) {
    if (disabled || !val || !isValid(val)) return { label: "—", style: "bg-gray-50 border-gray-200 text-gray-400" };
    const n = parseFloat(val);
    return n >= 1.0 && n <= 3.0
      ? { label: "Passed", style: "bg-green-50 border-green-200 text-green-700" }
      : { label: "Failed", style: "bg-red-50 border-red-200 text-red-700" };
  }

  const ms1Status = statusDisplay(ms1Input);
  const ms2Status = statusDisplay(ms2Input, ms2Disabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">
                  {student.firstName[0]}{student.lastName[0]}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{student.studentId}</p>
                <p className="text-sm font-bold text-gray-800">
                  {student.lastName}, {student.firstName}{student.middleName ? ` ${student.middleName[0]}.` : ""}
                </p>
                <p className="text-[11px] text-gray-400 font-medium">{student.course} &middot; {student.yearLevel}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* MS 1 */}
          <div className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">1</span>
                <span className="text-xs font-bold text-gray-700">NSTP 1</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ms1Status.style}`}>
                {ms1Status.label}
              </span>
            </div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Grade</label>
            <input
              type="text"
              inputMode="decimal"
              value={ms1Input}
              onChange={(e) => handleInputChange(e.target.value, setMs1Input)}
              placeholder="1.0 - 5.0"
              className={`w-full px-3 py-2 rounded-lg border text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition ${
                ms1Input && !isValid(ms1Input)
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-gray-200 bg-gray-50 text-gray-800"
              }`}
            />
          </div>

          {/* MS 2 */}
          <div className={`rounded-xl border p-4 ${ms2Disabled ? "border-gray-100 bg-gray-50" : "border-gray-100"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${ms2Disabled ? "bg-gray-100 text-gray-300" : "bg-gray-100 text-gray-600"}`}>2</span>
                <span className={`text-xs font-bold ${ms2Disabled ? "text-gray-400" : "text-gray-700"}`}>NSTP 2</span>
                {ms2Disabled && (
                  <span className="text-[10px] text-gray-400 font-medium">— Not enrolled</span>
                )}
              </div>
              {!ms2Disabled && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ms2Status.style}`}>
                  {ms2Status.label}
                </span>
              )}
            </div>
            <label className={`text-[10px] font-semibold uppercase tracking-wide mb-1 block ${ms2Disabled ? "text-gray-300" : "text-gray-400"}`}>Grade</label>
            <input
              type="text"
              inputMode="decimal"
              value={ms2Disabled ? "" : ms2Input}
              onChange={(e) => handleInputChange(e.target.value, setMs2Input)}
              placeholder={ms2Disabled ? "N/A" : "1.0 - 5.0"}
              disabled={ms2Disabled}
              className={`w-full px-3 py-2 rounded-lg border text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition ${
                ms2Disabled
                  ? "border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed"
                  : ms2Input && !isValid(ms2Input)
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-gray-200 bg-gray-50 text-gray-800"
              }`}
            />
          </div>

          {saveResult && (
            <div className={`px-3 py-2 rounded-lg border text-xs font-semibold ${
              saveResult.includes("Failed")
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}>
              {saveResult}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
