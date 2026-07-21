"use client";

import { useEffect, useState } from "react";
import StudentPageLayout from "@/components/layout/StudentPageLayout";
import PageIntroPanel from "@/components/common/PageIntroPanel";
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

  const isAdvanceCourse = studentProgram === "ROTC" && !!profile?.willingToTakeAdvanceCourse;
  const hasSerialNumber = !!profile?.serialNumber;

  const matchingSession = hasProgram
    ? sessions
        .filter((s) => {
          if (s.program !== studentProgram) return false;
          if (studentProgram === "ROTC") {
            return isAdvanceCourse ? !!s.isAdvanceCourse : !s.isAdvanceCourse;
          }
          return true;
        })
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
      <PageIntroPanel
        title="Attendance"
        subtitle="Check in to your active attendance session."
        variant="sky"
      />

      <div className="max-w-md">
        {hasSerialNumber && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">You have graduated</h3>
            <p className="text-sm text-gray-500">
              You have been assigned a serial number and have completed the program. Attendance is no longer required.
            </p>
          </div>
        )}

        {!hasSerialNumber && !hasProgram && <NoProgramCard />}

        {!hasSerialNumber && hasProgram && !isApproved && (
          <NotApprovedCard status={enrollmentStatus} />
        )}

        {!hasSerialNumber && hasProgram && isApproved && !matchingSession && (
          <NoAttendanceCard program={studentProgram} />
        )}

        {!hasSerialNumber && hasProgram && isApproved && matchingSession && (
          <AttendanceCard session={matchingSession} />
        )}
      </div>
    </StudentPageLayout>
  );
}



