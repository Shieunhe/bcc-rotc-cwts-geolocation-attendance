"use client";

import { useState, useMemo } from "react";
import { useAdminEnrollments } from "@/hooks/useAdminEnrollments";
import { NSTProgram, EnrollmentWithMs, StudentMsRecord } from "@/types";
import StudentRecordModal from "./StudentRecordModal";
import * as XLSX from "xlsx";

interface AdminViewRecordsProps {
  program: NSTProgram;
}

function extractSY(scheduleId: string): string {
  const parts = scheduleId.split("_");
  return parts.length >= 3 ? parts.slice(2).join("_") : "";
}

interface FlatStudentRow {
  enrollment: EnrollmentWithMs;
  msRecord: StudentMsRecord;
  msLabel: string;
  sy: string;
}

function flattenApproved(enrollments: EnrollmentWithMs[]): FlatStudentRow[] {
  const rows: FlatStudentRow[] = [];
  for (const e of enrollments) {
    for (const r of e.msRecords) {
      if (r.status !== "approved") continue;
      rows.push({
        enrollment: e,
        msRecord: r,
        msLabel: `MS ${r.msLevel}`,
        sy: extractSY(r.scheduleId),
      });
    }
  }
  return rows;
}

export default function AdminViewRecords({ program }: AdminViewRecordsProps) {
  const { enrollments, isLoading } = useAdminEnrollments(program);
  const [search, setSearch] = useState("");
  const [msFilter, setMsFilter] = useState("All");
  const [syFilter, setSyFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState<EnrollmentWithMs | null>(null);
  const [selectedMsLevel, setSelectedMsLevel] = useState<string | null>(null);

  const allRows = useMemo(() => flattenApproved(enrollments), [enrollments]);

  const availableSYs = useMemo(() => {
    const sySet = new Set<string>();
    for (const r of allRows) {
      if (r.sy) sySet.add(r.sy);
    }
    return Array.from(sySet).sort().reverse();
  }, [allRows]);

  const filtered = useMemo(() => {
    return allRows.filter((row) => {
      if (msFilter !== "All" && row.msRecord.msLevel !== msFilter) return false;
      if (syFilter !== "All" && row.sy !== syFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${row.enrollment.firstName} ${row.enrollment.lastName} ${row.enrollment.studentId} ${row.enrollment.course}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (program === "CWTS") {
        const compA = a.enrollment.company ?? "";
        const compB = b.enrollment.company ?? "";
        return compA.localeCompare(compB);
      }
      const batA = a.enrollment.battalion ?? 0;
      const batB = b.enrollment.battalion ?? 0;
      if (batA !== batB) return batA - batB;
      const compA = a.enrollment.rotcCompany ?? "";
      const compB = b.enrollment.rotcCompany ?? "";
      if (compA !== compB) return compA.localeCompare(compB);
      const platA = a.enrollment.rotcPlatoon ?? 0;
      const platB = b.enrollment.rotcPlatoon ?? 0;
      return platA - platB;
    });
  }, [allRows, msFilter, syFilter, search, program]);

  function downloadExcel() {
    const data = filtered.map((row, idx) => {
      const addr = [
        row.enrollment.permanentBarangay,
        row.enrollment.permanentMunicipality,
        row.enrollment.permanentProvince,
      ].filter(Boolean).join(", ") || "—";

      const courseAcronym = row.enrollment.course
        .split(" ")
        .map((w) => w[0])
        .filter((c) => c && c === c.toUpperCase())
        .join("");

      return {
        "#": idx + 1,
        "Serial Number": row.enrollment.serialNumber || "N/A",
        "Surname": row.enrollment.lastName,
        "First Name": row.enrollment.firstName,
        "Middle Name": row.enrollment.middleName || "",
        "Suffix": row.enrollment.suffix || "",
        "Course": courseAcronym || row.enrollment.course,
        "Platoon": program === "ROTC"
          ? (row.enrollment.rotcPlatoon ? String(row.enrollment.rotcPlatoon) : "—")
          : (row.enrollment.company || "—"),
        "ID Number": row.enrollment.studentId,
        "Birthdate": row.enrollment.birthdate || "—",
        "Sex": row.enrollment.sex || "—",
        "Address": addr,
        "MS": row.msLabel,
        "SY": row.sy ? `SY ${row.sy}` : "—",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Records");

    const filterParts: string[] = [program];
    if (msFilter !== "All") filterParts.push(`MS${msFilter}`);
    if (syFilter !== "All") filterParts.push(`SY${syFilter}`);
    const filename = `${filterParts.join("_")}_Records.xlsx`;

    XLSX.writeFile(wb, filename);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">View Records</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View complete records of all {program} students.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, student ID, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={msFilter}
          onChange={(e) => setMsFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="All">All MS Levels</option>
          <option value="1">MS 1</option>
          <option value="2">MS 2</option>
        </select>
        <select
          value={syFilter}
          onChange={(e) => setSyFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="All">All SY</option>
          {availableSYs.map((sy) => (
            <option key={sy} value={sy}>SY {sy}</option>
          ))}
        </select>
        <button
          onClick={downloadExcel}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Excel
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Student ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Course</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">MS Level</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">SY</th>
                {program === "ROTC" && (
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Battalion</th>
                )}
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={program === "ROTC" ? 8 : 7} className="text-center py-10 text-gray-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={`${row.enrollment.uid}-${row.msRecord.msLevel}`} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{row.enrollment.studentId}</td>
                    <td className="px-4 py-3 text-gray-700">{row.enrollment.lastName}, {row.enrollment.firstName}{row.enrollment.suffix ? ` ${row.enrollment.suffix}` : ""}</td>
                    <td className="px-4 py-3 text-gray-500">{row.enrollment.course}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                        {row.msLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.sy ? `SY ${row.sy}` : "—"}</td>
                    {program === "ROTC" && (
                      <td className="px-4 py-3 text-gray-500">
                        {row.enrollment.willingToTakeAdvanceCourse
                          ? "Advance Course"
                          : row.enrollment.battalion
                          ? `Battalion ${row.enrollment.battalion}`
                          : row.enrollment.specialUnit
                          ? "Special Platoon"
                          : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedStudent(row.enrollment);
                          setSelectedMsLevel(row.msRecord.msLevel);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          Showing {filtered.length} of {allRows.length} record(s)
        </div>
      </div>

      {/* Modal */}
      {selectedStudent && selectedMsLevel && (
        <StudentRecordModal
          student={selectedStudent}
          program={program}
          msLevel={selectedMsLevel}
          onClose={() => { setSelectedStudent(null); setSelectedMsLevel(null); }}
        />
      )}
    </div>
  );
}
