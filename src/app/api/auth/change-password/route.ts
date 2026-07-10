import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, execute } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You are not signed in." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required." }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "New password must be different from your current password." }, { status: 400 });
    }

    const rows = await query<(RowDataPacket & { password: string })[]>(
      "SELECT password FROM students WHERE id = ? LIMIT 1",
      [user.id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await execute(
      "UPDATE students SET password = ? WHERE id = ?",
      [hashed, user.id]
    );

    return NextResponse.json({ ok: true, message: "Password updated successfully." });
  } catch (e) {
    console.error("[auth/change-password]", e);
    return NextResponse.json({ error: "Could not update password. Try again." }, { status: 500 });
  }
}
