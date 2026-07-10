import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { query, execute } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";

const CODE_TTL_MS = 15 * 60 * 1000;

function getGmailTransporter() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const emailRaw =
      typeof body === "object" && body !== null && typeof body.email === "string"
        ? (body.email as string).trim()
        : "";
    if (!emailRaw) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const transporter = getGmailTransporter();
    if (!transporter) {
      return NextResponse.json(
        { error: "Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env." },
        { status: 500 }
      );
    }

    const emailNorm = emailRaw.toLowerCase();
    const rows = await query<(RowDataPacket & { id: number; email: string })[]>(
      "SELECT id, email FROM students WHERE LOWER(email) = ? LIMIT 1",
      [emailNorm]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    const student = rows[0];
    const code = String(randomInt(100_000, 1_000_000));
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await execute(
      `INSERT INTO password_reset_codes (student_id, email, verification_code, expires_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE verification_code = VALUES(verification_code), expires_at = VALUES(expires_at), updated_at = NOW()`,
      [student.id, emailNorm, code, expiresAt.toISOString().slice(0, 19).replace("T", " ")]
    );

    const fromEmail = process.env.GMAIL_USER!;
    try {
      await transporter.sendMail({
        from: `BCC ROTC/CWTS Attendance <${fromEmail}>`,
        to: student.email,
        subject: "Password reset verification code",
        html: `<p>Your verification code is:</p><p style="font-size:22px;font-weight:bold;letter-spacing:4px;">${code}</p><p>This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>`,
      });
    } catch (mailErr) {
      console.error("[forgot-password/send] Gmail SMTP error:", mailErr);
      const detail = mailErr instanceof Error ? mailErr.message : String(mailErr);
      return NextResponse.json(
        { error: `[Gmail SMTP] ${detail}. Check GMAIL_USER and GMAIL_APP_PASSWORD in .env.` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: "Verification code sent." });
  } catch (e) {
    console.error("[forgot-password/send]", e);
    const message = e instanceof Error ? e.message : "Server error.";
    return NextResponse.json({ error: message.slice(0, 400) }, { status: 500 });
  }
}
