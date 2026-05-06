import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { Timestamp } from "firebase-admin/firestore";
import {
  FIREBASE_ADMIN_CREDENTIAL_HELP,
  FIREBASE_ADMIN_JWT_TIME_HELP,
  getAdminAuth,
  getAdminDb,
  isFirebaseCredentialRejected,
  isFirebaseJwtTimeError,
} from "@/lib/firebaseAdmin";
import { resolveAuthUserForPasswordReset } from "@/lib/resolveAuthUserForPasswordReset";

export const runtime = "nodejs";

const PASSWORD_RESET_COLLECTION = "password_reset_codes";
const CODE_FIELD = "verification-code";
const EXPIRES_FIELD = "verification-code-expires-at";

function expiresToMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as Timestamp).toMillis === "function") {
    return (value as Timestamp).toMillis();
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}
function codesMatch(stored: string, given: string): boolean {
  const a = stored.trim().padStart(6, "0");
  const b = given.trim().padStart(6, "0");
  if (a.length !== b.length || a.length !== 6) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid body." }, { status: 400 });
    }
    const { email: rawEmail, code: rawCode, newPassword: rawPass } = body as Record<string, unknown>;

    const emailRaw = typeof rawEmail === "string" ? rawEmail.trim() : "";
    const code = typeof rawCode === "string" ? rawCode : "";
    const newPassword = typeof rawPass === "string" ? rawPass : "";

    if (!emailRaw) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    if (!code.trim()) return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const resolved = await resolveAuthUserForPasswordReset(auth, db, emailRaw);
    if (!resolved) {
      return NextResponse.json({ error: "Invalid code or email." }, { status: 400 });
    }
    const { uid } = resolved;

    const resetRef = db.collection(PASSWORD_RESET_COLLECTION).doc(uid);
    const snap = await resetRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "No active verification code. Request a new code." }, { status: 400 });
    }

    const data = snap.data()!;
    const storedCode = String(data[CODE_FIELD] ?? "");
    const expiresMs = expiresToMillis(data[EXPIRES_FIELD]);

    if (!storedCode || Date.now() > expiresMs) {
      await resetRef.delete().catch(() => {});
      return NextResponse.json({ error: "Code expired. Request a new code." }, { status: 400 });
    }

    if (!codesMatch(storedCode, code)) {
      return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
    }

    try {
      await auth.updateUser(uid, { password: newPassword });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("PASSWORD_DOES_NOT_MEET_REQUIREMENTS") || msg.includes("weak-password")) {
        return NextResponse.json({ error: "Password is too weak. Try a stronger password." }, { status: 400 });
      }
      throw e;
    }

    const enrollRef = db.collection("account_reservations").doc(uid);
    const enrollSnap = await enrollRef.get();
    if (enrollSnap.exists) {
      await enrollRef.update({
        password: newPassword,
        updatedAt: new Date().toISOString(),
      });
    }

    await resetRef.delete().catch(() => {});

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (e) {
    console.error("[forgot-password/confirm]", e);
    const message = e instanceof Error ? e.message : "Server error.";
    if (message.includes("Firebase Admin is not configured")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    if (isFirebaseJwtTimeError(message)) {
      return NextResponse.json({ error: FIREBASE_ADMIN_JWT_TIME_HELP }, { status: 500 });
    }
    if (isFirebaseCredentialRejected(message)) {
      return NextResponse.json({ error: FIREBASE_ADMIN_CREDENTIAL_HELP }, { status: 500 });
    }
    return NextResponse.json({ error: "Something went wrong. Try again later." }, { status: 500 });
  }
}
