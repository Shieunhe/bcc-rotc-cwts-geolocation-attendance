import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EnrollmentDocument, AttendanceSession, AttendanceRecord, AttendanceRecordStatus, StudentGrade } from "@/types";


const LATE_THRESHOLD_MINUTES = 15;

export const studentService = {
  async getProfile(uid: string): Promise<EnrollmentDocument | null> {
    const snap = await getDoc(doc(db, "account_reservations", uid));
    if (!snap.exists()) return null;
    return snap.data() as EnrollmentDocument;
  },

  async getAttendanceSessions(): Promise<AttendanceSession[]> {
    const snap = await getDocs(collection(db, "create_attendance"));
    const now = new Date();
    const sessions = snap.docs.map((d) => d.data() as AttendanceSession);

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
      await this.markAbsentStudents(s.id, s.program, s.isAdvanceCourse);
    }

    return sessions;
  },

  async markAbsentStudents(sessionId: string, program: string, isAdvanceCourse?: boolean): Promise<void> {
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

  async markAttendance(studentUid: string, attendanceSessionId: string, status: AttendanceRecordStatus): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(collection(db, "attendance_list"));
    const record: AttendanceRecord = {
      id: docRef.id,
      studentUid,
      attendanceSessionId,
      status,
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
};
