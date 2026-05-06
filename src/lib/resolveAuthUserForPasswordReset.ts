import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

/**
 * Finds the Firebase Auth user for password reset.
 * 1) getUserByEmail (normalized)
 * 2) Look up `account_reservations` by exact email variants, then getUser(uid) — doc id is the Auth uid from enrollment
 */
export async function resolveAuthUserForPasswordReset(
  auth: Auth,
  db: Firestore,
  emailRaw: string
): Promise<{ uid: string; sendTo: string } | null> {
  const raw = emailRaw.trim();
  if (!raw) return null;
  const normalized = raw.toLowerCase();

  try {
    const u = await auth.getUserByEmail(normalized);
    return { uid: u.uid, sendTo: u.email ?? normalized };
  } catch {
    /* try enrollment */
  }

  const variants = [...new Set([normalized, raw, raw.toUpperCase()])];
  for (const v of variants) {
    const snap = await db.collection("account_reservations").where("email", "==", v).limit(1).get();
    if (!snap.empty) {
      const uid = snap.docs[0].id;
      try {
        const u = await auth.getUser(uid);
        const row = snap.docs[0].data() as { email?: string };
        return { uid: u.uid, sendTo: u.email ?? row.email ?? normalized };
      } catch {
        /* missing Auth user for this enrollment uid */
      }
    }
  }

  return null;
}
