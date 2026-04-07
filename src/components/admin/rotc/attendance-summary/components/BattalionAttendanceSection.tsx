"use client";

import { useState } from "react";
import {
  ROTCCompany, EnrollmentDocument, AttendanceRecord,
  ROTC_PLATOONS_PER_COMPANY,
} from "@/types";
import PlatoonAttendanceList from "./PlatoonAttendanceList";

type BattalionRoster = Record<ROTCCompany, Record<number, EnrollmentDocument[]>>;

const COMPANY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Alpha:   { bg: "bg-blue-50",    text: "text-blue-700",    bar: "bg-blue-500" },
  Bravo:   { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  Charlie: { bg: "bg-amber-50",   text: "text-amber-700",   bar: "bg-amber-500" },
  Delta:   { bg: "bg-purple-50",  text: "text-purple-700",  bar: "bg-purple-500" },
  Echo:    { bg: "bg-rose-50",    text: "text-rose-700",    bar: "bg-rose-500" },
  Foxtrot: { bg: "bg-cyan-50",    text: "text-cyan-700",    bar: "bg-cyan-500" },
  Golf:    { bg: "bg-orange-50",  text: "text-orange-700",  bar: "bg-orange-500" },
  Hotel:   { bg: "bg-teal-50",    text: "text-teal-700",    bar: "bg-teal-500" },
};

function getCounts(members: EnrollmentDocument[], recordMap: Map<string, AttendanceRecord>, graceOver: boolean) {
  let present = 0, late = 0, absent = 0, unmarked = 0;
  for (const m of members) {
    const s = recordMap.get(m.uid)?.status;
    if (s === "present") present++;
    else if (s === "late") late++;
    else if (s === "absent") absent++;
    else if (graceOver) absent++;
    else unmarked++;
  }
  return { present, late, absent, unmarked, total: members.length };
}

interface Props {
  battalionNum: number;
  label: string;
  companies: ROTCCompany[];
  roster: BattalionRoster;
  recordMap: Map<string, AttendanceRecord>;
  graceOver: boolean;
}

export default function BattalionAttendanceSection({ battalionNum, label, companies, roster, recordMap, graceOver }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  let bPresent = 0, bLate = 0, bAbsent = 0, bUnmarked = 0, bTotal = 0;
  for (const c of companies) {
    for (let p = 1; p <= ROTC_PLATOONS_PER_COMPANY; p++) {
      const counts = getCounts(roster[c]?.[p] ?? [], recordMap, graceOver);
      bPresent += counts.present;
      bLate += counts.late;
      bAbsent += counts.absent;
      bUnmarked += counts.unmarked;
      bTotal += counts.total;
    }
  }

  const bAttended = bPresent + bLate;
  const bPct = bTotal > 0 ? Math.round((bAttended / bTotal) * 100) : 0;

  return (
    <div>
      {/* Battalion header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">Battalion {battalionNum} — {label}</h2>
          <span className="text-sm font-bold text-gray-600">{bAttended}/{bTotal} attended</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
          {bTotal > 0 && (
            <>
              <div className="h-full bg-green-500 transition-all" style={{ width: `${(bPresent / bTotal) * 100}%` }} />
              <div className="h-full bg-amber-400 transition-all" style={{ width: `${(bLate / bTotal) * 100}%` }} />
              <div className="h-full bg-red-400 transition-all" style={{ width: `${(bAbsent / bTotal) * 100}%` }} />
              {bUnmarked > 0 && <div className="h-full bg-gray-300 transition-all" style={{ width: `${(bUnmarked / bTotal) * 100}%` }} />}
            </>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500" /> {bPresent} Present
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> {bLate} Late
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-400" /> {bAbsent} Absent
          </span>
          {bUnmarked > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-300" /> {bUnmarked} Not Yet Marked
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">{bPct}% attendance</span>
        </div>
      </div>

      {/* Companies */}
      <div className="space-y-2">
        {companies.map((company) => {
          const colors = COMPANY_COLORS[company] ?? COMPANY_COLORS.Alpha;

          let cPresent = 0, cLate = 0, cAbsent = 0, cUnmarked = 0, cTotal = 0;
          for (let p = 1; p <= ROTC_PLATOONS_PER_COMPANY; p++) {
            const counts = getCounts(roster[company]?.[p] ?? [], recordMap, graceOver);
            cPresent += counts.present;
            cLate += counts.late;
            cAbsent += counts.absent;
            cUnmarked += counts.unmarked;
            cTotal += counts.total;
          }
          const cAttended = cPresent + cLate;
          const cPct = cTotal > 0 ? Math.round((cAttended / cTotal) * 100) : 0;

          return (
            <div key={company} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5">
                {/* Company header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-bold ${colors.text}`}>{company[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-800">{company} Company</h3>
                      <span className="text-xs font-semibold text-gray-500">{cPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex mt-1.5">
                      {cTotal > 0 && (
                        <>
                          <div className="h-full bg-green-500" style={{ width: `${(cPresent / cTotal) * 100}%` }} />
                          <div className="h-full bg-amber-400" style={{ width: `${(cLate / cTotal) * 100}%` }} />
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-green-600">{cPresent} Present</span>
                      <span className="text-[11px] font-semibold text-amber-600">{cLate} Late</span>
                      <span className="text-[11px] font-semibold text-red-600">{cAbsent} Absent</span>
                      {cUnmarked > 0 && <span className="text-[11px] font-semibold text-gray-500">{cUnmarked} Not Yet</span>}
                      <span className="text-[11px] text-gray-400 ml-auto">{cTotal} total</span>
                    </div>
                  </div>
                </div>

                {/* Platoon rows */}
                <div className="border-t border-gray-100 pt-2 space-y-0.5">
                  {Array.from({ length: ROTC_PLATOONS_PER_COMPANY }, (_, i) => {
                    const platoonNum = i + 1;
                    const members = roster[company]?.[platoonNum] ?? [];
                    const key = `${company}-${platoonNum}`;
                    const isOpen = expanded === key;
                    const p = getCounts(members, recordMap, graceOver);

                    return (
                      <div key={platoonNum}>
                        <button
                          onClick={() => setExpanded(isOpen ? null : key)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <span className="text-xs font-bold text-gray-600 w-20 shrink-0">Platoon {platoonNum}</span>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{p.present}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{p.late}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />{p.absent}
                            </span>
                            {p.unmarked > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />{p.unmarked}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium tabular-nums">{p.total} members</span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="mx-3 mb-2 rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
                            <PlatoonAttendanceList members={members} recordMap={recordMap} graceOver={graceOver} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
