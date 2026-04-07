"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { AttendanceSession } from "@/types";
import ROTCAttendanceBox from "./component/ROTCAttendanceBox";
import CWTSAttendanceBox from "./component/CWTSAttendanceBox";

export default function OfficerViewAttendance() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllAttendanceSessions().then((data) => {
      setSessions(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const rotcSessions = sessions.filter((s) => s.program === "ROTC");
  const cwtsSessions = sessions.filter((s) => s.program === "CWTS");

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">View Attendance</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review ROTC and CWTS attendance sessions and student records.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading sessions...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ROTCAttendanceBox sessions={rotcSessions} />
          <CWTSAttendanceBox sessions={cwtsSessions} />
        </div>
      )}
    </>
  );
}
