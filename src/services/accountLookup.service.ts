/**
 * Looks up enrollment email in Firestore (`account_reservations`) while the user is signed out.
 * Your Firestore security rules must allow this query for unauthenticated clients, or the call will
 * fail (handled as a generic error). Typical options: a Cloud Function + Admin SDK, or narrow rules
 * (e.g. only `email` + `uid` fields via a dedicated collection).
 */
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EnrollmentDocument } from "@/types";

/**
 * Same emails routed in LoginForm — these users exist in Firebase Auth and may not have a Firestore enrollment doc.
 * Keep in sync with `LoginForm` admin redirects.
 */
const ADMIN_AUTH_EMAILS = new Set(["rotc@admin.com", "cwts@admin.com", "officer@admin.com"]);

export interface AccountLookupResult {
  found: boolean;
  email?: string;
  displayName?: string;
  /** Set when Firestore fails (e.g. rules/network), distinct from “no match”. */
  lookupError?: string;
}

export async function lookupAccountByEmail(rawEmail: string): Promise<AccountLookupResult> {
  const trimmed = rawEmail.trim();
  if (!trimmed) return { found: false };

  const lower = trimmed.toLowerCase();

  if (ADMIN_AUTH_EMAILS.has(lower)) {
    return { found: true, email: trimmed, displayName: "Administrator" };
  }

  try {
    const candidates = [...new Set([trimmed, lower])];
    for (const candidate of candidates) {
      const q = query(collection(db, "account_reservations"), where("email", "==", candidate), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data() as EnrollmentDocument;
        const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
        const displayName = name || data.username || data.email || trimmed;
        return { found: true, email: data.email ?? trimmed, displayName };
      }
    }
  } catch {
    return {
      found: false,
      lookupError: "Unable to check your email right now. Try again later.",
    };
  }

  return { found: false };
}
