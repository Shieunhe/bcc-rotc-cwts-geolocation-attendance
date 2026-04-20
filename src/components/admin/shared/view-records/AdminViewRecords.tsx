"use client";

import { useState, useMemo } from "react";
import { useAdminEnrollments } from "@/hooks/useAdminEnrollments";
import { NSTProgram, EnrollmentDocument } from "@/types";
import StudentRecordModal from "./StudentRecordModal";

interface AdminViewRecordsProps {
  program: NSTProgram;
}

export default function AdminViewRecords({ program }: AdminViewRecordsProps) {
  const { enrollments, isLoading } = useAdminEnrollments(program);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState<EnrollmentDocument | null>(null);

  const approvedStudents = useMemo(
    () => enrollments.filter((e) => e.status === "approved"),
    [enrollments]
  );

  const years = ["All", "1st Year", "2nd Year", "3rd Year", "4th Year"];

  const filtered = useMemo(() => {
    return approvedStudents.filter((s) => {
      const matchesYear = yearFilter === "All" || s.yearLevel === yearFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.studentId.toLowerCase().includes(q) ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q);
      return matchesYear && matchesSearch;
    });
  }, [approvedStudents, yearFilter, search]);

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
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>
          ))}
        </select>
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Year</th>
                {program === "ROTC" && (
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Battalion</th>
                )}
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={program === "ROTC" ? 7 : 6} className="text-center py-10 text-gray-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((student, idx) => (
                  <tr key={student.uid} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{student.studentId}</td>
                    <td className="px-4 py-3 text-gray-700">{student.lastName}, {student.firstName}</td>
                    <td className="px-4 py-3 text-gray-500">{student.course}</td>
                    <td className="px-4 py-3 text-gray-500">{student.yearLevel}</td>
                    {program === "ROTC" && (
                      <td className="px-4 py-3 text-gray-500">
                        {student.willingToTakeAdvanceCourse
                          ? "Advance Course"
                          : student.battalion
                          ? `Battalion ${student.battalion}`
                          : student.specialUnit
                          ? "Special Platoon"
                          : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedStudent(student)}
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
          Showing {filtered.length} of {approvedStudents.length} student(s)
        </div>
      </div>

      {/* Modal */}
      {selectedStudent && (
        <StudentRecordModal
          student={selectedStudent}
          program={program}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
