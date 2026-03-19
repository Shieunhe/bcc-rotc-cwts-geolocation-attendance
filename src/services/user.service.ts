// import { doc, setDoc, getDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { StudentProfile } from "@/types";

// export const userService = {
//   async createProfile(uid: string, data: Omit<StudentProfile, "uid">): Promise<void> {
//     await setDoc(doc(db, "users", uid), { uid, ...data });
//   },

//   async getProfile(uid: string): Promise<StudentProfile | null> {
//     const snap = await getDoc(doc(db, "users", uid));
//     return snap.exists() ? (snap.data() as StudentProfile) : null;
//   },
// };
