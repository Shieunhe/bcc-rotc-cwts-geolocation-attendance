"use client";

import { useState } from "react";
import { AttendanceRecord, EnrollmentDocument } from "@/types";

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  present:  { bg: "bg-green-50 border-green-200", text: "text-green-700", border: "border-l-green-500", label: "Present" },
  late:     { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", border: "border-l-amber-400", label: "Late" },
  absent:   { bg: "bg-red-50 border-red-200",     text: "text-red-700",   border: "border-l-red-400",   label: "Absent" },
  unmarked: { bg: "bg-gray-50 border-gray-200",   text: "text-gray-500",  border: "border-l-gray-300",  label: "Not Yet" },
};

function getStatus(uid: string, recordMap: Map<string, AttendanceRecord>, graceOver: boolean): string {
  const s = recordMap.get(uid)?.status;
  if (s) return s;
  return graceOver ? "absent" : "unmarked";
}

const LATE_THRESHOLD_MINUTES = 15;

function formatTimeDisplay(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

interface Props {
  students: EnrollmentDocument[];
  recordMap: Map<string, AttendanceRecord>;
  graceOver: boolean;
  sessionCloseDate: string | null;
}

export default function AdvanceCourseAttendanceBox({
  students, recordMap, graceOver, sessionCloseDate,
}: Props) {
  const lateDeadlineStr = sessionCloseDate
    ? new Date(new Date(sessionCloseDate).getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000).toISOString()
    : null;

  const [filterGender, setFilterGender] = useState<"" | "Male" | "Female">("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [search, setSearch] = useState("");

  const filtered = students.filter((s) => {
    const status = getStatus(s.uid, recordMap, graceOver);
    if (filterGender && s.sex !== filterGender) return false;
    if (filterStatus && status !== filterStatus) return false;
    if (filterYear && s.yearLevel !== filterYear) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${s.lastName} ${s.firstName} ${s.middleName ?? ""} ${s.studentId ?? ""} ${s.course ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { present: 0, late: 1, absent: 2, unmarked: 3 };
    const sa = getStatus(a.uid, recordMap, graceOver);
    const sb = getStatus(b.uid, recordMap, graceOver);
    const diff = (order[sa] ?? 4) - (order[sb] ?? 4);
    if (diff !== 0) return diff;
    return a.lastName.localeCompare(b.lastName);
  });

  const counts = { present: 0, late: 0, absent: 0, unmarked: 0 };
  for (const s of filtered) {
    const st = getStatus(s.uid, recordMap, graceOver);
    if (st === "present") counts.present++;
    else if (st === "late") counts.late++;
    else if (st === "absent") counts.absent++;
    else counts.unmarked++;
  }
  const total = filtered.length;
  const attended = counts.present + counts.late;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
  const hasUnmarked = counts.unmarked > 0;

  const statusOptions = [
    { value: "present", label: "Present" },
    { value: "late", label: "Late" },
    { value: "absent", label: "Absent" },
    ...(hasUnmarked ? [{ value: "unmarked", label: "Not Yet Marked" }] : []),
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Advance Course</h2>
            <p className="text-[11px] text-white/70 font-medium">{students.length} cadet{students.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {students.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 font-medium">No advance course cadets enrolled.</p>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className={`grid ${hasUnmarked ? "grid-cols-5" : "grid-cols-4"} gap-2`}>
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
              {hasUnmarked && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-2.5 text-center">
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Not Yet</p>
                  <p className="text-lg font-bold text-gray-600">{counts.unmarked}</p>
                </div>
              )}
            </div>

            {/* Attendance bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-gray-600">Attendance Rate</span>
                <span className="text-[11px] font-bold text-amber-600">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                {total > 0 && (
                  <>
                    <div className="h-full bg-green-500" style={{ width: `${(counts.present / total) * 100}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${(counts.late / total) * 100}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${(counts.absent / total) * 100}%` }} />
                    {hasUnmarked && <div className="h-full bg-gray-300" style={{ width: `${(counts.unmarked / total) * 100}%` }} />}
                  </>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Filters</p>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select value={filterGender} onChange={(e) => setFilterGender(e.target.value as "" | "Male" | "Female")}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition">
                    <option value="">All Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div className="relative">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition">
                    <option value="">All Status</option>
                    {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div className="relative">
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition">
                    <option value="">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                  <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
                  placeholder="Search by name, course, or student ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            {/* Student list */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {sorted.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-gray-400 font-medium">No students match your filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    <span>Student</span>
                    <span className="w-16 text-center">Gender</span>
                    <span className="w-16 text-center">Time</span>
                    <span className="w-18 text-center">Status</span>
                  </div>
                  {sorted.map((s) => {
                    const status = getStatus(s.uid, recordMap, graceOver);
                    const cfg = statusConfig[status] ?? statusConfig.absent;
                    const record = recordMap.get(s.uid);
                    const name = `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}`;

                    return (
                      <div key={s.uid} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-2.5 border-l-3 ${cfg.border}`}>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {s.studentId && <span className="text-[10px] text-gray-400">{s.studentId}</span>}
                            {s.course && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="text-[10px] text-gray-400">{s.course}</span>
                              </>
                            )}
                            {s.yearLevel && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="text-[10px] text-gray-400">{s.yearLevel}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border w-16 text-center ${
                          s.sex === "Male"
                            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                            : "bg-pink-50 text-pink-600 border-pink-200"
                        }`}>
                          {s.sex || "—"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium w-16 text-center">
                          {status === "present" || status === "late"
                            ? (record ? formatTimeDisplay(record.createdAt) : "—")
                            : status === "absent" && lateDeadlineStr
                              ? formatTimeDisplay(lateDeadlineStr)
                              : "—"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border w-18 text-center ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-right">{sorted.length} of {students.length} cadets shown</p>
          </>
        )}
      </div>
    </div>
  );
}
