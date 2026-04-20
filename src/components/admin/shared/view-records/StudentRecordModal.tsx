"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { NSTProgram, EnrollmentDocument, AttendanceRecord, StudentGrade } from "@/types";

interface StudentRecordModalProps {
  student: EnrollmentDocument;
  program: NSTProgram;
  onClose: () => void;
}

export default function StudentRecordModal({ student, program, onClose }: StudentRecordModalProps) {
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<{ ms1?: StudentGrade; ms2?: StudentGrade }>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [records, gradeData] = await Promise.all([
          adminService.getStudentAttendanceRecords(student.uid),
          adminService.getStudentGrades(student.uid),
        ]);
        setAttendanceRecords(records);
        setGrades(gradeData);
      } catch (err) {
        console.error("Error fetching student records:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [student.uid]);

  const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
  const lateCount = attendanceRecords.filter((r) => r.status === "late").length;
  const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
  const totalRecords = attendanceRecords.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Student Record</h2>
            <p className="text-sm text-gray-500">{student.firstName} {student.lastName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/80 text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Personal Info */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                  <InfoItem label="Student ID" value={student.studentId} />
                  <InfoItem label="Name" value={`${student.lastName}, ${student.firstName} ${student.middleName}`} />
                  <InfoItem label="Course" value={student.course} />
                  <InfoItem label="Year Level" value={student.yearLevel} />
                  <InfoItem label="MS Level" value={student.msLevel} />
                  <InfoItem label="Program" value={student.nstpComponent} />
                </div>
              </section>

              {/* Assignment Info - ROTC only */}
              {program === "ROTC" && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Assignment
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                    <InfoItem label="Battalion" value={student.battalion ? `Battalion ${student.battalion}` : "—"} />
                    <InfoItem label="Company" value={student.rotcCompany || "—"} />
                    <InfoItem label="Platoon" value={student.rotcPlatoon ? String(student.rotcPlatoon) : "—"} />
                    <InfoItem label="Special Unit" value={student.specialUnit || "—"} />
                    <InfoItem label="Advance Course" value={student.willingToTakeAdvanceCourse ? "Yes" : "No"} />
                  </div>
                </section>
              )}

              {/* Grades */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Grades
                </h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 ">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Subject</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Grade</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-2.5 text-gray-700">NSTP 1</td>
                        <td className="px-4 py-2.5 text-center font-medium text-gray-700">
                          {grades.ms1 ? grades.ms1.grade.toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {grades.ms1 ? (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              grades.ms1.status === "Passed"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {grades.ms1.status}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-gray-700">NSTP 2</td>
                        <td className="px-4 py-2.5 text-center font-medium text-gray-700">
                          {grades.ms2 ? grades.ms2.grade.toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {grades.ms2 ? (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              grades.ms2.status === "Passed"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {grades.ms2.status}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Attendance Summary */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Attendance Summary
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                    <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                    <p className="text-xs text-green-600 font-medium">Present</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
                    <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
                    <p className="text-xs text-yellow-600 font-medium">Late</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                    <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                    <p className="text-xs text-red-600 font-medium">Absent</p>
                  </div>
                </div>

                {/* Attendance Details Table */}
                {totalRecords > 0 ? (
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-600">MI</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Type</th>
                          <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Status</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {attendanceRecords
                          .sort((a, b) => {
                            if (a.miNumber && b.miNumber) {
                              if (a.miNumber !== b.miNumber) return a.miNumber - b.miNumber;
                              if (a.miType === "in" && b.miType === "out") return -1;
                              if (a.miType === "out" && b.miType === "in") return 1;
                            }
                            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                          })
                          .map((record, idx) => (
                            <tr key={record.id || idx} className="hover:bg-white/50">
                              <td className="px-4 py-2.5 text-gray-700 font-medium">
                                {record.miNumber ? `MI ${record.miNumber}` : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 capitalize">
                                {record.miType === "in" ? "Time In" : record.miType === "out" ? "Time Out" : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  record.status === "present"
                                    ? "bg-green-100 text-green-700"
                                    : record.status === "late"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs">
                                {new Date(record.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center text-sm text-gray-400">
                    No attendance records found.
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-700 font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}
