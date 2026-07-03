"use client";

import { useEffect, useState } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import { adminService } from "@/services/admin.service";
import {
  AttendanceSession, AttendanceRecord, EnrollmentDocument,
  CWTSCompany, CWTS_COMPANIES,
  EnrollmentSchedule, getSchoolYearFromDate,
} from "@/types";
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, WidthType, AlignmentType, BorderStyle, HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

const LATE_THRESHOLD_MINUTES = 15;
const MI_COUNT = 15;
const MI_NUMBERS = Array.from({ length: MI_COUNT }, (_, i) => i + 1);

function isGracePeriodOver(session: AttendanceSession | null): boolean {
  if (!session) return false;
  const deadline = new Date(new Date(session.closeDate).getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);
  return new Date() >= deadline;
}

function formatTimeDisplay(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateDisplay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
    ? `Time In - (${formatTimeDisplay(entry.in.openDate)} - ${formatTimeDisplay(entry.in.closeDate)})`
    : "Time In - (Not yet)";
  const outLabel = entry?.out
    ? `Time Out - (${formatTimeDisplay(entry.out.openDate)} - ${formatTimeDisplay(entry.out.closeDate)})`
    : "Time Out - (Not yet)";
  return `MI ${mi}  ${inLabel} | ${outLabel}`;
}

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  present:  { bg: "bg-green-50 border-green-200", text: "text-green-700", border: "border-l-green-500", label: "Present" },
  late:     { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", border: "border-l-amber-400", label: "Late" },
  absent:   { bg: "bg-red-50 border-red-200",     text: "text-red-700",   border: "border-l-red-400",   label: "Absent" },
  unmarked: { bg: "bg-gray-50 border-gray-200",   text: "text-gray-500",  border: "border-l-gray-300",  label: "Not Yet" },
};

function getStatus(uid: string, recordMap: Map<string, AttendanceRecord>, graceOver: boolean): string {
  const s = recordMap.get(uid)?.status;
  if (s) return s;
  return graceOver ? "absent" : "unmarked";
}

function getSessionSY(s: AttendanceSession): string {
  return s.schoolYear ?? getSchoolYearFromDate(s.openDate);
}

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

type CycleOption = { value: string; schoolYear: string; msLevel: "1" | "2" | ""; label: string };

function buildCycleOptions(sessions: AttendanceSession[], schedules: EnrollmentSchedule[]): CycleOption[] {
  const seen = new Set<string>();
  const options: CycleOption[] = [];
  const scheduleLevelsByYear = new Map<string, Set<"1" | "2">>();

  for (const schedule of schedules) {
    const levels = scheduleLevelsByYear.get(schedule.year) ?? new Set<"1" | "2">();
    levels.add(schedule.msLevel);
    scheduleLevelsByYear.set(schedule.year, levels);
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    const syDiff = getSessionSY(b).localeCompare(getSessionSY(a));
    if (syDiff !== 0) return syDiff;
    return getSessionMsLevel(a).localeCompare(getSessionMsLevel(b));
  });

  for (const session of sortedSessions) {
    const schoolYear = getSessionSY(session);
    const msLevel = getSessionMsLevel(session);
    const value = buildCycleValue(schoolYear, msLevel);
    if (seen.has(value)) continue;
    seen.add(value);
    options.push({
      value,
      schoolYear,
      msLevel,
      label: msLevel ? `CWTS ${msLevel} - SY ${schoolYear}` : `SY ${schoolYear}`,
    });
  }

  for (const [schoolYear, levels] of scheduleLevelsByYear) {
    for (const msLevel of Array.from(levels).sort()) {
      const value = buildCycleValue(schoolYear, msLevel);
      if (!seen.has(value)) {
        seen.add(value);
        options.push({
          value,
          schoolYear,
          msLevel,
          label: `CWTS ${msLevel} - SY ${schoolYear}`,
        });
      }
    }
  }

  return options.sort((a, b) => {
    const syDiff = b.schoolYear.localeCompare(a.schoolYear);
    if (syDiff !== 0) return syDiff;
    return a.msLevel.localeCompare(b.msLevel);
  });
}

export default function CWTSAttendanceSummary() {
  const [allSessions, setAllSessions] = useState<AttendanceSession[]>([]);
  const [schedules, setSchedules] = useState<EnrollmentSchedule[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [selectedMI, setSelectedMI] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<"in" | "out">("in");
  const [enrolledStudents, setEnrolledStudents] = useState<EnrollmentDocument[]>([]);
  const [recordMap, setRecordMap] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [filterCompany, setFilterCompany] = useState<CWTSCompany | "">("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoadingSessions(true);
    setSelectedMI(0);
    setRecordMap(new Map());
    setEnrolledStudents([]);
    Promise.all([
      adminService.getSessionsByProgram("CWTS"),
      adminService.getEnrollmentSchedules("CWTS"),
    ]).then(([data, scheds]) => {
      setAllSessions(data);
      setSchedules(scheds);
      const options = buildCycleOptions(data, scheds);
      setSelectedCycle(options[0]?.value ?? "");
      setLoadingSessions(false);
    }).catch(() => setLoadingSessions(false));
  }, []);

  const cycleOptions = buildCycleOptions(allSessions, schedules);
  const cycleFilter = parseCycleValue(selectedCycle);
  const sessionsByCycle = allSessions.filter((s) => {
    if (getSessionSY(s) !== cycleFilter.schoolYear) return false;
    if (cycleFilter.msLevel && getSessionMsLevel(s) !== cycleFilter.msLevel) return false;
    return true;
  });
  const miSessions = getMISessions(sessionsByCycle);
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
    adminService.getAttendanceSummary(selectedSessionId, "CWTS").then(({ records, enrolledStudents: enrolled }) => {
      const map = new Map<string, AttendanceRecord>();
      for (const r of records) map.set(r.studentUid, r);
      setRecordMap(map);
      setEnrolledStudents(enrolled);
      setLoadingRecords(false);
    }).catch(() => setLoadingRecords(false));
  }, [selectedSessionId]);

  const isLoading = loadingSessions || loadingRecords;
  const graceOver = isGracePeriodOver(selectedSession);
  const lateDeadlineStr = selectedSession
    ? new Date(new Date(selectedSession.closeDate).getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000).toISOString()
    : null;
  const selectedMsLevel = cycleFilter.msLevel || selectedSession?.msLevel || "";

  const filtered = enrolledStudents.filter((s) => {
    const status = getStatus(s.uid, recordMap, graceOver);
    if (filterCompany && s.company !== filterCompany) return false;
    if (filterStatus && status !== filterStatus) return false;
    if (filterYear && s.yearLevel !== filterYear) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${s.lastName} ${s.firstName} ${s.middleName ?? ""} ${s.suffix ?? ""} ${s.studentId ?? ""} ${s.course ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const companyOrder: Record<string, number> = {
    Alpha: 0, Bravo: 1, Charlie: 2, Delta: 3, Echo: 4, Foxtrot: 5,
  };

  const sorted = [...filtered].sort((a, b) => {
    const ca = companyOrder[a.company ?? ""] ?? 99;
    const cb = companyOrder[b.company ?? ""] ?? 99;
    if (ca !== cb) return ca - cb;
    const order: Record<string, number> = { present: 0, late: 1, absent: 2, unmarked: 3 };
    const sa = getStatus(a.uid, recordMap, graceOver);
    const sb = getStatus(b.uid, recordMap, graceOver);
    const diff = (order[sa] ?? 4) - (order[sb] ?? 4);
    if (diff !== 0) return diff;
    return a.lastName.localeCompare(b.lastName);
  });

  const counts = { present: 0, late: 0, absent: 0, unmarked: 0 };
  for (const s of filtered) {
    const st = getStatus(s.uid, recordMap, graceOver);
    if (st === "present") counts.present++;
    else if (st === "late") counts.late++;
    else if (st === "absent") counts.absent++;
    else counts.unmarked++;
  }
  const total = filtered.length;
  const attended = counts.present + counts.late;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
  const hasUnmarked = counts.unmarked > 0;

  const statusOptions = [
    { value: "present", label: "Present" },
    { value: "late", label: "Late" },
    { value: "absent", label: "Absent" },
    ...(hasUnmarked ? [{ value: "unmarked", label: "Not Yet Marked" }] : []),
  ];

  async function downloadWord() {
    const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
    const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    const headers = ["No.", "Name", "ID Number", "Status", selectedType === "in" ? "Time In" : "Time Out"];

    function makeCell(
      text: string,
      options?: {
        bold?: boolean;
        size?: number;
        color?: string;
        fill?: string;
        alignment?: "left" | "center" | "right";
        columnSpan?: number;
      }
    ) {
      return new TableCell({
        columnSpan: options?.columnSpan,
        borders,
        ...(options?.fill ? { shading: { fill: options.fill } } : {}),
        children: [new Paragraph({
          alignment: options?.alignment,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({
            text,
            bold: options?.bold,
            size: options?.size ?? 20,
            font: "Arial",
            color: options?.color,
          })],
        })],
      });
    }

    function makeHeaderRow() {
      return new TableRow({
        tableHeader: true,
        children: headers.map((h) =>
          new TableCell({
            borders,
            shading: { fill: "065F46" },
            children: [new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: h, bold: true, size: 18, font: "Arial", color: "FFFFFF" })],
            })],
          })
        ),
      });
    }

    function makeSummaryTable() {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell("MI / Type", { bold: true, fill: "DBEAFE", color: "1E3A8A" }),
              makeCell(`MI ${selectedMI} - ${selectedType === "in" ? "TIME IN" : "TIME OUT"}`, { bold: true, size: 22 }),
              makeCell("Session Date", { bold: true, fill: "DBEAFE", color: "1E3A8A" }),
              makeCell(selectedSession ? formatDateDisplay(selectedSession.openDate) : "-", { bold: true, size: 22 }),
            ],
          }),
          new TableRow({
            children: [
              makeCell("Time Window", { bold: true, fill: "EFF6FF", color: "1E3A8A" }),
              makeCell(
                selectedSession
                  ? `${formatTimeDisplay(selectedSession.openDate)} - ${formatTimeDisplay(selectedSession.closeDate)}`
                  : "-",
                { size: 22 }
              ),
              makeCell("NSTP Component", { bold: true, fill: "EFF6FF", color: "1E3A8A" }),
              makeCell("CWTS", { bold: true, size: 22 }),
            ],
          }),
          new TableRow({
            children: [
              makeCell("School Year", { bold: true, fill: "DBEAFE", color: "1E3A8A" }),
              makeCell(cycleFilter.schoolYear || "-", { bold: true, size: 22 }),
              makeCell("CWTS Level", { bold: true, fill: "DBEAFE", color: "1E3A8A" }),
              makeCell(selectedMsLevel ? `CWTS ${selectedMsLevel}` : "All", { bold: true, size: 22 }),
            ],
          }),
        ],
      });
    }

    function makeCountsTable() {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell(`TOTAL: ${total}`, { bold: true, size: 22, fill: "F3F4F6", alignment: AlignmentType.CENTER }),
              makeCell(`PRESENT: ${counts.present}`, { bold: true, size: 22, fill: "DCFCE7", color: "166534", alignment: AlignmentType.CENTER }),
              makeCell(`LATE: ${counts.late}`, { bold: true, size: 22, fill: "FEF3C7", color: "92400E", alignment: AlignmentType.CENTER }),
              makeCell(`ABSENT: ${counts.absent}`, { bold: true, size: 22, fill: "FEE2E2", color: "991B1B", alignment: AlignmentType.CENTER }),
            ],
          }),
        ],
      });
    }

    function makeSectionHeading(text: string, fill: string, color = "FFFFFF") {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell(text, {
                bold: true,
                size: 26,
                fill,
                color,
                alignment: AlignmentType.CENTER,
                columnSpan: 5,
              }),
            ],
          }),
        ],
      });
    }

    function makeDataRows(students: EnrollmentDocument[]) {
      return students.map((s, idx) => {
        const status = getStatus(s.uid, recordMap, graceOver);
        const cfg = statusConfig[status] ?? statusConfig.absent;
        const record = recordMap.get(s.uid);
        const time = status === "present" || status === "late"
          ? (record ? formatTimeDisplay(record.createdAt) : "")
          : status === "absent" && lateDeadlineStr
            ? formatTimeDisplay(lateDeadlineStr)
            : "";
        const name = `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}${s.suffix ? ` ${s.suffix}` : ""}`;
        const cells = [String(idx + 1), name, s.studentId ?? "", cfg.label, time];

        return new TableRow({
          children: cells.map((text) =>
            new TableCell({
              borders,
              ...(idx % 2 === 1 ? { shading: { fill: "F9FAFB" } } : {}),
              children: [new Paragraph({
                spacing: { before: 30, after: 30 },
                children: [new TextRun({ text, size: 18, font: "Arial" })],
              })],
            })
          ),
        });
      });
    }

    const companySections: (Paragraph | Table)[] = [];
    for (const company of CWTS_COMPANIES) {
      const students = sorted.filter((s) => s.company === company);
      if (students.length === 0) continue;

      companySections.push(
        new Paragraph({ spacing: { before: 220, after: 80 } }),
        makeSectionHeading(`${company.toUpperCase()} COMPANY`, "D1FAE5", "065F46"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [makeHeaderRow(), ...makeDataRows(students)],
        }),
      );
    }

    const unassigned = sorted.filter((s) => !s.company);
    if (unassigned.length > 0) {
      companySections.push(
        new Paragraph({ spacing: { before: 220, after: 80 } }),
        makeSectionHeading("UNASSIGNED", "F3F4F6", "374151"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [makeHeaderRow(), ...makeDataRows(unassigned)],
        }),
      );
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: "CWTS ATTENDANCE SUMMARY", bold: true, size: 34, font: "Arial", color: "065F46" })],
          }),
          makeSummaryTable(),
          new Paragraph({ spacing: { after: 140 } }),
          makeCountsTable(),
          new Paragraph({ spacing: { before: 120, after: 120 } }),
          ...companySections,
          new Paragraph({
            spacing: { before: 180 },
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `${sorted.length} of ${enrolledStudents.length} students shown`, size: 16, font: "Arial", color: "999999" })],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CWTS_Attendance_MI${selectedMI}_${selectedType === "in" ? "TimeIn" : "TimeOut"}.docx`);
  }

  return (
    <AdminPageLayout program="CWTS">
      <PageIntroPanel
        title="CWTS Attendance Summary"
        subtitle="View attendance records for CWTS students."
        variant="emerald"
      />

      {/* Cycle selector */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">CWTS Cycle</label>
        <div className="relative max-w-xs">
          <select
            value={selectedCycle}
            onChange={(e) => {
              setSelectedCycle(e.target.value);
              setSelectedMI(0);
              setRecordMap(new Map());
              setEnrolledStudents([]);
            }}
            className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          >
            {cycleOptions.length === 0 && <option value="">No sessions found</option>}
            {cycleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
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
              className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
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
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">CWTS Attendance</h2>
                  <p className="text-[11px] text-white/70 font-medium">{enrolledStudents.length} student{enrolledStudents.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button
                onClick={downloadWord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur text-white text-[11px] font-semibold transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Overview cards */}
            <div className={`grid ${hasUnmarked ? "grid-cols-5" : "grid-cols-4"} gap-2`}>
              <div className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
                <p className="text-lg font-bold text-gray-800">{total}</p>
              </div>
              <div className="bg-green-50 rounded-xl border border-green-200 p-2.5 text-center">
                <p className="text-[9px] font-semibold text-green-600 uppercase tracking-wide">Present</p>
                <p className="text-lg font-bold text-green-700">{counts.present}</p>
              </div>
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-2.5 text-center">
                <p className="text-[9px] font-semibold text-amber-600 uppercase tracking-wide">Late</p>
                <p className="text-lg font-bold text-amber-700">{counts.late}</p>
              </div>
              <div className="bg-red-50 rounded-xl border border-red-200 p-2.5 text-center">
                <p className="text-[9px] font-semibold text-red-600 uppercase tracking-wide">Absent</p>
                <p className="text-lg font-bold text-red-700">{counts.absent}</p>
              </div>
              {hasUnmarked && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-2.5 text-center">
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Not Yet</p>
                  <p className="text-lg font-bold text-gray-600">{counts.unmarked}</p>
                </div>
              )}
            </div>

            {/* Attendance bar */}
            {/* <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-gray-600">Attendance Rate</span>
                <span className="text-[11px] font-bold text-gray-600">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                {total > 0 && (
                  <>
                    <div className="h-full bg-green-500" style={{ width: `${(counts.present / total) * 100}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${(counts.late / total) * 100}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${(counts.absent / total) * 100}%` }} />
                    {hasUnmarked && <div className="h-full bg-gray-300" style={{ width: `${(counts.unmarked / total) * 100}%` }} />}
                  </>
                )}
              </div>
            </div> */}

            {/* Filters */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Filters</p>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as "in" | "out")}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                    <option value="in" disabled={!currentMI?.in}>Time In{currentMI?.in ? "" : " - Not created"}</option>
                    <option value="out" disabled={!currentMI?.out}>Time Out{currentMI?.out ? "" : " - Not created"}</option>
                  </select>
                  <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div className="relative">
                  <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value as CWTSCompany | "")}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                    <option value="">All Companies</option>
                    {CWTS_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div className="relative">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                    <option value="">All Status</option>
                    {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div className="relative">
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                    <option value="">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                  <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="relative">
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, course, or student ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {/* Student list */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {sorted.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-gray-400 font-medium">
                    {enrolledStudents.length === 0 ? "No enrolled students found." : "No students match your filters."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block divide-y divide-gray-100">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      <span>Student</span>
                      <span className="w-20 text-center">Company</span>
                      <span className="w-16 text-center">Time</span>
                      <span className="w-18 text-center">Status</span>
                    </div>
                    {sorted.map((s) => {
                      const status = getStatus(s.uid, recordMap, graceOver);
                      const cfg = statusConfig[status] ?? statusConfig.absent;
                      const record = recordMap.get(s.uid);
                      const name = `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}${s.suffix ? ` ${s.suffix}` : ""}`;

                      return (
                        <div key={s.uid} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-2.5 border-l-3 ${cfg.border}`}>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {s.studentId && <span className="text-[10px] text-gray-400">{s.studentId}</span>}
                              {s.course && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-[10px] text-gray-400">{s.course}</span>
                                </>
                              )}
                              {s.yearLevel && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-[10px] text-gray-400">{s.yearLevel}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium w-20 text-center truncate">{s.company ?? "-"}</span>
                          <span className="text-[10px] text-gray-400 font-medium w-16 text-center">
                            {status === "present" || status === "late"
                              ? (record ? formatTimeDisplay(record.createdAt) : "-")
                              : status === "absent" && lateDeadlineStr
                                ? formatTimeDisplay(lateDeadlineStr)
                                : "-"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border w-18 text-center ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-gray-50">
                    {sorted.map((s) => {
                      const status = getStatus(s.uid, recordMap, graceOver);
                      const cfg = statusConfig[status] ?? statusConfig.absent;
                      const record = recordMap.get(s.uid);
                      const name = `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName[0]}.` : ""}${s.suffix ? ` ${s.suffix}` : ""}`;
                      const timeStr = status === "present" || status === "late"
                        ? (record ? formatTimeDisplay(record.createdAt) : "-")
                        : status === "absent" && lateDeadlineStr
                          ? formatTimeDisplay(lateDeadlineStr)
                          : "-";

                      return (
                        <div key={s.uid} className={`px-4 py-3 border-l-3 ${cfg.border}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {s.studentId}{s.course ? ` | ${s.course}` : ""}
                              </p>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-gray-400 font-medium">{s.company ?? "-"}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-[10px] text-gray-400">{timeStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-right">{sorted.length} of {enrolledStudents.length} students shown</p>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}

