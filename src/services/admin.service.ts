import {
  CWTSCompany, CWTS_COMPANIES,
  EnrollmentDocument, EnrollmentWithMs, EnrollmentSchedule, EnrollmentStatus, NSTProgram,
  StudentMsRecord,
  ROTCBattalion, ROTCCompany, ROTCPlatoon,
  ROTC_PLATOONS_PER_COMPANY, ROTC_PLATOON_SLOT_LIMIT,
  SpecialUnit,
  AttendanceLocation, AttendanceSession,
  AttendanceRecord, AttendanceRecordStatus, StudentGrade, AttendanceOffense,
} from "@/types";

async function rpc(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch("/api/rpc/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error ?? "RPC call failed");
  return body.result;
}

export const adminService = {

  /* ---------- Enrollment ---------- */

  async getEnrollmentsByProgram(program: NSTProgram): Promise<EnrollmentWithMs[]> {
    return (await rpc("getEnrollmentsByProgram", { program })) as EnrollmentWithMs[];
  },

  async getEnrollmentSchedule(program: NSTProgram, msLevel: string): Promise<EnrollmentSchedule | null> {
    return (await rpc("getEnrollmentSchedule", { program, msLevel })) as EnrollmentSchedule | null;
  },

  async getEnrollmentSchedules(program: NSTProgram): Promise<EnrollmentSchedule[]> {
    return (await rpc("getEnrollmentSchedules", { program })) as EnrollmentSchedule[];
  },

  async saveEnrollmentSchedule(schedule: EnrollmentSchedule): Promise<void> {
    await rpc("saveEnrollmentSchedule", { schedule });
  },

  async updateEnrollmentStatus(
    uid: string,
    status: EnrollmentStatus,
    rejectionReason?: string,
    options?: { resetRotcAssignments?: boolean },
  ): Promise<void> {
    await rpc("updateEnrollmentStatus", { uid, status, rejectionReason, options });
  },

  async getApprovedEnrollmentsByProgram(program: NSTProgram): Promise<EnrollmentWithMs[]> {
    return (await rpc("getApprovedEnrollmentsByProgram", { program })) as EnrollmentWithMs[];
  },

  async updateEnrollmentFields(uid: string, fields: Partial<EnrollmentDocument>): Promise<void> {
    await rpc("updateEnrollmentFields", { uid, fields });
  },

  /* ---------- CWTS ---------- */

  async getNextAvailableCWTSCompany(): Promise<CWTSCompany | null> {
    return (await rpc("getNextAvailableCWTSCompany")) as CWTSCompany | null;
  },

  async getCWTSCompanyCounts(): Promise<Record<CWTSCompany, EnrollmentWithMs[]>> {
    return (await rpc("getCWTSCompanyCounts")) as Record<CWTSCompany, EnrollmentWithMs[]>;
  },

  async approveCWTSEnrollment(uid: string): Promise<CWTSCompany | null> {
    return (await rpc("approveCWTSEnrollment", { uid })) as CWTSCompany | null;
  },

  /* ---------- ROTC ---------- */

  async getROTCApprovedEnrollments(msLevel: "1" | "2" = "2"): Promise<EnrollmentWithMs[]> {
    return (await rpc("getROTCApprovedEnrollments", { msLevel })) as EnrollmentWithMs[];
  },

  async assignROTCPlatoons(msLevel: "1" | "2" = "2"): Promise<{ assigned: number; alreadyAssigned: number }> {
    return (await rpc("assignROTCPlatoons", { msLevel })) as { assigned: number; alreadyAssigned: number };
  },

  buildROTCSlotCounts(
    assigned: EnrollmentWithMs[],
    companies: ROTCCompany[],
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const c of companies) {
      for (let p = 1; p <= ROTC_PLATOONS_PER_COMPANY; p++) {
        counts[`${c}-${p}`] = 0;
      }
    }
    for (const e of assigned) {
      const key = `${e.rotcCompany}-${e.rotcPlatoon}`;
      if (counts[key] !== undefined) counts[key]++;
    }
    return counts;
  },

  computeROTCAssignments(
    cadets: EnrollmentWithMs[],
    battalion: ROTCBattalion,
    companies: ROTCCompany[],
    slotCounts: Record<string, number>,
  ): { uid: string; battalion: ROTCBattalion; rotcCompany: ROTCCompany; rotcPlatoon: ROTCPlatoon }[] {
    const results: { uid: string; battalion: ROTCBattalion; rotcCompany: ROTCCompany; rotcPlatoon: ROTCPlatoon }[] = [];
    let companyIdx = 0;
    let platoonNum = 1;

    while (companyIdx < companies.length) {
      const key = `${companies[companyIdx]}-${platoonNum}`;
      if ((slotCounts[key] ?? 0) < ROTC_PLATOON_SLOT_LIMIT) break;
      platoonNum++;
      if (platoonNum > ROTC_PLATOONS_PER_COMPANY) {
        platoonNum = 1;
        companyIdx++;
      }
    }

    for (const cadet of cadets) {
      if (companyIdx >= companies.length) break;
      results.push({
        uid: cadet.uid,
        battalion,
        rotcCompany: companies[companyIdx],
        rotcPlatoon: platoonNum as ROTCPlatoon,
      });
      const key = `${companies[companyIdx]}-${platoonNum}`;
      slotCounts[key] = (slotCounts[key] ?? 0) + 1;
      if (slotCounts[key] >= ROTC_PLATOON_SLOT_LIMIT) {
        platoonNum++;
        if (platoonNum > ROTC_PLATOONS_PER_COMPANY) {
          platoonNum = 1;
          companyIdx++;
        }
      }
    }

    return results;
  },

  async getROTCRosterGrouped(msLevel: "1" | "2" = "2"): Promise<{
    battalion1: Record<ROTCCompany, Record<number, EnrollmentWithMs[]>>;
    battalion2: Record<ROTCCompany, Record<number, EnrollmentWithMs[]>>;
    advanceCourseMale: EnrollmentWithMs[];
    advanceCourseFemale: EnrollmentWithMs[];
  }> {
    return (await rpc("getROTCRosterGrouped", { msLevel })) as {
      battalion1: Record<ROTCCompany, Record<number, EnrollmentWithMs[]>>;
      battalion2: Record<ROTCCompany, Record<number, EnrollmentWithMs[]>>;
      advanceCourseMale: EnrollmentWithMs[];
      advanceCourseFemale: EnrollmentWithMs[];
    };
  },

  async getSpecialUnitEnrollments(msLevel: "1" | "2" = "2"): Promise<Record<SpecialUnit, EnrollmentWithMs[]>> {
    return (await rpc("getSpecialUnitEnrollments", { msLevel })) as Record<SpecialUnit, EnrollmentWithMs[]>;
  },

  async getSpecialUnitCount(unit: SpecialUnit, msLevel: "1" | "2" = "2"): Promise<number> {
    return (await rpc("getSpecialUnitCount", { unit, msLevel })) as number;
  },

  async approveWithSpecialUnit(uid: string, specialUnit: SpecialUnit): Promise<string | null> {
    return (await rpc("approveWithSpecialUnit", { uid, specialUnit })) as string | null;
  },

  /* ---------- Attendance ---------- */

  async getSessionsByProgram(program: NSTProgram, isAdvanceCourse?: boolean): Promise<AttendanceSession[]> {
    return (await rpc("getSessionsByProgram", { program, isAdvanceCourse })) as AttendanceSession[];
  },

  async getSessionsByProgramForCycle(
    program: NSTProgram,
    options: { isAdvanceCourse?: boolean; msLevel?: "1" | "2"; schoolYear?: string },
  ): Promise<AttendanceSession[]> {
    return (await rpc("getSessionsByProgramForCycle", { program, options })) as AttendanceSession[];
  },

  async getAllAttendanceSessions(): Promise<AttendanceSession[]> {
    return (await rpc("getAllAttendanceSessions")) as AttendanceSession[];
  },

  async createAttendanceSession(data: {
    program: NSTProgram;
    msLevel?: "1" | "2";
    schoolYear?: string;
    isAdvanceCourse?: boolean;
    miNumber?: number;
    miType?: "in" | "out";
    openDate: string;
    closeDate: string;
    location: AttendanceLocation;
    createdBy: string;
  }): Promise<string> {
    return (await rpc("createAttendanceSession", { data })) as string;
  },

  async autoCloseExpiredSessions(): Promise<number> {
    return (await rpc("autoCloseExpiredSessions")) as number;
  },

  async markAbsentStudents(
    sessionId: string,
    program: string,
    isAdvanceCourse?: boolean,
    miNumber?: number,
    miType?: "in" | "out",
  ): Promise<void> {
    await rpc("markAbsentStudents", { sessionId, program, isAdvanceCourse, miNumber, miType });
  },

  async getSessionAttendanceRecords(sessionId: string): Promise<(AttendanceRecord & { student?: EnrollmentWithMs })[]> {
    return (await rpc("getSessionAttendanceRecords", { sessionId })) as (AttendanceRecord & { student?: EnrollmentWithMs })[];
  },

  async getAttendanceSummary(sessionId: string, program: string): Promise<{
    records: (AttendanceRecord & { student?: EnrollmentWithMs })[];
    enrolledStudents: EnrollmentWithMs[];
  }> {
    return (await rpc("getAttendanceSummary", { sessionId, program })) as {
      records: (AttendanceRecord & { student?: EnrollmentWithMs })[];
      enrolledStudents: EnrollmentWithMs[];
    };
  },

  async getAttendanceSessionsByDate(program: string, date: string): Promise<AttendanceSession[]> {
    return (await rpc("getAttendanceSessionsByDate", { program, date })) as AttendanceSession[];
  },

  async updateAttendanceStatus(recordId: string, newStatus: AttendanceRecordStatus): Promise<void> {
    await rpc("updateAttendanceStatus", { recordId, newStatus });
  },

  /* ---------- Grades ---------- */

  async getStudentGradesByMs(msLevel: "ms1" | "ms2", program: NSTProgram): Promise<Map<string, StudentGrade>> {
    const obj = (await rpc("getStudentGradesByMs", { msLevel, program })) as Record<string, StudentGrade>;
    return new Map(Object.entries(obj));
  },

  async saveStudentGrade(
    uid: string,
    program: NSTProgram,
    msLevel: "ms1" | "ms2",
    grade: number,
    midterm?: number,
    finalTerm?: number,
  ): Promise<void> {
    await rpc("saveStudentGrade", { uid, program, msLevel, grade, midterm, finalTerm });
  },

  async saveStudentGradesBatch(
    updates: { uid: string; program: NSTProgram; msLevel: "ms1" | "ms2"; grade: number }[],
  ): Promise<void> {
    await rpc("saveStudentGradesBatch", { updates });
  },

  async getStudentGrades(studentUid: string): Promise<{ ms1?: StudentGrade; ms2?: StudentGrade }> {
    return (await rpc("getStudentGrades", { studentUid })) as { ms1?: StudentGrade; ms2?: StudentGrade };
  },

  /* ---------- Offenses ---------- */

  async getAllAttendanceOffenses(): Promise<(AttendanceOffense & { student?: EnrollmentWithMs })[]> {
    return (await rpc("getAllAttendanceOffenses")) as (AttendanceOffense & { student?: EnrollmentWithMs })[];
  },

  async getAttendanceOffense(uid: string): Promise<AttendanceOffense | null> {
    return (await rpc("getAttendanceOffense", { uid })) as AttendanceOffense | null;
  },

  async recordAttendanceOffense(uid: string): Promise<AttendanceOffense> {
    return (await rpc("recordAttendanceOffense", { uid })) as AttendanceOffense;
  },

  async settleAttendanceOffense(uid: string): Promise<void> {
    await rpc("settleAttendanceOffense", { uid });
  },

  /* ---------- Student attendance records ---------- */

  async getStudentAttendanceRecords(studentUid: string): Promise<AttendanceRecord[]> {
    return (await rpc("getStudentAttendanceRecords", { studentUid })) as AttendanceRecord[];
  },

  async getStudentAttendanceRecordsForCycle(
    studentUid: string,
    program: NSTProgram,
    msLevel: "1" | "2",
    schoolYear: string,
  ): Promise<AttendanceRecord[]> {
    return (await rpc("getStudentAttendanceRecordsForCycle", { studentUid, program, msLevel, schoolYear })) as AttendanceRecord[];
  },

  /* ---------- Serial numbers & signatories ---------- */

  async saveSignatorySettings(program: NSTProgram, settings: Record<string, string | null>): Promise<void> {
    await rpc("saveSignatorySettings", { program, settings });
  },

  async getSignatorySettings(program: NSTProgram): Promise<Record<string, string> | null> {
    return (await rpc("getSignatorySettings", { program })) as Record<string, string> | null;
  },

  async saveSerialNumber(
    uid: string,
    serialNumber: string,
    program: NSTProgram,
    signatories: Record<string, string>,
  ): Promise<void> {
    await rpc("saveSerialNumber", { uid, serialNumber, program, signatories });
  },

  async getSerialNumbersByProgram(
    program: NSTProgram,
  ): Promise<Map<string, { serialNumber: string; createdAt: string; [key: string]: string | undefined }>> {
    const obj = (await rpc("getSerialNumbersByProgram", { program })) as Record<
      string,
      { serialNumber: string; createdAt: string; [key: string]: string | undefined }
    >;
    return new Map(Object.entries(obj));
  },
};
