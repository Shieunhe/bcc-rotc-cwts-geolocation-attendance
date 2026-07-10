import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const rows = await query<(RowDataPacket & {
      email: string;
      first_name: string;
      last_name: string;
      suffix: string | null;
      username: string;
    })[]>(
      "SELECT email, first_name, last_name, suffix, username FROM students WHERE LOWER(email) = ? LIMIT 1",
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const row = rows[0];
    const name = [row.first_name, row.last_name, row.suffix].filter(Boolean).join(" ").trim();
    const displayName = name || row.username || row.email;

    return NextResponse.json({ email: row.email, displayName });
  } catch (e) {
    console.error("[auth/lookup]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
