export interface ForgotPasswordApiResult {
  ok: boolean;
  message?: string;
}

async function readApiError(res: Response): Promise<{ message?: string; error?: string }> {
  const text = await res.text();
  if (!text.trim()) {
    return {};
  }
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<!doctype")) {
    return {
      error:
        `API returned an HTML error page (${res.status}) instead of JSON — usually a server crash in /api/forgot-password/send. Restart dev server after updating next.config (serverExternalPackages). Check the terminal for Node errors related to firebase-admin.`,
    };
  }
  try {
    return JSON.parse(text) as { message?: string; error?: string };
  } catch {
    return { error: text.slice(0, 240) };
  }
}

function fallbackForStatus(status: number): string {
  if (status === 404) return "No matching Firebase login for password reset.";
  if (status === 502) return "Email could not be sent. Check Resend API key and sender address.";
  if (status === 500) return "Server error. Check Firebase Admin credentials in .env and server logs.";
  return `Request failed (${status}).`;
}

export async function sendForgotPasswordCode(email: string): Promise<ForgotPasswordApiResult> {
  try {
    const res = await fetch("/api/forgot-password/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await readApiError(res);
    if (!res.ok) {
      const msg =
        data.error ??
        data.message ??
        fallbackForStatus(res.status);
      return { ok: false, message: msg };
    }
    return { ok: true, message: data.message ?? "Verification code sent." };
  } catch {
    return { ok: false, message: "Network error. Try again." };
  }
}

export async function confirmForgotPassword(params: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<ForgotPasswordApiResult> {
  try {
    const res = await fetch("/api/forgot-password/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({  
        email: params.email.trim(),
        code: params.code.trim(),
        newPassword: params.newPassword,
      }),
    });
    const data = await readApiError(res);
    if (!res.ok) {
      return {
        ok: false,
        message: data.error ?? data.message ?? (res.status === 400 ? "Could not reset password." : fallbackForStatus(res.status)),
      };
    }
    return { ok: true, message: data.message ?? "Password updated." };
  } catch {
    return { ok: false, message: "Network error. Try again." };
  }
}