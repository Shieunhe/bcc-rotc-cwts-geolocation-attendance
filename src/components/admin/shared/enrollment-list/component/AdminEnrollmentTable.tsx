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
              <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">View Details</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => {
              const badge = getBadge(enrollment.status);
              return (
                <tr key={enrollment.uid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {enrollment.photo ? (
                        <img src={enrollment.photo} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                          {enrollment.firstName?.[0]}{enrollment.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{enrollment.lastName}, {enrollment.firstName}</p>
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
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
                    >
                      View Details
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
          return (
            <div key={enrollment.uid} className="px-4 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{enrollment.course} • {enrollment.yearLevel}</span>
                  <span>{formatDate(enrollment.createdAt)}</span>
                </div>
                <button
                  onClick={() => setSelectedEnrollment(enrollment)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
                >
                  View Details
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
