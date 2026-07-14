import { NextRequest, NextResponse } from "next/server";
import { adminServerService } from "@/services/server/admin.server";
import { getSessionToken, verifyToken } from "@/lib/auth";

type Svc = typeof adminServerService;
type SvcKey = keyof Svc;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dispatch: Record<SvcKey, (p: any) => Promise<unknown>> = {
  getEnrollmentsByProgram: (p) => adminServerService.getEnrollmentsByProgram(p.program),
  getEnrollmentSchedule: (p) => adminServerService.getEnrollmentSchedule(p.program, p.msLevel),
  getEnrollmentSchedules: (p) => adminServerService.getEnrollmentSchedules(p.program),
  saveEnrollmentSchedule: (p) => adminServerService.saveEnrollmentSchedule(p.schedule),
  updateEnrollmentStatus: (p) => adminServerService.updateEnrollmentStatus(p.uid, p.status, p.rejectionReason, p.options),
  getApprovedEnrollmentsByProgram: (p) => adminServerService.getApprovedEnrollmentsByProgram(p.program),
  updateEnrollmentFields: (p) => adminServerService.updateEnrollmentFields(p.uid, p.fields),

  getNextAvailableCWTSCompany: () => adminServerService.getNextAvailableCWTSCompany(),
  getCWTSCompanyCounts: () => adminServerService.getCWTSCompanyCounts(),
  approveCWTSEnrollment: (p) => adminServerService.approveCWTSEnrollment(p.uid),

  getROTCApprovedEnrollments: (p) => adminServerService.getROTCApprovedEnrollments(p.msLevel),
  assignROTCPlatoons: (p) => adminServerService.assignROTCPlatoons(p.msLevel),
  getROTCRosterGrouped: (p) => adminServerService.getROTCRosterGrouped(p.msLevel),
  getSpecialUnitEnrollments: (p) => adminServerService.getSpecialUnitEnrollments(p.msLevel),
  getSpecialUnitCount: (p) => adminServerService.getSpecialUnitCount(p.unit, p.msLevel),
  approveWithSpecialUnit: (p) => adminServerService.approveWithSpecialUnit(p.uid, p.specialUnit),

  getSessionsByProgram: (p) => adminServerService.getSessionsByProgram(p.program, p.isAdvanceCourse),
  getSessionsByProgramForCycle: (p) => adminServerService.getSessionsByProgramForCycle(p.program, p.options),
  getAllAttendanceSessions: () => adminServerService.getAllAttendanceSessions(),
  createAttendanceSession: (p) => adminServerService.createAttendanceSession(p.data),
  autoCloseExpiredSessions: () => adminServerService.autoCloseExpiredSessions(),
  markAbsentStudents: (p) => adminServerService.markAbsentStudents(p.sessionId, p.program, p.isAdvanceCourse, p.miNumber, p.miType),
  getSessionAttendanceRecords: (p) => adminServerService.getSessionAttendanceRecords(p.sessionId),
  getAttendanceSummary: (p) => adminServerService.getAttendanceSummary(p.sessionId, p.program),
  getAttendanceSessionsByDate: (p) => adminServerService.getAttendanceSessionsByDate(p.program, p.date),
  updateAttendanceStatus: (p) => adminServerService.updateAttendanceStatus(p.recordId, p.newStatus),

  getStudentGradesByMs: (p) => adminServerService.getStudentGradesByMs(p.msLevel, p.program),
  saveStudentGrade: (p) => adminServerService.saveStudentGrade(p.uid, p.program, p.msLevel, p.grade, p.midterm, p.finalTerm),
  saveStudentGradesBatch: (p) => adminServerService.saveStudentGradesBatch(p.updates),
  getStudentGrades: (p) => adminServerService.getStudentGrades(p.studentUid),

  getAllAttendanceOffenses: () => adminServerService.getAllAttendanceOffenses(),
  getAttendanceOffense: (p) => adminServerService.getAttendanceOffense(p.uid),
  recordAttendanceOffense: (p) => adminServerService.recordAttendanceOffense(p.uid),
  settleAttendanceOffense: (p) => adminServerService.settleAttendanceOffense(p.uid),

  getStudentAttendanceRecords: (p) => adminServerService.getStudentAttendanceRecords(p.studentUid),
  getStudentAttendanceRecordsForCycle: (p) =>
    adminServerService.getStudentAttendanceRecordsForCycle(p.studentUid, p.program, p.msLevel, p.schoolYear),

  saveSignatorySettings: (p) => adminServerService.saveSignatorySettings(p.program, p.settings),
  getSignatorySettings: (p) => adminServerService.getSignatorySettings(p.program),
  saveSerialNumber: (p) => adminServerService.saveSerialNumber(p.uid, p.serialNumber, p.program, p.signatories),
  getSerialNumbersByProgram: (p) => adminServerService.getSerialNumbersByProgram(p.program),
};

function serialize(value: unknown): unknown {
  if (value instanceof Map) return Object.fromEntries(value);
  return value;
}

export async function POST(req: NextRequest) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload || (payload.role !== "admin" && payload.role !== "officer")) {
      return NextResponse.json({ error: "Forbidden: admin or officer role required" }, { status: 403 });
    }

    const body = await req.json();
    const { method, params } = body as { method: string; params: Record<string, unknown> };

    const handler = dispatch[method as SvcKey];
    if (!handler) {
      return NextResponse.json({ error: `Unknown method: ${method}` }, { status: 400 });
    }

    const raw = await handler(params ?? {});
    return NextResponse.json({ result: serialize(raw) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[admin-rpc]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
