"use client";

import { useState } from "react";
import { EnrollmentDocument, EnrollmentStatus } from "@/types";
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

function getBadge(status: EnrollmentStatus) {
  return STATUS_BADGE[status] ?? STATUS_BADGE.pending;
}

function formatDate(date: string | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

interface AdminEnrollmentTableProps {
  enrollments: EnrollmentDocument[];
  onStatusChange?: () => void;
}

export default function AdminEnrollmentTable({ enrollments, onStatusChange }: AdminEnrollmentTableProps) {
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentDocument | null>(null);

  return (
    <>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student ID</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Course & Year</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">View / Edit Details</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => {
              const badge = getBadge(enrollment.status);
              const hasMedical = enrollment.hasMedicalCondition === true;
              return (
                <tr key={enrollment.uid} className={`border-b last:border-0 transition ${hasMedical ? "bg-red-50 border-b-red-100 hover:bg-red-100/70" : "border-b-gray-50 hover:bg-gray-50/50"}`}>
                  <td className={`px-5 py-3.5 ${hasMedical ? "border-l-4 border-l-red-500" : ""}`}>
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
                  <td className="px-5 py-3.5 text-gray-600">{enrollment.studentId}</td>
                  <td className="px-5 py-3.5 text-gray-600">{enrollment.course} • {enrollment.yearLevel}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(enrollment.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setSelectedEnrollment(enrollment)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline text-center transition"
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

      <div className="sm:hidden divide-y divide-gray-100">
        {enrollments.map((enrollment) => {
          const badge = getBadge(enrollment.status);
          const hasMedical = enrollment.hasMedicalCondition === true;
          return (
            <div key={enrollment.uid} className={`px-4 py-4 space-y-2 ${hasMedical ? "bg-red-50 border-l-4 border-l-red-500" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs ${hasMedical ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                    {enrollment.firstName?.[0]}{enrollment.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{enrollment.lastName}, {enrollment.firstName}</p>
                    <p className="text-xs text-gray-400">{enrollment.studentId}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{enrollment.course} • {enrollment.yearLevel}</span>
                  <span>{formatDate(enrollment.createdAt)}</span>
                </div>
                <button
                  onClick={() => setSelectedEnrollment(enrollment)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
                >
                  View / Edit
                </button>
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
