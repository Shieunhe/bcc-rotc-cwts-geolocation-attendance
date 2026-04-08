"use client";

import { useState } from "react";
import { EnrollmentDocument } from "@/types";
import ROTCPlatoonTable from "./ROTCPlatoonTable";

interface AdvanceCourseSectionProps {
  maleStudents: EnrollmentDocument[];
  femaleStudents: EnrollmentDocument[];
}

export default function AdvanceCourseSection({
  maleStudents,
  femaleStudents,
}: AdvanceCourseSectionProps) {
  const [expanded, setExpanded] = useState<"male" | "female" | null>(null);
  const total = maleStudents.length + femaleStudents.length;

  const toggle = (key: "male" | "female") =>
    setExpanded((prev) => (prev === key ? null : key));

  const groups = [
    { key: "male" as const, label: "Male", students: maleStudents, colors: { bg: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-500" } },
    { key: "female" as const, label: "Female", students: femaleStudents, colors: { bg: "bg-pink-50", text: "text-pink-700", bar: "bg-pink-500" } },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-bold text-gray-800">Advance Course List</h2>
        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
          ADVANCE
        </span>
        <span className="text-xs font-semibold text-gray-400 tabular-nums">
          {total} cadet{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {groups.map(({ key, label, students, colors }) => (
          <div
            key={key}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}
                >
                  <span className={`text-sm font-bold ${colors.text}`}>
                    {label[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-800">
                      {label}
                    </h3>
                    <span className="text-xs text-gray-400 tabular-nums ml-auto">
                      {students.length} cadet{students.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
              >
                <span className="text-xs font-semibold text-gray-500 flex-1">
                  View cadets
                </span>
                <span className="text-[11px] font-semibold text-gray-400 tabular-nums">
                  {students.length}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                    expanded === key ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {expanded === key && (
                <div className="border-t border-gray-50 mt-1">
                  <ROTCPlatoonTable members={students} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
