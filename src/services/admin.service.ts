import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CWTSCompany, CWTS_COMPANIES, CWTS_COMPANY_SLOT_LIMIT,
  EnrollmentDocument, EnrollmentSchedule, EnrollmentStatus, NSTProgram,
  ROTCBattalion, ROTCCompany, ROTCPlatoon,
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
  ROTC_PLATOONS_PER_COMPANY, ROTC_PLATOON_SLOT_LIMIT,
  AttendanceLocation, AttendanceSession, AttendanceStatus, ATTENDANCE_RADIUS_METERS,
  AttendanceRecord,
} from "@/types";

export const adminService = {
  async getEnrollmentsByProgram(program: NSTProgram): Promise<EnrollmentDocument[]> {
    const q = query(
      collection(db, "account_reservations"),
      where("nstpComponent", "==", program)
    );
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map((doc) => doc.data() as EnrollmentDocument);
    
    return enrollments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getEnrollmentSchedule(program: NSTProgram): Promise<EnrollmentSchedule | null> {
    const ref = doc(db, "enrollment_schedules", program);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return snapshot.data() as EnrollmentSchedule;
  },

  async saveEnrollmentSchedule(schedule: EnrollmentSchedule): Promise<void> {
    const ref = doc(db, "enrollment_schedules", schedule.program);
    await setDoc(ref, { ...schedule, updatedAt: new Date().toISOString() });
  },

  async updateEnrollmentStatus(uid: string, status: EnrollmentStatus, rejectionReason?: string): Promise<void> {
    const ref = doc(db, "account_reservations", uid);
    const data: Record<string, string> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (rejectionReason !== undefined) {
      data.rejectionReason = rejectionReason;
    }
    await updateDoc(ref, data);
  },

  async getNextAvailableCWTSCompany(): Promise<CWTSCompany | null> {
    const q = query(
      collection(db, "account_reservations"),
      where("nstpComponent", "==", "CWTS"),
      where("status", "==", "approved")
    );
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map((d) => d.data() as EnrollmentDocument);

    const counts: Record<CWTSCompany, number> = {
      Alpha: 0, Bravo: 0, Charlie: 0, Delta: 0, Echo: 0, Foxtrot: 0,
    };
    for (const e of enrollments) {
      if (e.company && counts[e.company] !== undefined) {
        counts[e.company]++;
      }
    }

    return CWTS_COMPANIES.find((c) => counts[c] < CWTS_COMPANY_SLOT_LIMIT) ?? null;
  },

  async getCWTSCompanyCounts(): Promise<Record<CWTSCompany, EnrollmentDocument[]>> {
    const q = query(
      collection(db, "account_reservations"),
      where("nstpComponent", "==", "CWTS"),
      where("status", "==", "approved")
    );
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map((d) => d.data() as EnrollmentDocument);

    const grouped: Record<CWTSCompany, EnrollmentDocument[]> = {
      Alpha: [], Bravo: [], Charlie: [], Delta: [], Echo: [], Foxtrot: [],
    };
    for (const e of enrollments) {
      if (e.company && grouped[e.company]) {
        grouped[e.company].push(e);
      }
    }
    return grouped;
  },

  async approveCWTSEnrollment(uid: string): Promise<CWTSCompany | null> {
    const company = await this.getNextAvailableCWTSCompany();
    if (!company) return null;

    const ref = doc(db, "account_reservations", uid);
    await updateDoc(ref, {
      status: "approved",
      company,
      updatedAt: new Date().toISOString(),
    });
    return company;
  },

  // ─── ROTC ───

  async getROTCApprovedEnrollments(): Promise<EnrollmentDocument[]> {
    const q = query(
      collection(db, "account_reservations"),
      where("nstpComponent", "==", "ROTC"),
      where("status", "==", "approved")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as EnrollmentDocument);
  },

  async assignROTCPlatoons(): Promise<{ assigned: number; alreadyAssigned: number }> {
    const enrollments = await this.getROTCApprovedEnrollments();

    const unassigned = enrollments.filter((e) => !e.rotcCompany);
    const alreadyAssigned = enrollments.length - unassigned.length;
    if (unassigned.length === 0) return { assigned: 0, alreadyAssigned };

    const males = unassigned
      .filter((e) => e.sex === "Male")
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
    const females = unassigned
      .filter((e) => e.sex === "Female")
      .sort((a, b) => a.lastName.localeCompare(b.lastName));

    const existingMaleCounts = this.buildROTCSlotCounts(enrollments.filter((e) => e.sex === "Male" && e.rotcCompany), ROTC_BATTALION_1_COMPANIES);
    const existingFemaleCounts = this.buildROTCSlotCounts(enrollments.filter((e) => e.sex === "Female" && e.rotcCompany), ROTC_BATTALION_2_COMPANIES);

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
    assigned: EnrollmentDocument[],
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
    cadets: EnrollmentDocument[],
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
    battalion1: Record<ROTCCompany, Record<number, EnrollmentDocument[]>>;
    battalion2: Record<ROTCCompany, Record<number, EnrollmentDocument[]>>;
  }> {
    const enrollments = await this.getROTCApprovedEnrollments();

    const buildEmpty = (companies: ROTCCompany[]) => {
      const result: Record<string, Record<number, EnrollmentDocument[]>> = {};
      for (const c of companies) {
        result[c] = {};
        for (let p = 1; p <= ROTC_PLATOONS_PER_COMPANY; p++) {
          result[c][p] = [];
        }
      }
      return result as Record<ROTCCompany, Record<number, EnrollmentDocument[]>>;
    };

    const battalion1 = buildEmpty(ROTC_BATTALION_1_COMPANIES);
    const battalion2 = buildEmpty(ROTC_BATTALION_2_COMPANIES);

    for (const e of enrollments) {
      if (!e.rotcCompany || !e.rotcPlatoon) continue;
      const target = e.battalion === 1 ? battalion1 : battalion2;
      if (target[e.rotcCompany]?.[e.rotcPlatoon]) {
        target[e.rotcCompany][e.rotcPlatoon].push(e);
      }
    }

    return { battalion1, battalion2 };
  },

  // ─── Attendance ────────────────────────────────────────────────

  async getAllAttendanceSessions(): Promise<AttendanceSession[]> {
    const snap = await getDocs(collection(db, "create_attendance"));
    const now = new Date();
    const sessions = snap.docs.map((d) => d.data() as AttendanceSession);

    const LATE_THRESHOLD_MINUTES = 15;
    const expiredSessions = sessions.filter((s) => {
      if (s.status === "closed") return false;
      const lateDeadline = new Date(
        new Date(s.closeDate).getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000
      );
      return now >= lateDeadline;
    });

    for (const s of expiredSessions) {
      await updateDoc(doc(db, "create_attendance", s.id), { status: "closed" });
      s.status = "closed";
      await this.markAbsentStudents(s.id, s.program);
    }

    return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAbsentStudents(sessionId: string, program: string): Promise<void> {
    const enrolledSnap = await getDocs(
      query(collection(db, "account_reservations"), where("nstpComponent", "==", program), where("status", "==", "approved"))
    );
    if (enrolledSnap.empty) return;

    const recordsSnap = await getDocs(
      query(collection(db, "attendance_list"), where("attendanceSessionId", "==", sessionId))
    );
    const markedUids = new Set(recordsSnap.docs.map((d) => d.data().studentUid as string));

    const now = new Date().toISOString();
    const batch = writeBatch(db);
    let count = 0;

    for (const enrolled of enrolledSnap.docs) {
      const uid = enrolled.data().uid as string;
      if (markedUids.has(uid)) continue;
      const ref = doc(collection(db, "attendance_list"));
      batch.set(ref, {
        id: ref.id,
        studentUid: uid,
        attendanceSessionId: sessionId,
        status: "absent",
        createdAt: now,
        updatedAt: now,
      } satisfies AttendanceRecord);
      count++;
    }

    if (count > 0) await batch.commit();
  },

  async getSessionAttendanceRecords(sessionId: string): Promise<(AttendanceRecord & { student?: EnrollmentDocument })[]> {
    const recordsSnap = await getDocs(
      query(collection(db, "attendance_list"), where("attendanceSessionId", "==", sessionId))
    );
    const records = recordsSnap.docs.map((d) => d.data() as AttendanceRecord);

    const studentUids = [...new Set(records.map((r) => r.studentUid))];
    const studentMap = new Map<string, EnrollmentDocument>();

    for (const uid of studentUids) {
      const snap = await getDoc(doc(db, "account_reservations", uid));
      if (snap.exists()) studentMap.set(uid, snap.data() as EnrollmentDocument);
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
    records: (AttendanceRecord & { student?: EnrollmentDocument })[];
    enrolledStudents: EnrollmentDocument[];
  }> {
    const [recordsSnap, enrolledSnap] = await Promise.all([
      getDocs(query(collection(db, "attendance_list"), where("attendanceSessionId", "==", sessionId))),
      getDocs(query(collection(db, "account_reservations"), where("nstpComponent", "==", program), where("status", "==", "approved"))),
    ]);

    const enrolledStudents = enrolledSnap.docs.map((d) => d.data() as EnrollmentDocument);
    const studentMap = new Map(enrolledStudents.map((s) => [s.uid, s]));

    const records = recordsSnap.docs.map((d) => {
      const record = d.data() as AttendanceRecord;
      return { ...record, student: studentMap.get(record.studentUid) };
    });

    return { records, enrolledStudents };
  },

  async createAttendanceSession(data: {
    program: NSTProgram;
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
};
