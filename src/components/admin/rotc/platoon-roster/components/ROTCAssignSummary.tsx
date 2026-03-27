import React from 'react'

interface ROTCAssignSummaryProps {
    isLoading: boolean;
    grandTotal: number;
    b1Total: number;
    b2Total: number;
    b1Capacity: number;
    b2Capacity: number;
    closed: boolean;
}

export default function ROTCAssignSummary({ isLoading, grandTotal, b1Total, b2Total, b1Capacity, b2Capacity, closed }: ROTCAssignSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Total Assigned</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{isLoading ? "—" : grandTotal}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Battalion 1 (M)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{isLoading ? "—" : b1Total}<span className="text-sm text-gray-400 font-medium">/{b1Capacity}</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Battalion 2 (F)</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{isLoading ? "—" : b2Total}<span className="text-sm text-gray-400 font-medium">/{b2Capacity}</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Schedule</p>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold mt-1 ${closed ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
            {closed ? "Closed" : "Open"}
            </span>
        </div>
    </div>
  )
}
