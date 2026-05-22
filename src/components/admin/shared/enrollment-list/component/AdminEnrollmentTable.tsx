"use client";

import { useState, useMemo } from "react";
import { EnrollmentWithMs, EnrollmentStatus } from "@/types";
import AdminEnrollmentDetailModal from "./AdminEnrollmentDetailModal";

const STATUS_BADGE: Record<EnrollmentStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(date: string | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function extractSY(scheduleId: string): string {
  const parts = scheduleId.split("_");
  return parts.length >= 3 ? parts.slice(2).join("_") : "";
}

interface FlatRow {
  enrollment: EnrollmentWithMs;
  msLabel: string;
  sy: string;
  msStatus: EnrollmentStatus;
  msDate: string;
}

function flattenEnrollments(enrollments: EnrollmentWithMs[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const enrollment of enrollments) {
    for (const record of enrollment.msRecords) {
      rows.push({
        enrollment,
        msLabel: `MS ${record.msLevel}`,
        sy: extractSY(record.scheduleId),
        msStatus: record.status,
        msDate: record.createdAt,
      });
    }
  }
  return rows;
}

const MS_BADGE_STYLE: Record<string, string> = {
  approved: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

interface AdminEnrollmentTableProps {
  enrollments: EnrollmentWithMs[];
  onStatusChange?: () => void;
  statusFilter?: string;
}

export default function AdminEnrollmentTable({ enrollments, onStatusChange, statusFilter }: AdminEnrollmentTableProps) {
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithMs | null>(null);
  const rows = useMemo(() => {
    const all = flattenEnrollments(enrollments);
    if (!statusFilter || statusFilter === "all") return all;
    return all.filter((r) => r.msStatus === statusFilter);
  }, [enrollments, statusFilter]);

  return (
    <>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student ID</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Course & Year</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">MS Level</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">SY</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { enrollment, msLabel, sy, msStatus, msDate } = row;
              const hasMedical = enrollment.hasMedicalCondition === true;
              const rowBg = hasMedical ? "bg-red-50 hover:bg-red-100/70" : "hover:bg-gray-50/50";

              return (
                <tr key={`${enrollment.uid}-${msLabel}`} className={`border-b border-gray-100 last:border-0 transition ${rowBg}`}>
                  <td className={`px-5 py-3 ${hasMedical ? "border-l-4 border-l-red-500" : ""}`}>
                    <div className="flex items-center gap-3">
                      {enrollment.photo ? (
                        <img src={enrollment.photo} alt="" className={`w-9 h-9 rounded-full object-cover border-2 ${hasMedical ? "border-red-300" : "border-gray-200"}`} />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs ${hasMedical ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                          {enrollment.firstName?.[0]}{enrollment.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-800">{enrollment.lastName}, {enrollment.firstName}</p>
                          {hasMedical && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500 text-[9px] font-bold text-white uppercase tracking-wide shadow-sm">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Medical
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{enrollment.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3 text-gray-600 text-xs">{enrollment.studentId}</td>

                  <td className="px-5 py-3 text-gray-600 text-xs">{enrollment.course} • {enrollment.yearLevel}</td>

                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${MS_BADGE_STYLE[msStatus] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {msLabel}
                    </span>
                  </td>

                  <td className="px-5 py-3 text-xs text-gray-500">
                    {sy ? `SY ${sy}` : "—"}
                  </td>

                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {formatDate(msDate)}
                  </td>

                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${STATUS_BADGE[msStatus]?.className ?? STATUS_BADGE.pending.className}`}>
                      {STATUS_BADGE[msStatus]?.label ?? msStatus}
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedEnrollment(enrollment)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
                    >
                      View / Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="sm:hidden divide-y divide-gray-100">
        {rows.map((row) => {
          const { enrollment, msLabel, sy, msStatus, msDate } = row;
          const hasMedical = enrollment.hasMedicalCondition === true;

          return (
            <div key={`${enrollment.uid}-${msLabel}`} className={`px-4 py-4 space-y-3 ${hasMedical ? "bg-red-50 border-l-4 border-l-red-500" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs ${hasMedical ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                    {enrollment.firstName?.[0]}{enrollment.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{enrollment.lastName}, {enrollment.firstName}</p>
                    <p className="text-xs text-gray-400">{enrollment.studentId} • {enrollment.course} • {enrollment.yearLevel}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEnrollment(enrollment)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition shrink-0"
                >
                  View / Edit
                </button>
              </div>

              {hasMedical && (
                <div className="flex items-center gap-1.5 pl-12">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500 text-[9px] font-bold text-white uppercase tracking-wide shadow-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Medical Condition
                  </span>
                  <span className="text-[10px] text-red-600 font-medium">{enrollment.medicalCondition}</span>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap pl-12">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${MS_BADGE_STYLE[msStatus] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                  {msLabel}
                </span>
                {sy && <span className="text-[10px] text-gray-500 font-medium">SY {sy}</span>}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATUS_BADGE[msStatus]?.className ?? STATUS_BADGE.pending.className}`}>
                  {STATUS_BADGE[msStatus]?.label ?? msStatus}
                </span>
                <span className="text-[10px] text-gray-400">{formatDate(msDate)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {selectedEnrollment && (
      <AdminEnrollmentDetailModal
        enrollment={selectedEnrollment}
        onClose={() => setSelectedEnrollment(null)}
        onStatusChange={onStatusChange}
      />
    )}
    </>
  );
}
