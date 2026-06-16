"use client";

import { useRef, useState } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import Button from "@/components/common/Button";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import { EnrollmentSchedule, MSLevel, NSTProgram } from "@/types";
import { useEnrollmentSchedule } from "@/hooks/useEnrollmentSchedule";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${hh}:${mm}:${ss}`;
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
const SY_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const start = currentYear + i;
  return `${start}-${start + 1}`;
});

export default function AdminEnrollmentSchedule({ program }: AdminEnrollmentScheduleProps) {
  const { schedules, isLoading, save, isSaving } = useEnrollmentSchedule(program);

  const [showForm, setShowForm] = useState(false);
  const [formMs, setFormMs] = useState<MSLevel>("1");
  const [formYear, setFormYear] = useState(`${currentYear}-${currentYear + 1}`);
  const [formOpen, setFormOpen] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [success, setSuccess] = useState(false);

  const activeSchedules = schedules.filter((s) => {
    const status = getScheduleStatus(s.openDate, s.deadline);
    return status.label === "Open" || status.label === "Upcoming";
  });

  const closedSchedules = schedules
    .filter((s) => {
      const status = getScheduleStatus(s.openDate, s.deadline);
      return status.label === "Closed";
    })
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
    const nextYearStart = latestYearStart + 1;
    const nextMs: MSLevel = latest.msLevel === "1" ? "2" : "1";

    return { ms: nextMs, year: `${nextYearStart}-${nextYearStart + 1}` };
  }

  function openCreate() {
    const next = getNextMsAndYear();
    setFormMs(next.ms);
    setFormYear(next.year);
    setFormOpen("");
    setFormDeadline("");
    setShowForm(true);
    setSuccess(false);
  }

  function closeForm() {
    setShowForm(false);
  }

  const duplicateExists = schedules.some((s) => s.msLevel === formMs && s.year === formYear);
  const isValid = formOpen !== "" && formDeadline !== "" && formYear !== "" && new Date(formDeadline) >= new Date(formOpen) && !duplicateExists;

  async function handleSave() {
    if (!isValid) return;
    setSuccess(false);
    const openWithTime = `${formOpen}T00:00:00`;
    const deadlineWithTime = `${formDeadline}T23:59:59`;
    await save({ program, msLevel: formMs, year: formYear, openDate: openWithTime, deadline: deadlineWithTime, updatedAt: "" });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      closeForm();
    }, 1500);
  }

  if (isLoading) {
    return (
      <AdminPageLayout program={program}>
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading schedules...</p>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout program={program}>
      <div className="max-w-3xl w-full mx-auto space-y-6">
        <PageIntroPanel
          title={`${program} Enrollment Schedule`}
          subtitle="Manage enrollment schedules per MS level and school year."
          variant={program === "CWTS" ? "emerald" : "sky"}
          actions={!showForm ? (
            <button
              onClick={hasActiveSchedule ? undefined : openCreate}
              disabled={hasActiveSchedule}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm ${
                hasActiveSchedule
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : program === "CWTS"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Schedule
            </button>
          ) : undefined}
        />

        {hasActiveSchedule && !showForm && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-700 font-medium">
              You cannot create a new schedule while there is an active (open or upcoming) enrollment. Wait until the current schedule is closed.
            </p>
          </div>
        )}

        {/* Current / Active Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Current Enrollment</h2>
          </div>
          {activeSchedules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeSchedules.map((s) => (
                <ScheduleCard
                  key={`${s.msLevel}_${s.year}`}
                  label={`MS ${s.msLevel} — SY ${s.year || "N/A"}`}
                  schedule={s}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-400 font-medium">No active enrollment schedule.</p>
              <p className="text-xs text-gray-300 mt-1">Create a new schedule to open enrollment.</p>
            </div>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">Create New Schedule</p>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* MS Level + Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>MS Level</label>
                <select
                  value={formMs}
                  disabled
                  className={inputClass + " bg-gray-50 text-gray-400 cursor-not-allowed"}
                >
                  <option value={formMs}>MS {formMs}</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Auto-determined by sequence (MS 1 → MS 2)</p>
              </div>
              <div>
                <label className={labelClass}>School Year</label>
                <select
                  value={formYear}
                  disabled
                  className={inputClass + " bg-gray-50 text-gray-400 cursor-not-allowed"}
                >
                  <option value={formYear}>SY {formYear}</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Auto-determined by sequence</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateWithTime label="Open Date" value={formOpen} time="00:00:00" onChange={setFormOpen} />
              <DateWithTime label="Deadline" value={formDeadline} time="23:59:59" onChange={setFormDeadline} min={formOpen || undefined} />
            </div>

            {duplicateExists && (
              <p className="text-xs text-red-500 font-medium">A schedule for MS {formMs} — SY {formYear} already exists.</p>
            )}

            {formOpen && formDeadline && new Date(formDeadline) < new Date(formOpen) && (
              <p className="text-xs text-red-500 font-medium">Deadline must not be before the open date.</p>
            )}

            {success && (
              <p className="text-xs text-green-600 font-medium">Schedule saved successfully.</p>
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

        {/* Past / Closed Section */}
        {closedSchedules.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Past Schedules</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {closedSchedules.map((s) => (
                <ScheduleCard
                  key={`${s.msLevel}_${s.year}`}
                  label={`MS ${s.msLevel} — SY ${s.year || "N/A"}`}
                  schedule={s}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {schedules.length === 0 && !showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-400 font-medium">No schedules created yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click &quot;Create Schedule&quot; to get started.</p>
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

function DateWithTime({ label, value, time, onChange, min }: { label: string; value: string; time: string; onChange: (v: string) => void; min?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    try { inputRef.current?.showPicker(); } catch { inputRef.current?.focus(); }
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div
        onClick={openPicker}
        className={inputClass + " flex items-center justify-between cursor-pointer"}
      >
        <span className="text-sm text-gray-900">
          {value ? `${formatDateValue(value)} ${time}` : <span className="text-gray-400">Select date</span>}
        </span>
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}

function ScheduleCard({ label, schedule }: { label: string; schedule: EnrollmentSchedule }) {
  const status = getScheduleStatus(schedule.openDate, schedule.deadline);
  const daysRemaining = getDaysRemaining(schedule.deadline);
  const isClosed = status.label === "Closed";

  return (
    <div className={`rounded-2xl border shadow-sm p-5 space-y-3 ${isClosed ? "bg-gray-50 border-gray-200" : "bg-white border-gray-100"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-bold ${isClosed ? "text-gray-500" : "text-gray-800"}`}>{label}</p>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${status.className}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Opens</p>
          <p className={`text-sm font-semibold mt-0.5 ${isClosed ? "text-gray-500" : "text-gray-800"}`}>{formatDisplayDate(schedule.openDate)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Deadline</p>
          <p className={`text-sm font-semibold mt-0.5 ${isClosed ? "text-gray-500" : "text-gray-800"}`}>{formatDisplayDate(schedule.deadline)}</p>
        </div>
      </div>

      {daysRemaining && !isClosed && (
        <p className="text-[10px] text-gray-500 pt-2 border-t border-gray-100">{daysRemaining}</p>
      )}
    </div>
  );
}
