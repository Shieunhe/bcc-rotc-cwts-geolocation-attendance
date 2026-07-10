"use client";

import { useRef, useState } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import Button from "@/components/common/Button";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import { EnrollmentSchedule, MSLevel, NSTProgram } from "@/types";
import { useEnrollmentSchedule } from "@/hooks/useEnrollmentSchedule";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => pad2(i));
const PERIOD_OPTIONS = ["AM", "PM"] as const;

function pad2(value: number | string) {
  return String(value).padStart(2, "0");
}

function to12HourParts(dateStr: string) {
  const date = new Date(dateStr);
  const rawHours = date.getHours();
  const period = rawHours >= 12 ? "PM" : "AM";
  const hour12 = rawHours % 12 || 12;
  return {
    hour: String(hour12),
    minute: pad2(date.getMinutes()),
    period,
  };
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const { hour, minute, period } = to12HourParts(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} | ${hour}:${minute} ${period}`;
}

function buildDateTimeString(date: string, hour: string, minute: string, period: "AM" | "PM") {
  if (!date) return "";
  let hour24 = parseInt(hour, 10) % 12;
  if (period === "PM") hour24 += 12;
  return `${date}T${pad2(hour24)}:${minute}:00`;
}

type ScheduleStatusLabel = "Not Set" | "Upcoming" | "Open" | "Closed";

function getScheduleStatus(openDate: string, deadline: string): { label: ScheduleStatusLabel; className: string; dot: string } {
  if (!openDate || !deadline) return { label: "Not Set", className: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" };
  const now = new Date();
  const open = new Date(openDate);
  const end = new Date(deadline);
  if (now < open) return { label: "Upcoming", className: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" };
  if (now >= open && now <= end) return { label: "Open", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" };
  return { label: "Closed", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" };
}

function getDaysRemaining(deadline: string): string | null {
  if (!deadline) return null;
  const now = new Date();
  const end = new Date(deadline);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Deadline passed";
  if (diff === 0) return "Deadline is today";
  if (diff === 1) return "1 day remaining";
  return `${diff} days remaining`;
}

const inputClass = "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

interface AdminEnrollmentScheduleProps {
  program: NSTProgram;
}

const currentYear = new Date().getFullYear();

export default function AdminEnrollmentSchedule({ program }: AdminEnrollmentScheduleProps) {
  const { schedules, isLoading, save, isSaving } = useEnrollmentSchedule(program);
  const isCWTS = program === "CWTS";
  const levelLabel = isCWTS ? "CWTS Level" : "MS Level";
  const levelPrefix = isCWTS ? "CWTS" : "MS";
  const sequenceLabel = isCWTS ? "CWTS 1 to CWTS 2" : "MS 1 to MS 2";

  const [showForm, setShowForm] = useState(false);
  const [formMs, setFormMs] = useState<MSLevel>("1");
  const [formYear, setFormYear] = useState(`${currentYear}-${currentYear + 1}`);
  const [formOpenDate, setFormOpenDate] = useState("");
  const [formOpenHour, setFormOpenHour] = useState("8");
  const [formOpenMinute, setFormOpenMinute] = useState("00");
  const [formOpenPeriod, setFormOpenPeriod] = useState<"AM" | "PM">("AM");
  const [formDeadlineDate, setFormDeadlineDate] = useState("");
  const [formDeadlineHour, setFormDeadlineHour] = useState("5");
  const [formDeadlineMinute, setFormDeadlineMinute] = useState("00");
  const [formDeadlinePeriod, setFormDeadlinePeriod] = useState<"AM" | "PM">("PM");
  const [success, setSuccess] = useState(false);

  const formOpen = buildDateTimeString(formOpenDate, formOpenHour, formOpenMinute, formOpenPeriod);
  const formDeadline = buildDateTimeString(formDeadlineDate, formDeadlineHour, formDeadlineMinute, formDeadlinePeriod);

  const activeSchedules = schedules.filter((s) => {
    const status = getScheduleStatus(s.openDate, s.deadline);
    return status.label === "Open" || status.label === "Upcoming";
  });

  const closedSchedules = schedules
    .filter((s) => getScheduleStatus(s.openDate, s.deadline).label === "Closed")
    .sort((a, b) => {
      const yearDiff = (b.year || "0").localeCompare(a.year || "0");
      if (yearDiff !== 0) return yearDiff;
      return a.msLevel.localeCompare(b.msLevel);
    });

  const hasActiveSchedule = activeSchedules.length > 0;

  function getNextMsAndYear(): { ms: MSLevel; year: string } {
    if (schedules.length === 0) return { ms: "1", year: `${currentYear}-${currentYear + 1}` };

    const sorted = [...schedules].sort((a, b) => {
      const yearDiff = (b.year || "0").localeCompare(a.year || "0");
      if (yearDiff !== 0) return yearDiff;
      return b.msLevel.localeCompare(a.msLevel);
    });

    const latest = sorted[0];
    const latestYearStart = parseInt(latest.year?.split("-")[0] || `${currentYear}`, 10);
    if (latest.msLevel === "1") {
      return { ms: "2", year: latest.year };
    }

    const nextYearStart = latestYearStart + 1;
    return { ms: "1", year: `${nextYearStart}-${nextYearStart + 1}` };
  }

  function openCreate() {
    const next = getNextMsAndYear();
    setFormMs(next.ms);
    setFormYear(next.year);
    setFormOpenDate("");
    setFormDeadlineDate("");
    setFormOpenHour("8");
    setFormOpenMinute("00");
    setFormOpenPeriod("AM");
    setFormDeadlineHour("5");
    setFormDeadlineMinute("00");
    setFormDeadlinePeriod("PM");
    setShowForm(true);
    setSuccess(false);
  }

  function closeForm() {
    setShowForm(false);
  }

  const duplicateExists = schedules.some((s) => s.msLevel === formMs && s.year === formYear);
  const isValid =
    formOpen !== "" &&
    formDeadline !== "" &&
    formYear !== "" &&
    new Date(formDeadline).getTime() > new Date(formOpen).getTime() &&
    !duplicateExists;

  async function handleSave() {
    if (!isValid) return;
    setSuccess(false);
    await save({
      program,
      msLevel: formMs,
      year: formYear,
      openDate: formOpen,
      deadline: formDeadline,
      updatedAt: "",
    });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      closeForm();
    }, 1500);
  }

  if (isLoading) {
    return (
      <AdminPageLayout program={program}>
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading schedules...</p>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout program={program}>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageIntroPanel
          title={`${program} Enrollment Schedule`}
          subtitle={`Manage enrollment schedules per ${isCWTS ? "CWTS level" : "MS level"} and school year.`}
          variant={program === "CWTS" ? "emerald" : "sky"}
          actions={!showForm ? (
            <button
              onClick={hasActiveSchedule ? undefined : openCreate}
              disabled={hasActiveSchedule}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm ${
                hasActiveSchedule
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : program === "CWTS"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Schedule
            </button>
          ) : undefined}
        />

        {hasActiveSchedule && !showForm && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium text-amber-700">
              You cannot create a new schedule while there is an active (open or upcoming) enrollment. Wait until the current schedule is closed.
            </p>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Current Enrollment</h2>
          </div>
          {activeSchedules.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activeSchedules.map((s) => (
                <ScheduleCard key={`${s.msLevel}_${s.year}`} label={`${levelPrefix} ${s.msLevel} - SY ${s.year || "N/A"}`} schedule={s} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
              <p className="text-sm font-medium text-gray-400">No active enrollment schedule.</p>
              <p className="mt-1 text-xs text-gray-300">Create a new schedule to open enrollment.</p>
            </div>
          )}
        </div>

        {showForm && (
          <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">Create New Schedule</p>
              <button onClick={closeForm} className="text-gray-400 transition hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{levelLabel}</label>
                <select value={formMs} disabled className={inputClass + " cursor-not-allowed bg-gray-50 text-gray-400"}>
                  <option value={formMs}>{levelPrefix} {formMs}</option>
                </select>
                <p className="mt-1 text-[10px] text-gray-400">Auto-determined by sequence ({sequenceLabel})</p>
              </div>
              <div>
                <label className={labelClass}>School Year</label>
                <select value={formYear} disabled className={inputClass + " cursor-not-allowed bg-gray-50 text-gray-400"}>
                  <option value={formYear}>SY {formYear}</option>
                </select>
                <p className="mt-1 text-[10px] text-gray-400">Auto-determined by sequence</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateTimePicker
                label="Open Date & Time"
                dateValue={formOpenDate}
                hourValue={formOpenHour}
                minuteValue={formOpenMinute}
                periodValue={formOpenPeriod}
                onDateChange={setFormOpenDate}
                onHourChange={setFormOpenHour}
                onMinuteChange={setFormOpenMinute}
                onPeriodChange={setFormOpenPeriod}
              />
              <DateTimePicker
                label="Deadline Date & Time"
                dateValue={formDeadlineDate}
                hourValue={formDeadlineHour}
                minuteValue={formDeadlineMinute}
                periodValue={formDeadlinePeriod}
                onDateChange={setFormDeadlineDate}
                onHourChange={setFormDeadlineHour}
                onMinuteChange={setFormDeadlineMinute}
                onPeriodChange={setFormDeadlinePeriod}
                min={formOpenDate || undefined}
              />
            </div>

            {duplicateExists && (
              <p className="text-xs font-medium text-red-500">A schedule for {levelPrefix} {formMs} - SY {formYear} already exists.</p>
            )}

            {formOpen && formDeadline && new Date(formDeadline).getTime() <= new Date(formOpen).getTime() && (
              <p className="text-xs font-medium text-red-500">Deadline must be after the open date and time.</p>
            )}

            {success && (
              <p className="text-xs font-medium text-green-600">Schedule saved successfully.</p>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={closeForm} fullWidth className="!py-2.5 !text-sm">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isValid} loading={isSaving} fullWidth className="!py-2.5 !text-sm">
                Create Schedule
              </Button>
            </div>
          </div>
        )}

        {closedSchedules.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Past Schedules</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {closedSchedules.map((s) => (
                <ScheduleCard key={`${s.msLevel}_${s.year}`} label={`${levelPrefix} ${s.msLevel} - SY ${s.year || "N/A"}`} schedule={s} />
              ))}
            </div>
          </div>
        )}

        {schedules.length === 0 && !showForm && (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-400">No schedules created yet.</p>
            <p className="mt-1 text-xs text-gray-400">Click &quot;Create Schedule&quot; to get started.</p>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}

function formatDateValue(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

function DateTimePicker({
  label,
  dateValue,
  hourValue,
  minuteValue,
  periodValue,
  onDateChange,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
  min,
}: {
  label: string;
  dateValue: string;
  hourValue: string;
  minuteValue: string;
  periodValue: "AM" | "PM";
  onDateChange: (v: string) => void;
  onHourChange: (v: string) => void;
  onMinuteChange: (v: string) => void;
  onPeriodChange: (v: "AM" | "PM") => void;
  min?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    try {
      inputRef.current?.showPicker();
    } catch {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      <div onClick={openPicker} className={inputClass + " flex cursor-pointer items-center justify-between"}>
        <span className="text-sm text-gray-900">
          {dateValue ? formatDateValue(dateValue) : <span className="text-gray-400">Select date</span>}
        </span>
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="date"
        value={dateValue}
        onChange={(e) => onDateChange(e.target.value)}
        min={min}
        className="sr-only"
        tabIndex={-1}
      />
      <div className="grid grid-cols-3 gap-2">
        <select value={hourValue} onChange={(e) => onHourChange(e.target.value)} className={inputClass}>
          {HOUR_OPTIONS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <select value={minuteValue} onChange={(e) => onMinuteChange(e.target.value)} className={inputClass}>
          {MINUTE_OPTIONS.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
        <select value={periodValue} onChange={(e) => onPeriodChange(e.target.value as "AM" | "PM")} className={inputClass}>
          {PERIOD_OPTIONS.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ScheduleCard({ label, schedule }: { label: string; schedule: EnrollmentSchedule }) {
  const status = getScheduleStatus(schedule.openDate, schedule.deadline);
  const daysRemaining = getDaysRemaining(schedule.deadline);
  const isClosed = status.label === "Closed";

  return (
    <div className={`space-y-3 rounded-2xl border p-5 shadow-sm ${isClosed ? "border-gray-200 bg-gray-50" : "border-gray-100 bg-white"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-bold ${isClosed ? "text-gray-500" : "text-gray-800"}`}>{label}</p>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Opens</p>
          <p className={`mt-0.5 text-sm font-semibold ${isClosed ? "text-gray-500" : "text-gray-800"}`}>{formatDisplayDate(schedule.openDate)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Deadline</p>
          <p className={`mt-0.5 text-sm font-semibold ${isClosed ? "text-gray-500" : "text-gray-800"}`}>{formatDisplayDate(schedule.deadline)}</p>
        </div>
      </div>

      {daysRemaining && !isClosed && (
        <p className="border-t border-gray-100 pt-2 text-[10px] text-gray-500">{daysRemaining}</p>
      )}
    </div>
  );
}
