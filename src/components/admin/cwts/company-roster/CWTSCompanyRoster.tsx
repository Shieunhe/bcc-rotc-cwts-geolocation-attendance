"use client";

import { useState } from "react";
import { CWTS_COMPANIES, CWTS_COMPANY_SLOT_LIMIT, CWTSCompany } from "@/types";
import { useCWTSCompanyRoster } from "@/hooks/useCWTSCompanyRoster";
import AdminPageLayout from "@/components/layout/AdminPageLayout";

const COMPANY_COLORS: Record<CWTSCompany, { bg: string; text: string; bar: string; border: string; dot: string }> = {
  Alpha:   { bg: "bg-blue-50",   text: "text-blue-700",   bar: "bg-blue-500",   border: "border-blue-200",   dot: "bg-blue-500" },
  Bravo:   { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500", border: "border-emerald-200", dot: "bg-emerald-500" },
  Charlie: { bg: "bg-amber-50",  text: "text-amber-700",  bar: "bg-amber-500",  border: "border-amber-200",  dot: "bg-amber-500" },
  Delta:   { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-500", border: "border-purple-200", dot: "bg-purple-500" },
  Echo:    { bg: "bg-rose-50",   text: "text-rose-700",   bar: "bg-rose-500",   border: "border-rose-200",   dot: "bg-rose-500" },
  Foxtrot: { bg: "bg-cyan-50",   text: "text-cyan-700",   bar: "bg-cyan-500",   border: "border-cyan-200",   dot: "bg-cyan-500" },
};

export default function CWTSCompanyRoster() {
  const { companies, isLoading } = useCWTSCompanyRoster();
  const [expanded, setExpanded] = useState<CWTSCompany | null>(null);

  const totalAssigned = companies
    ? CWTS_COMPANIES.reduce((sum, c) => sum + companies[c].length, 0)
    : 0;
  const totalSlots = CWTS_COMPANIES.length * CWTS_COMPANY_SLOT_LIMIT;

  return (
    <AdminPageLayout program="CWTS">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">CWTS Company List</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Approved CWTS enrollments are automatically assigned to their respective companies.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 tracking-wide font-medium">Total Assigned</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{isLoading ? "—" : totalAssigned}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 tracking-wide font-medium">Total Capacity</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalSlots}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 tracking-wide font-medium">Available Slots</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{isLoading ? "—" : totalSlots - totalAssigned}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 tracking-wide font-medium">Companies</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{CWTS_COMPANIES.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-400">Loading company roster...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {CWTS_COMPANIES.map((company) => {
            const members = companies?.[company] ?? [];
            const count = members.length;
            const pct = Math.round((count / CWTS_COMPANY_SLOT_LIMIT) * 100);
            const colors = COMPANY_COLORS[company];
            const isExpanded = expanded === company;
            const isFull = count >= CWTS_COMPANY_SLOT_LIMIT;

            return (
              <div key={company} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Company header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : company)}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-gray-50/50 transition text-left"
                >
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-bold ${colors.text}`}>{company[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-bold text-gray-800">{company}</h3>
                      {isFull && (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-semibold">
                          FULL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${colors.bar}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 shrink-0 tabular-nums">
                        {count}/{CWTS_COMPANY_SLOT_LIMIT}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded member list */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {members.length === 0 ? (
                      <p className="px-5 py-6 text-sm text-gray-400 text-center">No members assigned yet.</p>
                    ) : (
                      <>
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-gray-50">
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">#</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Student ID</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Course</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Year Level</th>
                              </tr>
                            </thead>
                            <tbody>
                              {members.map((m, i) => (
                                <tr key={m.uid} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition">
                                  <td className="px-5 py-3 text-xs text-gray-400">{i + 1}</td>
                                  <td className="px-5 py-3 text-xs font-medium text-gray-700">{m.studentId}</td>
                                  <td className="px-5 py-3 text-xs font-medium text-gray-800">
                                    {m.lastName}, {m.firstName} {m.middleName?.[0] ? `${m.middleName[0]}.` : ""}
                                  </td>
                                  <td className="px-5 py-3 text-xs text-gray-600">{m.course}</td>
                                  <td className="px-5 py-3 text-xs text-gray-600">{m.yearLevel}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-gray-50">
                          {members.map((m, i) => (
                            <div key={m.uid} className="px-4 py-3 flex items-center gap-3">
                              <span className="text-[11px] text-gray-400 w-5 shrink-0">{i + 1}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">
                                  {m.lastName}, {m.firstName}
                                </p>
                                <p className="text-[11px] text-gray-400">{m.studentId} • {m.course}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminPageLayout>
  );
}
