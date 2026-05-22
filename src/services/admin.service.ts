import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CWTSCompany, CWTS_COMPANIES, CWTS_COMPANY_SLOT_LIMIT,
  EnrollmentDocument, EnrollmentWithMs, EnrollmentSchedule, EnrollmentStatus, NSTProgram,
  StudentMsRecord,
  ROTCBattalion, ROTCCompany, ROTCPlatoon,
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
  ROTC_PLATOONS_PER_COMPANY, ROTC_PLATOON_SLOT_LIMIT,
  SpecialUnit, SPECIAL_UNIT_SLOT_LIMITS,
  AttendanceLocation, AttendanceSession, AttendanceStatus, ATTENDANCE_RADIUS_METERS,
  AttendanceRecord, AttendanceRecordStatus, StudentGrade, AttendanceOffense,
} from "@/types";

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

async function fetchMsRecordsByProgram(program: NSTProgram): Promise<StudentMsRecord[]> {
  const snap = await getDocs(query(collection(db, "student_ms_records"), where("program", "==", program)));
  return snap.docs.map((d) => d.data() as StudentMsRecord);
}

async function fetchMsRecordsByUid(uid: string): Promise<StudentMsRecord[]> {
  const snap = await getDocs(query(collection(db, "student_ms_records"), where("uid", "==", uid)));
  return snap.docs.map((d) => d.data() as StudentMsRecord);
}

async function fetchApprovedUids(program: NSTProgram): Promise<{ uids: string[]; msRecords: StudentMsRecord[] }> {
  const msRecords = await fetchMsRecordsByProgram(program);
  const byUid = new Map<string, StudentMsRecord[]>();
  for (const r of msRecords) {
    if (!byUid.has(r.uid)) byUid.set(r.uid, []);
    byUid.get(r.uid)!.push(r);
  }
  const uids: string[] = [];
  for (const [uid, records] of byUid) {
    const latest = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (latest?.status === "approved") uids.push(uid);
  }
  return { uids, msRecords };
}

async function batchFetchProfiles(uids: string[]): Promise<EnrollmentDocument[]> {
  if (uids.length === 0) return [];
  const profiles: EnrollmentDocument[] = [];
  const batchSize = 30;
  for (let i = 0; i < uids.length; i += batchSize) {
    const batch = uids.slice(i, i + batchSize);
    const q = query(collection(db, "account_reservations"), where("uid", "in", batch));
    const snap = await getDocs(q);
    profiles.push(...snap.docs.map((d) => d.data() as EnrollmentDocument));
  }
  return profiles;
}

async function findLatestMsRecordDoc(uid: string): Promise<{ docId: string; data: StudentMsRecord } | null> {
  const snap = await getDocs(query(collection(db, "student_ms_records"), where("uid", "==", uid)));
  if (snap.empty) return null;
  let latest: { docId: string; data: StudentMsRecord } | null = null;
  for (const d of snap.docs) {
    const data = d.data() as StudentMsRecord;
    if (!latest || new Date(data.createdAt).getTime() > new Date(latest.data.createdAt).getTime()) {
      latest = { docId: d.id, data };
    }
  }
  return latest;
}

export const adminService = {
  async getEnrollmentsByProgram(program: NSTProgram): Promise<EnrollmentWithMs[]> {
    const [enrollmentSnap, msRecords] = await Promise.all([
      getDocs(query(collection(db, "account_reservations"), where("nstpComponent", "==", program))),
      fetchMsRecordsByProgram(program),
    ]);
    const enrollments = enrollmentSnap.docs.map((d) => d.data() as EnrollmentDocument);
    return enrollments
      .map((e) => mergeWithMsRecords(e, msRecords))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getEnrollmentSchedule(program: NSTProgram, msLevel: string): Promise<EnrollmentSchedule | null> {
    const q = query(
      collection(db, "enrollment_schedules"),
      where("program", "==", program),
      where("msLevel", "==", msLevel),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const now = new Date();
    const open = snapshot.docs
      .map((d) => d.data() as EnrollmentSchedule)
      .find((s) => now >= new Date(s.openDate) && now <= new Date(s.deadline));
    return open ?? (snapshot.docs[0].data() as EnrollmentSchedule);
  },

  async getEnrollmentSchedules(program: NSTProgram): Promise<EnrollmentSchedule[]> {
    const q = query(
      collection(db, "enrollment_schedules"),
      where("program", "==", program),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as EnrollmentSchedule);
  },

  async saveEnrollmentSchedule(schedule: EnrollmentSchedule): Promise<void> {
    const ref = doc(db, "enrollment_schedules", `${schedule.program}_${schedule.msLevel}_${schedule.year}`);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Schedule for MS ${schedule.msLevel} — SY ${schedule.year} already exists.`);
    }
    const deadline = schedule.deadline.includes("T")
      ? schedule.deadline
      : `${schedule.deadline}T23:59:59`;
    await setDoc(ref, { ...schedule, deadline, updatedAt: new Date().toISOString() });
  },

  async updateEnrollmentStatus(uid: string, status: EnrollmentStatus, rejectionReason?: string): Promise<void> {
    const latest = await findLatestMsRecordDoc(uid);
    if (!latest) return;
    const data: Record<string, string> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (rejectionReason !== undefined) {
      data.rejectionReason = rejectionReason;
    }
    await updateDoc(doc(db, "student_ms_records", latest.docId), data);
  },

  async getSpecialUnitEnrollments(): Promise<Record<SpecialUnit, EnrollmentWithMs[]>> {
    const { uids, msRecords } = await fetchApprovedUids("ROTC");
    const profiles = await batchFetchProfiles(uids);
    const result: Record<SpecialUnit, EnrollmentWithMs[]> = { Medics: [], HQ: [], MP: [] };
    for (const p of profiles) {
      const merged = mergeWithMsRecords(p, msRecords);
      if (merged.specialUnit && result[merged.specialUnit]) {
        result[merged.specialUnit].push(merged);
      }
    }
    return result;
  },

  async getSpecialUnitCount(unit: SpecialUnit): Promise<number> {
    const { uids } = await fetchApprovedUids("ROTC");
    const profiles = await batchFetchProfiles(uids);
    return profiles.filter((p) => p.specialUnit === unit).length;
  },

  async approveWithSpecialUnit(uid: string, specialUnit: SpecialUnit): Promise<string | null> {
    const count = await this.getSpecialUnitCount(specialUnit);
    if (count >= SPECIAL_UNIT_SLOT_LIMITS[specialUnit]) return null;

    await updateDoc(doc(db, "account_reservations", uid), {
      specialUnit,
      updatedAt: new Date().toISOString(),
    });
    await this.updateEnrollmentStatus(uid, "approved");
    return specialUnit;
  },

  async getNextAvailableCWTSCompany(): Promise<CWTSCompany | null> {
    const { uids } = await fetchApprovedUids("CWTS");
    const profiles = await batchFetchProfiles(uids);

    const counts: Record<CWTSCompany, number> = {
      Alpha: 0, Bravo: 0, Charlie: 0, Delta: 0, Echo: 0, Foxtrot: 0,
    };
    for (const e of profiles) {
      if (e.company && counts[e.company] !== undefined) {
        counts[e.company]++;
      }
    }

    return CWTS_COMPANIES.find((c) => counts[c] < CWTS_COMPANY_SLOT_LIMIT) ?? null;
  },

  async getCWTSCompanyCounts(): Promise<Record<CWTSCompany, EnrollmentWithMs[]>> {
    const { uids, msRecords } = await fetchApprovedUids("CWTS");
    const profiles = await batchFetchProfiles(uids);

    const grouped: Record<CWTSCompany, EnrollmentWithMs[]> = {
      Alpha: [], Bravo: [], Charlie: [], Delta: [], Echo: [], Foxtrot: [],
    };
    for (const p of profiles) {
      const merged = mergeWithMsRecords(p, msRecords);
      if (merged.company && grouped[merged.company]) {
        grouped[merged.company].push(merged);
      }
    }
    return grouped;
  },

  async approveCWTSEnrollment(uid: string): Promise<CWTSCompany | null> {
    const company = await this.getNextAvailableCWTSCompany();
    if (!company) return null;

    await updateDoc(doc(db, "account_reservations", uid), {
      company,
      updatedAt: new Date().toISOString(),
    });
    await this.updateEnrollmentStatus(uid, "approved");
    return company;
  },

  // ─── ROTC ───

  async getROTCApprovedEnrollments(): Promise<EnrollmentWithMs[]> {
    const { uids, msRecords } = await fetchApprovedUids("ROTC");
    const profiles = await batchFetchProfiles(uids);
    return profiles.map((p) => mergeWithMsRecords(p, msRecords));
  },

  async assignROTCPlatoons(): Promise<{ assigned: number; alreadyAssigned: number }> {
    const enrollments = await this.getROTCApprovedEnrollments();

    const unassigned = enrollments.filter((e) => !e.rotcCompany && !e.willingToTakeAdvanceCourse && !e.specialUnit && !e.medicalCondition);
    const alreadyAssigned = enrollments.length - unassigned.length;
    if (unassigned.length === 0) return { assigned: 0, alreadyAssigned };

    const males = unassigned
      .filter((e) => e.sex === "Male")
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
    const females = unassigned
      .filter((e) => e.sex === "Female")
      .sort((a, b) => a.lastName.localeCompare(b.lastName));

    const existingMaleCounts = this.buildROTCSlotCounts(enrollments.filter((e) => e.sex === "Male" && e.rotcCompany && !e.specialUnit && !e.medicalCondition), ROTC_BATTALION_1_COMPANIES);
    const existingFemaleCounts = this.buildROTCSlotCounts(enrollments.filter((e) => e.sex === "Female" && e.rotcCompany && !e.specialUnit && !e.medicalCondition), ROTC_BATTALION_2_COMPANIES);

    const maleAssignments = this.computeROTCAssignments(males, 1, ROTC_BATTALION_1_COMPANIES, existingMaleCounts);
    const femaleAssignments = this.computeROTCAssignments(females, 2, ROTC_BATTALION_2_COMPANIES, existingFemaleCounts);

    const all = [...maleAssignments, ...femaleAssignments];

    const batchSize = 500;
    for (let i = 0; i < all.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = all.slice(i, i + batchSize);
      for (const a of chunk) {
        const ref = doc(db, "account_reservations", a.uid);
        batch.update(ref, {
          battalion: a.battalion,
          rotcCompany: a.rotcCompany,
          rotcPlatoon: a.rotcPlatoon,
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
    }

    return { assigned: all.length, alreadyAssigned };
  },

  buildROTCSlotCounts(
    assigned: EnrollmentWithMs[],
    companies: ROTCCompany[]
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
    slotCounts: Record<string, number>
  ): { uid: string; battalion: ROTCBattalion; rotcCompany: ROTCCompany; rotcPlatoon: ROTCPlatoon }[] {
    const results: { uid: string; battalion: ROTCBattalion; rotcCompany: ROTCCompany; rotcPlatoon: ROTCPlatoon }[] = [];
    let companyIdx = 0;
    let platoonNum = 1;

    // Fast-forward to the first slot with available space
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

  async getROTCRosterGrouped(): Promise<{
    battalion1: Record<ROTCCompany, Record<number, EnrollmentWithMs[]>>;
    battalion2: Record<ROTCCompany, Record<number, EnrollmentWithMs[]>>;
    advanceCourseMale: EnrollmentWithMs[];
    advanceCourseFemale: EnrollmentWithMs[];
  }> {
    const enrollments = await this.getROTCApprovedEnrollments();

    const buildEmpty = (companies: ROTCCompany[]) => {
      const result: Record<string, Record<number, EnrollmentWithMs[]>> = {};
      for (const c of companies) {
        result[c] = {};
        for (let p = 1; p <= ROTC_PLATOONS_PER_COMPANY; p++) {
          result[c][p] = [];
        }
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
      if (target[e.rotcCompany]?.[e.rotcPlatoon]) {
        target[e.rotcCompany][e.rotcPlatoon].push(e);
      }
    }

    return { battalion1, battalion2, advanceCourseMale, advanceCourseFemale };
  },

  // ─── Attendance ────────────────────────────────────────────────

  async getSessionsByProgram(program: NSTProgram, isAdvanceCourse?: boolean): Promise<AttendanceSession[]> {
    const snap = await getDocs(
      query(collection(db, "create_attendance"), where("program", "==", program))
    );
    const sessions = snap.docs.map((d) => d.data() as AttendanceSession);
    return sessions.filter((s) => {
      if (isAdvanceCourse) return !!s.isAdvanceCourse;
      if (program === "ROTC") return !s.isAdvanceCourse;
      return true;
    });
  },

  async autoCloseExpiredSessions(): Promise<number> {
    const LATE_THRESHOLD_MINUTES = 15;
    const snap = await getDocs(collection(db, "create_attendance"));
    const now = new Date();
    let closed = 0;

    console.log(`[AutoClose] Fetched ${snap.docs.length} session(s). Now = ${now.toISOString()}`);

    for (const d of snap.docs) {
      const s = d.data() as AttendanceSession;
      if (s.status === "closed") continue;

      const closeTime = new Date(s.closeDate).getTime();
      const lateDeadline = new Date(closeTime + LATE_THRESHOLD_MINUTES * 60 * 1000);

      console.log(
        `[AutoClose] Session ${s.id} | status=${s.status} | closeDate=${s.closeDate} | ` +
        `parsedClose=${new Date(closeTime).toISOString()} | lateDeadline=${lateDeadline.toISOString()} | ` +
        `shouldClose=${now >= lateDeadline}`
      );

      if (now >= lateDeadline) {
        try {
          await updateDoc(doc(db, "create_attendance", s.id), { status: "closed" });
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

  async getAllAttendanceSessions(): Promise<AttendanceSession[]> {
    const snap = await getDocs(collection(db, "create_attendance"));
    const sessions = snap.docs.map((d) => d.data() as AttendanceSession);
    return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAbsentStudents(sessionId: string, program: string, isAdvanceCourse?: boolean, miNumber?: number, miType?: "in" | "out"): Promise<void> {
    const { uids } = await fetchApprovedUids(program as NSTProgram);
    const profiles = await batchFetchProfiles(uids);
    if (profiles.length === 0) return;

    const recordsSnap = await getDocs(
      query(collection(db, "attendance_list"), where("attendanceSessionId", "==", sessionId))
    );
    const markedUids = new Set(recordsSnap.docs.map((d) => d.data().studentUid as string));

    const now = new Date().toISOString();
    const batch = writeBatch(db);
    let count = 0;

    for (const data of profiles) {
      if (markedUids.has(data.uid)) continue;

      if (program === "ROTC") {
        const studentIsAdvance = !!data.willingToTakeAdvanceCourse;
        if (isAdvanceCourse && !studentIsAdvance) continue;
        if (!isAdvanceCourse && studentIsAdvance) continue;
      }

      const ref = doc(collection(db, "attendance_list"));
      batch.set(ref, {
        id: ref.id,
        studentUid: data.uid,
        attendanceSessionId: sessionId,
        status: "absent",
        ...(miNumber != null && { miNumber }),
        ...(miType != null && { miType }),
        createdAt: now,
        updatedAt: now,
      } satisfies AttendanceRecord);
      count++;
    }

    if (count > 0) await batch.commit();
  },

  async getSessionAttendanceRecords(sessionId: string): Promise<(AttendanceRecord & { student?: EnrollmentWithMs })[]> {
    const recordsSnap = await getDocs(
      query(collection(db, "attendance_list"), where("attendanceSessionId", "==", sessionId))
    );
    const records = recordsSnap.docs.map((d) => d.data() as AttendanceRecord);

    const studentUids = [...new Set(records.map((r) => r.studentUid))];
    const studentMap = new Map<string, EnrollmentWithMs>();

    for (const uid of studentUids) {
      const [snap, msRecords] = await Promise.all([
        getDoc(doc(db, "account_reservations", uid)),
        fetchMsRecordsByUid(uid),
      ]);
      if (snap.exists()) {
        studentMap.set(uid, mergeWithMsRecords(snap.data() as EnrollmentDocument, msRecords));
      }
    }

    return records.map((r) => ({ ...r, student: studentMap.get(r.studentUid) }));
  },

  async getAttendanceSessionsByDate(program: string, date: string): Promise<AttendanceSession[]> {
    const snap = await getDocs(
      query(collection(db, "create_attendance"), where("program", "==", program))
    );
    return snap.docs
      .map((d) => d.data() as AttendanceSession)
      .filter((s) => s.openDate.startsWith(date))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAttendanceSummary(sessionId: string, program: string): Promise<{
    records: (AttendanceRecord & { student?: EnrollmentWithMs })[];
    enrolledStudents: EnrollmentWithMs[];
  }> {
    const { uids, msRecords } = await fetchApprovedUids(program as NSTProgram);
    const [recordsSnap, profiles] = await Promise.all([
      getDocs(query(collection(db, "attendance_list"), where("attendanceSessionId", "==", sessionId))),
      batchFetchProfiles(uids),
    ]);

    const enrolledStudents = profiles.map((p) => mergeWithMsRecords(p, msRecords));
    const studentMap = new Map(enrolledStudents.map((s) => [s.uid, s]));

    const records = recordsSnap.docs.map((d) => {
      const record = d.data() as AttendanceRecord;
      return { ...record, student: studentMap.get(record.studentUid) };
    });

    return { records, enrolledStudents };
  },

  async createAttendanceSession(data: {
    program: NSTProgram;
    isAdvanceCourse?: boolean;
    miNumber?: number;
    miType?: "in" | "out";
    openDate: string;
    closeDate: string;
    location: AttendanceLocation;
    createdBy: string;
  }): Promise<string> {
    const ref = doc(collection(db, "create_attendance"));

    const now = new Date();
    const open = new Date(data.openDate);
    const close = new Date(data.closeDate);

    let status: AttendanceStatus = "scheduled";
    if (now >= open && now < close) status = "open";
    else if (now >= close) status = "closed";

    const session: AttendanceSession = {
      id: ref.id,
      program: data.program,
      ...(data.isAdvanceCourse ? { isAdvanceCourse: true } : {}),
      ...(data.miNumber ? { miNumber: data.miNumber } : {}),
      ...(data.miType ? { miType: data.miType } : {}),
      openDate: data.openDate,
      closeDate: data.closeDate,
      location: data.location,
      radiusMeters: ATTENDANCE_RADIUS_METERS,
      status,
      createdAt: now.toISOString(),
      createdBy: data.createdBy,
    };

    await setDoc(ref, session);
    return ref.id;
  },

  // ─── Grades ─────────────────────────────────────────────────────

  async getApprovedEnrollmentsByProgram(program: NSTProgram): Promise<EnrollmentWithMs[]> {
    const { uids, msRecords } = await fetchApprovedUids(program);
    const profiles = await batchFetchProfiles(uids);
    return profiles
      .map((p) => mergeWithMsRecords(p, msRecords))
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  },

  async getStudentGradesByMs(msLevel: "ms1" | "ms2", program: NSTProgram): Promise<Map<string, StudentGrade>> {
    const q = query(
      collection(db, "student_grades", msLevel, "students"),
      where("program", "==", program),
    );
    const snapshot = await getDocs(q);
    const map = new Map<string, StudentGrade>();
    for (const d of snapshot.docs) {
      const grade = d.data() as StudentGrade;
      map.set(grade.student_uid, grade);
    }
    return map;
  },

  async saveStudentGrade(uid: string, program: NSTProgram, msLevel: "ms1" | "ms2", grade: number, midterm?: number, finalTerm?: number): Promise<void> {
    const ref = doc(db, "student_grades", msLevel, "students", uid);
    const status: "Passed" | "Failed" = grade >= 1.0 && grade <= 3.0 ? "Passed" : "Failed";
    const now = new Date().toISOString();
    const existing = await getDoc(ref);
    const data: Record<string, unknown> = { student_uid: uid, grade, status, program, updatedAt: now };
    if (midterm !== undefined) data.midterm = midterm;
    if (finalTerm !== undefined) data.finalTerm = finalTerm;
    data.createdAt = existing.exists() ? (existing.data().createdAt || now) : now;
    await setDoc(ref, data);
  },

  async saveStudentGradesBatch(updates: { uid: string; program: NSTProgram; msLevel: "ms1" | "ms2"; grade: number }[]): Promise<void> {
    const batchSize = 500;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = updates.slice(i, i + batchSize);
      const now = new Date().toISOString();
      for (const u of chunk) {
        const ref = doc(db, "student_grades", u.msLevel, "students", u.uid);
        const status: "Passed" | "Failed" = u.grade >= 1.0 && u.grade <= 3.0 ? "Passed" : "Failed";
        batch.set(ref, { student_uid: u.uid, grade: u.grade, status, program: u.program, createdAt: now, updatedAt: now });
      }
      await batch.commit();
    }
  },

  async updateAttendanceStatus(recordId: string, newStatus: AttendanceRecordStatus): Promise<void> {
    const ref = doc(db, "attendance_list", recordId);
    await updateDoc(ref, { status: newStatus, updatedAt: new Date().toISOString() });
  },

  async getAllAttendanceOffenses(): Promise<(AttendanceOffense & { student?: EnrollmentWithMs })[]> {
    const offenseSnap = await getDocs(collection(db, "attendance_offenses"));
    if (offenseSnap.empty) return [];

    const offenses = offenseSnap.docs.map((d) => d.data() as AttendanceOffense);
    const uids = offenses.map((o) => o.student_uid);

    const enrollmentMap = new Map<string, EnrollmentWithMs>();
    const batchSize = 10;
    for (let i = 0; i < uids.length; i += batchSize) {
      const batch = uids.slice(i, i + batchSize);
      const q = query(collection(db, "account_reservations"), where("uid", "in", batch));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const data = d.data() as EnrollmentDocument;
        const msRecords = await fetchMsRecordsByUid(data.uid);
        enrollmentMap.set(data.uid, mergeWithMsRecords(data, msRecords));
      }
    }

    return offenses.map((o) => ({ ...o, student: enrollmentMap.get(o.student_uid) }));
  },

  async getAttendanceOffense(uid: string): Promise<AttendanceOffense | null> {
    const snap = await getDoc(doc(db, "attendance_offenses", uid));
    return snap.exists() ? (snap.data() as AttendanceOffense) : null;
  },

  async recordAttendanceOffense(uid: string): Promise<AttendanceOffense> {
    const ref = doc(db, "attendance_offenses", uid);
    const now = new Date().toISOString();
    const existing = await getDoc(ref);

    if (existing.exists()) {
      const data = existing.data() as AttendanceOffense;
      const newOffend = Math.min(data.offend + 1, 2);
      const updated: AttendanceOffense = {
        ...data,
        offend: newOffend,
        settled: newOffend >= 2 ? false : data.settled,
        updatedAt: now,
      };
      await setDoc(ref, updated);
      return updated;
    } else {
      const offense: AttendanceOffense = {
        student_uid: uid,
        offend: 1,
        settled: false,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(ref, offense);
      return offense;
    }
  },

  async settleAttendanceOffense(uid: string): Promise<void> {
    const ref = doc(db, "attendance_offenses", uid);
    await updateDoc(ref, { settled: true, updatedAt: new Date().toISOString() });
  },

  async updateEnrollmentFields(uid: string, fields: Partial<EnrollmentDocument>): Promise<void> {
    const ref = doc(db, "account_reservations", uid);
    await updateDoc(ref, { ...fields, updatedAt: new Date().toISOString() });
  },

  async getStudentAttendanceRecords(studentUid: string): Promise<AttendanceRecord[]> {
    const q = query(collection(db, "attendance_list"), where("studentUid", "==", studentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AttendanceRecord);
  },

  async saveSignatorySettings(program: NSTProgram, settings: Record<string, string | null>): Promise<void> {
    const ref = doc(db, "serial_number_settings", program);
    await setDoc(ref, { ...settings, program, updatedAt: new Date().toISOString() }, { merge: true });
  },

  async getSignatorySettings(program: NSTProgram): Promise<Record<string, string> | null> {
    const snap = await getDoc(doc(db, "serial_number_settings", program));
    if (!snap.exists()) return null;
    return snap.data() as Record<string, string>;
  },

  async saveSerialNumber(uid: string, serialNumber: string, program: NSTProgram, signatories: Record<string, string>): Promise<void> {
    const ref = doc(db, "serial_number", uid);
    await setDoc(ref, {
      uid,
      serialNumber,
      program,
      ...signatories,
      createdAt: new Date().toISOString(),
    });
  },

  async getSerialNumbersByProgram(program: NSTProgram): Promise<Map<string, { serialNumber: string; createdAt: string; [key: string]: string | undefined }>> {
    const q = query(collection(db, "serial_number"), where("program", "==", program));
    const snap = await getDocs(q);
    const map = new Map<string, { serialNumber: string; createdAt: string; [key: string]: string | undefined }>();
    for (const d of snap.docs) {
      const data = d.data();
      map.set(data.uid, { ...data, serialNumber: data.serialNumber, createdAt: data.createdAt } as { serialNumber: string; createdAt: string; [key: string]: string | undefined });
    }
    return map;
  },

  async getStudentGrades(studentUid: string): Promise<{ ms1?: StudentGrade; ms2?: StudentGrade }> {
    const [ms1Snap, ms2Snap] = await Promise.all([
      getDoc(doc(db, "student_grades", "ms1", "students", studentUid)),
      getDoc(doc(db, "student_grades", "ms2", "students", studentUid)),
    ]);
    return {
      ms1: ms1Snap.exists() ? (ms1Snap.data() as StudentGrade) : undefined,
      ms2: ms2Snap.exists() ? (ms2Snap.data() as StudentGrade) : undefined,
    };
  },
};
