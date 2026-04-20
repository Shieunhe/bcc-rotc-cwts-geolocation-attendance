"use client";

import { useEffect, useState } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import { adminService } from "@/services/admin.service";
import { useROTCPlatoonRoster } from "@/hooks/useROTCPlatoonRoster";
import {
  AttendanceSession, AttendanceRecord,
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
  ROTC_PLATOONS_PER_COMPANY,
  ROTCCompany, EnrollmentDocument, SpecialUnit, SPECIAL_UNITS,
} from "@/types";
import BattalionAttendanceBox from "./components/BattalionAttendanceBox";
import AdvanceCourseAttendanceBox from "./components/AdvanceCourseAttendanceBox";
import SpecialPlatoonAttendanceBox from "./components/SpecialPlatoonAttendanceBox";
import OverallAttendanceBox from "./components/OverallAttendanceBox";

const LATE_THRESHOLD_MINUTES = 15;
const MI_COUNT = 15;
const MI_NUMBERS = Array.from({ length: MI_COUNT }, (_, i) => i + 1);

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function getMISessions(sessions: AttendanceSession[]) {
  const map = new Map<number, { in?: AttendanceSession; out?: AttendanceSession }>();
  for (const s of sessions) {
    if (!s.miNumber || !s.miType) continue;
    const entry = map.get(s.miNumber) ?? {};
    entry[s.miType] = s;
    map.set(s.miNumber, entry);
  }
  return map;
}

function getMIOptionLabel(mi: number, entry?: { in?: AttendanceSession; out?: AttendanceSession }) {
  const inLabel = entry?.in
    ? `Time In - (${formatTime(entry.in.openDate)} - ${formatTime(entry.in.closeDate)})`
    : "Time In - (Not yet)";
  const outLabel = entry?.out
    ? `Time Out - (${formatTime(entry.out.openDate)} - ${formatTime(entry.out.closeDate)})`
    : "Time Out - (Not yet)";
  return `MI ${mi}  ${inLabel} | ${outLabel}`;
}

function isGracePeriodOver(session: AttendanceSession | null): boolean {
  if (!session) return false;
  const deadline = new Date(new Date(session.closeDate).getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);
  return new Date() >= deadline;
}

function flattenRoster(
  companies: ROTCCompany[],
  roster: Record<ROTCCompany, Record<number, EnrollmentDocument[]>>,
) {
  const list: { student: EnrollmentDocument; company: ROTCCompany; platoon: number }[] = [];
  for (const c of companies) {
    for (let p = 1; p <= ROTC_PLATOONS_PER_COMPANY; p++) {
      for (const m of roster[c]?.[p] ?? []) {
        list.push({ student: m, company: c, platoon: p });
      }
    }
  }
  return list;
}

export type AttendanceSummarySection = "battalion-1" | "battalion-2" | "advance-course" | "special-platoon" | "overall";

const SECTION_META: Record<AttendanceSummarySection, { title: string; subtitle: string }> = {
  "battalion-1":      { title: "Battalion 1 — Male", subtitle: "View attendance for Battalion 1 (Male) cadets." },
  "battalion-2":      { title: "Battalion 2 — Female", subtitle: "View attendance for Battalion 2 (Female) cadets." },
  "advance-course":   { title: "Advance Course", subtitle: "View attendance for advance course cadets." },
  "special-platoon":  { title: "Special Platoon", subtitle: "View attendance for special unit cadets (Medics, HQ, MP)." },
  "overall":          { title: "Overall Summary", subtitle: "Combined attendance for Battalion 1, Battalion 2, and Special Platoon." },
};

interface Props {
  section: AttendanceSummarySection;
}

export default function ROTCAttendanceSummary({ section }: Props) {
  const meta = SECTION_META[section];
  const [allSessions, setAllSessions] = useState<AttendanceSession[]>([]);
  const [selectedMI, setSelectedMI] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<"in" | "out">("in");
  const [recordMap, setRecordMap] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const { roster, isLoading: rosterLoading } = useROTCPlatoonRoster();
  const [specialUnitStudents, setSpecialUnitStudents] = useState<Record<SpecialUnit, EnrollmentDocument[]>>({ Medics: [], HQ: [], MP: [] });
  const [loadingSpecial, setLoadingSpecial] = useState(false);

  useEffect(() => {
    if (section !== "special-platoon" && section !== "overall") return;
    setLoadingSpecial(true);
    adminService.getSpecialUnitEnrollments()
      .then(setSpecialUnitStudents)
      .finally(() => setLoadingSpecial(false));
  }, [section]);

  useEffect(() => {
    setLoadingSessions(true);
    setSelectedMI(0);
    setRecordMap(new Map());
    const isAdvance = section === "advance-course";
    adminService.getSessionsByProgram("ROTC", isAdvance).then((data) => {
      const filtered = section === "advance-course"
        ? data.filter((s) => s.isAdvanceCourse)
        : section === "battalion-1" || section === "battalion-2" || section === "overall"
          ? data.filter((s) => !s.isAdvanceCourse)
          : data;
      setAllSessions(filtered);
      setLoadingSessions(false);
    }).catch(() => setLoadingSessions(false));
  }, [section]);

  const miSessions = getMISessions(allSessions);
  const currentMI = miSessions.get(selectedMI);
  const selectedSession = currentMI?.[selectedType] ?? null;
  const selectedSessionId = selectedSession?.id ?? null;

  function handleMIChange(mi: number) {
    setSelectedMI(mi);
    const entry = miSessions.get(mi);
    setSelectedType(entry?.in ? "in" : entry?.out ? "out" : "in");
  }

  useEffect(() => {
    if (!selectedSessionId) { setRecordMap(new Map()); return; }
    setLoadingRecords(true);
    adminService.getAttendanceSummary(selectedSessionId, "ROTC").then(({ records }) => {
      const map = new Map<string, AttendanceRecord>();
      for (const r of records) map.set(r.studentUid, r);
      setRecordMap(map);
      setLoadingRecords(false);
    }).catch(() => setLoadingRecords(false));
  }, [selectedSessionId]);

  const isLoading = rosterLoading || loadingSessions || loadingRecords || loadingSpecial;
  const graceOver = isGracePeriodOver(selectedSession);

  const b1Students = roster ? flattenRoster(ROTC_BATTALION_1_COMPANIES, roster.battalion1) : [];
  const b2Students = roster ? flattenRoster(ROTC_BATTALION_2_COMPANIES, roster.battalion2) : [];
  const advanceCourseStudents = roster ? [...roster.advanceCourseMale, ...roster.advanceCourseFemale] : [];

  return (
    <AdminPageLayout program="ROTC">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{meta.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{meta.subtitle}</p>
          </div>
        </div>
      </div>

      {/* MI selector + Time In/Out */}
      <div className="flex items-end gap-3 flex-wrap mb-5">
        <div className="flex-1 min-w-[220px]">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Select Military Instruction</label>
          <div className="relative">
            <select
              value={selectedMI}
              onChange={(e) => handleMIChange(Number(e.target.value))}
              className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value={0}>Select Military Instruction...</option>
              {MI_NUMBERS.map((mi) => {
                const entry = miSessions.get(mi);
                const created = !!entry;
                return (
                  <option key={mi} value={mi} disabled={!created}>
                    {created ? getMIOptionLabel(mi, entry) : `MI ${mi} — Not yet created`}
                  </option>
                );
              })}
            </select>
            <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading attendance data...</p>
          </div>
        </div>
      ) : selectedMI === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-500">Select a Military Instruction to view attendance records.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {section === "battalion-1" && (
            <BattalionAttendanceBox
              battalionNum={1}
              label="Male"
              companies={ROTC_BATTALION_1_COMPANIES}
              students={b1Students}
              recordMap={recordMap}
              graceOver={graceOver}
              sessionCloseDate={selectedSession?.closeDate ?? null}
              accentFrom="from-blue-600"
              accentTo="to-indigo-700"
              accentRing="focus:ring-blue-500"
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              hasIn={!!currentMI?.in}
              hasOut={!!currentMI?.out}
            />
          )}
          {section === "battalion-2" && (
            <BattalionAttendanceBox
              battalionNum={2}
              label="Female"
              companies={ROTC_BATTALION_2_COMPANIES}
              students={b2Students}
              recordMap={recordMap}
              graceOver={graceOver}
              sessionCloseDate={selectedSession?.closeDate ?? null}
              accentFrom="from-violet-600"
              accentTo="to-purple-700"
              accentRing="focus:ring-violet-500"
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              hasIn={!!currentMI?.in}
              hasOut={!!currentMI?.out}
            />
          )}
          {section === "advance-course" && (
            <AdvanceCourseAttendanceBox
              students={advanceCourseStudents}
              recordMap={recordMap}
              graceOver={graceOver}
              sessionCloseDate={selectedSession?.closeDate ?? null}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              hasIn={!!currentMI?.in}
              hasOut={!!currentMI?.out}
            />
          )}
          {section === "special-platoon" && (
            <SpecialPlatoonAttendanceBox
              unitStudents={specialUnitStudents}
              recordMap={recordMap}
              graceOver={graceOver}
              sessionCloseDate={selectedSession?.closeDate ?? null}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              hasIn={!!currentMI?.in}
              hasOut={!!currentMI?.out}
            />
          )}
          {section === "overall" && (
            <OverallAttendanceBox
              b1Students={b1Students}
              b2Students={b2Students}
              specialUnitStudents={specialUnitStudents}
              recordMap={recordMap}
              graceOver={graceOver}
              sessionCloseDate={selectedSession?.closeDate ?? null}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              hasIn={!!currentMI?.in}
              hasOut={!!currentMI?.out}
            />
          )}
        </div>
      )}
    </AdminPageLayout>
  );
}
