"use client";

import { useState, useMemo } from "react";
import { useROTCPlatoonRoster } from "@/hooks/useROTCPlatoonRoster";
import { EnrollmentDocument } from "@/types";

export default function OfficerAdvanceCourse() {
  const { roster, isLoading } = useROTCPlatoonRoster();
  const [filterGender, setFilterGender] = useState<"" | "Male" | "Female">("");
  const [search, setSearch] = useState("");

  const allStudents = useMemo(() => {
    if (!roster) return [];
    return [...roster.advanceCourseMale, ...roster.advanceCourseFemale];
  }, [roster]);

  const filtered = useMemo(() => {
    let list = allStudents;
    if (filterGender) list = list.filter((s) => s.sex === filterGender);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => {
        const haystack = `${s.lastName} ${s.firstName} ${s.middleName} ${s.studentId} ${s.course}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    return list;
  }, [allStudents, filterGender, search]);

  const maleCount = roster?.advanceCourseMale.length ?? 0;
  const femaleCount = roster?.advanceCourseFemale.length ?? 0;
  const total = maleCount + femaleCount;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Advance Course</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View all cadets who took the advance ROTC course.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Total Cadets</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{isLoading ? "—" : total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Male</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{isLoading ? "—" : maleCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Female</p>
          <p className="text-2xl font-bold text-pink-600 mt-1">{isLoading ? "—" : femaleCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-4">
          <h2 className="text-base font-bold text-white">Advance Course List</h2>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Gender filter */}
            <div className="relative">
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value as "" | "Male" | "Female")}
                className="appearance-none w-full sm:w-40 pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">All Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, student ID, or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400">Loading cadets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400">No cadets found.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">#</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Student ID</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Course</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Year</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: EnrollmentDocument, i: number) => (
                    <tr key={s.uid} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition">
                      <td className="px-5 py-2.5 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-5 py-2.5 text-xs font-medium text-gray-700">{s.studentId}</td>
                      <td className="px-5 py-2.5 text-xs font-medium text-gray-800">
                        {s.lastName}, {s.firstName} {s.middleName?.[0] ? `${s.middleName[0]}.` : ""}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-gray-600">{s.course}</td>
                      <td className="px-5 py-2.5 text-xs text-gray-600">{s.yearLevel}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          s.sex === "Male"
                            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                            : "bg-pink-50 text-pink-600 border-pink-200"
                        }`}>
                          {s.sex}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filtered.map((s: EnrollmentDocument, i: number) => (
                <div key={s.uid} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-[11px] text-gray-400 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {s.lastName}, {s.firstName}
                    </p>
                    <p className="text-[11px] text-gray-400">{s.studentId} • {s.course} • {s.yearLevel}</p>
                  </div>
                  <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    s.sex === "Male"
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                      : "bg-pink-50 text-pink-600 border-pink-200"
                  }`}>
                    {s.sex}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
