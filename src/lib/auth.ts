import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { query } from "./db";
import type { RowDataPacket } from "mysql2/promise";

const JWT_SECRET = process.env.JWT_SECRET || "bcc-rotc-cwts-secret-key";
const COOKIE_NAME = "bcc_session";
const TOKEN_EXPIRY = "7d";

export interface SessionUser {
  id: number;
  email: string;
  username: string;
  role: "student" | "admin" | "officer";
  firstName: string;
  lastName: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: "student" | "admin" | "officer";
  iat?: number;
  exp?: number;
}

export function createToken(user: SessionUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role } satisfies Omit<JwtPayload, "iat" | "exp">,
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const rows = await query<(RowDataPacket & SessionUser)[]>(
    "SELECT id, email, username, role, first_name AS firstName, last_name AS lastName FROM students WHERE id = ? LIMIT 1",
    [payload.userId]
  );

  if (rows.length === 0) return null;
  return rows[0];
}
