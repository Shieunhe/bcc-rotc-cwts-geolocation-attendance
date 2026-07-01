"use client";

import { useEffect, useState } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import { adminService } from "@/services/admin.service";
import {
  AttendanceSession, AttendanceRecord,
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
  ROTCCompany, EnrollmentDocument, SpecialUnit,
  getSchoolYearFromDate,
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

export type AttendanceSummarySection = "battalion-1" | "battalion-2" | "advance-course" | "special-platoon" | "overall";

const SECTION_META: Record<AttendanceSummarySection, { title: string; subtitle: string }> = {
  "battalion-1":      { title: "Battalion 1 - Male", subtitle: "View attendance for Battalion 1 (Male) cadets." },
  "battalion-2":      { title: "Battalion 2 - Female", subtitle: "View attendance for Battalion 2 (Female) cadets." },
  "advance-course":   { title: "Advance Course", subtitle: "View attendance for advance course cadets." },
  "special-platoon":  { title: "Special Platoon", subtitle: "View attendance for special unit cadets (Medics, HQ, MP)." },
  "overall":          { title: "Overall Summary", subtitle: "Combined attendance for Battalion 1, Battalion 2, and Special Platoon." },
};

interface Props {
  section: AttendanceSummarySection;
}

function getSessionSY(s: AttendanceSession): string {
  return s.schoolYear ?? getSchoolYearFromDate(s.openDate);
}

function getUniqueSYs(sessions: AttendanceSession[]): string[] {
  const set = new Set(sessions.map(getSessionSY));
  return Array.from(set).sort().reverse();
}

type SYOption = { schoolYear: string; msLevel: "1" | "2" | ""; label: string };

function getSessionMsLevel(session: AttendanceSession): "1" | "2" | "" {
  return session.msLevel ?? "";
}

function buildCycleValue(schoolYear: string, msLevel: "1" | "2" | ""): string {
  return `${schoolYear}__${msLevel || "all"}`;
}

function parseCycleValue(value: string): { schoolYear: string; msLevel: "1" | "2" | "" } {
  const [schoolYear = "", rawMs = "all"] = value.split("__");
  return {
    schoolYear,
    msLevel: rawMs === "1" || rawMs === "2" ? rawMs : "",
  };
}

function buildSYOptions(sessions: AttendanceSession[]): SYOption[] {
  const seen = new Set<string>();
  const options: SYOption[] = [];

  const addOption = (schoolYear: string, msLevel: "1" | "2" | "") => {
    const key = buildCycleValue(schoolYear, msLevel);
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      schoolYear,
      msLevel,
      label: msLevel ? `MS ${msLevel} - SY ${schoolYear}` : `SY ${schoolYear}`,
    });
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    const syDiff = getSessionSY(b).localeCompare(getSessionSY(a));
    if (syDiff !== 0) return syDiff;
    return getSessionMsLevel(a).localeCompare(getSessionMsLevel(b));
  });
  for (const session of sortedSessions) {
    addOption(getSessionSY(session), getSessionMsLevel(session));
  }

  if (options.length === 0) {
    for (const sy of getUniqueSYs(sessions)) {
      addOption(sy, "");
    }
  }

  return options;
}

export default function ROTCAttendanceSummary({ section }: Props) {
  const meta = SECTION_META[section];
  const [allSessions, setAllSessions] = useState<AttendanceSession[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [selectedMI, setSelectedMI] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<"in" | "out">("in");
  const [enrolledStudents, setEnrolledStudents] = useState<EnrollmentDocument[]>([]);
  const [recordMap, setRecordMap] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const selectedMsLevel = parseCycleValue(selectedCycle).msLevel;
  const [loadingSpecial, setLoadingSpecial] = useState(false);

  useEffect(() => {
    setLoadingSessions(true);
    setSelectedMI(0);
    setRecordMap(new Map());
    setEnrolledStudents([]);
    const isAdvance = section === "advance-course";
    Promise.all([
      adminService.getSessionsByProgram("ROTC", isAdvance),
      adminService.getEnrollmentSchedules("ROTC"),
    ]).then(([data]) => {
      const filtered = section === "advance-course"
        ? data.filter((s) => s.isAdvanceCourse)
        : section === "battalion-1" || section === "battalion-2" || section === "overall"
          ? data.filter((s) => !s.isAdvanceCourse)
          : data;
      setAllSessions(filtered);
      const nextOptions = buildSYOptions(filtered);
      setSelectedCycle(nextOptions[0] ? buildCycleValue(nextOptions[0].schoolYear, nextOptions[0].msLevel) : "");
      setLoadingSessions(false);
    }).catch(() => setLoadingSessions(false));
  }, [section]);

  const syOptions = buildSYOptions(allSessions);
  const cycleFilter = parseCycleValue(selectedCycle);
  const sessionsBySY = allSessions.filter((s) => {
    if (getSessionSY(s) !== cycleFilter.schoolYear) return false;
    if (cycleFilter.msLevel && getSessionMsLevel(s) !== cycleFilter.msLevel) return false;
    return true;
  });
  const miSessions = getMISessions(sessionsBySY);
  const currentMI = miSessions.get(selectedMI);
  const selectedSession = currentMI?.[selectedType] ?? null;
  const selectedSessionId = selectedSession?.id ?? null;

  function handleMIChange(mi: number) {
    setSelectedMI(mi);
    const entry = miSessions.get(mi);
    setSelectedType(entry?.in ? "in" : entry?.out ? "out" : "in");
  }

  useEffect(() => {
    if (!selectedSessionId) { setRecordMap(new Map()); setEnrolledStudents([]); return; }
    setLoadingRecords(true);
    adminService.getAttendanceSummary(selectedSessionId, "ROTC").then(({ records, enrolledStudents: enrolled }) => {
      const map = new Map<string, AttendanceRecord>();
      for (const r of records) map.set(r.studentUid, r);
      setRecordMap(map);
      setEnrolledStudents(enrolled);
      setLoadingRecords(false);
    }).catch(() => setLoadingRecords(false));
  }, [selectedSessionId]);

  const isLoading = loadingSessions || loadingRecords || loadingSpecial;
  const graceOver = isGracePeriodOver(selectedSession);

  const b1Students = enrolledStudents
    .filter((student) =>
      !student.specialUnit &&
      !student.medicalCondition &&
      !student.willingToTakeAdvanceCourse &&
      student.battalion === 1 &&
      !!student.rotcCompany &&
      !!student.rotcPlatoon
    )
    .map((student) => ({
      student,
      company: student.rotcCompany as ROTCCompany,
      platoon: student.rotcPlatoon as number,
    }));

  const b2Students = enrolledStudents
    .filter((student) =>
      !student.specialUnit &&
      !student.medicalCondition &&
      !student.willingToTakeAdvanceCourse &&
      student.battalion === 2 &&
      !!student.rotcCompany &&
      !!student.rotcPlatoon
    )
    .map((student) => ({
      student,
      company: student.rotcCompany as ROTCCompany,
      platoon: student.rotcPlatoon as number,
    }));

  const advanceCourseStudents = enrolledStudents.filter((student) =>
    !!student.willingToTakeAdvanceCourse && !student.specialUnit && !student.medicalCondition
  );

  const specialUnitStudents: Record<SpecialUnit, EnrollmentDocument[]> = {
    Medics: enrolledStudents.filter((student) => student.specialUnit === "Medics"),
    HQ: enrolledStudents.filter((student) => student.specialUnit === "HQ"),
    MP: enrolledStudents.filter((student) => student.specialUnit === "MP"),
  };

  return (
    <AdminPageLayout program="ROTC">
      <PageIntroPanel
        title={meta.title}
        subtitle={meta.subtitle}
        variant="sky"
      />

      <div className="mb-4">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">School Year</label>
        <div className="relative max-w-xs">
          <select
            value={selectedCycle}
            onChange={(e) => {
              setSelectedCycle(e.target.value);
              setSelectedMI(0);
              setRecordMap(new Map());
            }}
            className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            {syOptions.length === 0 && <option value="">No sessions found</option>}
            {syOptions.map((opt, i) => (
              <option
                key={`${opt.schoolYear}-${opt.msLevel || "all"}-${i}`}
                value={buildCycleValue(opt.schoolYear, opt.msLevel)}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

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
                    {created ? getMIOptionLabel(mi, entry) : `MI ${mi} - Not yet created`}
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
              sessionOpenDate={selectedSession?.openDate ?? null}
              sessionCloseDate={selectedSession?.closeDate ?? null}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              hasIn={!!currentMI?.in}
              hasOut={!!currentMI?.out}
              selectedMI={selectedMI}
            />
          )}
        </div>
      )}
    </AdminPageLayout>
  );
}
