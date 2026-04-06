import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EnrollmentDocument, AttendanceSession } from "@/types";

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

    const closeExpired = sessions
      .filter((s) => {
        if (s.status === "closed") return false;
        const lateDeadline = new Date(
          new Date(s.closeDate).getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000
        );
        return now >= lateDeadline;
      })
      .map((s) =>
        updateDoc(doc(db, "create_attendance", s.id), { status: "closed" }).then(() => {
          s.status = "closed";
        })
      );

    await Promise.all(closeExpired);

    return sessions;
  },
};
