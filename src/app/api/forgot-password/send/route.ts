import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { Resend } from "resend";
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

/** Minutes until the emailed code expires. */
const CODE_TTL_MS = 15 * 60 * 1000;

function resendErrorMessage(error: unknown): string {
  if (error === null || error === undefined) return "Unknown Resend error.";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const o = error as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
    if (Array.isArray(o.errors)) return JSON.stringify(o.errors);
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Resend request failed.";
  }
}

/** Resend secret key — strip quotes/spaces from .env like KEY = "re_xxx" */
function getResendApiKey(): string | undefined {
  const raw =
    process.env.FORGOT_PASSWORD_API?.trim() ||
    process.env.RESEND_API_KEY?.trim() ||
    "";
  if (!raw) return undefined;
  let k = raw;
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  return k.trim() || undefined;
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const emailRaw =
      typeof body === "object" && body !== null && "email" in body && typeof (body as { email: unknown }).email === "string"
        ? (body as { email: string }).email.trim()
        : "";
    if (!emailRaw) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const emailNormalized = emailRaw.toLowerCase();

    const resendKey = getResendApiKey();
    if (!resendKey) {
      return NextResponse.json(
        { error: "Resend is not configured. Set FORGOT_PASSWORD_API or RESEND_API_KEY (starts with re_)." },
        { status: 500 }
      );
    }
    if (!resendKey.startsWith("re_")) {
      return NextResponse.json(
        {
          error:
            "Resend API key must start with re_. Check FORGOT_PASSWORD_API / RESEND_API_KEY for typos, spaces around =, or extra quotes.",
        },
        { status: 500 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const resolved = await resolveAuthUserForPasswordReset(auth, db, emailRaw);
    if (!resolved) {
      return NextResponse.json(
        {
          error:
            "No Firebase login account matches this email. Search may show your enrollment, but reset requires an active Authentication user (same email as sign-in). Ask an admin to check Firebase Authentication or fix your account email.",
        },
        { status: 404 }
      );
    }
    const { uid, sendTo } = resolved;

    const code = String(randomInt(100_000, 1_000_000));
    const expiresAt = Timestamp.fromMillis(Date.now() + CODE_TTL_MS);

    try {
      await db.collection(PASSWORD_RESET_COLLECTION).doc(uid).set(
        {
          [CODE_FIELD]: code,
          [EXPIRES_FIELD]: expiresAt,
          email: emailNormalized,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (dbErr) {
      console.error("[forgot-password/send] Firestore write failed:", dbErr);
      const dbMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      return NextResponse.json(
        {
          error:
            `Could not save verification code (${dbMsg}). Check Firebase Admin permissions and Firestore rules allow Admin SDK writes.`,
        },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);
    // Default uses Resend's unverified test sender. For production set RESEND_FROM_EMAIL to an address on a domain you verified at resend.com/domains.
    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "BCC ROTC/CWTS Attendance <noreply@resend.dev>";

    let sendResult: Awaited<ReturnType<Resend["emails"]["send"]>>;
    try {
      sendResult = await resend.emails.send({
        from: fromEmail,
        to: sendTo,
        subject: "Password reset verification code",
        html: `<p>Your verification code is:</p><p style="font-size:22px;font-weight:bold;letter-spacing:4px;">${code}</p><p>This code expires in 15 minutes. If you didn’t request this, you can ignore this email.</p>`,
      });
    } catch (mailErr) {
      console.error("[forgot-password/send] Resend threw:", mailErr);
      const detail = mailErr instanceof Error ? mailErr.message : String(mailErr);
      return NextResponse.json(
        {
          error: `[Resend] ${detail}. Confirm API key in dashboard, domain verified for "from", and use RESEND_FROM_EMAIL with your verified domain.`,
        },
        { status: 502 }
      );
    }

    if (sendResult.error) {
      const detail = resendErrorMessage(sendResult.error);
      console.error("[forgot-password/send] Resend API error:", detail);
      return NextResponse.json(
        {
          error: `[Resend] ${detail}. Typical fixes: valid re_ key, "from" uses a verified domain (Dashboard → Domains), Resend test mode only sends to your account email.`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: "Verification code sent." });
  } catch (e) {
    console.error("[forgot-password/send]", e);
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
    return NextResponse.json({ error: message.slice(0, 400) }, { status: 500 });
  }
}
