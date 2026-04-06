"use client";

import { useEffect, useState } from "react";
import StudentPageLayout from "@/components/layout/StudentPageLayout";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { studentService } from "@/services/student.service";
import { AttendanceSession } from "@/types";
import NoProgramCard from "./component/NoProgramCard";
import NotApprovedCard from "./component/NotApprovedCard";
import NoAttendanceCard from "./component/NoAttendanceCard";
import AttendanceCard from "./component/AttendanceCard";

export default function AttendancePage() {
  const { profile, authLoading, dataLoading } = useStudentProfile();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    studentService.getAttendanceSessions().then((data) => {
      setSessions(data);
      setLoadingSessions(false);
    }).catch(() => setLoadingSessions(false));
  }, []);

  const isLoading = authLoading || dataLoading || loadingSessions;
  const enrollmentStatus = profile?.status || "";
  const isApproved = enrollmentStatus === "approved";
  const studentProgram = profile?.nstpComponent || "";
  const hasProgram = studentProgram === "ROTC" || studentProgram === "CWTS";

  const matchingSession = hasProgram
    ? sessions
        .filter((s) => s.program === studentProgram)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
    : null;

  if (isLoading) {
    return (
      <StudentPageLayout>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading attendance...</p>
          </div>
        </div>
      </StudentPageLayout>
    );
  }

  return (
    <StudentPageLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance</h1>
            <p className="text-sm text-gray-500 mt-0.5">Check in to your active attendance session.</p>
          </div>
        </div>
      </div>

      <div className="max-w-md">
        {!hasProgram && <NoProgramCard />}

        {hasProgram && !isApproved && (
          <NotApprovedCard status={enrollmentStatus} />
        )}

        {hasProgram && isApproved && !matchingSession && (
          <NoAttendanceCard program={studentProgram} />
        )}

        {hasProgram && isApproved && matchingSession && (
          <AttendanceCard session={matchingSession} />
        )}
      </div>
    </StudentPageLayout>
  );
}
