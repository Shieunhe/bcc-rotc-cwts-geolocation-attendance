"use client";

import { useState } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import { useAdminEnrollments } from "@/hooks/useAdminEnrollments";
import { NSTProgram } from "@/types";
import AdminEnrollmentHeader from "./component/AdminEnrollmentHeader";
import AdminEnrollmentSearch, { type FilterStatus } from "./component/AdminEnrollmentSearch";
import AdminEnrollmentTable from "./component/AdminEnrollmentTable";

interface AdminEnrollmentListProps {
  program: NSTProgram;
}

export default function AdminEnrollmentList({ program }: AdminEnrollmentListProps) {
  const { enrollments, isLoading, error, refetch } = useAdminEnrollments(program);
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
        <AdminEnrollmentHeader program={program} />
        <AdminEnrollmentSearch filter={filter} onFilterChange={setFilter} search={search} onSearchChange={setSearch} />
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
          <AdminEnrollmentTable enrollments={filtered} onStatusChange={refetch} />
        )}
      </div>
    </AdminPageLayout>
  );
}
