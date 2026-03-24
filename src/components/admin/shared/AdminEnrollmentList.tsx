"use client";

import { useState } from "react";
import AdminPageLayout from "@/components/admin/shared/AdminPageLayout";
import Input from "@/components/common/Input";
import { useAdminEnrollments } from "@/hooks/useAdminEnrollments";
import { EnrollmentStatus, NSTProgram } from "@/types";

const SearchIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

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

type FilterStatus = "all" | EnrollmentStatus;

const FILTER_OPTIONS: FilterStatus[] = ["all", "pending", "approved", "rejected"];

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

const DATE_LOCALE = "en-PH";

interface AdminEnrollmentListProps {
  program: NSTProgram;
}

export default function AdminEnrollmentList({ program }: AdminEnrollmentListProps) {
  const { enrollments, isLoading, error } = useAdminEnrollments(program);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = enrollments.filter((e) => {
    const matchesFilter = filter === "all" || e.status === filter;
    const matchesSearch =
      search === "" ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.studentId.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.course.toLowerCase().includes(search.toLowerCase()) ||
      e.yearLevel.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <AdminPageLayout program={program}>
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading enrollments...</p>
        </div>
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout program={program}>
        <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
          <p className="text-base font-semibold text-red-500">Failed to load enrollments.</p>
          <p className="text-sm text-gray-400 mt-1">
            {error instanceof Error ? error.message : "An unexpected error occurred."}
          </p>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout program={program}>
      <div className="max-w-5xl w-full mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Enrollment List</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {enrollments.length} total {program} enrollment{enrollments.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name, Student ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={SearchIcon}
            />
          </div>

          <div className="flex gap-1.5 bg-white rounded-xl border border-gray-200 p-1">
            {FILTER_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                  filter === s
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No enrollments found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? "Try adjusting your search." : `No ${program} enrollment records yet.`}
            </p>
          </div>
        ) : (
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => {
                    const badge = STATUS_BADGE[e.status] ?? STATUS_BADGE.pending;
                    return (
                      <tr key={e.uid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {e.photo ? (
                              <img src={e.photo} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                                {e.firstName?.[0]}{e.lastName?.[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">{e.lastName}, {e.firstName}</p>
                              <p className="text-xs text-gray-400">{e.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{e.studentId}</td>
                        <td className="px-5 py-3.5 text-gray-600">{e.course} • {e.yearLevel}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {e.createdAt ? new Date(e.createdAt).toLocaleDateString(DATE_LOCALE, DATE_FORMAT_OPTIONS) : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((e) => {
                const badge = STATUS_BADGE[e.status] ?? STATUS_BADGE.pending;
                return (
                  <div key={e.uid} className="px-4 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {e.photo ? (
                          <img src={e.photo} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                            {e.firstName?.[0]}{e.lastName?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{e.lastName}, {e.firstName}</p>
                          <p className="text-xs text-gray-400">{e.studentId}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{e.course} • {e.yearLevel}</span>
                      <span>
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString(DATE_LOCALE, DATE_FORMAT_OPTIONS) : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
