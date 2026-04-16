"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { AttendanceOffense, EnrollmentDocument, NSTProgram } from "@/types";
import AdminPageLayout from "@/components/layout/AdminPageLayout";

type OffenseWithStudent = AttendanceOffense & { student?: EnrollmentDocument };
type OffenseFilter = "" | "warning" | "settlement";

interface Props {
  program: NSTProgram;
}

export default function AdminOffenses({ program }: Props) {
  const [allOffenses, setAllOffenses] = useState<OffenseWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OffenseFilter>("");
  const [search, setSearch] = useState("");
  const [detailOffense, setDetailOffense] = useState<OffenseWithStudent | null>(null);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    adminService.getAllAttendanceOffenses().then((data) => {
      const filtered = data.filter((o) => o.student?.nstpComponent === program);
      setAllOffenses(filtered);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [program]);

  const filtered = allOffenses.filter((o) => {
    if (filter === "warning" && o.offend !== 1) return false;
    if (filter === "settlement" && o.offend < 2) return false;
    if (search) {
      const q = search.toLowerCase();
      const s = o.student;
      const haystack = s
        ? `${s.lastName} ${s.firstName} ${s.middleName ?? ""} ${s.studentId ?? ""} ${s.course ?? ""}`.toLowerCase()
        : o.student_uid.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const warningCount = allOffenses.filter((o) => o.offend === 1).length;
  const settlementCount = allOffenses.filter((o) => o.offend >= 2).length;

  const themeColor = program === "ROTC" ? "blue" : "emerald";

  const handleSettle = async () => {
    if (!detailOffense) return;
    setSettling(true);
    try {
      await adminService.settleAttendanceOffense(detailOffense.student_uid);
      setAllOffenses((prev) =>
        prev.map((o) =>
          o.student_uid === detailOffense.student_uid ? { ...o, settled: true } : o
        )
      );
      setDetailOffense(null);
    } finally {
      setSettling(false);
    }
  };

  const getStatusDisplay = (o: OffenseWithStudent) => {
    if (o.offend < 2) return { label: "—", style: "text-gray-300" };
    if (o.settled) return { label: "Settled", style: "bg-green-50 text-green-700 border border-green-200" };
    return { label: "Not Yet Settled", style: "bg-red-50 text-red-700 border border-red-200" };
  };

  return (
    <AdminPageLayout program={program}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-${themeColor}-50 flex items-center justify-center`}>
          <svg className={`w-5 h-5 text-${themeColor}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance Offenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{program} students with attendance violations.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{allOffenses.length}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Warning</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{warningCount}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">Need Settlement</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{settlementCount}</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mr-1">Filter</p>
            {([
              { value: "" as OffenseFilter, label: "All" },
              { value: "warning" as OffenseFilter, label: "Warning" },
              { value: "settlement" as OffenseFilter, label: "Need for Settlement" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                  filter === opt.value
                    ? opt.value === "settlement"
                      ? "bg-red-500 text-white"
                      : opt.value === "warning"
                        ? "bg-amber-500 text-white"
                        : "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, student ID, or course..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className={`w-6 h-6 border-2 border-${themeColor}-500 border-t-transparent rounded-full animate-spin`} />
              <p className="text-xs text-gray-400 font-medium">Loading offenses...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-400 font-medium">
              {allOffenses.length === 0 ? "No offenses recorded yet." : "No offenses match your filters."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide w-10">#</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">Student ID</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">Name</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">Course</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">Offense</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((o, idx) => {
                    const s = o.student;
                    const name = s
                      ? `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}`
                      : o.student_uid;
                    const isSettlement = o.offend >= 2;
                    const status = getStatusDisplay(o);

                    return (
                      <tr
                        key={o.student_uid}
                        className={isSettlement && !o.settled ? "bg-red-50/60" : ""}
                      >
                        <td className="px-4 py-3 text-xs text-gray-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-600">{s?.studentId ?? "—"}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-700">{name}</p>
                          {s?.yearLevel && <p className="text-[10px] text-gray-400 mt-0.5">{s.yearLevel}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{s?.course ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          {isSettlement ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Need for Settlement
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Warning
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {status.label === "—" ? (
                            <span className="text-sm text-gray-300 font-medium">—</span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${status.style}`}>
                              {status.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDetailOffense(o)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filtered.map((o, idx) => {
                const s = o.student;
                const name = s
                  ? `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}`
                  : o.student_uid;
                const isSettlement = o.offend >= 2;
                const status = getStatusDisplay(o);

                return (
                  <div
                    key={o.student_uid}
                    className={`px-4 py-3 ${isSettlement && !o.settled ? "bg-red-50/60 border-l-3 border-l-red-400" : "border-l-3 border-l-amber-300"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-700">{idx + 1}. {name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {s?.studentId ?? "—"}{s?.course ? ` · ${s.course}` : ""}{s?.yearLevel ? ` · ${s.yearLevel}` : ""}
                        </p>
                      </div>
                      {isSettlement ? (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          Settlement
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                          Warning
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {status.label !== "—" ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${status.style}`}>
                          {status.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                      <button
                        onClick={() => setDetailOffense(o)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 transition"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-right">{filtered.length} of {allOffenses.length} records shown</p>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Detail / Settle Modal */}
    {detailOffense && (() => {
      const s = detailOffense.student;
      const name = s
        ? `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}`
        : detailOffense.student_uid;
      const isSettlement = detailOffense.offend >= 2;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => !settling && setDetailOffense(null)} />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gray-100 border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSettlement ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100"}`}>
                    <svg className={`w-5 h-5 ${isSettlement ? "text-red-500" : "text-amber-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Offense Detail</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{isSettlement ? "Need for Settlement" : "Warning"}</p>
                  </div>
                </div>
                <button
                  onClick={() => !settling && setDetailOffense(null)}
                  className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Student info */}
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs font-bold text-gray-800">{name}</p>
                {s && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {s.studentId}{s.course ? ` · ${s.course}` : ""}{s.yearLevel ? ` · ${s.yearLevel}` : ""}
                  </p>
                )}
              </div>

              {/* Offense info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <span className="text-[11px] font-semibold text-gray-500">Offense Level</span>
                  {isSettlement ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      2nd Offense
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      1st Offense
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <span className="text-[11px] font-semibold text-gray-500">Settlement Status</span>
                  {!isSettlement ? (
                    <span className="text-xs text-gray-300 font-medium">—</span>
                  ) : detailOffense.settled ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      Settled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                      Not Yet Settled
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <span className="text-[11px] font-semibold text-gray-500">Date Recorded</span>
                  <span className="text-[11px] text-gray-600 font-medium">
                    {new Date(detailOffense.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isSettlement && !detailOffense.settled && (
                  <button
                    onClick={handleSettle}
                    disabled={settling}
                    className="flex-1 py-2.5 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {settling ? "Updating..." : "Mark as Settled"}
                  </button>
                )}
                <button
                  onClick={() => !settling && setDetailOffense(null)}
                  className={`${isSettlement && !detailOffense.settled ? "flex-1" : "w-full"} py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })()}
    </AdminPageLayout>
  );
}
