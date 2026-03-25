import Input from '@/components/common/Input'
import { EnrollmentStatus } from '@/types';

export type FilterStatus = "all" | EnrollmentStatus;

const FILTER_OPTIONS: FilterStatus[] = ["all", "pending", "approved", "rejected"];

const SearchIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

interface AdminEnrollmentSearchProps {
    filter: FilterStatus;
    onFilterChange: (status: FilterStatus) => void;
    search: string;
    onSearchChange: (value: string) => void;
}

export default function AdminEnrollmentSearch({ filter, onFilterChange, search, onSearchChange }: AdminEnrollmentSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
        <Input
            type="text"
            placeholder="Search by name, Student ID, or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={SearchIcon}
        />
        </div>

        <div className="flex gap-1.5 bg-white rounded-xl border border-gray-200 p-1">
        {FILTER_OPTIONS.map((status) => (
            <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                filter === status
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            >
            {status}
            </button>
        ))}
        </div>
    </div>
  )
}
