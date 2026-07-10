export interface AccountLookupResult {
  found: boolean;
  email?: string;
  displayName?: string;
  lookupError?: string;
}

const ADMIN_AUTH_EMAILS = new Set(["bcc.rotc.admin@gmail.com", "bcc.cwts.admin@gmail.com", "bcc.officer.admin@gmail.com"]);

export async function lookupAccountByEmail(rawEmail: string): Promise<AccountLookupResult> {
  const trimmed = rawEmail.trim();
  if (!trimmed) return { found: false };

  const lower = trimmed.toLowerCase();

  if (ADMIN_AUTH_EMAILS.has(lower)) {
    return { found: true, email: trimmed, displayName: "Administrator" };
  }

  try {
    const res = await fetch("/api/auth/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    if (!res.ok) {
      if (res.status === 404) return { found: false };
      return { found: false, lookupError: "Unable to check your email right now. Try again later." };
    }
    const data = await res.json();
    return {
      found: true,
      email: data.email ?? trimmed,
      displayName: data.displayName ?? trimmed,
    };
  } catch {
    return {
      found: false,
      lookupError: "Unable to check your email right now. Try again later.",
    };
  }
}
