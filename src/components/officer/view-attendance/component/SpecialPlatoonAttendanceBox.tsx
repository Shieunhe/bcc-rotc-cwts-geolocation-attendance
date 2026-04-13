"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { AttendanceSession, AttendanceRecord, EnrollmentDocument, SPECIAL_UNITS, SpecialUnit } from "@/types";

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

const UNIT_THEME: Record<SpecialUnit, { bg: string; text: string; border: string }> = {
  Medics: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  HQ: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  MP: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
};

function UnitIcon({ unit, className }: { unit: SpecialUnit; className?: string }) {
  if (unit === "Medics") return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 2v4H6a2 2 0 00-2 2v4h4v4a2 2 0 002 2h4v-4h4a2 2 0 002-2V8h-4V4a2 2 0 00-2-2h-4z" />
    </svg>
  );
  if (unit === "HQ") return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

interface Props {
  sessions: AttendanceSession[];
}

export default function SpecialPlatoonAttendanceBox({ sessions }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessions[0]?.id ?? null);
  const [records, setRecords] = useState<RecordWithStudent[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [filterUnit, setFilterUnit] = useState<SpecialUnit | "">("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!selectedSessionId) { setRecords([]); return; }
    setLoadingRecords(true);
    adminService.getSessionAttendanceRecords(selectedSessionId).then((data) => {
      const specialOnly = data
        .filter((r) => r.student?.specialUnit && SPECIAL_UNITS.includes(r.student.specialUnit))
        .sort((a, b) => {
          const order = { present: 0, late: 1, absent: 2 };
          return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        });
      setRecords(specialOnly);
      setLoadingRecords(false);
    }).catch(() => setLoadingRecords(false));
  }, [selectedSessionId]);

  const filtered = records.filter((r) => {
    const s = r.student;
    if (filterUnit && s?.specialUnit !== filterUnit) return false;
    if (filterStatus && r.status !== filterStatus) return false;
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

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const LATE_THRESHOLD_MINUTES = 15;
  const lateDeadlineStr = selectedSession
    ? new Date(new Date(selectedSession.closeDate).getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000).toISOString()
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 2v4H6a2 2 0 00-2 2v4h4v4a2 2 0 002 2h4v-4h4a2 2 0 002-2V8h-4V4a2 2 0 00-2-2h-4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Special Platoon Attendance</h2>
            <p className="text-[11px] text-white/70 font-medium">Medics · HQ · MP</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 font-medium">No attendance sessions found.</p>
          </div>
        ) : (
          <>
            {/* Session selector */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Select Session</label>
              <div className="relative">
                <select
                  value={selectedSessionId ?? ""}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="appearance-none w-full px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDate(s.openDate)} — {formatTime(s.openDate)} to {formatTime(s.closeDate)}
                    </option>
                  ))}
                </select>
                <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {loadingRecords ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No special platoon attendance records for this session.</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase">Total</p>
                    <p className="text-lg font-bold text-gray-800">{total}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl border border-green-200 p-2.5 text-center">
                    <p className="text-[9px] font-semibold text-green-600 uppercase">Present</p>
                    <p className="text-lg font-bold text-green-700">{counts.present}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-2.5 text-center">
                    <p className="text-[9px] font-semibold text-amber-600 uppercase">Late</p>
                    <p className="text-lg font-bold text-amber-700">{counts.late}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl border border-red-200 p-2.5 text-center">
                    <p className="text-[9px] font-semibold text-red-600 uppercase">Absent</p>
                    <p className="text-lg font-bold text-red-700">{counts.absent}</p>
                  </div>
                </div>

                {/* <p className="text-xs text-gray-400 text-right">{pct}% attendance rate</p> */}

                {/* Filters */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value as SpecialUnit | "")}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition">
                        <option value="">All Units</option>
                        {SPECIAL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="relative">
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition">
                        <option value="">All Status</option>
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                    />
                  </div>
                </div>

                {/* Records list */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {filtered.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-gray-400 font-medium">No records match your filters.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop */}
                      <div className="hidden sm:block divide-y divide-gray-100">
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          <span>Student</span>
                          <span className="w-20 text-center">Unit</span>
                          <span className="w-16 text-center">Time</span>
                          <span className="w-16 text-center">Deadline</span>
                          <span className="w-18 text-center">Status</span>
                        </div>
                        {filtered.map((r) => {
                          const s = r.student;
                          const cfg = statusConfig[r.status] ?? statusConfig.absent;
                          const name = s ? `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}` : r.studentUid;
                          const unit = s?.specialUnit as SpecialUnit;
                          const theme = unit ? UNIT_THEME[unit] : null;

                          return (
                            <div key={r.id} className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-4 py-2.5 border-l-3 ${cfg.border}`}>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {s?.studentId && <span className="text-[10px] text-gray-400">{s.studentId}</span>}
                                  {s?.course && (
                                    <>
                                      <span className="text-gray-300">&middot;</span>
                                      <span className="text-[10px] text-gray-400">{s.course}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {theme && unit ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border w-20 justify-center ${theme.bg} ${theme.text} ${theme.border}`}>
                                  <UnitIcon unit={unit} className="w-3 h-3" />
                                  {unit}
                                </span>
                              ) : <span className="w-20" />}
                              <span className="text-[10px] text-gray-400 font-medium w-16 text-center">
                                {formatTime(r.createdAt)}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium w-16 text-center">
                                {lateDeadlineStr ? formatTime(lateDeadlineStr) : "—"}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border w-18 text-center ${cfg.bg} ${cfg.text}`}>
                                {cfg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile */}
                      <div className="sm:hidden divide-y divide-gray-50">
                        {filtered.map((r) => {
                          const s = r.student;
                          const cfg = statusConfig[r.status] ?? statusConfig.absent;
                          const name = s ? `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}` : r.studentUid;
                          const unit = s?.specialUnit as SpecialUnit;
                          const theme = unit ? UNIT_THEME[unit] : null;

                          return (
                            <div key={r.id} className={`px-4 py-3 border-l-3 ${cfg.border}`}>
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
                              <div className="flex items-center gap-2 mt-1.5">
                                {theme && unit && (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                                    <UnitIcon unit={unit} className="w-3 h-3" />
                                    {unit}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400">{formatTime(r.createdAt)}</span>
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
        )}
      </div>
    </div>
  );
}
