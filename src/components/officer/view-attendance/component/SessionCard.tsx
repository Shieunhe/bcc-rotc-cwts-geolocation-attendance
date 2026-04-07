"use client";

import { useState } from "react";
import { AttendanceSession } from "@/types";
import AttendanceRecordList from "./AttendanceRecordList";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const statusConfig: Record<string, { gradient: string; badge: string; label: string }> = {
  open: {
    gradient: "bg-gradient-to-r from-green-500 to-emerald-600",
    badge: "bg-white/20 text-white backdrop-blur",
    label: "Open",
  },
  scheduled: {
    gradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
    badge: "bg-white/20 text-white backdrop-blur",
    label: "Scheduled",
  },
  closed: {
    gradient: "bg-gradient-to-r from-gray-400 to-gray-500",
    badge: "bg-white/20 text-white backdrop-blur",
    label: "Closed",
  },
};

interface SessionCardProps {
  session: AttendanceSession;
}

export default function SessionCard({ session }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[session.status] ?? statusConfig.closed;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Colored header */}
      <div className={`px-5 py-4 ${config.gradient}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{session.program} Attendance</h3>
              <p className="text-[11px] text-white/70 font-medium">{formatDate(session.openDate)}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${config.badge}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Info section */}
      <div className="p-5">
        {/* Schedule row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 rounded-xl bg-green-50 border border-green-100 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Open</p>
            <p className="text-sm font-bold text-green-700 mt-0.5">{formatTime(session.openDate)}</p>
          </div>
          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <div className="flex-1 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">Close</p>
            <p className="text-sm font-bold text-red-600 mt-0.5">{formatTime(session.closeDate)}</p>
          </div>
        </div>

        {/* Created by */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-medium">Created by {session.createdBy}</span>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-3 border-t border-gray-100 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 transition"
      >
        {expanded ? "Hide Records" : "View Student Records"}
        <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          <AttendanceRecordList sessionId={session.id} />
        </div>
      )}
    </div>
  );
}
