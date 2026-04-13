import Input from "@/components/common/Input";
import { EnrollmentStatus } from "@/types";

export type FilterStatus = "all" | EnrollmentStatus;

const FILTER_OPTIONS: FilterStatus[] = ["all", "pending", "approved", "rejected"];

const selectClass =
  "appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition";

const COURSES = [
  "BS CRIMINOLOGY",
  "BS HOSPITALITY MANAGEMENT",
  "BS INFORMATION TECHNOLOGY",
  "BS TOURISM MANAGEMENT",
  "BEED",
  "BEED ENGLISH",
  "BEED MATH",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const MS_LEVELS = ["1", "2"];

const SearchIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronIcon = (
  <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export interface EnrollmentFilters {
  status: FilterStatus;
  msLevel: string;
  yearLevel: string;
  course: string;
  medicalCondition: string;
  search: string;
}

interface AdminEnrollmentSearchProps {
  filters: EnrollmentFilters;
  onFiltersChange: (filters: EnrollmentFilters) => void;
  program?: "ROTC" | "CWTS";
}

export default function AdminEnrollmentSearch({ filters, onFiltersChange, program }: AdminEnrollmentSearchProps) {
  function update(partial: Partial<EnrollmentFilters>) {
    onFiltersChange({ ...filters, ...partial });
  }

  const hasActiveFilters = filters.msLevel || filters.yearLevel || filters.course || filters.medicalCondition;

  return (
    <div className="space-y-3">
      {/* Search + Status tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by name, Student ID, or email..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            icon={SearchIcon}
          />
        </div>
        <div className="flex gap-1.5 bg-white rounded-xl border border-gray-200 p-1">
          {FILTER_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => update({ status })}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                filters.status === status
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Filters:</span>

        {program !== "CWTS" && (
          <div className="relative">
            <select value={filters.msLevel} onChange={(e) => update({ msLevel: e.target.value })} className={selectClass}>
              <option value="">All MS Level</option>
              {MS_LEVELS.map((ms) => (
                <option key={ms} value={ms}>MS {ms}</option>
              ))}
            </select>
            {ChevronIcon}
          </div>
        )}

        <div className="relative">
          <select value={filters.yearLevel} onChange={(e) => update({ yearLevel: e.target.value })} className={selectClass}>
            <option value="">All Year Levels</option>
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {ChevronIcon}
        </div>

        <div className="relative">
          <select value={filters.course} onChange={(e) => update({ course: e.target.value })} className={selectClass}>
            <option value="">All Courses</option>
            {COURSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {ChevronIcon}
        </div>

        {program !== "CWTS" && (
          <div className="relative">
            <select value={filters.medicalCondition} onChange={(e) => update({ medicalCondition: e.target.value })} className={selectClass}>
              <option value="">Medical Condition</option>
              <option value="yes">With Medical Condition</option>
              <option value="no">No Medical Condition</option>
            </select>
            {ChevronIcon}
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={() => update({ msLevel: "", yearLevel: "", course: "", medicalCondition: "" })}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
