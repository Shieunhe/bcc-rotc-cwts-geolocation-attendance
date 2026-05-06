import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin.
 *
 * Fixes UNAUTHENTICATED from broken PEM in .env — use a JSON key file instead:
 *
 * 1) Download the service account JSON from Firebase Console → Project settings → Service accounts.
 * 2) Save as e.g. `firebase-service-account.json` in the project root (gitignored).
 * 3) In .env (no spaces around =):
 *    GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
 *
 * Or use FIREBASE_SERVICE_ACCOUNT_JSON / split FIREBASE_ADMIN_* vars (see below).
 */
function normalizePrivateKey(raw: string | undefined): string {
  if (!raw) return "";
  let k = raw.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  if (k.includes("\\n")) k = k.replace(/\\n/g, "\n");
  k = k.replace(/\r\n/g, "\n");
  return k;
}

/** Shown when Google rejects the Admin SDK credential (wrong key, revoked key, or wrong Firebase project). */
export const FIREBASE_ADMIN_CREDENTIAL_HELP =
  "Firebase Admin credentials were rejected. Use a service account JSON from Firebase Console → Project settings → Service accounts for the same project as NEXT_PUBLIC_FIREBASE_PROJECT_ID. Save it as e.g. firebase-service-account.json, set GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json with no spaces around =, restart the server. If the key was rotated, download a new JSON.";

/** JWT iat/exp rejected — usually PC clock wrong vs NTP, or revoked key. */
export const FIREBASE_ADMIN_JWT_TIME_HELP =
  "Google rejected the Admin token (JWT time window). Sync Windows time: Settings → Time & language → Date & time → turn on Set time automatically and the correct time zone. Or open Command Prompt as Administrator and run: w32tm /resync. Retry forgot-password. If it still fails, generate a new service account key in Firebase (old key may be revoked).";

export function isFirebaseJwtTimeError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("iat and exp") ||
    m.includes("reasonable timeframe") ||
    m.includes("short-lived token") ||
    m.includes("server time is not properly synced")
  );
}

export function isFirebaseCredentialRejected(message: string): boolean {
  if (isFirebaseJwtTimeError(message)) return false;
  const m = message.toUpperCase();
  return m.includes("UNAUTHENTICATED") || m.includes("INVALID_GRANT") || /\b16\b.*UNAUTHENTICATED/i.test(message);
}

function resolveCredentialFilePath(): string | null {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!raw) return null;
  const unquoted =
    (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1).trim()
      : raw;
  const abs = resolve(process.cwd(), unquoted);
  if (existsSync(unquoted)) return unquoted;
  if (existsSync(abs)) return abs;
  return null;
}

export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]!;

  const credPath = resolveCredentialFilePath();
  if (credPath) {
    try {
      const json = JSON.parse(readFileSync(credPath, "utf8")) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      const pk = normalizePrivateKey(json.private_key ?? "");
      if (!json.project_id || !json.client_email || !pk.includes("BEGIN PRIVATE KEY")) {
        throw new Error("Invalid service account JSON (missing project_id, client_email, or private_key).");
      }
      return initializeApp({
        credential: cert({
          projectId: json.project_id,
          clientEmail: json.client_email,
          privateKey: pk,
        }),
      });
    } catch (e) {
      throw new Error(
        `Failed to load GOOGLE_APPLICATION_CREDENTIALS (${credPath}): ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  const gacRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (gacRaw && !credPath) {
    const unquoted =
      (gacRaw.startsWith('"') && gacRaw.endsWith('"')) || (gacRaw.startsWith("'") && gacRaw.endsWith("'"))
        ? gacRaw.slice(1, -1).trim()
        : gacRaw;
    const triedAbs = resolve(process.cwd(), unquoted);
    throw new Error(
      `GOOGLE_APPLICATION_CREDENTIALS is set but the file was not found. Checked "${unquoted}" and "${triedAbs}". Save your Firebase service account JSON there (project root is ${process.cwd()}) or fix the path.`
    );
  }

  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonRaw) {
    let parsed: { project_id?: string; client_email?: string; private_key?: string };
    try {
      let text = jsonRaw;
      if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
        text = text.slice(1, -1);
      }
      parsed = JSON.parse(text) as typeof parsed;
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON.");
    }
    const pk = normalizePrivateKey(parsed.private_key ?? "");
    if (!parsed.project_id || !parsed.client_email || !pk.includes("BEGIN PRIVATE KEY")) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON missing project_id, client_email, or valid private_key.");
    }
    return initializeApp({
      credential: cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: pk,
      }),
    });
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  let clientEmail = (process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? "").trim();
  if ((clientEmail.startsWith('"') && clientEmail.endsWith('"')) || (clientEmail.startsWith("'") && clientEmail.endsWith("'"))) {
    clientEmail = clientEmail.slice(1, -1).trim();
  }

  const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin: set GOOGLE_APPLICATION_CREDENTIALS=./your-key.json (recommended), or FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_ADMIN_* variables."
    );
  }

  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_ADMIN_PRIVATE_KEY is not a valid PEM. Prefer GOOGLE_APPLICATION_CREDENTIALS pointing at the downloaded JSON file."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
