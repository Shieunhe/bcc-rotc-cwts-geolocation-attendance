"use client";

import { useState } from "react";

type Program = "ROTC" | "CWTS" | "";

export default function OfficerCreateAttendance() {
  const [program, setProgram] = useState<Program>("");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");

  const isReady = program && openDate && closeDate;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Create Attendance</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Set up an attendance session for ROTC or CWTS.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-xl overflow-hidden">
        {/* Step 1: Program */}
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">1</span>
            </div>
            <h2 className="text-sm font-bold text-gray-800">Select Program</h2>
          </div>

          <div className="relative">
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value as Program)}
              className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-10"
            >
              <option value="">Select a program...</option>
              <option value="ROTC">ROTC — Reserve Officers&apos; Training Corps</option>
              <option value="CWTS">CWTS — Civic Welfare Training Service</option>
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {program && (
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              program === "ROTC"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {program} selected
            </div>
          )}
        </div>

        {/* Step 2: Schedule */}
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${program ? "bg-indigo-600" : "bg-gray-300"}`}>
              <span className="text-[11px] font-bold text-white">2</span>
            </div>
            <h2 className={`text-sm font-bold ${program ? "text-gray-800" : "text-gray-400"}`}>Set Schedule</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Open Date & Time
              </label>
              <input
                type="datetime-local"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                disabled={!program}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Close Date & Time
              </label>
              <input
                type="datetime-local"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                disabled={!program}
                min={openDate}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="p-5 sm:p-6 bg-gray-50/50">
          {isReady && (
            <div className="mb-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Summary</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-indigo-600">
                <span>Program: <strong>{program}</strong></span>
                <span>Opens: <strong>{new Date(openDate).toLocaleString()}</strong></span>
                <span>Closes: <strong>{new Date(closeDate).toLocaleString()}</strong></span>
              </div>
            </div>
          )}

          <button
            disabled={!isReady}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Attendance
          </button>
        </div>
      </div>
    </>
  );
}
