import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EnrollmentDocument } from "@/types";

export const studentService = {
  async getProfile(uid: string): Promise<EnrollmentDocument | null> {
    const snap = await getDoc(doc(db, "account_reservations", uid));
    if (!snap.exists()) return null;
    return snap.data() as EnrollmentDocument;
  },
};
