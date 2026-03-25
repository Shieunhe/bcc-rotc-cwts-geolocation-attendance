"use client";

import { useState, useEffect } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import Button from "@/components/common/Button";
import { NSTProgram } from "@/types";
import { useEnrollmentSchedule } from "@/hooks/useEnrollmentSchedule";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getScheduleStatus(openDate: string, deadline: string): { label: string; className: string; dot: string } {
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

interface AdminEnrollmentScheduleProps {
  program: NSTProgram;
}

export default function AdminEnrollmentSchedule({ program }: AdminEnrollmentScheduleProps) {
  const { schedule, isLoading, save, isSaving } = useEnrollmentSchedule(program);
  const [openDate, setOpenDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (schedule) {
      setOpenDate(schedule.openDate);
      setDeadline(schedule.deadline);
    }
  }, [schedule]);

  const hasChanges = openDate !== (schedule?.openDate ?? "") || deadline !== (schedule?.deadline ?? "");
  const isValid = openDate !== "" && deadline !== "" && new Date(deadline) > new Date(openDate);
  const status = getScheduleStatus(schedule?.openDate ?? "", schedule?.deadline ?? "");
  const daysRemaining = getDaysRemaining(schedule?.deadline ?? "");

  async function handleSave() {
    if (!isValid) return;
    setSuccess(false);
    await save({ program, openDate, deadline, updatedAt: "" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (isLoading) {
    return (
      <AdminPageLayout program={program}>
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading schedule...</p>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout program={program}>
      <div className="max-w-2xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{program} Enrollment Schedule</h1>
            <p className="text-sm text-gray-500 mt-1">Set the enrollment open date and deadline.</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${status.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Current schedule overview */}
        {schedule && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 tracking-wide mb-4">Current Schedule</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Opens on</p>
                <p className="text-base font-semibold text-gray-800">{formatDisplayDate(schedule.openDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Deadline</p>
                <p className="text-base font-semibold text-gray-800">{formatDisplayDate(schedule.deadline)}</p>
              </div>
            </div>
            {daysRemaining && (
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">{daysRemaining}</p>
            )}
          </div>
        )}

        {/* Edit form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <p className="text-xs font-semibold text-gray-400 tracking-wide">
            {schedule ? "Update Schedule" : "Set Schedule"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Open Date</label>
              <input
                type="date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={openDate || undefined}
                className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {openDate && deadline && new Date(deadline) <= new Date(openDate) && (
            <p className="text-xs text-red-500 font-medium">Deadline must be after the open date.</p>
          )}

          {success && (
            <p className="text-xs text-green-600 font-medium">Schedule saved successfully.</p>
          )}

          <Button
            onClick={handleSave}
            disabled={!isValid || !hasChanges}
            loading={isSaving}
            fullWidth
            className="!py-2.5 !text-sm"
          >
            {schedule ? "Update Schedule" : "Save Schedule"}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  );
}
