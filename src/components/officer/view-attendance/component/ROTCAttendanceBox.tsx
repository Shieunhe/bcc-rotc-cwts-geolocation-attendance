"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import {
  AttendanceSession, AttendanceRecord, EnrollmentDocument,
  ROTCBattalion, ROTCCompany,
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
} from "@/types";

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

export default function ROTCAttendanceBox({ sessions }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessions[0]?.id ?? null);
  const [records, setRecords] = useState<RecordWithStudent[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [filterBattalion, setFilterBattalion] = useState<"" | "1" | "2">("");
  const [filterCompany, setFilterCompany] = useState<ROTCCompany | "">("");
  const [filterPlatoon, setFilterPlatoon] = useState<"" | "1" | "2" | "3" | "4">("");
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

  const companyOptions: ROTCCompany[] = filterBattalion === "1"
    ? ROTC_BATTALION_1_COMPANIES
    : filterBattalion === "2"
      ? ROTC_BATTALION_2_COMPANIES
      : [...ROTC_BATTALION_1_COMPANIES, ...ROTC_BATTALION_2_COMPANIES];

  useEffect(() => {
    if (filterCompany && !companyOptions.includes(filterCompany)) setFilterCompany("");
  }, [filterBattalion]);

  const filtered = records.filter((r) => {
    const s = r.student;
    if (filterBattalion && String(s?.battalion) !== filterBattalion) return false;
    if (filterCompany && s?.rotcCompany !== filterCompany) return false;
    if (filterPlatoon && String(s?.rotcPlatoon) !== filterPlatoon) return false;
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

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">ROTC Attendance</h2>
            <p className="text-[11px] text-white/70 font-medium">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 font-medium">No ROTC attendance sessions yet.</p>
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
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDate(s.openDate)} — {formatTime(s.openDate)} to {formatTime(s.closeDate)} ({s.status})
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {loadingRecords ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                      <select value={filterBattalion} onChange={(e) => setFilterBattalion(e.target.value as "" | "1" | "2")}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                        <option value="">All Battalions</option>
                        <option value="1">Battalion 1</option>
                        <option value="2">Battalion 2</option>
                      </select>
                      <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="relative">
                      <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value as ROTCCompany | "")}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                        <option value="">All Companies</option>
                        {companyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="relative">
                      <select value={filterPlatoon} onChange={(e) => setFilterPlatoon(e.target.value as "" | "1" | "2" | "3" | "4")}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                        <option value="">All Platoons</option>
                        <option value="1">Platoon 1</option>
                        <option value="2">Platoon 2</option>
                        <option value="3">Platoon 3</option>
                        <option value="4">Platoon 4</option>
                      </select>
                      <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="relative">
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                        <option value="">All Status</option>
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                      </select>
                      <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="relative">
                      <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                    <div className="divide-y divide-gray-100">
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        <span>Student</span>
                        <span className="w-20 text-center">Info</span>
                        <span className="w-16 text-center">Time</span>
                        <span className="w-16 text-center">Status</span>
                      </div>
                      {filtered.map((record) => {
                        const cfg = statusConfig[record.status] ?? statusConfig.absent;
                        const s = record.student;
                        const name = s
                          ? `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}`
                          : record.studentUid;
                        const info = s
                          ? `B${s.battalion ?? "?"} · ${s.rotcCompany ?? "?"} · P${s.rotcPlatoon ?? "?"}`
                          : "";

                        return (
                          <div key={record.id} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-2.5 border-l-3 ${cfg.border}`}>
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
                            <span className="text-[10px] text-gray-400 font-medium w-20 text-center truncate">{info}</span>
                            <span className="text-[10px] text-gray-400 font-medium w-16 text-center">
                              {new Date(record.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border w-16 text-center ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
