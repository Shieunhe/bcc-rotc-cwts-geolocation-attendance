import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createToken, setSessionCookie, type SessionUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";

interface StudentRow extends RowDataPacket {
  id: number;
  email: string;
  username: string;
  password: string;
  role: "student" | "admin" | "officer";
  first_name: string;
  last_name: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { email, password } = body as { email?: string; password?: string };
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    const rows = await query<StudentRow[]>(
      "SELECT id, email, username, password, role, first_name, last_name FROM students WHERE LOWER(email) = ? LIMIT 1",
      [emailNorm]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "No account found with this email." }, { status: 401 });
    }

    const user = rows[0];
    if (password !== user.password) {
      return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    const token = createToken(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: sessionUser,
    });
  } catch (e) {
    console.error("[auth/login]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
