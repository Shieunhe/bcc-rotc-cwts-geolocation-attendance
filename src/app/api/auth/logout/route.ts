import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auth/logout]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
