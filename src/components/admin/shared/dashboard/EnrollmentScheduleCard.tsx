import Link from "next/link";
import { NSTProgram } from "@/types";
import { useEnrollmentSchedule } from "@/hooks/useEnrollmentSchedule";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getStatus(openDate: string, deadline: string): { label: string; className: string; dot: string } {
  if (!openDate || !deadline) return { label: "Not Set", className: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" };
  const now = new Date();
  const open = new Date(openDate);
  const end = new Date(deadline);
  if (now < open) return { label: "Upcoming", className: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" };
  if (now >= open && now <= end) return { label: "Open", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" };
  return { label: "Closed", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" };
}

interface EnrollmentScheduleCardProps {
  base: string;
  program: NSTProgram;
}

export default function EnrollmentScheduleCard({ base, program }: EnrollmentScheduleCardProps) {
  const { schedules, isLoading } = useEnrollmentSchedule(program);
  const schedule = schedules.find((s) => {
    const st = getStatus(s.openDate, s.deadline);
    return st.label === "Open";
  }) ?? schedules[0] ?? null;
  const status = getStatus(schedule?.openDate ?? "", schedule?.deadline ?? "");

  return (
    <Link href={`${base}/enrollment-schedule`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Enrollment Schedule</p>
      {isLoading ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
          Loading...
        </span>
      ) : schedule ? (
        <div className="space-y-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${status.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <p className="text-xs text-gray-500">{formatDate(schedule.openDate)} — {formatDate(schedule.deadline)}</p>
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
          Not set
        </span>
      )}
      <p className="text-xs text-gray-500 mt-2">Tap to manage {program} enrollment period.</p>
    </Link>
  );
}
