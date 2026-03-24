import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EnrollmentDocument, NSTProgram } from "@/types";

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
};
