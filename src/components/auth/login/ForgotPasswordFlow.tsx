"use client";

import { useState } from "react";
import { lookupAccountByEmail } from "@/services/accountLookup.service";
import { confirmForgotPassword, sendForgotPasswordCode } from "@/services/forgotPasswordApi.service";

export const EmailIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const LockIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const KeyIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

type ForgotStep = "find" | "sendCode" | "reset";

export function FormInput({
  label,
  icon,
  type = "text",
  className = "",
  ...props
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
          {icon}
        </div>
        <input
          type={inputType}
          className={`w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 ${isPassword ? "pr-12" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function AlertBox({ type, children }: { type: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };
  const icons = {
    error: (
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    success: (
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`flex items-start gap-2.5 text-sm border rounded-xl px-4 py-3 ${styles[type]}`}>
      {icons[type]}
      <span>{children}</span>
    </div>
  );
}

export function PrimaryButton({
  children,
  loading = false,
  disabled = false,
  className = "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 shadow-blue-200/50 hover:shadow-blue-200/60",
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled || loading}
      className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Please wait...
        </>
      ) : (
        children
      )}
    </button>
  );
}

function AccountCard({
  email,
  displayName,
  selected,
  onSelect,
}: {
  email: string;
  displayName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const emailLine = email.trim() || "—";
  const name = displayName.trim();
  const showBoth = name.length > 0 && name.toLowerCase() !== emailLine.toLowerCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${
        selected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
      }`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{showBoth ? name : emailLine}</p>
        {showBoth && <p className="text-xs text-gray-500 truncate mt-0.5">{emailLine}</p>}
      </div>
      {selected && (
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

function StepIndicator({ step }: { step: ForgotStep }) {
  const steps = [
    { key: "find", label: "Find" },
    { key: "sendCode", label: "Verify" },
    { key: "reset", label: "Reset" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i <= currentIdx
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < currentIdx ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i <= currentIdx ? "text-blue-600" : "text-gray-400"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i < currentIdx ? "bg-blue-600" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface ForgotPasswordFlowProps {
  onExit: () => void;
  onSuccess: (email: string, message: string) => void;
  restrictEmail?: string;
  restrictMessage?: string;
  blockedEmails?: string[];
  blockedMessage?: string;
}

export default function ForgotPasswordFlow({ onExit, onSuccess, restrictEmail, restrictMessage, blockedEmails, blockedMessage }: ForgotPasswordFlowProps) {
  const [forgotStep, setForgotStep] = useState<ForgotStep>("find");
  const [forgotEmail, setForgotEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotInfo, setForgotInfo] = useState("");
  const [searchAccountLoading, setSearchAccountLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [savePasswordLoading, setSavePasswordLoading] = useState(false);
  const [forgotAccountDisplayName, setForgotAccountDisplayName] = useState("");
  const [foundAccountMatch, setFoundAccountMatch] = useState<{ email: string; displayName: string } | null>(null);
  const [selectedForgotAccount, setSelectedForgotAccount] = useState<{ email: string; displayName: string } | null>(null);

  async function handleFindAccount(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForgotInfo("");
    const trimmed = forgotEmail.trim();
    if (!trimmed) { setError("Enter your email to search."); return; }
    if (restrictEmail && trimmed.toLowerCase() !== restrictEmail.toLowerCase()) {
      setError(restrictMessage ?? "This email is not supported on this portal.");
      return;
    }
    if (blockedEmails && blockedEmails.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setError(blockedMessage ?? "This email is not supported on this portal.");
      return;
    }
    setSearchAccountLoading(true);
    const result = await lookupAccountByEmail(trimmed);
    setSearchAccountLoading(false);
    if (result.lookupError) {
      setFoundAccountMatch(null);
      setSelectedForgotAccount(null);
      setError(result.lookupError);
      return;
    }
    if (!result.found) {
      setFoundAccountMatch(null);
      setSelectedForgotAccount(null);
      setError("Can't find your account.");
      return;
    }
    setFoundAccountMatch({
      email: result.email ?? trimmed,
      displayName: result.displayName ?? "",
    });
    setSelectedForgotAccount(null);
  }

  function handleContinueAfterAccountSelect() {
    setError("");
    if (!selectedForgotAccount) {
      setError("Select your account to continue.");
      return;
    }
    setForgotEmail(selectedForgotAccount.email);
    setForgotAccountDisplayName(selectedForgotAccount.displayName);
    setForgotStep("sendCode");
  }

  async function handleSendVerification(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForgotInfo("");
    setSendCodeLoading(true);
    const result = await sendForgotPasswordCode(forgotEmail);
    setSendCodeLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Could not send verification code.");
      return;
    }
    setVerifyCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotInfo(result.message ?? "We sent a verification code to your email.");
    setForgotStep("reset");
  }

  async function handleSaveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!verifyCode.trim()) { setError("Enter the verification code from your email."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmNewPassword) { setError("Passwords do not match."); return; }
    setSavePasswordLoading(true);
    const result = await confirmForgotPassword({ email: forgotEmail, code: verifyCode, newPassword });
    setSavePasswordLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Could not reset password.");
      return;
    }
    onSuccess(forgotEmail.trim(), result.message ?? "Password updated. Sign in with your new password.");
  }

  return (
    <>
      <button
        type="button"
        className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
        onClick={onExit}
      >
        <svg className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to sign in
      </button>

      <StepIndicator step={forgotStep} />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {forgotStep === "find" && "Find your account"}
          {forgotStep === "sendCode" && "Verify your identity"}
          {forgotStep === "reset" && "Set new password"}
        </h2>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          {forgotStep === "find" && "Enter your email address and we'll find your account."}
          {forgotStep === "sendCode" && "We'll send a verification code to your email."}
          {forgotStep === "reset" && `Enter the code sent to ${forgotEmail.trim() || "your email"}.`}
        </p>
      </div>

      {forgotStep === "find" && (
        <div className="space-y-5">
          <form onSubmit={handleFindAccount} className="space-y-4">
            <FormInput
              label="Email"
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value);
                setFoundAccountMatch(null);
                setSelectedForgotAccount(null);
              }}
              placeholder={restrictEmail ?? "Enter your email address"}
              icon={EmailIcon}
            />
            {error && <AlertBox type="error">{error}</AlertBox>}
            <PrimaryButton type="submit" loading={searchAccountLoading}>
              Search Account
            </PrimaryButton>
          </form>

          {foundAccountMatch && (
            <div className="space-y-4 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Select your account
              </p>
              <AccountCard
                email={foundAccountMatch.email}
                displayName={foundAccountMatch.displayName}
                selected={selectedForgotAccount?.email.toLowerCase() === foundAccountMatch.email.toLowerCase()}
                onSelect={() => setSelectedForgotAccount(foundAccountMatch)}
              />
              <PrimaryButton
                type="button"
                disabled={!selectedForgotAccount}
                onClick={handleContinueAfterAccountSelect}
              >
                Continue
              </PrimaryButton>
            </div>
          )}
        </div>
      )}

      {forgotStep === "sendCode" && (
        <form onSubmit={handleSendVerification} className="space-y-5">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Account</p>
              <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">
                {forgotAccountDisplayName.trim() || forgotEmail.trim()}
              </p>
              {forgotAccountDisplayName.trim() && (
                <p className="text-xs text-gray-500 truncate">{forgotEmail.trim()}</p>
              )}
            </div>
          </div>

          {error && <AlertBox type="error">{error}</AlertBox>}

          <PrimaryButton type="submit" loading={sendCodeLoading}>
            Send Verification Code
          </PrimaryButton>

          <button
            type="button"
            className="w-full text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            onClick={() => {
              setForgotStep("find");
              setForgotAccountDisplayName("");
              setFoundAccountMatch(null);
              setSelectedForgotAccount(null);
              setError("");
              setForgotInfo("");
            }}
          >
            Not you? Try a different email
          </button>
        </form>
      )}

      {forgotStep === "reset" && (
        <form onSubmit={handleSaveNewPassword} className="space-y-5">
          {forgotInfo && <AlertBox type="success">{forgotInfo}</AlertBox>}

          <FormInput
            label="Verification code"
            type="text"
            required
            autoComplete="one-time-code"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="Enter 6-digit code"
            icon={KeyIcon}
            className="font-mono text-center text-base tracking-[0.3em] placeholder:tracking-normal placeholder:font-sans"
          />

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Create new password</p>
            <FormInput
              label="New password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              icon={LockIcon}
            />
            <FormInput
              label="Confirm password"
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter your password"
              icon={LockIcon}
            />
          </div>

          {error && <AlertBox type="error">{error}</AlertBox>}

          <PrimaryButton type="submit" loading={savePasswordLoading}>
            Save New Password
          </PrimaryButton>

          <div className="flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              className="font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
              disabled={sendCodeLoading}
              onClick={async () => {
                setError("");
                setForgotInfo("");
                setSendCodeLoading(true);
                const result = await sendForgotPasswordCode(forgotEmail);
                setSendCodeLoading(false);
                if (!result.ok) {
                  setError(result.message ?? "Could not resend code.");
                  return;
                }
                setForgotInfo(result.message ?? "A new code was sent.");
              }}
            >
              Resend code
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              className="font-medium text-gray-500 hover:text-gray-800 transition-colors"
              onClick={() => {
                setForgotStep("sendCode");
                setVerifyCode("");
                setNewPassword("");
                setConfirmNewPassword("");
                setError("");
                setForgotInfo("");
              }}
            >
              Go back
            </button>
          </div>
        </form>
      )}
    </>
  );
}
