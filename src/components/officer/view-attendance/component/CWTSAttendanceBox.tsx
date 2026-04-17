"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import {
  AttendanceSession, AttendanceRecord, AttendanceRecordStatus, EnrollmentDocument,
  CWTSCompany, CWTS_COMPANIES,
} from "@/types";
import UpdateStatusModal from "./UpdateStatusModal";

type RecordWithStudent = AttendanceRecord & { student?: EnrollmentDocument };

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  present: { bg: "bg-green-50 border-green-200", text: "text-green-700", border: "border-l-green-500", label: "Present" },
  late:    { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", border: "border-l-amber-400", label: "Late" },
  absent:  { bg: "bg-red-50 border-red-200",     text: "text-red-700",   border: "border-l-red-400",   label: "Absent" },
};

interface Props {
  sessions: AttendanceSession[];
}

const MI_COUNT = 15;
const MI_NUMBERS = Array.from({ length: MI_COUNT }, (_, i) => i + 1);

function getMISessions(sessions: AttendanceSession[]) {
  const map = new Map<number, { in?: AttendanceSession; out?: AttendanceSession }>();
  for (const s of sessions) {
    if (!s.miNumber || !s.miType) continue;
    const entry = map.get(s.miNumber) ?? {};
    entry[s.miType] = s;
    map.set(s.miNumber, entry);
  }
  return map;
}

function getMIOptionLabel(mi: number, entry?: { in?: AttendanceSession; out?: AttendanceSession }) {
  const inLabel = entry?.in
    ? `Time In - (${formatTime(entry.in.openDate)} - ${formatTime(entry.in.closeDate)})`
    : "Time In - (Not yet)";
  const outLabel = entry?.out
    ? `Time Out - (${formatTime(entry.out.openDate)} - ${formatTime(entry.out.closeDate)})`
    : "Time Out - (Not yet)";
  return `MI ${mi}  ${inLabel} | ${outLabel}`;
}

export default function CWTSAttendanceBox({ sessions }: Props) {
  const miSessions = getMISessions(sessions);

  const [selectedMI, setSelectedMI] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<"in" | "out">("in");

  const currentMI = miSessions.get(selectedMI);
  const currentSession = currentMI?.[selectedType] ?? null;
  const selectedSessionId = currentSession?.id ?? null;

  function handleMIChange(mi: number) {
    setSelectedMI(mi);
    const entry = miSessions.get(mi);
    setSelectedType(entry?.in ? "in" : entry?.out ? "out" : "in");
  }
  const [records, setRecords] = useState<RecordWithStudent[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [editingRecord, setEditingRecord] = useState<RecordWithStudent | null>(null);

  const handleStatusUpdated = (recordId: string, newStatus: AttendanceRecordStatus) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? { ...r, status: newStatus } : r));
  };

  const [filterCompany, setFilterCompany] = useState<CWTSCompany | "">("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!selectedSessionId) { setRecords([]); return; }
    setLoadingRecords(true);
    adminService.getSessionAttendanceRecords(selectedSessionId).then((data) => {
      setRecords(data.sort((a, b) => {
        const order = { present: 0, late: 1, absent: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      }));
      setLoadingRecords(false);
    }).catch(() => setLoadingRecords(false));
  }, [selectedSessionId]);

  const filtered = records.filter((r) => {
    const s = r.student;
    if (filterCompany && s?.company !== filterCompany) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterYear && s?.yearLevel !== filterYear) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = s
        ? `${s.lastName} ${s.firstName} ${s.middleName ?? ""} ${s.studentId ?? ""} ${s.course ?? ""}`.toLowerCase()
        : r.studentUid.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const counts = {
    present: filtered.filter((r) => r.status === "present").length,
    late: filtered.filter((r) => r.status === "late").length,
    absent: filtered.filter((r) => r.status === "absent").length,
  };
  const total = filtered.length;
  const attended = counts.present + counts.late;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

  const selectedSession = currentSession;
  const LATE_THRESHOLD_MINUTES = 15;
  const lateDeadlineStr = selectedSession
    ? new Date(new Date(selectedSession.closeDate).getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000).toISOString()
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">CWTS Attendance</h2>
            <p className="text-[11px] text-white/70 font-medium">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* MI selector — always visible */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Select Military Instruction</label>
          <div className="relative">
            <select
              value={selectedMI}
              onChange={(e) => handleMIChange(Number(e.target.value))}
              className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            >
              <option value={0}>Select Military Instruction...</option>
              {MI_NUMBERS.map((mi) => {
                const entry = miSessions.get(mi);
                const created = !!entry;
                return (
                  <option key={mi} value={mi} disabled={!created}>
                    {created ? getMIOptionLabel(mi, entry) : `MI ${mi} — Not yet created`}
                  </option>
                );
              })}
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {selectedMI > 0 ? (
          <>
            {loadingRecords ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400 font-medium">Loading records...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Overview cards */}
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

                {/* Filters */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Filters</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as "in" | "out")}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        <option value="in" disabled={!currentMI?.in}>Time In{currentMI?.in ? "" : " — Not created"}</option>
                        <option value="out" disabled={!currentMI?.out}>Time Out{currentMI?.out ? "" : " — Not created"}</option>
                      </select>
                      <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="relative">
                      <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value as CWTSCompany | "")}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        <option value="">All Companies</option>
                        {CWTS_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="relative">
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        <option value="">All Status</option>
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                      </select>
                      <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="relative">
                      <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Student list */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {filtered.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-gray-400 font-medium">
                        {records.length === 0 ? "No attendance records for this session." : "No students match your filters."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden sm:block divide-y divide-gray-100">
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          <span>Student</span>
                          <span className="w-20 text-center">Company</span>
                          <span className="w-16 text-center">Time</span>
                          <span className="w-16 text-center">Status</span>
                          <span className="w-24 text-center">Update Status</span>
                        </div>
                        {filtered.map((record) => {
                          const cfg = statusConfig[record.status] ?? statusConfig.absent;
                          const s = record.student;
                          const name = s
                            ? `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}`
                            : record.studentUid;

                          return (
                            <div key={record.id} className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-4 py-2.5 border-l-3 ${cfg.border}`}>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {s?.studentId && <span className="text-[10px] text-gray-400">{s.studentId}</span>}
                                  {s?.course && (
                                    <>
                                      <span className="text-gray-300">·</span>
                                      <span className="text-[10px] text-gray-400">{s.course}</span>
                                    </>
                                  )}
                                  {s?.yearLevel && (
                                    <>
                                      <span className="text-gray-300">·</span>
                                      <span className="text-[10px] text-gray-400">{s.yearLevel}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium w-20 text-center truncate">{s?.company ?? "—"}</span>
                              <span className="text-[10px] text-gray-400 font-medium w-16 text-center">
                                {record.status === "present" || record.status === "late"
                                  ? formatTime(record.createdAt)
                                  : record.status === "absent" && lateDeadlineStr
                                    ? formatTime(lateDeadlineStr)
                                    : "—"}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border w-16 text-center ${cfg.bg} ${cfg.text}`}>
                                {cfg.label}
                              </span>
                              <button
                                onClick={() => setEditingRecord(record)}
                                className="w-24 flex items-center justify-center gap-1 px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Update
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile cards */}
                      <div className="sm:hidden divide-y divide-gray-50">
                        {filtered.map((record) => {
                          const cfg = statusConfig[record.status] ?? statusConfig.absent;
                          const s = record.student;
                          const name = s
                            ? `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}`
                            : record.studentUid;
                          const timeStr = record.status === "present" || record.status === "late"
                            ? formatTime(record.createdAt)
                            : record.status === "absent" && lateDeadlineStr
                              ? formatTime(lateDeadlineStr)
                              : "—";

                          return (
                            <div key={record.id} className={`px-4 py-3 border-l-3 ${cfg.border}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {s?.studentId}{s?.course ? ` · ${s.course}` : ""}
                                  </p>
                                </div>
                                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cfg.bg} ${cfg.text}`}>
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 font-medium">{s?.company ?? "—"}</span>
                                  <span className="text-gray-300">·</span>
                                  <span className="text-[10px] text-gray-400">{timeStr}</span>
                                </div>
                                <button
                                  onClick={() => setEditingRecord(record)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Update
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <p className="text-[10px] text-gray-400 text-right">{filtered.length} of {records.length} records shown</p>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 font-medium">Select a Military Instruction to view attendance records.</p>
          </div>
        )}
      </div>

      {editingRecord && (
        <UpdateStatusModal
          recordId={editingRecord.id}
          currentStatus={editingRecord.status}
          student={editingRecord.student}
          studentUid={editingRecord.studentUid}
          onClose={() => setEditingRecord(null)}
          onUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
