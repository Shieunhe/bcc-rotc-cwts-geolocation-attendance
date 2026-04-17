"use client";

import { useState } from "react";
import {
  AttendanceRecord, EnrollmentDocument,
  ROTCCompany, SpecialUnit, SPECIAL_UNITS,
} from "@/types";

type StudentRow = { student: EnrollmentDocument; company: ROTCCompany; platoon: number };

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

function countStatuses(uids: string[], recordMap: Map<string, AttendanceRecord>, graceOver: boolean) {
  const c = { present: 0, late: 0, absent: 0, unmarked: 0, total: 0 };
  for (const uid of uids) {
    const s = getStatus(uid, recordMap, graceOver);
    if (s === "present") c.present++;
    else if (s === "late") c.late++;
    else if (s === "absent") c.absent++;
    else c.unmarked++;
    c.total++;
  }
  return c;
}

const LATE_THRESHOLD_MINUTES = 15;

function formatTimeDisplay(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

interface Props {
  b1Students: StudentRow[];
  b2Students: StudentRow[];
  specialUnitStudents: Record<SpecialUnit, EnrollmentDocument[]>;
  recordMap: Map<string, AttendanceRecord>;
  graceOver: boolean;
  sessionCloseDate: string | null;
  selectedType: "in" | "out";
  onTypeChange: (type: "in" | "out") => void;
  hasIn: boolean;
  hasOut: boolean;
}

type GroupFilter = "" | "battalion-1" | "battalion-2" | "special";

export default function OverallAttendanceBox({
  b1Students, b2Students, specialUnitStudents, recordMap, graceOver, sessionCloseDate,
  selectedType, onTypeChange, hasIn, hasOut,
}: Props) {
  const lateDeadlineStr = sessionCloseDate
    ? new Date(new Date(sessionCloseDate).getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000).toISOString()
    : null;

  const [filterGroup, setFilterGroup] = useState<GroupFilter>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [search, setSearch] = useState("");

  const specialAll = SPECIAL_UNITS.flatMap((u) => specialUnitStudents[u]);

  const b1Counts = countStatuses(b1Students.map((r) => r.student.uid), recordMap, graceOver);
  const b2Counts = countStatuses(b2Students.map((r) => r.student.uid), recordMap, graceOver);
  const spCounts = countStatuses(specialAll.map((s) => s.uid), recordMap, graceOver);

  const overallCounts = {
    total: b1Counts.total + b2Counts.total + spCounts.total,
    present: b1Counts.present + b2Counts.present + spCounts.present,
    late: b1Counts.late + b2Counts.late + spCounts.late,
    absent: b1Counts.absent + b2Counts.absent + spCounts.absent,
    unmarked: b1Counts.unmarked + b2Counts.unmarked + spCounts.unmarked,
  };

  const hasUnmarked = overallCounts.unmarked > 0;
  const attended = overallCounts.present + overallCounts.late;
  const pct = overallCounts.total > 0 ? Math.round((attended / overallCounts.total) * 100) : 0;

  type UnifiedStudent = { student: EnrollmentDocument; group: string; info: string };

  const allStudents: UnifiedStudent[] = [
    ...b1Students.map((r) => ({ student: r.student, group: "battalion-1" as const, info: `B1 · ${r.company} · P${r.platoon}` })),
    ...b2Students.map((r) => ({ student: r.student, group: "battalion-2" as const, info: `B2 · ${r.company} · P${r.platoon}` })),
    ...specialAll.map((s) => ({ student: s, group: "special" as const, info: s.specialUnit ?? "Special" })),
  ];

  const filtered = allStudents.filter((row) => {
    const s = row.student;
    const status = getStatus(s.uid, recordMap, graceOver);
    if (filterGroup && row.group !== filterGroup) return false;
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
    const sa = getStatus(a.student.uid, recordMap, graceOver);
    const sb = getStatus(b.student.uid, recordMap, graceOver);
    const diff = (order[sa] ?? 4) - (order[sb] ?? 4);
    if (diff !== 0) return diff;
    return a.student.lastName.localeCompare(b.student.lastName);
  });

  const statusOptions = [
    { value: "present", label: "Present" },
    { value: "late", label: "Late" },
    { value: "absent", label: "Absent" },
    ...(hasUnmarked ? [{ value: "unmarked", label: "Not Yet Marked" }] : []),
  ];

  const groupSections = [
    { key: "battalion-1", label: "Battalion 1 (Male)", counts: b1Counts, color: "blue" },
    { key: "battalion-2", label: "Battalion 2 (Female)", counts: b2Counts, color: "violet" },
    { key: "special", label: "Special Platoon", counts: spCounts, color: "red" },
  ];

  return (
    <div className="space-y-6">
      {/* Overall totals card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Overall ROTC Attendance</h2>
              <p className="text-[11px] text-white/70 font-medium">{overallCounts.total} total cadets</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Grand total cards */}
          <div className={`grid ${hasUnmarked ? "grid-cols-5" : "grid-cols-4"} gap-2`}>
            <div className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-gray-800">{overallCounts.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-2.5 text-center">
              <p className="text-[9px] font-semibold text-green-600 uppercase tracking-wide">Present</p>
              <p className="text-lg font-bold text-green-700">{overallCounts.present}</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-2.5 text-center">
              <p className="text-[9px] font-semibold text-amber-600 uppercase tracking-wide">Late</p>
              <p className="text-lg font-bold text-amber-700">{overallCounts.late}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-2.5 text-center">
              <p className="text-[9px] font-semibold text-red-600 uppercase tracking-wide">Absent</p>
              <p className="text-lg font-bold text-red-700">{overallCounts.absent}</p>
            </div>
            {hasUnmarked && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-2.5 text-center">
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Not Yet</p>
                <p className="text-lg font-bold text-gray-600">{overallCounts.unmarked}</p>
              </div>
            )}
          </div>

          {/* Per-group breakdown */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Breakdown by Group</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {groupSections.map(({ key, label, counts: gc, color }) => {
                const groupAttended = gc.present + gc.late;
                const groupPct = gc.total > 0 ? Math.round((groupAttended / gc.total) * 100) : 0;
                return (
                  <div key={key} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-gray-700">{label}</h3>
                      <span className="text-[10px] font-bold text-gray-400">{gc.total} cadets</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div>
                        <p className="text-[9px] text-gray-400 font-medium">Total</p>
                        <p className="text-sm font-bold text-gray-700">{gc.total}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-green-600 font-medium">Present</p>
                        <p className="text-sm font-bold text-green-700">{gc.present}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-amber-600 font-medium">Late</p>
                        <p className="text-sm font-bold text-amber-700">{gc.late}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-red-600 font-medium">Absent</p>
                        <p className="text-sm font-bold text-red-700">{gc.absent}</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex mt-2">
                      {gc.total > 0 && (
                        <>
                          <div className="h-full bg-green-500" style={{ width: `${(gc.present / gc.total) * 100}%` }} />
                          <div className="h-full bg-amber-400" style={{ width: `${(gc.late / gc.total) * 100}%` }} />
                          <div className="h-full bg-red-400" style={{ width: `${(gc.absent / gc.total) * 100}%` }} />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed student list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">All Cadets</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Combined student list from Battalion 1, Battalion 2, and Special Platoon</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Filters */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Filters</p>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select value={selectedType} onChange={(e) => onTypeChange(e.target.value as "in" | "out")}
                  className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition">
                  <option value="in" disabled={!hasIn}>Time In{hasIn ? "" : " — Not created"}</option>
                  <option value="out" disabled={!hasOut}>Time Out{hasOut ? "" : " — Not created"}</option>
                </select>
                <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              <div className="relative">
                <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value as GroupFilter)}
                  className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition">
                  <option value="">All Groups</option>
                  <option value="battalion-1">Battalion 1 (Male)</option>
                  <option value="battalion-2">Battalion 2 (Female)</option>
                  <option value="special">Special Platoon</option>
                </select>
                <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              <div className="relative">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition">
                  <option value="">All Status</option>
                  {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              <div className="relative">
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                  className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition">
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
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
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
              <>
                {/* Desktop table */}
                <div className="hidden sm:block divide-y divide-gray-100">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    <span>Student</span>
                    <span className="w-28 text-center">Assignment</span>
                    <span className="w-16 text-center">Time</span>
                    <span className="w-18 text-center">Status</span>
                  </div>
                  {sorted.map((row) => {
                    const s = row.student;
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
                                <span className="text-gray-300">&middot;</span>
                                <span className="text-[10px] text-gray-400">{s.course}</span>
                              </>
                            )}
                            {s.yearLevel && (
                              <>
                                <span className="text-gray-300">&middot;</span>
                                <span className="text-[10px] text-gray-400">{s.yearLevel}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium w-28 text-center truncate">{row.info}</span>
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

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-gray-50">
                  {sorted.map((row) => {
                    const s = row.student;
                    const status = getStatus(s.uid, recordMap, graceOver);
                    const cfg = statusConfig[status] ?? statusConfig.absent;
                    const record = recordMap.get(s.uid);
                    const name = `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}`;
                    const timeStr = status === "present" || status === "late"
                      ? (record ? formatTimeDisplay(record.createdAt) : "—")
                      : status === "absent" && lateDeadlineStr
                        ? formatTimeDisplay(lateDeadlineStr)
                        : "—";

                    return (
                      <div key={s.uid} className={`px-4 py-3 border-l-3 ${cfg.border}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {s.studentId}{s.course ? ` · ${s.course}` : ""}
                            </p>
                          </div>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-gray-400 font-medium">{row.info}</span>
                          <span className="text-gray-300">&middot;</span>
                          <span className="text-[10px] text-gray-400">{timeStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <p className="text-[10px] text-gray-400 text-right">{sorted.length} of {allStudents.length} cadets shown</p>
        </div>
      </div>
    </div>
  );
}
