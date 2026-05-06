"use client";

import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type AuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

const LockIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

function authErrorMessage(code: string): string {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/requires-recent-login":
      return "Please sign out and sign in again, then change your password.";
    case "auth/weak-password":
      return "New password is too weak. Use a stronger password.";
    default:
      return "Could not update password. Try again.";
  }
}

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const user = auth.currentUser;
    if (!user?.email) {
      setMessage({ type: "err", text: "You are not signed in." });
      return;
    }

    const hasPasswordProvider = user.providerData.some((p) => p.providerId === "password");
    if (!hasPasswordProvider) {
      setMessage({
        type: "err",
        text: "This account does not use an email password. Use the provider you signed up with to manage your login.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "err", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "err", text: "New password and confirmation do not match." });
      return;
    }
    if (newPassword === currentPassword) {
      setMessage({ type: "err", text: "New password must be different from your current password." });
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "ok", text: "Password updated successfully." });
    } catch (err) {
      const code = (err as AuthError)?.code ?? "";
      setMessage({ type: "err", text: authErrorMessage(code) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-800">Change password</h2>
        <p className="text-xs text-gray-500 mt-0.5">Use your current password to confirm, then choose a new one.</p>
      </div>

      {message && (
        <div
          role="alert"
          className={`text-sm rounded-xl px-4 py-3 ${
            message.type === "ok" ? "bg-green-50 text-green-800 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="••••••••"
        icon={LockIcon}
        required
      />

      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="••••••••"
        icon={LockIcon}
        required
        minLength={6}
      />

      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••"
        icon={LockIcon}
        required
        minLength={6}
      />

      <Button type="submit" loading={loading} fullWidth>
        Update password
      </Button>
    </form>
  );
}
