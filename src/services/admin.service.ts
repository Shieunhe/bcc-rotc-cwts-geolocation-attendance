import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EnrollmentDocument, EnrollmentSchedule, EnrollmentStatus, NSTProgram } from "@/types";

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
};
