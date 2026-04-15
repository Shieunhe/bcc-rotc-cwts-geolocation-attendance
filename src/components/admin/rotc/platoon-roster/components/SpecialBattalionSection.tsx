"use client";

import { useState } from "react";
import { SPECIAL_UNITS, SPECIAL_UNIT_SLOT_LIMITS, SpecialUnit, EnrollmentDocument } from "@/types";
import ROTCPlatoonTable from "./ROTCPlatoonTable";

const UNIT_CONFIG: Record<SpecialUnit, { bg: string; text: string; dot: string }> = {
  Medics: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  HQ: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  MP: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
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

interface SpecialBattalionSectionProps {
  unitData: Record<SpecialUnit, EnrollmentDocument[]>;
}

export default function SpecialBattalionSection({ unitData }: SpecialBattalionSectionProps) {
  const [expanded, setExpanded] = useState<SpecialUnit | null>(null);
  const total = SPECIAL_UNITS.reduce((sum, u) => sum + unitData[u].length, 0);
  const capacity = SPECIAL_UNITS.reduce((sum, u) => sum + SPECIAL_UNIT_SLOT_LIMITS[u], 0);

  const toggle = (unit: SpecialUnit) =>
    setExpanded((prev) => (prev === unit ? null : unit));

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-bold text-gray-800">Special Battalion</h2>
        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold">
          MEDICAL
        </span>
        <span className="text-xs font-semibold text-gray-400 tabular-nums">
          {total}/{capacity} members
        </span>
      </div>

      <div className="space-y-2">
        {SPECIAL_UNITS.map((unit) => {
          const config = UNIT_CONFIG[unit];
          const members = unitData[unit];

          return (
            <div key={unit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <UnitIcon unit={unit} className={`w-5 h-5 ${config.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-800">{unit}</h3>
                      <span className="text-xs text-gray-400 tabular-nums ml-auto">
                        {members.length}/{SPECIAL_UNIT_SLOT_LIMITS[unit]} members
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggle(unit)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
                >
                  <span className="text-xs font-semibold text-gray-500 flex-1">View members</span>
                  <span className="text-[11px] font-semibold text-gray-400 tabular-nums">{members.length}</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded === unit ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expanded === unit && (
                  <div className="border-t border-gray-50 mt-1">
                    <ROTCPlatoonTable members={members} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
