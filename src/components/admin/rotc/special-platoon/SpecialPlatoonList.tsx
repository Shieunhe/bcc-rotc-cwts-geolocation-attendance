"use client";

import { useEffect, useState } from "react";
import { SPECIAL_UNITS, SPECIAL_UNIT_SLOT_LIMITS, SpecialUnit, EnrollmentDocument } from "@/types";
import { adminService } from "@/services/admin.service";
import AdminPageLayout from "@/components/layout/AdminPageLayout";

const UNIT_CONFIG: Record<SpecialUnit, { gradient: string; bg: string; text: string; border: string; badge: string; dot: string }> = {
  Medics: { gradient: "from-red-500 to-red-600", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  HQ: { gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  MP: { gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
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

function UnitSection({ unit, enrollments }: { unit: SpecialUnit; enrollments: EnrollmentDocument[] }) {
  const config = UNIT_CONFIG[unit];
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${config.border}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 sm:p-5 hover:bg-gray-50/50 transition"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm shrink-0`}>
          <UnitIcon unit={unit} className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-bold text-gray-800">{unit}</h3>
          <p className="text-xs text-gray-400">{enrollments.length}/{SPECIAL_UNIT_SLOT_LIMITS[unit]} members</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${config.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {enrollments.length}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          {enrollments.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No members assigned yet.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${config.bg}`}>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Student ID</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Course</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Sex</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {enrollments.map((e, i) => (
                      <tr key={e.uid} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-5 py-2.5 font-semibold text-gray-800">
                          {e.lastName}, {e.firstName} {e.middleName ? e.middleName[0] + "." : ""}
                        </td>
                        <td className="px-5 py-2.5 text-gray-600">{e.studentId}</td>
                        <td className="px-5 py-2.5 text-gray-600">{e.course}</td>
                        <td className="px-5 py-2.5 text-gray-600">{e.yearLevel}</td>
                        <td className="px-5 py-2.5 text-gray-600">{e.sex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {enrollments.map((e, i) => (
                  <div key={e.uid} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                      <span className={`text-xs font-bold ${config.text}`}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {e.lastName}, {e.firstName}
                      </p>
                      <p className="text-xs text-gray-400">{e.studentId} &middot; {e.course} &middot; {e.yearLevel}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{e.sex}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SpecialPlatoonList() {
  const [data, setData] = useState<Record<SpecialUnit, EnrollmentDocument[]> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminService.getSpecialUnitEnrollments()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  const total = data ? SPECIAL_UNITS.reduce((sum, u) => sum + data[u].length, 0) : 0;
  const capacity = SPECIAL_UNITS.reduce((sum, u) => sum + SPECIAL_UNIT_SLOT_LIMITS[u], 0);

  return (
    <AdminPageLayout program="ROTC">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Special Platoon List</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Medical assignment units for ROTC cadets &middot; {total}/{capacity} total members
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading special units...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {SPECIAL_UNITS.map((unit) => (
            <UnitSection key={unit} unit={unit} enrollments={data![unit]} />
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
}
