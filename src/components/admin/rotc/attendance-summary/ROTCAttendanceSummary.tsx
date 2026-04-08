"use client";

import { useEffect, useState } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import { adminService } from "@/services/admin.service";
import { useROTCPlatoonRoster } from "@/hooks/useROTCPlatoonRoster";
import {
  AttendanceSession, AttendanceRecord,
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
  ROTC_PLATOONS_PER_COMPANY,
  ROTCCompany, EnrollmentDocument,
} from "@/types";
import BattalionAttendanceBox from "./components/BattalionAttendanceBox";
import AdvanceCourseAttendanceBox from "./components/AdvanceCourseAttendanceBox";

const LATE_THRESHOLD_MINUTES = 15;

function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
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

export type AttendanceSummarySection = "battalion-1" | "battalion-2" | "advance-course";

const SECTION_META: Record<AttendanceSummarySection, { title: string; subtitle: string }> = {
  "battalion-1":    { title: "Battalion 1 — Male", subtitle: "View attendance for Battalion 1 (Male) cadets." },
  "battalion-2":    { title: "Battalion 2 — Female", subtitle: "View attendance for Battalion 2 (Female) cadets." },
  "advance-course": { title: "Advance Course", subtitle: "View attendance for advance course cadets." },
};

interface Props {
  section: AttendanceSummarySection;
}

export default function ROTCAttendanceSummary({ section }: Props) {
  const meta = SECTION_META[section];
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [recordMap, setRecordMap] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const { roster, isLoading: rosterLoading } = useROTCPlatoonRoster();

  useEffect(() => {
    setLoadingSessions(true);
    setSelectedSessionId(null);
    setRecordMap(new Map());
    adminService.getAttendanceSessionsByDate("ROTC", selectedDate).then((data) => {
      setSessions(data);
      if (data.length > 0) setSelectedSessionId(data[0].id);
      setLoadingSessions(false);
    }).catch(() => setLoadingSessions(false));
  }, [selectedDate]);

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

  const isLoading = rosterLoading || loadingSessions || loadingRecords;
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;
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

      {/* Date picker + session selector */}
      <div className="flex items-end gap-3 flex-wrap mb-5">
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        {sessions.length > 1 && (
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Session</label>
            <div className="relative">
              <select
                value={selectedSessionId ?? ""}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {sessions.map((s, i) => {
                  const openTime = new Date(s.openDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                  const closeTime = new Date(s.closeDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                  return (
                    <option key={s.id} value={s.id}>
                      Session {i + 1} — {openTime} to {closeTime}
                    </option>
                  );
                })}
              </select>
              <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading attendance data...</p>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-500">No ROTC attendance session on this date.</p>
          <p className="text-xs text-gray-400 mt-1">Select a different date to view attendance records.</p>
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
            />
          )}
          {section === "advance-course" && (
            <AdvanceCourseAttendanceBox
              students={advanceCourseStudents}
              recordMap={recordMap}
              graceOver={graceOver}
              sessionCloseDate={selectedSession?.closeDate ?? null}
            />
          )}
        </div>
      )}
    </AdminPageLayout>
  );
}
