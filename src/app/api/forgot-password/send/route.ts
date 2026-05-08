import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
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

function getGmailTransporter() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
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

    const transporter = getGmailTransporter();
    if (!transporter) {
      return NextResponse.json(
        { error: "Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file." },
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

    const fromEmail = process.env.GMAIL_USER!;

    try {
      await transporter.sendMail({
        from: `BCC ROTC/CWTS Attendance <${fromEmail}>`,
        to: sendTo,
        subject: "Password reset verification code",
        html: `<p>Your verification code is:</p><p style="font-size:22px;font-weight:bold;letter-spacing:4px;">${code}</p><p>This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>`,
      });
    } catch (mailErr) {
      console.error("[forgot-password/send] Gmail SMTP error:", mailErr);
      const detail = mailErr instanceof Error ? mailErr.message : String(mailErr);
      return NextResponse.json(
        {
          error: `[Gmail SMTP] ${detail}. Check GMAIL_USER and GMAIL_APP_PASSWORD in .env. Make sure 2-Step Verification is enabled and you're using an App Password.`,
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
