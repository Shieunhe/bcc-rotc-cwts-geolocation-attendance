"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { AttendanceSession } from "@/types";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import ROTCAttendanceBox from "./component/ROTCAttendanceBox";
import AdvanceCourseAttendanceBox from "./component/AdvanceCourseAttendanceBox";
import CWTSAttendanceBox from "./component/CWTSAttendanceBox";

export type ViewAttendanceSection = "rotc" | "cwts" | "advance-course" | "special-platoon";

const SECTION_META: Record<ViewAttendanceSection, { title: string; subtitle: string }> = {
  rotc:              { title: "ROTC Attendance", subtitle: "Review ROTC attendance sessions and student records." },
  cwts:              { title: "CWTS Attendance", subtitle: "Review CWTS attendance sessions and student records." },
  "advance-course":  { title: "Advance Course Attendance", subtitle: "Review advance course attendance sessions and student records." },
  "special-platoon": { title: "ROTC Attendance", subtitle: "Review ROTC attendance sessions and student records." },
};

interface Props {
  section: ViewAttendanceSection;
}

export default function OfficerViewAttendance({ section }: Props) {
  const meta = SECTION_META[section];
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdvance = section === "advance-course";
    const program = section === "cwts" ? "CWTS" : "ROTC";
    adminService.getSessionsByProgram(program, isAdvance || undefined).then((data) => {
      setSessions(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [section]);

  return (
    <>
      <PageIntroPanel
        title={meta.title}
        subtitle={meta.subtitle}
        variant="sky"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading sessions...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(section === "rotc" || section === "special-platoon") && <ROTCAttendanceBox sessions={sessions} />}
          {section === "advance-course" && <AdvanceCourseAttendanceBox sessions={sessions} />}
          {section === "cwts" && <CWTSAttendanceBox sessions={sessions} />}
        </div>
      )}
    </>
  );
}
