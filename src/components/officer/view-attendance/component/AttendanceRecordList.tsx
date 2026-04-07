"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { AttendanceRecord, EnrollmentDocument } from "@/types";

type RecordWithStudent = AttendanceRecord & { student?: EnrollmentDocument };

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  present: { bg: "bg-green-50 border-green-200", text: "text-green-700", border: "border-l-green-500", label: "Present" },
  late:    { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", border: "border-l-amber-400", label: "Late" },
  absent:  { bg: "bg-red-50 border-red-200",     text: "text-red-700",   border: "border-l-red-400",   label: "Absent" },
};

interface Props {
  sessionId: string;
}

export default function AttendanceRecordList({ sessionId }: Props) {
  const [records, setRecords] = useState<RecordWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService.getSessionAttendanceRecords(sessionId).then((data) => {
      const sorted = data.sort((a, b) => {
        const order = { present: 0, late: 1, absent: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
      setRecords(sorted);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sessionId]);

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = r.student
      ? `${r.student.lastName} ${r.student.firstName} ${r.student.middleName ?? ""} ${r.student.studentId ?? ""}`.toLowerCase()
      : r.studentUid.toLowerCase();
    return name.includes(q);
  });

  const counts = {
    present: filtered.filter((r) => r.status === "present").length,
    late: filtered.filter((r) => r.status === "late").length,
    absent: filtered.filter((r) => r.status === "absent").length,
  };
  const total = filtered.length;
  const attended = counts.present + counts.late;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Loading records...</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-xs text-gray-400 font-medium">No attendance records yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-2.5 text-center">
          <p className="text-[9px] font-semibold text-green-600 uppercase tracking-wide">Present</p>
          <p className="text-lg font-bold text-green-700">{counts.present}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-2.5 text-center">
          <p className="text-[9px] font-semibold text-amber-600 uppercase tracking-wide">Late</p>
          <p className="text-lg font-bold text-amber-700">{counts.late}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-2.5 text-center">
          <p className="text-[9px] font-semibold text-red-600 uppercase tracking-wide">Absent</p>
          <p className="text-lg font-bold text-red-700">{counts.absent}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or student ID..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>

      {/* Student list */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-gray-400 font-medium">No students match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((record) => {
              const cfg = statusConfig[record.status] ?? statusConfig.absent;
              const name = record.student
                ? `${record.student.lastName}, ${record.student.firstName}${record.student.middleName ? ` ${record.student.middleName[0]}.` : ""}`
                : record.studentUid;
              const studentId = record.student?.studentId;

              return (
                <div key={record.id} className={`flex items-center gap-3 px-4 py-3 border-l-3 ${cfg.border}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                    {studentId && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{studentId}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(record.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
