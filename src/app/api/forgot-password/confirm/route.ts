import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";

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
    const body = await req.json().catch(() => null);
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

    const emailNorm = emailRaw.toLowerCase();

    const rows = await query<(RowDataPacket & { id: number })[]>(
      "SELECT id FROM students WHERE LOWER(email) = ? LIMIT 1",
      [emailNorm]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid code or email." }, { status: 400 });
    }
    const studentId = rows[0].id;

    const resetRows = await query<(RowDataPacket & { verification_code: string; expires_at: string })[]>(
      "SELECT verification_code, expires_at FROM password_reset_codes WHERE student_id = ? LIMIT 1",
      [studentId]
    );
    if (resetRows.length === 0) {
      return NextResponse.json({ error: "No active verification code. Request a new code." }, { status: 400 });
    }

    const storedCode = resetRows[0].verification_code;
    const expiresAt = new Date(resetRows[0].expires_at);

    if (Date.now() > expiresAt.getTime()) {
      await execute("DELETE FROM password_reset_codes WHERE student_id = ?", [studentId]);
      return NextResponse.json({ error: "Code expired. Request a new code." }, { status: 400 });
    }

    if (!codesMatch(storedCode, code)) {
      return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
    }

    await execute("UPDATE students SET password = ? WHERE id = ?", [newPassword, studentId]);

    await execute("DELETE FROM password_reset_codes WHERE student_id = ?", [studentId]);

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (e) {
    console.error("[forgot-password/confirm]", e);
    return NextResponse.json({ error: "Something went wrong. Try again later." }, { status: 500 });
  }
}
