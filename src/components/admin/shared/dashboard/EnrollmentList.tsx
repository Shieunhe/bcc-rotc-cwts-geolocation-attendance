import React from 'react'
import { NSTProgram } from '@/types';
import Link from "next/link";

interface EnrollmentListProps {
    base: string;
    program: NSTProgram;
    isLoading: boolean;
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

export default function EnrollmentList({ base, program, isLoading, total, pending, approved, rejected }: EnrollmentListProps) {
  return (
    <Link href={`${base}/enrollment`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Enrollment List</p>
        {isLoading ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
            Loading...
        </span>
        ) : total > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">
            {total} Total
            </span>
            {pending > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-yellow-100 text-yellow-700 border-yellow-200">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                {pending} Pending
            </span>
            )}
            {approved > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-green-100 text-green-700 border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {approved} Approved
            </span>
            )}
            {rejected > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-red-100 text-red-700 border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {rejected} Rejected
            </span>
            )}
        </div>
        ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
            No enrollments yet
        </span>
        )}
        <p className="text-xs text-gray-500 mt-2">Tap to view and manage all {program} enrollments.</p>
    </Link>
  )
}
