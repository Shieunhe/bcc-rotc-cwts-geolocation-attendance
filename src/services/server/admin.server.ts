import { query, execute, getConnection } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import {
  CWTSCompany, CWTS_COMPANIES, CWTS_COMPANY_SLOT_LIMIT,
  EnrollmentDocument, EnrollmentWithMs, EnrollmentSchedule, EnrollmentStatus, NSTProgram, MSLevel,
  StudentMsRecord,
  ROTCBattalion, ROTCCompany, ROTCPlatoon,
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
  ROTC_PLATOONS_PER_COMPANY, ROTC_PLATOON_SLOT_LIMIT,
  SpecialUnit, SPECIAL_UNIT_SLOT_LIMITS,
  AttendanceSession, AttendanceStatus, ATTENDANCE_RADIUS_METERS,
  AttendanceRecord, AttendanceRecordStatus, StudentGrade, AttendanceOffense,
  getSchoolYearFromDate,
} from "@/types";
import { compareSchedulesDesc, extractSchoolYearFromScheduleId, isScheduleOpenAt } from "@/utils/enrollmentSchedule";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function ts(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

/* ------------------------------------------------------------------ */
/*  Row mappers                                                       */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStudentRow(r: any): EnrollmentDocument {
  return {
    uid: String(r.id),
    studentId: r.student_id ?? "",
    lastName: r.last_name ?? "",
    firstName: r.first_name ?? "",
    middleName: r.middle_name ?? "",
    suffix: r.suffix || undefined,
    religion: r.religion ?? "",
    birthdate: r.birthdate ?? "",
    sex: r.sex ?? "",
    contactNumber: r.contact_number ?? "",
    placeOfBirth: r.place_of_birth ?? "",
    temporaryBarangay: r.temporary_barangay ?? "",
    temporaryMunicipality: r.temporary_municipality ?? "",
    temporaryProvince: r.temporary_province ?? "",
    permanentBarangay: r.permanent_barangay ?? "",
    permanentMunicipality: r.permanent_municipality ?? "",
    permanentProvince: r.permanent_province ?? "",
    fatherName: r.father_name ?? "",
    fatherOccupation: r.father_occupation ?? "",
    motherName: r.mother_name ?? "",
    motherOccupation: r.mother_occupation ?? "",
    emergencyContactName: r.emergency_contact_name ?? "",
    emergencyContactAddress: r.emergency_contact_address ?? "",
    emergencyContactRelationship: r.emergency_contact_relationship ?? "",
    emergencyContactContactNumber: r.emergency_contact_contact_number ?? "",
    willingToTakeAdvanceCourse: !!r.willing_to_take_advance_course,
    course: r.course ?? "",
    yearLevel: r.year_level ?? "",
    nstpComponent: r.nstp_component ?? "",
    height: r.height ?? "",
    weight: r.weight ?? "",
    bloodType: r.blood_type ?? "",
    complexion: r.complexion ?? "",
    hasMedicalCondition: r.has_medical_condition == null ? null : !!r.has_medical_condition,
    medicalCondition: r.medical_condition ?? "",
    medicalCertificate: r.medical_certificate ?? null,
    xrayFile: r.xray_file ?? null,
    email: r.email ?? "",
    username: r.username ?? "",
    password: r.password ?? "",
    photo: r.photo ?? null,
    corFile: r.cor_file ?? null,
    createdAt: ts(r.created_at),
    updatedAt: ts(r.updated_at),
    company: r.company || undefined,
    battalion: r.battalion != null ? (Number(r.battalion) as ROTCBattalion) : undefined,
    rotcCompany: r.rotc_company || undefined,
    rotcPlatoon: r.rotc_platoon != null ? (Number(r.rotc_platoon) as ROTCPlatoon) : undefined,
    specialUnit: r.special_unit || undefined,
    platoon: r.platoon || undefined,
    grades: r.grades != null ? Number(r.grades) : undefined,
    serialNumber: r.serial_number || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMsRecord(r: any): StudentMsRecord {
  return {
    uid: String(r.student_id),
    scheduleId: r.schedule_id ?? "",
    msLevel: r.ms_level as MSLevel,
    status: r.status as EnrollmentStatus,
    rejectionReason: r.rejection_reason || undefined,
    program: r.program as NSTProgram,
    createdAt: ts(r.created_at),
    updatedAt: ts(r.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSchedule(r: any): EnrollmentSchedule {
  return {
    program: r.program as NSTProgram,
    msLevel: r.ms_level as MSLevel,
    year: r.year ?? "",
    openDate: ts(r.open_date),
    deadline: ts(r.deadline),
    updatedAt: ts(r.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(r: any): AttendanceSession {
  return {
    id: String(r.id),
    program: r.program as NSTProgram,
    msLevel: r.ms_level ? (r.ms_level as MSLevel) : undefined,
    isAdvanceCourse: r.is_advance_course ? true : undefined,
    schoolYear: r.school_year || undefined,
    miNumber: r.mi_number ?? undefined,
    miType: r.mi_type || undefined,
    openDate: ts(r.open_date),
    closeDate: ts(r.close_date),
    location: { latitude: Number(r.latitude), longitude: Number(r.longitude) },
    radiusMeters: r.radius_meters ?? ATTENDANCE_RADIUS_METERS,
    status: r.status as AttendanceStatus,
    createdAt: ts(r.created_at),
    createdBy: r.created_by ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAttRecord(r: any): AttendanceRecord {
  return {
    id: String(r.id),
    studentUid: String(r.student_id),
    attendanceSessionId: String(r.attendance_session_id),
    status: r.status as AttendanceRecordStatus,
    miNumber: r.mi_number ?? undefined,
    miType: r.mi_type || undefined,
    createdAt: ts(r.created_at),
    updatedAt: ts(r.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGrade(r: any): StudentGrade {
  return {
    student_uid: String(r.student_id),
    midterm: r.midterm != null ? Number(r.midterm) : undefined,
    finalTerm: r.final_term != null ? Number(r.final_term) : undefined,
    grade: Number(r.grade),
    status: r.status as "Passed" | "Failed",
    program: r.program as NSTProgram,
    createdAt: ts(r.created_at),
    updatedAt: ts(r.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOffense(r: any): AttendanceOffense {
  return {
    student_uid: String(r.student_id),
    offend: r.offend,
    settled: !!r.settled,
    warningAcknowledgedAt: r.warning_acknowledged_at ? ts(r.warning_acknowledged_at) : undefined,
    createdAt: ts(r.created_at),
    updatedAt: ts(r.updated_at),
  };
}

/* ------------------------------------------------------------------ */
/*  Pure computation (unchanged logic)                                */
/* ------------------------------------------------------------------ */

function mergeWithMsRecords(enrollment: EnrollmentDocument, allMsRecords: StudentMsRecord[]): EnrollmentWithMs {
  const records = allMsRecords.filter((r) => r.uid === enrollment.uid);
  const msLevelOne = records.some((r) => r.msLevel === "1");
  const msLevelTwo = records.some((r) => r.msLevel === "2");
  const latest = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return {
    ...enrollment,
    status: latest?.status ?? "pending",
    msLevelOne,
    msLevelTwo,
    rejectionReason: latest?.rejectionReason,
    msRecords: records,
  };
}

function getEffectiveAttendanceStatus(session: AttendanceSession): AttendanceStatus {
  const now = Date.now();
  const openAt = new Date(session.openDate).getTime();
  const closeAt = new Date(session.closeDate).getTime();
  if (Number.isNaN(openAt) || Number.isNaN(closeAt)) return session.status;
  if (now >= closeAt) return "closed";
  if (now >= openAt) return "open";
  return "scheduled";
}

function getAttendanceCycleForSession(session: AttendanceSession): { schoolYear: string; msLevel?: "1" | "2" } {
  return {
    schoolYear: session.schoolYear ?? getSchoolYearFromDate(session.openDate),
    msLevel: session.msLevel,
  };
}

function buildAttendanceSlotKey(session: {
  program: NSTProgram;
  isAdvanceCourse?: boolean;
  schoolYear?: string;
  msLevel?: "1" | "2";
  miNumber?: number;
  miType?: "in" | "out";
  openDate?: string;
}): string {
  const schoolYear = session.schoolYear ?? (session.openDate ? getSchoolYearFromDate(session.openDate) : "");
  return [
    session.program,
    session.isAdvanceCourse ? "advance" : "regular",
    session.msLevel ?? "na",
    schoolYear,
    session.miNumber ?? 0,
    session.miType ?? "na",
  ].join("|");
}

function resolveScheduleCycleFromList(
  schedules: EnrollmentSchedule[],
  referenceDate: string,
): { schoolYear: string; msLevel?: "1" | "2" } {
  const schoolYear = getSchoolYearFromDate(referenceDate);
  const byYear = schedules.filter((s) => s.year === schoolYear);
  const at = new Date(referenceDate).getTime();

  const matchingWindow = byYear.find((s) => {
    const start = new Date(s.openDate).getTime();
    const end = new Date(s.deadline).getTime();
    return at >= start && at <= end;
  });
  if (matchingWindow) return { schoolYear, msLevel: matchingWindow.msLevel };

  const activeNow = byYear.find((s) => {
    const now = Date.now();
    const start = new Date(s.openDate).getTime();
    const end = new Date(s.deadline).getTime();
    return now >= start && now <= end;
  });
  if (activeNow) return { schoolYear, msLevel: activeNow.msLevel };

  if (byYear.length === 1) return { schoolYear, msLevel: byYear[0].msLevel };

  return { schoolYear };
}

function buildROTCSlotCounts(
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
}

function computeROTCAssignments(
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
}

/* ------------------------------------------------------------------ */
/*  DB helper functions                                               */
/* ------------------------------------------------------------------ */

async function fetchMsRecordsByProgram(program: NSTProgram): Promise<StudentMsRecord[]> {
  const rows = await query<RowDataPacket[]>("SELECT * FROM student_ms_records WHERE program = ?", [program]);
  return rows.map(mapMsRecord);
}

async function fetchMsRecordsByUid(uid: string): Promise<StudentMsRecord[]> {
  const rows = await query<RowDataPacket[]>("SELECT * FROM student_ms_records WHERE student_id = ?", [uid]);
  return rows.map(mapMsRecord);
}

async function fetchApprovedUids(program: NSTProgram, msLevel?: "1" | "2"): Promise<{ uids: string[]; msRecords: StudentMsRecord[] }> {
  const msRecords = await fetchMsRecordsByProgram(program);
  const byUid = new Map<string, StudentMsRecord[]>();
  for (const r of msRecords) {
    if (!byUid.has(r.uid)) byUid.set(r.uid, []);
    byUid.get(r.uid)!.push(r);
  }
  const uids: string[] = [];
  for (const [uid, records] of byUid) {
    const latest = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (!latest || latest.status !== "approved") continue;
    if (msLevel && latest.msLevel !== msLevel) continue;
    uids.push(uid);
  }
  return { uids, msRecords };
}

async function fetchApprovedUidsForCycle(
  program: NSTProgram,
  msLevel?: "1" | "2",
  schoolYear?: string,
): Promise<{ uids: string[]; msRecords: StudentMsRecord[] }> {
  const msRecords = await fetchMsRecordsByProgram(program);
  const byUid = new Map<string, StudentMsRecord[]>();
  for (const r of msRecords) {
    if (!byUid.has(r.uid)) byUid.set(r.uid, []);
    byUid.get(r.uid)!.push(r);
  }
  const uids: string[] = [];
  for (const [uid, records] of byUid) {
    const matching = records
      .filter((r) => {
        if (r.status !== "approved") return false;
        if (msLevel && r.msLevel !== msLevel) return false;
        if (schoolYear && extractSchoolYearFromScheduleId(r.scheduleId) !== schoolYear) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (matching.length > 0) uids.push(uid);
  }
  return { uids, msRecords };
}

async function fetchSchedulesByProgram(program: NSTProgram): Promise<EnrollmentSchedule[]> {
  const rows = await query<RowDataPacket[]>("SELECT * FROM enrollment_schedules WHERE program = ?", [program]);
  return rows.map(mapSchedule);
}

async function fetchApprovedUidsForCurrentEnrollmentCycle(
  program: NSTProgram,
  msLevel?: "1" | "2",
): Promise<{ uids: string[]; msRecords: StudentMsRecord[] }> {
  const schedules = await fetchSchedulesByProgram(program);
  const matching = schedules.filter((s) => !msLevel || s.msLevel === msLevel);
  const now = new Date();
  const activeOrUpcoming = matching
    .filter((s) => new Date(s.deadline) >= now)
    .sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime());
  const selected = activeOrUpcoming[0] ?? [...matching].sort(
    (a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime(),
  )[0];
  if (!selected?.year) return fetchApprovedUids(program, msLevel);
  return fetchApprovedUidsForCycle(program, selected.msLevel, selected.year);
}

async function fetchROTCApprovedUidsForCurrentCycle(
  msLevel?: "1" | "2",
): Promise<{ uids: string[]; msRecords: StudentMsRecord[] }> {
  const schedules = await fetchSchedulesByProgram("ROTC");
  const matching = schedules.filter((s) => !msLevel || s.msLevel === msLevel);
  const now = new Date();
  const activeOrUpcoming = matching
    .filter((s) => new Date(s.deadline) >= now)
    .sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime());
  const selected = activeOrUpcoming[0] ?? [...matching].sort(
    (a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime(),
  )[0];

  if (!selected?.year) return fetchApprovedUidsForCycle("ROTC", msLevel);

  const cycleResult = await fetchApprovedUidsForCycle("ROTC", msLevel, selected.year);
  const selectedStart = new Date(selected.openDate).getTime();
  const selectedEnd = new Date(selected.deadline).getTime();
  const byUid = new Map<string, StudentMsRecord[]>();

  for (const record of cycleResult.msRecords) {
    if (!byUid.has(record.uid)) byUid.set(record.uid, []);
    byUid.get(record.uid)!.push(record);
  }

  for (const [uid, records] of byUid) {
    if (cycleResult.uids.includes(uid)) continue;
    const hasFallbackApprovedRecord = records
      .filter((r) => r.status === "approved")
      .some((r) => {
        if (msLevel && r.msLevel !== msLevel) return false;
        if (r.scheduleId) return false;
        const createdAt = new Date(r.createdAt).getTime();
        return createdAt >= selectedStart && createdAt <= selectedEnd;
      });
    if (hasFallbackApprovedRecord) cycleResult.uids.push(uid);
  }

  return cycleResult;
}

async function batchFetchProfiles(uids: string[]): Promise<EnrollmentDocument[]> {
  if (uids.length === 0) return [];
  const placeholders = uids.map(() => "?").join(",");
  const rows = await query<RowDataPacket[]>(
    `SELECT * FROM students WHERE id IN (${placeholders})`,
    uids,
  );
  return rows.map(mapStudentRow);
}

async function findLatestMsRecord(uid: string): Promise<{ id: number; data: StudentMsRecord } | null> {
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM student_ms_records WHERE student_id = ? ORDER BY created_at DESC LIMIT 1",
    [uid],
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id, data: mapMsRecord(rows[0]) };
}

async function resolveAttendanceCycle(program: NSTProgram, referenceDate: string): Promise<{ schoolYear: string; msLevel?: "1" | "2" }> {
  const schedules = await fetchSchedulesByProgram(program);
  return resolveScheduleCycleFromList(schedules, referenceDate);
}

/* ------------------------------------------------------------------ */
/*  Exported service                                                  */
/* ------------------------------------------------------------------ */

export const adminServerService = {

  /* ---------- Enrollment ---------- */

  async getEnrollmentsByProgram(program: NSTProgram): Promise<EnrollmentWithMs[]> {
    const [studentRows, msRecords] = await Promise.all([
      query<RowDataPacket[]>("SELECT * FROM students WHERE nstp_component = ?", [program]),
      fetchMsRecordsByProgram(program),
    ]);
    return studentRows
      .map(mapStudentRow)
      .map((e) => mergeWithMsRecords(e, msRecords))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getEnrollmentSchedule(program: NSTProgram, msLevel: string): Promise<EnrollmentSchedule | null> {
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM enrollment_schedules WHERE program = ? AND ms_level = ?",
      [program, msLevel],
    );
    if (rows.length === 0) return null;
    const schedules = rows.map(mapSchedule).sort(compareSchedulesDesc);
    const open = schedules.find((s) => isScheduleOpenAt(s));
    return open ?? schedules[0];
  },

  async getEnrollmentSchedules(program: NSTProgram): Promise<EnrollmentSchedule[]> {
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM enrollment_schedules WHERE program = ?",
      [program],
    );
    return rows.map(mapSchedule);
  },

  async saveEnrollmentSchedule(schedule: EnrollmentSchedule): Promise<void> {
    const existing = await query<RowDataPacket[]>(
      "SELECT id FROM enrollment_schedules WHERE program = ? AND ms_level = ? AND year = ?",
      [schedule.program, schedule.msLevel, schedule.year],
    );
    if (existing.length > 0) {
      const levelPrefix = schedule.program === "CWTS" ? "CWTS" : "MS";
      throw new Error(`Schedule for ${levelPrefix} ${schedule.msLevel} - SY ${schedule.year} already exists.`);
    }
    const openDate = schedule.openDate.includes("T") ? schedule.openDate : `${schedule.openDate}T00:00:00`;
    const deadline = schedule.deadline.includes("T") ? schedule.deadline : `${schedule.deadline}T23:59:59`;
    await execute(
      `INSERT INTO enrollment_schedules (program, ms_level, year, open_date, deadline, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [schedule.program, schedule.msLevel, schedule.year, openDate, deadline, new Date().toISOString()],
    );
  },

  async updateEnrollmentStatus(
    uid: string,
    status: EnrollmentStatus,
    rejectionReason?: string,
    options?: { resetRotcAssignments?: boolean },
  ): Promise<void> {
    const latest = await findLatestMsRecord(uid);
    if (!latest) return;

    const now = new Date().toISOString();
    const sets = ["status = ?", "updated_at = ?"];
    const vals: unknown[] = [status, now];
    if (rejectionReason !== undefined) {
      sets.push("rejection_reason = ?");
      vals.push(rejectionReason);
    }
    vals.push(latest.id);
    await execute(`UPDATE student_ms_records SET ${sets.join(", ")} WHERE id = ?`, vals);

    const shouldReset = options?.resetRotcAssignments ?? true;
    if (status === "approved" && latest.data.program === "ROTC" && shouldReset) {
      await execute(
        `UPDATE students SET battalion = NULL, rotc_company = NULL, rotc_platoon = NULL, special_unit = NULL, updated_at = ? WHERE id = ?`,
        [now, uid],
      );
    }
  },

  async getApprovedEnrollmentsByProgram(program: NSTProgram): Promise<EnrollmentWithMs[]> {
    const { uids, msRecords } = await fetchApprovedUids(program);
    const profiles = await batchFetchProfiles(uids);
    return profiles
      .map((p) => mergeWithMsRecords(p, msRecords))
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  },

  async updateEnrollmentFields(uid: string, fields: Partial<EnrollmentDocument>): Promise<void> {
    const entries = Object.entries(fields).filter(([k]) => k !== "uid");
    if (entries.length === 0) return;
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of entries) {
      sets.push(`\`${camelToSnake(key)}\` = ?`);
      values.push(typeof value === "boolean" ? (value ? 1 : 0) : (value ?? null));
    }
    sets.push("`updated_at` = ?");
    values.push(new Date().toISOString());
    values.push(uid);
    await execute(`UPDATE students SET ${sets.join(", ")} WHERE id = ?`, values);
  },

  /* ---------- CWTS ---------- */

  async getNextAvailableCWTSCompany(): Promise<CWTSCompany | null> {
    const { uids } = await fetchApprovedUidsForCurrentEnrollmentCycle("CWTS");
    const profiles = await batchFetchProfiles(uids);
    const counts: Record<CWTSCompany, number> = { Alpha: 0, Bravo: 0, Charlie: 0, Delta: 0, Echo: 0, Foxtrot: 0 };
    for (const e of profiles) {
      if (e.company && counts[e.company] !== undefined) counts[e.company]++;
    }
    return CWTS_COMPANIES.find((c) => counts[c] < CWTS_COMPANY_SLOT_LIMIT) ?? null;
  },

  async getCWTSCompanyCounts(): Promise<Record<CWTSCompany, EnrollmentWithMs[]>> {
    const { uids, msRecords } = await fetchApprovedUidsForCurrentEnrollmentCycle("CWTS");
    const profiles = await batchFetchProfiles(uids);
    const grouped: Record<CWTSCompany, EnrollmentWithMs[]> = { Alpha: [], Bravo: [], Charlie: [], Delta: [], Echo: [], Foxtrot: [] };
    for (const p of profiles) {
      const merged = mergeWithMsRecords(p, msRecords);
      if (merged.company && grouped[merged.company]) grouped[merged.company].push(merged);
    }
    return grouped;
  },

  async approveCWTSEnrollment(uid: string): Promise<CWTSCompany | null> {
    const company = await this.getNextAvailableCWTSCompany();
    if (!company) return null;
    await execute("UPDATE students SET company = ?, updated_at = ? WHERE id = ?", [company, new Date().toISOString(), uid]);
    await this.updateEnrollmentStatus(uid, "approved");
    return company;
  },

  /* ---------- ROTC ---------- */

  async getROTCApprovedEnrollments(msLevel: "1" | "2" = "2"): Promise<EnrollmentWithMs[]> {
    const { uids, msRecords } = await fetchROTCApprovedUidsForCurrentCycle(msLevel);
    const profiles = await batchFetchProfiles(uids);
    return profiles.map((p) => mergeWithMsRecords(p, msRecords));
  },

  async assignROTCPlatoons(msLevel: "1" | "2" = "2"): Promise<{ assigned: number; alreadyAssigned: number }> {
    const enrollments = await this.getROTCApprovedEnrollments(msLevel);
    const unassigned = enrollments.filter((e) => !e.rotcCompany && !e.willingToTakeAdvanceCourse && !e.specialUnit && !e.medicalCondition);
    const alreadyAssigned = enrollments.length - unassigned.length;
    if (unassigned.length === 0) return { assigned: 0, alreadyAssigned };

    const males = unassigned.filter((e) => e.sex === "Male").sort((a, b) => a.lastName.localeCompare(b.lastName));
    const females = unassigned.filter((e) => e.sex === "Female").sort((a, b) => a.lastName.localeCompare(b.lastName));

    const existingMaleCounts = buildROTCSlotCounts(
      enrollments.filter((e) => e.sex === "Male" && e.rotcCompany && !e.specialUnit && !e.medicalCondition),
      ROTC_BATTALION_1_COMPANIES,
    );
    const existingFemaleCounts = buildROTCSlotCounts(
      enrollments.filter((e) => e.sex === "Female" && e.rotcCompany && !e.specialUnit && !e.medicalCondition),
      ROTC_BATTALION_2_COMPANIES,
    );

    const maleAssignments = computeROTCAssignments(males, 1, ROTC_BATTALION_1_COMPANIES, existingMaleCounts);
    const femaleAssignments = computeROTCAssignments(females, 2, ROTC_BATTALION_2_COMPANIES, existingFemaleCounts);
    const all = [...maleAssignments, ...femaleAssignments];

    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      const now = new Date().toISOString();
      for (const a of all) {
        await conn.execute(
          "UPDATE students SET battalion = ?, rotc_company = ?, rotc_platoon = ?, updated_at = ? WHERE id = ?",
          [a.battalion, a.rotcCompany, a.rotcPlatoon, now, a.uid],
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return { assigned: all.length, alreadyAssigned };
  },

  async getROTCRosterGrouped(msLevel: "1" | "2" = "2"): Promise<{
    battalion1: Record<ROTCCompany, Record<number, EnrollmentWithMs[]>>;
    battalion2: Record<ROTCCompany, Record<number, EnrollmentWithMs[]>>;
    advanceCourseMale: EnrollmentWithMs[];
    advanceCourseFemale: EnrollmentWithMs[];
  }> {
    const enrollments = await this.getROTCApprovedEnrollments(msLevel);

    const buildEmpty = (companies: ROTCCompany[]) => {
      const result: Record<string, Record<number, EnrollmentWithMs[]>> = {};
      for (const c of companies) {
        result[c] = {};
        for (let p = 1; p <= ROTC_PLATOONS_PER_COMPANY; p++) result[c][p] = [];
      }
      return result as Record<ROTCCompany, Record<number, EnrollmentWithMs[]>>;
    };

    const battalion1 = buildEmpty(ROTC_BATTALION_1_COMPANIES);
    const battalion2 = buildEmpty(ROTC_BATTALION_2_COMPANIES);
    const advanceCourseMale: EnrollmentWithMs[] = [];
    const advanceCourseFemale: EnrollmentWithMs[] = [];

    for (const e of enrollments) {
      if (e.specialUnit || e.medicalCondition) continue;
      if (e.willingToTakeAdvanceCourse) {
        if (e.sex === "Male") advanceCourseMale.push(e);
        else advanceCourseFemale.push(e);
        continue;
      }
      if (!e.rotcCompany || !e.rotcPlatoon) continue;
      const target = e.battalion === 1 ? battalion1 : battalion2;
      if (target[e.rotcCompany]?.[e.rotcPlatoon]) target[e.rotcCompany][e.rotcPlatoon].push(e);
    }

    return { battalion1, battalion2, advanceCourseMale, advanceCourseFemale };
  },

  async getSpecialUnitEnrollments(msLevel: "1" | "2" = "2"): Promise<Record<SpecialUnit, EnrollmentWithMs[]>> {
    const { uids, msRecords } = await fetchApprovedUids("ROTC", msLevel);
    const profiles = await batchFetchProfiles(uids);
    const result: Record<SpecialUnit, EnrollmentWithMs[]> = { Medics: [], HQ: [], MP: [] };
    for (const p of profiles) {
      const merged = mergeWithMsRecords(p, msRecords);
      if (merged.specialUnit && result[merged.specialUnit]) result[merged.specialUnit].push(merged);
    }
    return result;
  },

  async getSpecialUnitCount(unit: SpecialUnit, msLevel: "1" | "2" = "2"): Promise<number> {
    const { uids } = await fetchApprovedUids("ROTC", msLevel);
    const profiles = await batchFetchProfiles(uids);
    return profiles.filter((p) => p.specialUnit === unit).length;
  },

  async approveWithSpecialUnit(uid: string, specialUnit: SpecialUnit): Promise<string | null> {
    const count = await this.getSpecialUnitCount(specialUnit);
    if (count >= SPECIAL_UNIT_SLOT_LIMITS[specialUnit]) return null;
    await execute("UPDATE students SET special_unit = ?, updated_at = ? WHERE id = ?", [specialUnit, new Date().toISOString(), uid]);
    await this.updateEnrollmentStatus(uid, "approved", undefined, { resetRotcAssignments: false });
    return specialUnit;
  },

  /* ---------- Attendance sessions ---------- */

  async getSessionsByProgram(program: NSTProgram, isAdvanceCourse?: boolean): Promise<AttendanceSession[]> {
    const rows = await query<RowDataPacket[]>("SELECT * FROM attendance_sessions WHERE program = ?", [program]);
    const sessions = rows.map(mapSession);
    return sessions.filter((s) => {
      if (isAdvanceCourse) return !!s.isAdvanceCourse;
      if (program === "ROTC") return !s.isAdvanceCourse;
      return true;
    });
  },

  async getSessionsByProgramForCycle(
    program: NSTProgram,
    options: { isAdvanceCourse?: boolean; msLevel?: "1" | "2"; schoolYear?: string },
  ): Promise<AttendanceSession[]> {
    const sessions = await this.getSessionsByProgram(program, options.isAdvanceCourse);
    return sessions.filter((s) => {
      if (options.msLevel && s.msLevel !== options.msLevel) return false;
      if (options.schoolYear && (s.schoolYear ?? getSchoolYearFromDate(s.openDate)) !== options.schoolYear) return false;
      return true;
    });
  },

  async getAllAttendanceSessions(): Promise<AttendanceSession[]> {
    const rows = await query<RowDataPacket[]>("SELECT * FROM attendance_sessions ORDER BY created_at DESC");
    return rows.map(mapSession);
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
    location: { latitude: number; longitude: number };
    createdBy: string;
  }): Promise<string> {
    await this.autoCloseExpiredSessions();

    const cycle = data.schoolYear
      ? { schoolYear: data.schoolYear, msLevel: data.msLevel }
      : await resolveAttendanceCycle(data.program, data.openDate);

    const existingSessions = await this.getSessionsByProgram(data.program, data.isAdvanceCourse);
    const sameCycleSessions = existingSessions.filter((session) => {
      const sessionCycle = getAttendanceCycleForSession(session);
      return sessionCycle.schoolYear === cycle.schoolYear && sessionCycle.msLevel === cycle.msLevel;
    });

    if (data.miNumber && data.miType) {
      const sameMiSessions = sameCycleSessions.filter((session) => session.miNumber === data.miNumber);
      const existingIn = sameMiSessions.find((session) => session.miType === "in");
      const existingOut = sameMiSessions.find((session) => session.miType === "out");
      const duplicateSession = sameMiSessions.find((session) => session.miType === data.miType);

      if (data.miType === "in" && (existingIn || duplicateSession)) {
        throw new Error(`MI ${data.miNumber} IN already exists for this cycle.`);
      }
      if (data.miType === "out") {
        if (!existingIn) throw new Error(`MI ${data.miNumber} OUT cannot be created before MI ${data.miNumber} IN.`);
        if (getEffectiveAttendanceStatus(existingIn) !== "closed") {
          throw new Error(`MI ${data.miNumber} IN must be closed first before creating MI ${data.miNumber} OUT.`);
        }
        if (existingOut) throw new Error(`MI ${data.miNumber} OUT already exists for this cycle.`);
      }
    }

    const now = new Date();
    const open = new Date(data.openDate);
    const close = new Date(data.closeDate);
    let status: AttendanceStatus = "scheduled";
    if (now >= open && now < close) status = "open";
    else if (now >= close) status = "closed";

    const result = await execute(
      `INSERT INTO attendance_sessions
       (program, ms_level, is_advance_course, school_year, mi_number, mi_type, open_date, close_date, latitude, longitude, radius_meters, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.program,
        cycle.msLevel ?? null,
        data.isAdvanceCourse ? 1 : 0,
        cycle.schoolYear,
        data.miNumber ?? null,
        data.miType ?? null,
        data.openDate,
        data.closeDate,
        data.location.latitude,
        data.location.longitude,
        ATTENDANCE_RADIUS_METERS,
        status,
        data.createdBy,
        now.toISOString(),
      ],
    );

    return String(result.insertId);
  },

  async autoCloseExpiredSessions(): Promise<number> {
    const LATE_THRESHOLD_MINUTES = 15;
    const rows = await query<RowDataPacket[]>("SELECT * FROM attendance_sessions WHERE status != 'closed'");
    const now = new Date();
    let closed = 0;

    console.log(`[AutoClose] Fetched ${rows.length} session(s). Now = ${now.toISOString()}`);

    for (const row of rows) {
      const s = mapSession(row);
      const closeTime = new Date(s.closeDate).getTime();
      const lateDeadline = new Date(closeTime + LATE_THRESHOLD_MINUTES * 60 * 1000);

      console.log(
        `[AutoClose] Session ${s.id} | status=${s.status} | closeDate=${s.closeDate} | ` +
        `parsedClose=${new Date(closeTime).toISOString()} | lateDeadline=${lateDeadline.toISOString()} | ` +
        `shouldClose=${now >= lateDeadline}`,
      );

      if (now >= lateDeadline) {
        try {
          await execute("UPDATE attendance_sessions SET status = 'closed' WHERE id = ?", [s.id]);
          console.log(`[AutoClose] Updated status to closed for ${s.id}`);
          await this.markAbsentStudents(s.id, s.program, s.isAdvanceCourse, s.miNumber, s.miType);
          console.log(`[AutoClose] Marked absents for ${s.id}`);
          closed++;
        } catch (err) {
          console.error(`[AutoClose] Failed to close session ${s.id}:`, err);
        }
      }
    }

    return closed;
  },

  async markAbsentStudents(
    sessionId: string,
    program: string,
    isAdvanceCourse?: boolean,
    miNumber?: number,
    miType?: "in" | "out",
  ): Promise<void> {
    const sessionRows = await query<RowDataPacket[]>("SELECT * FROM attendance_sessions WHERE id = ?", [sessionId]);
    const session = sessionRows.length > 0 ? mapSession(sessionRows[0]) : null;
    const sessionSchoolYear = session ? (session.schoolYear ?? getSchoolYearFromDate(session.openDate)) : undefined;

    const { uids } = session
      ? await fetchApprovedUidsForCycle(program as NSTProgram, session.msLevel, sessionSchoolYear)
      : await fetchApprovedUids(program as NSTProgram);

    const profiles = await batchFetchProfiles(uids);
    if (profiles.length === 0) return;

    const existingRows = await query<RowDataPacket[]>(
      "SELECT student_id FROM attendance_records WHERE attendance_session_id = ?",
      [sessionId],
    );
    const markedUids = new Set(existingRows.map((r) => String(r.student_id)));

    const now = new Date().toISOString();
    const toInsert: unknown[][] = [];

    for (const data of profiles) {
      if (markedUids.has(data.uid)) continue;

      if (program === "ROTC") {
        const studentIsAdvance = !!data.willingToTakeAdvanceCourse;
        if (isAdvanceCourse && !studentIsAdvance) continue;
        if (!isAdvanceCourse && studentIsAdvance) continue;
      }

      toInsert.push([data.uid, sessionId, "absent", miNumber ?? null, miType ?? null, now, now]);
    }

    if (toInsert.length === 0) return;

    const batchSize = 500;
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const chunk = toInsert.slice(i, i + batchSize);
      const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
      await execute(
        `INSERT IGNORE INTO attendance_records (student_id, attendance_session_id, status, mi_number, mi_type, created_at, updated_at)
         VALUES ${placeholders}`,
        chunk.flat(),
      );
    }
  },

  async getSessionAttendanceRecords(sessionId: string): Promise<(AttendanceRecord & { student?: EnrollmentWithMs })[]> {
    const sessionRows = await query<RowDataPacket[]>("SELECT * FROM attendance_sessions WHERE id = ?", [sessionId]);
    const session = sessionRows.length > 0 ? mapSession(sessionRows[0]) : null;
    const sessionSchoolYear = session ? (session.schoolYear ?? getSchoolYearFromDate(session.openDate)) : "";

    const recordRows = await query<RowDataPacket[]>(
      "SELECT * FROM attendance_records WHERE attendance_session_id = ?",
      [sessionId],
    );
    const records = recordRows.map(mapAttRecord);

    const studentUids = [...new Set(records.map((r) => r.studentUid))];
    if (studentUids.length === 0) return records.map((r) => ({ ...r }));

    const [profiles, allMsRecords] = await Promise.all([
      batchFetchProfiles(studentUids),
      (async () => {
        const ph = studentUids.map(() => "?").join(",");
        const rows = await query<RowDataPacket[]>(
          `SELECT * FROM student_ms_records WHERE student_id IN (${ph})`,
          studentUids,
        );
        return rows.map(mapMsRecord);
      })(),
    ]);

    const studentMap = new Map<string, EnrollmentWithMs>();
    for (const p of profiles) {
      studentMap.set(p.uid, mergeWithMsRecords(p, allMsRecords));
    }

    return records
      .map((r) => ({ ...r, student: studentMap.get(r.studentUid) }))
      .filter((entry) => {
        if (!session || !entry.student) return true;
        const approvedRecords = entry.student.msRecords.filter((r) => r.status === "approved");
        return approvedRecords.some((r) => {
          if (session.msLevel && r.msLevel !== session.msLevel) return false;
          return extractSchoolYearFromScheduleId(r.scheduleId) === sessionSchoolYear;
        });
      });
  },

  async getAttendanceSummary(sessionId: string, program: string): Promise<{
    records: (AttendanceRecord & { student?: EnrollmentWithMs })[];
    enrolledStudents: EnrollmentWithMs[];
  }> {
    const sessionRows = await query<RowDataPacket[]>("SELECT * FROM attendance_sessions WHERE id = ?", [sessionId]);
    const session = sessionRows.length > 0 ? mapSession(sessionRows[0]) : null;
    const sessionSchoolYear = session ? (session.schoolYear ?? getSchoolYearFromDate(session.openDate)) : undefined;

    const { uids, msRecords } = session
      ? await fetchApprovedUidsForCycle(program as NSTProgram, session.msLevel, sessionSchoolYear)
      : await fetchApprovedUids(program as NSTProgram);

    const [recordRows, profiles] = await Promise.all([
      query<RowDataPacket[]>("SELECT * FROM attendance_records WHERE attendance_session_id = ?", [sessionId]),
      batchFetchProfiles(uids),
    ]);

    const enrolledStudents = profiles.map((p) => mergeWithMsRecords(p, msRecords));
    const studentMap = new Map(enrolledStudents.map((s) => [s.uid, s]));

    const records = recordRows.map(mapAttRecord).map((record) => ({
      ...record,
      student: studentMap.get(record.studentUid),
    }));

    return { records, enrolledStudents };
  },

  async getAttendanceSessionsByDate(program: string, date: string): Promise<AttendanceSession[]> {
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM attendance_sessions WHERE program = ?",
      [program],
    );
    return rows
      .map(mapSession)
      .filter((s) => s.openDate.startsWith(date))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updateAttendanceStatus(recordId: string, newStatus: AttendanceRecordStatus): Promise<void> {
    await execute(
      "UPDATE attendance_records SET status = ?, updated_at = ? WHERE id = ?",
      [newStatus, new Date().toISOString(), recordId],
    );
  },

  /* ---------- Grades ---------- */

  async getStudentGradesByMs(msLevel: "ms1" | "ms2", program: NSTProgram): Promise<Map<string, StudentGrade>> {
    const dbLevel = msLevel === "ms1" ? "1" : "2";
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM student_grades WHERE ms_level = ? AND program = ?",
      [dbLevel, program],
    );
    const map = new Map<string, StudentGrade>();
    for (const r of rows) {
      const grade = mapGrade(r);
      map.set(grade.student_uid, grade);
    }
    return map;
  },

  async saveStudentGrade(
    uid: string,
    program: NSTProgram,
    msLevel: "ms1" | "ms2",
    grade: number,
    midterm?: number,
    finalTerm?: number,
  ): Promise<void> {
    const dbLevel = msLevel === "ms1" ? "1" : "2";
    const status: "Passed" | "Failed" = grade >= 1.0 && grade <= 3.0 ? "Passed" : "Failed";
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO student_grades (student_id, ms_level, grade, status, program, midterm, final_term, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE grade = VALUES(grade), status = VALUES(status),
         midterm = VALUES(midterm), final_term = VALUES(final_term), updated_at = VALUES(updated_at)`,
      [uid, dbLevel, grade, status, program, midterm ?? null, finalTerm ?? null, now, now],
    );
  },

  async saveStudentGradesBatch(
    updates: { uid: string; program: NSTProgram; msLevel: "ms1" | "ms2"; grade: number }[],
  ): Promise<void> {
    if (updates.length === 0) return;
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      const now = new Date().toISOString();
      for (const u of updates) {
        const dbLevel = u.msLevel === "ms1" ? "1" : "2";
        const status: "Passed" | "Failed" = u.grade >= 1.0 && u.grade <= 3.0 ? "Passed" : "Failed";
        await conn.execute(
          `INSERT INTO student_grades (student_id, ms_level, grade, status, program, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE grade = VALUES(grade), status = VALUES(status), updated_at = VALUES(updated_at)`,
          [u.uid, dbLevel, u.grade, status, u.program, now, now],
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getStudentGrades(studentUid: string): Promise<{ ms1?: StudentGrade; ms2?: StudentGrade }> {
    const rows = await query<RowDataPacket[]>("SELECT * FROM student_grades WHERE student_id = ?", [studentUid]);
    const result: { ms1?: StudentGrade; ms2?: StudentGrade } = {};
    for (const row of rows) {
      const grade = mapGrade(row);
      if (row.ms_level === "1") result.ms1 = grade;
      else if (row.ms_level === "2") result.ms2 = grade;
    }
    return result;
  },

  /* ---------- Offenses ---------- */

  async getAllAttendanceOffenses(): Promise<(AttendanceOffense & { student?: EnrollmentWithMs })[]> {
    const offenseRows = await query<RowDataPacket[]>("SELECT * FROM attendance_offenses");
    if (offenseRows.length === 0) return [];
    const offenses = offenseRows.map(mapOffense);
    const uids = offenses.map((o) => o.student_uid);

    const [profiles, allMsRecords] = await Promise.all([
      batchFetchProfiles(uids),
      (async () => {
        const ph = uids.map(() => "?").join(",");
        const rows = await query<RowDataPacket[]>(
          `SELECT * FROM student_ms_records WHERE student_id IN (${ph})`,
          uids,
        );
        return rows.map(mapMsRecord);
      })(),
    ]);

    const enrollmentMap = new Map<string, EnrollmentWithMs>();
    for (const p of profiles) {
      enrollmentMap.set(p.uid, mergeWithMsRecords(p, allMsRecords));
    }

    return offenses.map((o) => ({ ...o, student: enrollmentMap.get(o.student_uid) }));
  },

  async getAttendanceOffense(uid: string): Promise<AttendanceOffense | null> {
    const rows = await query<RowDataPacket[]>("SELECT * FROM attendance_offenses WHERE student_id = ?", [uid]);
    return rows.length > 0 ? mapOffense(rows[0]) : null;
  },

  async recordAttendanceOffense(uid: string): Promise<AttendanceOffense> {
    const now = new Date().toISOString();
    const existing = await query<RowDataPacket[]>("SELECT * FROM attendance_offenses WHERE student_id = ?", [uid]);

    if (existing.length > 0) {
      const data = mapOffense(existing[0]);
      const newOffend = Math.min(data.offend + 1, 2);
      await execute(
        "UPDATE attendance_offenses SET offend = ?, settled = ?, updated_at = ? WHERE student_id = ?",
        [newOffend, newOffend >= 2 ? 0 : (data.settled ? 1 : 0), now, uid],
      );
      return { ...data, offend: newOffend, settled: newOffend >= 2 ? false : data.settled, updatedAt: now };
    }

    await execute(
      "INSERT INTO attendance_offenses (student_id, offend, settled, created_at, updated_at) VALUES (?, 1, 0, ?, ?)",
      [uid, now, now],
    );
    return { student_uid: uid, offend: 1, settled: false, createdAt: now, updatedAt: now };
  },

  async settleAttendanceOffense(uid: string): Promise<void> {
    await execute(
      "UPDATE attendance_offenses SET settled = 1, updated_at = ? WHERE student_id = ?",
      [new Date().toISOString(), uid],
    );
  },

  /* ---------- Student attendance records ---------- */

  async getStudentAttendanceRecords(studentUid: string): Promise<AttendanceRecord[]> {
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM attendance_records WHERE student_id = ?",
      [studentUid],
    );
    return rows.map(mapAttRecord);
  },

  async getStudentAttendanceRecordsForCycle(
    studentUid: string,
    program: NSTProgram,
    msLevel: "1" | "2",
    schoolYear: string,
  ): Promise<AttendanceRecord[]> {
    const rows = await query<RowDataPacket[]>(
      `SELECT ar.id AS ar_id, ar.student_id, ar.attendance_session_id, ar.status AS ar_status,
              ar.mi_number AS ar_mi_number, ar.mi_type AS ar_mi_type,
              ar.created_at AS ar_created_at, ar.updated_at AS ar_updated_at,
              s.id AS s_id, s.program AS s_program, s.ms_level AS s_ms_level,
              s.is_advance_course AS s_is_advance_course, s.school_year AS s_school_year,
              s.mi_number AS s_mi_number, s.mi_type AS s_mi_type,
              s.open_date AS s_open_date, s.close_date AS s_close_date,
              s.latitude AS s_latitude, s.longitude AS s_longitude,
              s.radius_meters AS s_radius_meters, s.status AS s_status,
              s.created_by AS s_created_by, s.created_at AS s_created_at
       FROM attendance_records ar
       JOIN attendance_sessions s ON ar.attendance_session_id = s.id
       WHERE ar.student_id = ?`,
      [studentUid],
    );

    if (rows.length === 0) return [];

    const entries = rows.map((r) => ({
      record: mapAttRecord({
        id: r.ar_id, student_id: r.student_id, attendance_session_id: r.attendance_session_id,
        status: r.ar_status, mi_number: r.ar_mi_number, mi_type: r.ar_mi_type,
        created_at: r.ar_created_at, updated_at: r.ar_updated_at,
      }),
      session: mapSession({
        id: r.s_id, program: r.s_program, ms_level: r.s_ms_level,
        is_advance_course: r.s_is_advance_course, school_year: r.s_school_year,
        mi_number: r.s_mi_number, mi_type: r.s_mi_type,
        open_date: r.s_open_date, close_date: r.s_close_date,
        latitude: r.s_latitude, longitude: r.s_longitude,
        radius_meters: r.s_radius_meters, status: r.s_status,
        created_by: r.s_created_by, created_at: r.s_created_at,
      }),
    }));

    const matchingRecords = entries
      .filter(({ session }) => {
        const sessionSchoolYear = session.schoolYear ?? getSchoolYearFromDate(session.openDate);
        if (session.program !== program) return false;
        if (sessionSchoolYear !== schoolYear) return false;
        return session.msLevel === msLevel;
      })
      .sort((a, b) => new Date(b.record.updatedAt).getTime() - new Date(a.record.updatedAt).getTime());

    const dedupedBySlot = new Map<string, AttendanceRecord>();
    for (const { record, session } of matchingRecords) {
      const slotKey = buildAttendanceSlotKey(session);
      if (!dedupedBySlot.has(slotKey)) dedupedBySlot.set(slotKey, record);
    }

    return Array.from(dedupedBySlot.values());
  },

  /* ---------- Serial numbers & signatories ---------- */

  async saveSignatorySettings(program: NSTProgram, settings: Record<string, string | null>): Promise<void> {
    const now = new Date().toISOString();
    const sigMap: Record<string, string> = {
      signatory1Name: "signatory_1_name", signatory1Position: "signatory_1_position",
      signatory2Name: "signatory_2_name", signatory2Position: "signatory_2_position",
      signatory3Name: "signatory_3_name", signatory3Position: "signatory_3_position",
    };
    const get = (camel: string) => settings[camel] ?? settings[sigMap[camel]] ?? null;

    await execute(
      `INSERT INTO serial_number_settings (program, signatory_1_name, signatory_1_position, signatory_2_name, signatory_2_position, signatory_3_name, signatory_3_position, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         signatory_1_name = VALUES(signatory_1_name), signatory_1_position = VALUES(signatory_1_position),
         signatory_2_name = VALUES(signatory_2_name), signatory_2_position = VALUES(signatory_2_position),
         signatory_3_name = VALUES(signatory_3_name), signatory_3_position = VALUES(signatory_3_position),
         updated_at = VALUES(updated_at)`,
      [
        program,
        get("signatory1Name"), get("signatory1Position"),
        get("signatory2Name"), get("signatory2Position"),
        get("signatory3Name"), get("signatory3Position"),
        now,
      ],
    );
  },

  async getSignatorySettings(program: NSTProgram): Promise<Record<string, string> | null> {
    const rows = await query<RowDataPacket[]>("SELECT * FROM serial_number_settings WHERE program = ?", [program]);
    if (rows.length === 0) return null;
    const r = rows[0];
    const result: Record<string, string> = { program: r.program };
    if (r.signatory_1_name) result.signatory1Name = r.signatory_1_name;
    if (r.signatory_1_position) result.signatory1Position = r.signatory_1_position;
    if (r.signatory_2_name) result.signatory2Name = r.signatory_2_name;
    if (r.signatory_2_position) result.signatory2Position = r.signatory_2_position;
    if (r.signatory_3_name) result.signatory3Name = r.signatory_3_name;
    if (r.signatory_3_position) result.signatory3Position = r.signatory_3_position;
    if (r.updated_at) result.updatedAt = ts(r.updated_at);
    return result;
  },

  async saveSerialNumber(
    uid: string,
    serialNumber: string,
    program: NSTProgram,
    signatories: Record<string, string>,
  ): Promise<void> {
    const sigMap: Record<string, string> = {
      signatory1Name: "signatory_1_name", signatory1Position: "signatory_1_position",
      signatory2Name: "signatory_2_name", signatory2Position: "signatory_2_position",
      signatory3Name: "signatory_3_name", signatory3Position: "signatory_3_position",
    };
    const get = (camel: string) => signatories[camel] ?? signatories[sigMap[camel]] ?? null;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO serial_numbers (student_id, serial_number, program, signatory_1_name, signatory_1_position, signatory_2_name, signatory_2_position, signatory_3_name, signatory_3_position, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         serial_number = VALUES(serial_number),
         signatory_1_name = VALUES(signatory_1_name), signatory_1_position = VALUES(signatory_1_position),
         signatory_2_name = VALUES(signatory_2_name), signatory_2_position = VALUES(signatory_2_position),
         signatory_3_name = VALUES(signatory_3_name), signatory_3_position = VALUES(signatory_3_position)`,
      [
        uid, serialNumber, program,
        get("signatory1Name"), get("signatory1Position"),
        get("signatory2Name"), get("signatory2Position"),
        get("signatory3Name"), get("signatory3Position"),
        now,
      ],
    );
  },

  async getSerialNumbersByProgram(
    program: NSTProgram,
  ): Promise<Map<string, { serialNumber: string; createdAt: string; [key: string]: string | undefined }>> {
    const rows = await query<RowDataPacket[]>("SELECT * FROM serial_numbers WHERE program = ?", [program]);
    const map = new Map<string, { serialNumber: string; createdAt: string; [key: string]: string | undefined }>();
    for (const r of rows) {
      const entry: { serialNumber: string; createdAt: string; [key: string]: string | undefined } = {
        serialNumber: r.serial_number,
        createdAt: ts(r.created_at),
      };
      if (r.signatory_1_name) entry.signatory1Name = r.signatory_1_name;
      if (r.signatory_1_position) entry.signatory1Position = r.signatory_1_position;
      if (r.signatory_2_name) entry.signatory2Name = r.signatory_2_name;
      if (r.signatory_2_position) entry.signatory2Position = r.signatory_2_position;
      if (r.signatory_3_name) entry.signatory3Name = r.signatory_3_name;
      if (r.signatory_3_position) entry.signatory3Position = r.signatory_3_position;
      map.set(String(r.student_id), entry);
    }
    return map;
  },
};
