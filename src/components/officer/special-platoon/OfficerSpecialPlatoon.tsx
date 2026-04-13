"use client";

import { useState, useEffect, useMemo } from "react";
import { SPECIAL_UNITS, SPECIAL_UNIT_SLOT_LIMITS, SpecialUnit, EnrollmentDocument } from "@/types";
import { adminService } from "@/services/admin.service";

const UNIT_THEME: Record<SpecialUnit, { bg: string; text: string; border: string; dot: string }> = {
  Medics: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-500" },
  HQ: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", dot: "bg-blue-500" },
  MP: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-500" },
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

export default function OfficerSpecialPlatoon() {
  const [data, setData] = useState<Record<SpecialUnit, EnrollmentDocument[]> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState<SpecialUnit | "">("");
  const [filterGender, setFilterGender] = useState<"" | "Male" | "Female">("");
  const [filterCourse, setFilterCourse] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService.getSpecialUnitEnrollments()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  const allStudents = useMemo(() => {
    if (!data) return [];
    return SPECIAL_UNITS.flatMap((u) => data[u]);
  }, [data]);

  const courses = useMemo(() => {
    const set = new Set(allStudents.map((s) => s.course));
    return Array.from(set).sort();
  }, [allStudents]);

  const filtered = useMemo(() => {
    let list = filterUnit ? (data?.[filterUnit] ?? []) : allStudents;
    if (filterGender) list = list.filter((s) => s.sex === filterGender);
    if (filterCourse) list = list.filter((s) => s.course === filterCourse);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => {
        const haystack = `${s.lastName} ${s.firstName} ${s.middleName ?? ""} ${s.studentId} ${s.course}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    return list;
  }, [data, allStudents, filterUnit, filterGender, filterCourse, search]);

  const unitCounts = data ? SPECIAL_UNITS.map((u) => ({ unit: u, count: data[u].length })) : [];
  const total = allStudents.length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Special Platoon</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View all ROTC cadets assigned to special units (Medics, HQ, MP).
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{isLoading ? "—" : total}</p>
        </div>
        {unitCounts.map(({ unit, count }) => {
          const theme = UNIT_THEME[unit];
          return (
            <div key={unit} className={`rounded-xl border shadow-sm p-4 ${theme.bg} ${theme.border}`}>
              <div className="flex items-center gap-1.5">
                <UnitIcon unit={unit} className={`w-3.5 h-3.5 ${theme.text}`} />
                <p className={`text-[11px] uppercase tracking-wide font-medium ${theme.text}`}>{unit}</p>
              </div>
              <p className={`text-2xl font-bold mt-1 ${theme.text}`}>{isLoading ? "—" : count}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">of {SPECIAL_UNIT_SLOT_LIMITS[unit]}</p>
            </div>
          );
        })}
      </div>

      {/* Main list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-4">
          <h2 className="text-base font-bold text-white">Special Platoon List</h2>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value as SpecialUnit | "")}
                className="appearance-none w-full sm:w-36 pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="">All Units</option>
                {SPECIAL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative">
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="appearance-none w-full sm:w-48 pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="">All Courses</option>
                {courses.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative">
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value as "" | "Male" | "Female")}
                className="appearance-none w-full sm:w-36 pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="">All Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, student ID, or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
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
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Unit</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Student ID</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Course</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Year</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const unit = s.specialUnit as SpecialUnit;
                    const theme = UNIT_THEME[unit];
                    return (
                      <tr key={s.uid} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition">
                        <td className="px-5 py-2.5 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-5 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                            <UnitIcon unit={unit} className="w-3 h-3" />
                            {unit}
                          </span>
                        </td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filtered.map((s, i) => {
                const unit = s.specialUnit as SpecialUnit;
                const theme = UNIT_THEME[unit];
                return (
                  <div key={s.uid} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {s.lastName}, {s.firstName}
                      </p>
                      <p className="text-[11px] text-gray-400">{s.studentId} &middot; {s.course} &middot; {s.yearLevel}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                          <UnitIcon unit={unit} className="w-3 h-3" />
                          {unit}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          s.sex === "Male"
                            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                            : "bg-pink-50 text-pink-600 border-pink-200"
                        }`}>
                          {s.sex}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <p className="text-[10px] text-gray-400 text-right mt-2">{filtered.length} of {allStudents.length} cadets shown</p>
    </>
  );
}
