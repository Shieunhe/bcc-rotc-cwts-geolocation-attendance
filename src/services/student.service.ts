import type {
  EnrollmentWithMs,
  StudentMsRecord,
  AttendanceSession,
  AttendanceRecord,
  AttendanceRecordStatus,
  StudentGrade,
  AttendanceOffense,
} from "@/types";

async function rpc<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/api/rpc/student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `RPC ${method} failed`);
  }
  const data = await res.json();
  return data.result as T;
}

export const studentService = {
  async getProfile(uid: string): Promise<EnrollmentWithMs | null> {
    return rpc<EnrollmentWithMs | null>("getProfile", { uid });
  },

  async getStudentMsRecords(uid: string): Promise<StudentMsRecord[]> {
    return rpc<StudentMsRecord[]>("getStudentMsRecords", { uid });
  },

  async getAttendanceSessions(): Promise<AttendanceSession[]> {
    return rpc<AttendanceSession[]>("getAttendanceSessions");
  },

  async getAttendanceRecord(studentUid: string, attendanceSessionId: string): Promise<AttendanceRecord | null> {
    return rpc<AttendanceRecord | null>("getAttendanceRecord", { studentUid, attendanceSessionId });
  },

  async markAttendance(
    studentUid: string,
    attendanceSessionId: string,
    status: AttendanceRecordStatus,
    miNumber?: number,
    miType?: "in" | "out"
  ): Promise<void> {
    await rpc<void>("markAttendance", { studentUid, attendanceSessionId, status, miNumber, miType });
  },

  async getStudentGrades(uid: string): Promise<{ ms1: StudentGrade | null; ms2: StudentGrade | null }> {
    return rpc<{ ms1: StudentGrade | null; ms2: StudentGrade | null }>("getStudentGrades", { uid });
  },

  async getAttendanceOffense(uid: string): Promise<AttendanceOffense | null> {
    return rpc<AttendanceOffense | null>("getAttendanceOffense", { uid });
  },

  async acknowledgeWarning(uid: string): Promise<void> {
    await rpc<void>("acknowledgeWarning", { uid });
  },

  async getSerialNumber(uid: string): Promise<Record<string, string> | null> {
    return rpc<Record<string, string> | null>("getSerialNumber", { uid });
  },

  async getSignatorySettings(program: string): Promise<Record<string, string> | null> {
    return rpc<Record<string, string> | null>("getSignatorySettings", { program });
  },
};
