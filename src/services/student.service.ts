import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EnrollmentDocument, EnrollmentWithMs, StudentMsRecord, AttendanceSession, AttendanceRecord, AttendanceRecordStatus, StudentGrade, AttendanceOffense } from "@/types";

function mergeWithMsRecords(enrollment: EnrollmentDocument, msRecords: StudentMsRecord[]): EnrollmentWithMs {
  const records = msRecords.filter((r) => r.uid === enrollment.uid);
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

export const studentService = {
  async getProfile(uid: string): Promise<EnrollmentWithMs | null> {
    const snap = await getDoc(doc(db, "account_reservations", uid));
    if (!snap.exists()) return null;
    const enrollment = snap.data() as EnrollmentDocument;
    const msSnap = await getDocs(query(collection(db, "student_ms_records"), where("uid", "==", uid)));
    const msRecords = msSnap.docs.map((d) => d.data() as StudentMsRecord);
    return mergeWithMsRecords(enrollment, msRecords);
  },

  async getStudentMsRecords(uid: string): Promise<StudentMsRecord[]> {
    const snap = await getDocs(query(collection(db, "student_ms_records"), where("uid", "==", uid)));
    return snap.docs.map((d) => d.data() as StudentMsRecord);
  },

  async getAttendanceSessions(): Promise<AttendanceSession[]> {
    const snap = await getDocs(collection(db, "create_attendance"));
    return snap.docs.map((d) => d.data() as AttendanceSession);
  },

  async markAbsentStudents(sessionId: string, program: string, isAdvanceCourse?: boolean, miNumber?: number, miType?: "in" | "out"): Promise<void> {
    const msSnap = await getDocs(query(collection(db, "student_ms_records"), where("program", "==", program)));
    const msRecords = msSnap.docs.map((d) => d.data() as StudentMsRecord);
    const byUid = new Map<string, StudentMsRecord[]>();
    for (const r of msRecords) {
      if (!byUid.has(r.uid)) byUid.set(r.uid, []);
      byUid.get(r.uid)!.push(r);
    }
    const approvedUids: string[] = [];
    for (const [uid, records] of byUid) {
      const latest = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      if (latest?.status === "approved") approvedUids.push(uid);
    }
    if (approvedUids.length === 0) return;
    const profiles: EnrollmentDocument[] = [];
    const bSize = 30;
    for (let i = 0; i < approvedUids.length; i += bSize) {
      const batch = approvedUids.slice(i, i + bSize);
      const q2 = query(collection(db, "account_reservations"), where("uid", "in", batch));
      const snap2 = await getDocs(q2);
      profiles.push(...snap2.docs.map((d) => d.data() as EnrollmentDocument));
    }
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

  async getAttendanceRecord(studentUid: string, attendanceSessionId: string): Promise<AttendanceRecord | null> {
    const q = query(
      collection(db, "attendance_list"),
      where("studentUid", "==", studentUid),
      where("attendanceSessionId", "==", attendanceSessionId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as AttendanceRecord;
  },

  async markAttendance(studentUid: string, attendanceSessionId: string, status: AttendanceRecordStatus, miNumber?: number, miType?: "in" | "out"): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(collection(db, "attendance_list"));
    const record: AttendanceRecord = {
      id: docRef.id,
      studentUid,
      attendanceSessionId,
      status,
      ...(miNumber != null && { miNumber }),
      ...(miType != null && { miType }),
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, record);
  },

  async getStudentGrades(uid: string): Promise<{ ms1: StudentGrade | null; ms2: StudentGrade | null }> {
    const [ms1Snap, ms2Snap] = await Promise.all([
      getDoc(doc(db, "student_grades", "ms1", "students", uid)),
      getDoc(doc(db, "student_grades", "ms2", "students", uid)),
    ]);
    return {
      ms1: ms1Snap.exists() ? (ms1Snap.data() as StudentGrade) : null,
      ms2: ms2Snap.exists() ? (ms2Snap.data() as StudentGrade) : null,
    };
  },

  async getAttendanceOffense(uid: string): Promise<AttendanceOffense | null> {
    const snap = await getDoc(doc(db, "attendance_offenses", uid));
    return snap.exists() ? (snap.data() as AttendanceOffense) : null;
  },

  async acknowledgeWarning(uid: string): Promise<void> {
    const ref = doc(db, "attendance_offenses", uid);
    await updateDoc(ref, { warningAcknowledgedAt: new Date().toISOString() });
  },

  async getSerialNumber(uid: string): Promise<Record<string, string> | null> {
    const snap = await getDoc(doc(db, "serial_number", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data as Record<string, string>;
  },

  async getSignatorySettings(program: string): Promise<Record<string, string> | null> {
    const snap = await getDoc(doc(db, "serial_number_settings", program));
    if (!snap.exists()) return null;
    return snap.data() as Record<string, string>;
  },
};
