"use client";

import { useState, useMemo, useEffect } from "react";
import { useAdminEnrollments } from "@/hooks/useAdminEnrollments";
import { adminService } from "@/services/admin.service";
import {
  NSTProgram,
  EnrollmentDocument,
  StudentGrade,
  ROTC_BATTALION_1_COMPANIES,
  ROTC_BATTALION_2_COMPANIES,
  SPECIAL_UNITS,
} from "@/types";

type BattalionFilter = "All" | "Battalion 1" | "Battalion 2" | "Special Platoon" | "Advance Course";
type EligibilityFilter = "All" | "Eligible" | "Not Eligible" | "Assigned";

interface StudentWithGrades extends EnrollmentDocument {
  ms1Grade?: StudentGrade;
  ms2Grade?: StudentGrade;
  serialCreatedAt?: string;
}

interface AdminSerialNumberProps {
  program: NSTProgram;
}

export default function AdminSerialNumber({ program }: AdminSerialNumberProps) {
  const { enrollments, isLoading } = useAdminEnrollments(program);
  const [search, setSearch] = useState("");
  const [battalionFilter, setBattalionFilter] = useState<BattalionFilter>("All");
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [platoonFilter, setPlatoonFilter] = useState<string>("All");
  const [eligibilityFilter, setEligibilityFilter] = useState<EligibilityFilter>("All");
  const [studentsWithGrades, setStudentsWithGrades] = useState<StudentWithGrades[]>([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [assignStudent, setAssignStudent] = useState<StudentWithGrades | null>(null);
  const [serialInput, setSerialInput] = useState("");
  const [serialError, setSerialError] = useState("");
  const [commandantInput, setCommandantInput] = useState("");
  const [registrarInput, setRegistrarInput] = useState("");
  const [saving, setSaving] = useState(false);

  const approvedStudents = useMemo(
    () => enrollments.filter((e) => e.status === "approved"),
    [enrollments]
  );

  useEffect(() => {
    async function loadGrades() {
      if (approvedStudents.length === 0) {
        setStudentsWithGrades([]);
        setGradesLoading(false);
        return;
      }
      setGradesLoading(true);
      try {
        const [ms1Map, ms2Map, serialMap] = await Promise.all([
          adminService.getStudentGradesByMs("ms1", program),
          adminService.getStudentGradesByMs("ms2", program),
          adminService.getSerialNumbersByProgram(program),
        ]);
        const merged: StudentWithGrades[] = approvedStudents.map((s) => {
          const serial = serialMap.get(s.uid);
          return {
            ...s,
            ms1Grade: ms1Map.get(s.uid),
            ms2Grade: ms2Map.get(s.uid),
            serialNumber: serial?.serialNumber || s.serialNumber,
            serialCreatedAt: serial?.createdAt,
          };
        });
        setStudentsWithGrades(merged);
      } catch (err) {
        console.error("Error loading grades:", err);
        setStudentsWithGrades(approvedStudents.map((s) => ({ ...s })));
      } finally {
        setGradesLoading(false);
      }
    }
    loadGrades();
  }, [approvedStudents, program]);

  const companyOptions = useMemo((): string[] => {
    if (program !== "ROTC") return [];
    switch (battalionFilter) {
      case "Battalion 1":
        return ["All", ...ROTC_BATTALION_1_COMPANIES];
      case "Battalion 2":
        return ["All", ...ROTC_BATTALION_2_COMPANIES];
      case "Special Platoon":
        return ["All", ...SPECIAL_UNITS];
      default:
        return [];
    }
  }, [battalionFilter, program]);

  const platoonOptions = useMemo((): string[] => {
    if (program !== "ROTC") return [];
    if (battalionFilter === "Battalion 1" || battalionFilter === "Battalion 2") {
      return ["All", "1", "2", "3", "4"];
    }
    return [];
  }, [battalionFilter, program]);

  const handleBattalionChange = (val: BattalionFilter) => {
    setBattalionFilter(val);
    setCompanyFilter("All");
    setPlatoonFilter("All");
  };

  const isEligible = (s: StudentWithGrades) => !!s.ms1Grade && !!s.ms2Grade;
  const hasSerial = (s: StudentWithGrades) => !!s.serialNumber;

  const SERIAL_REGEX = /^[A-Z]{2}-[A-Z]\d{2}-\d{6}$/;

  const handleOpenAssign = (student: StudentWithGrades) => {
    setAssignStudent(student);
    setSerialInput("");
    setSerialError("");
    setCommandantInput("");
    setRegistrarInput("");
  };

  const handleSaveSerial = async () => {
    if (!assignStudent || !serialInput.trim() || !commandantInput.trim() || !registrarInput.trim()) return;
    const value = serialInput.trim();
    if (!SERIAL_REGEX.test(value)) {
      setSerialError("Invalid format. Must match: XX-X00-000000 (e.g. BO-R00-000000)");
      return;
    }
    setSerialError("");
    setSaving(true);
    try {
      await adminService.saveSerialNumber(assignStudent.uid, value, program, commandantInput.trim(), registrarInput.trim());
      const now = new Date().toISOString();
      setStudentsWithGrades((prev) =>
        prev.map((s) => s.uid === assignStudent.uid ? { ...s, serialNumber: value, serialCreatedAt: now } : s)
      );
      setAssignStudent(null);
      setSerialInput("");
      setCommandantInput("");
      setRegistrarInput("");
    } catch (err) {
      console.error("Error saving serial number:", err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return studentsWithGrades.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.studentId.toLowerCase().includes(q) ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (eligibilityFilter === "Eligible" && (!isEligible(s) || hasSerial(s))) return false;
      if (eligibilityFilter === "Not Eligible" && isEligible(s)) return false;
      if (eligibilityFilter === "Assigned" && !hasSerial(s)) return false;

      if (program !== "ROTC") return true;

      switch (battalionFilter) {
        case "All":
          return true;
        case "Battalion 1":
          return matchBattalion(s, 1, companyFilter, platoonFilter);
        case "Battalion 2":
          return matchBattalion(s, 2, companyFilter, platoonFilter);
        case "Special Platoon":
          return matchSpecialPlatoon(s, companyFilter);
        case "Advance Course":
          return s.willingToTakeAdvanceCourse === true;
        default:
          return true;
      }
    });
  }, [studentsWithGrades, search, battalionFilter, companyFilter, platoonFilter, eligibilityFilter, program]);

  const eligibleCount = studentsWithGrades.filter((s) => isEligible(s) && !hasSerial(s)).length;
  const assignedCount = studentsWithGrades.filter((s) => hasSerial(s)).length;
  const notEligibleCount = studentsWithGrades.filter((s) => !isEligible(s)).length;

  const loading = isLoading || gradesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-5 border border-violet-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Serial Number</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Assign serial numbers to {program} students who have completed all grades.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/80 rounded-xl px-4 py-3 border border-green-100/50 text-center">
            <p className="text-2xl font-bold text-green-600">{assignedCount}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Assigned</p>
          </div>
          <div className="bg-white/80 rounded-xl px-4 py-3 border border-violet-100/50 text-center">
            <p className="text-2xl font-bold text-violet-600">{eligibleCount}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Eligible</p>
          </div>
          <div className="bg-white/80 rounded-xl px-4 py-3 border border-gray-100/50 text-center">
            <p className="text-2xl font-bold text-gray-400">{notEligibleCount}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Not Eligible</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filters</p>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value as EligibilityFilter)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium text-gray-700"
          >
            <option value="All">All Status</option>
            <option value="Eligible">Eligible (No Serial Yet)</option>
            <option value="Assigned">Assigned</option>
            <option value="Not Eligible">Not Eligible</option>
          </select>

          {program === "ROTC" && (
            <>
              <select
                value={battalionFilter}
                onChange={(e) => handleBattalionChange(e.target.value as BattalionFilter)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium text-gray-700"
              >
                <option value="All">All Battalion</option>
                <option value="Battalion 1">Battalion 1</option>
                <option value="Battalion 2">Battalion 2</option>
                <option value="Special Platoon">Special Platoon</option>
                <option value="Advance Course">Advance Course</option>
              </select>

              {companyOptions.length > 0 && (
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium text-gray-700"
                >
                  {companyOptions.map((c) => (
                    <option key={c} value={c}>
                      {c === "All" ? "All Companies" : c}
                    </option>
                  ))}
                </select>
              )}

              {platoonOptions.length > 0 && (
                <select
                  value={platoonFilter}
                  onChange={(e) => setPlatoonFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium text-gray-700"
                >
                  {platoonOptions.map((p) => (
                    <option key={p} value={p}>
                      {p === "All" ? "All Platoons" : `Platoon ${p}`}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, student ID, or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Student ID</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Full Name</th>
                {program === "ROTC" ? (
                  <>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Battalion</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Company</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Platoon</th>
                  </>
                ) : (
                  <>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Course</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Year</th>
                  </>
                )}
                <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Serial Number</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={program === "ROTC" ? 8 : 7} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400 font-medium">No students found</p>
                      <p className="text-xs text-gray-300">Try adjusting your filters or search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((student, idx) => {
                  const eligible = isEligible(student);
                  const assigned = hasSerial(student);

                  return (
                    <tr key={student.uid} className="hover:bg-violet-50/30 transition group">
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 text-xs font-mono font-semibold text-gray-700 border border-gray-100">
                          {student.studentId}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800">{student.lastName}, {student.firstName} {student.middleName}</p>
                      </td>
                      {program === "ROTC" ? (
                        <>
                          <td className="px-4 py-3.5">
                            {(() => {
                              const label = student.willingToTakeAdvanceCourse
                                ? "Advance Course"
                                : student.specialUnit
                                ? "Special Platoon"
                                : student.battalion
                                ? `Battalion ${student.battalion}`
                                : "—";
                              const color = student.willingToTakeAdvanceCourse
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : student.specialUnit
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : student.battalion
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-50 text-gray-400 border-gray-100";
                              return (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
                                  {label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-medium text-gray-700">
                            {student.willingToTakeAdvanceCourse
                              ? <span className="text-gray-300">—</span>
                              : student.specialUnit
                              ? student.specialUnit
                              : student.rotcCompany || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-medium text-gray-700">
                            {student.willingToTakeAdvanceCourse || student.specialUnit
                              ? <span className="text-gray-300">—</span>
                              : student.rotcPlatoon
                              ? `Platoon ${student.rotcPlatoon}`
                              : <span className="text-gray-300">—</span>}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-xs font-medium text-blue-600 border border-blue-100">
                              {student.course}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-700">{student.yearLevel || "—"}</td>
                        </>
                      )}
                      {/* Serial Number */}
                      <td className="px-4 py-3.5 text-center">
                        {assigned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-sm font-bold text-green-700 border border-green-200">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {student.serialNumber}
                          </span>
                        ) : eligible ? (
                          <button
                            onClick={() => handleOpenAssign(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-xs font-medium text-violet-600 border border-violet-200 cursor-pointer hover:bg-violet-100 transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Assign Serial
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-400 border border-gray-100">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Grades Incomplete
                          </span>
                        )}
                      </td>
                      {/* Date Assigned */}
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {student.serialCreatedAt
                          ? new Date(student.serialCreatedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{studentsWithGrades.length}</span> student(s)
          </span>
          {(eligibilityFilter !== "All" || (program === "ROTC" && battalionFilter !== "All")) && (
            <div className="flex gap-2">
              {eligibilityFilter !== "All" && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-50 text-xs font-medium text-violet-600 border border-violet-100">
                  {eligibilityFilter}
                </span>
              )}
              {program === "ROTC" && battalionFilter !== "All" && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-xs font-medium text-indigo-600 border border-indigo-100">
                  {battalionFilter}
                  {companyFilter !== "All" && ` / ${companyFilter}`}
                  {platoonFilter !== "All" && ` / Platoon ${platoonFilter}`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign Serial Modal */}
      {assignStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAssignStudent(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                    <svg className="w-4.5 h-4.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Assign Serial Number</h3>
                    <p className="text-xs text-gray-500">Enter the serial number for this student</p>
                  </div>
                </div>
                <button onClick={() => setAssignStudent(null)} className="p-1.5 rounded-lg hover:bg-white/80 text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">Student</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-mono font-semibold text-gray-600 border border-gray-200">
                    {assignStudent.studentId}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {assignStudent.lastName}, {assignStudent.firstName} {assignStudent.middleName}
                </p>
                <div className="flex gap-3 pt-1">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">MS 1</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${
                      assignStudent.ms1Grade?.status === "Passed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {assignStudent.ms1Grade?.grade.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">MS 2</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${
                      assignStudent.ms2Grade?.status === "Passed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {assignStudent.ms2Grade?.grade.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Serial Number Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Serial Number</label>
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => { setSerialInput(e.target.value.toUpperCase()); setSerialError(""); }}
                  placeholder="e.g. BO-R00-000000"
                  className={`w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:border-transparent outline-none font-mono font-semibold text-gray-800 tracking-wider placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 ${
                    serialError ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-violet-500"
                  }`}
                  autoFocus
                />
                {serialError ? (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {serialError}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1.5">Format: XX-X00-000000 (e.g. BO-R00-000000)</p>
                )}
              </div>

              {/* Commandant Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Commandant</label>
                <input
                  type="text"
                  value={commandantInput}
                  onChange={(e) => setCommandantInput(e.target.value)}
                  placeholder="e.g. LTC REY A AUGUIS (INF) PA"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">Full name with rank (displayed on certificate)</p>
              </div>

              {/* School Registrar Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">School Registrar</label>
                <input
                  type="text"
                  value={registrarInput}
                  onChange={(e) => setRegistrarInput(e.target.value)}
                  placeholder="e.g. MA. MAY N. CUPTA"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">Full name of the school registrar (displayed on certificate)</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setAssignStudent(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSerial}
                disabled={!serialInput.trim() || !commandantInput.trim() || !registrarInput.trim() || saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function matchBattalion(
  s: EnrollmentDocument,
  battalion: 1 | 2,
  companyFilter: string,
  platoonFilter: string
): boolean {
  if (s.willingToTakeAdvanceCourse) return false;
  if (s.specialUnit) return false;
  if (s.battalion !== battalion) return false;
  if (companyFilter !== "All" && s.rotcCompany !== companyFilter) return false;
  if (platoonFilter !== "All" && String(s.rotcPlatoon) !== platoonFilter) return false;
  return true;
}

function matchSpecialPlatoon(s: EnrollmentDocument, companyFilter: string): boolean {
  if (!s.specialUnit) return false;
  if (companyFilter !== "All" && s.specialUnit !== companyFilter) return false;
  return true;
}
