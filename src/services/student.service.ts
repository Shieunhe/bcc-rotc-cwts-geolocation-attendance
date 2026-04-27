import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EnrollmentDocument, AttendanceSession, AttendanceRecord, AttendanceRecordStatus, StudentGrade, AttendanceOffense } from "@/types";

export const studentService = {
  async getProfile(uid: string): Promise<EnrollmentDocument | null> {
    const snap = await getDoc(doc(db, "account_reservations", uid));
    if (!snap.exists()) return null;
    return snap.data() as EnrollmentDocument;
  },

  async getAttendanceSessions(): Promise<AttendanceSession[]> {
    const snap = await getDocs(collection(db, "create_attendance"));
    return snap.docs.map((d) => d.data() as AttendanceSession);
  },

  async markAbsentStudents(sessionId: string, program: string, isAdvanceCourse?: boolean, miNumber?: number, miType?: "in" | "out"): Promise<void> {
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
      const data = enrolled.data() as EnrollmentDocument;
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

  async getSerialNumber(uid: string): Promise<{ serialNumber: string; createdAt: string; commandant?: string; schoolRegistrar?: string } | null> {
    const snap = await getDoc(doc(db, "serial_number", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { serialNumber: data.serialNumber, createdAt: data.createdAt, commandant: data.commandant, schoolRegistrar: data.schoolRegistrar };
  },
};
