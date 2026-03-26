import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CWTSCompany, CWTS_COMPANIES, CWTS_COMPANY_SLOT_LIMIT, EnrollmentDocument, EnrollmentSchedule, EnrollmentStatus, NSTProgram } from "@/types";

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
};
