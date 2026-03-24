import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EnrollmentDocument, NSTProgram } from "@/types";

export const adminService = {
  async getEnrollmentsByProgram(program: NSTProgram): Promise<EnrollmentDocument[]> {
    const q = query(
      collection(db, "account_reservations"),
      where("nstpComponent", "==", program),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as EnrollmentDocument);
  },
};
