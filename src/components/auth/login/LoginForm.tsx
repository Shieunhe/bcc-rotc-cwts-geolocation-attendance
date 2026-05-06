"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Footer from "@/components/common/Footer";
import Logo from "@/components/common/Logo";
import { lookupAccountByEmail } from "@/services/accountLookup.service";
import { confirmForgotPassword, sendForgotPasswordCode } from "@/services/forgotPasswordApi.service";

const EmailIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
);

const LockIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const KeyIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

type ForgotStep = "find" | "sendCode" | "reset";

function ForgotFlowProgress({ step }: { step: ForgotStep }) {
  const idx = step === "find" ? 0 : step === "sendCode" ? 1 : 2;
  return (
    <div className="flex gap-1.5 mb-6" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= idx ? "bg-blue-600" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );
}

function ForgotAccountSummary({ email, displayName }: { email: string; displayName: string }) {
  const emailLine = email.trim() || "—";
  const name = displayName.trim();
  const showBoth = name.length > 0 && name.toLowerCase() !== emailLine.toLowerCase();
  return (
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-slate-500">Account found</p>
      <p className="text-sm font-semibold text-slate-900 truncate">{showBoth ? name : emailLine}</p>
      {showBoth ? <p className="text-xs text-slate-500 truncate mt-0.5">{emailLine}</p> : null}
    </div>
  );
}

function ForgotSelectableAccountRow({
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
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        selected
          ? "border-blue-500 bg-blue-50/90 shadow-md ring-2 ring-blue-400/40"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/90"
      }`}
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
        }`}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">Account</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{showBoth ? name : emailLine}</p>
        {showBoth ? <p className="text-xs text-slate-500 truncate mt-0.5">{emailLine}</p> : null}
      </div>
      {selected ? (
        <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      ) : null}
    </button>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  /** FB-style: find account → send code → code + new password. */
  const [forgotStep, setForgotStep] = useState<ForgotStep>("find");
  const [forgotEmail, setForgotEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotInfo, setForgotInfo] = useState("");
  const [searchAccountLoading, setSearchAccountLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [savePasswordLoading, setSavePasswordLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");
  const [forgotAccountDisplayName, setForgotAccountDisplayName] = useState("");
  /** After Search succeeds — user must tap the row, then Continue. */
  const [foundAccountMatch, setFoundAccountMatch] = useState<{ email: string; displayName: string } | null>(null);
  const [selectedForgotAccount, setSelectedForgotAccount] = useState<{ email: string; displayName: string } | null>(
    null
  );

  function exitForgotFlow() {
    setShowForgot(false);
    setForgotStep("find");
    setForgotEmail("");
    setForgotAccountDisplayName("");
    setFoundAccountMatch(null);
    setSelectedForgotAccount(null);
    setVerifyCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotInfo("");
    setError("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessBanner("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (email === "rotc@admin.com") {
        router.push("/admin/rotc/dashboard");
      } else if (email === "cwts@admin.com") {
        router.push("/admin/cwts/dashboard");
      } else if (email === "officer@admin.com") {
        router.push("/officer/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof Error) {
        if (err.message.includes("user-not-found") || err.message.includes("invalid-credential")) {
          setError("No account found with this email.");
        } else if (err.message.includes("wrong-password")) {
          setError("Incorrect password. Please try again.");
        } else if (err.message.includes("too-many-requests")) {
          setError("Too many failed attempts. Please try again later.");
        } else if (err.message.includes("user-disabled")) {
          setError("This account has been disabled. Contact support.");
        } else if (err.message.includes("invalid-email")) {
          setError("Invalid email address.");
        } else {
          setError("Login failed. Please check your credentials.");
        }
      } else {
        setError("Login failed. Please try again.");
      }
    }
  }

  async function handleForgotFindAccount(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForgotInfo("");
    if (!forgotEmail.trim()) {
      setError("Enter your email to search.");
      return;
    }
    setSearchAccountLoading(true);
    const result = await lookupAccountByEmail(forgotEmail);
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
      email: result.email ?? forgotEmail.trim(),
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

  async function handleForgotSendVerification(e: React.FormEvent) {
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

  async function handleForgotSaveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!verifyCode.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSavePasswordLoading(true);
    const result = await confirmForgotPassword({
      email: forgotEmail,
      code: verifyCode,
      newPassword,
    });
    setSavePasswordLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Could not reset password.");
      return;
    }
    const savedEmail = forgotEmail.trim();
    exitForgotFlow();
    setEmail(savedEmail);
    setSuccessBanner(result.message ?? "Password updated. Sign in with your new password.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md">

        {/* Logo / Badge */}
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-4" />
          <h1 className="text-2xl sm:text-2xl font-bold text-gray-900 text-center tracking-tight">NSTP ENROLLMENT & ATTENDANCE</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {!showForgot ? (
            <>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 text-center">Sign in to your account</h2>
              {successBanner && (
                <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{successBanner}</span>
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                <Input
                  label="Email address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  icon={EmailIcon}
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={LockIcon}
                />

                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    onClick={() => {
                      setShowForgot(true);
                      setForgotStep("find");
                      setForgotEmail("");
                      setError("");
                      setSuccessBanner("");
                      setForgotInfo("");
                      setVerifyCode("");
                      setNewPassword("");
                      setConfirmNewPassword("");
                      setForgotAccountDisplayName("");
                      setFoundAccountMatch(null);
                      setSelectedForgotAccount(null);
                    }}
                  >
                    Forgot password
                  </button>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" loading={loading} fullWidth>
                  Login
                </Button>
              </form>

              <div className="flex items-center gap-3 my-5 sm:my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/enrollment" className="text-blue-600 italic hover:text-blue-700 font-semibold hover:underline">
                  Enroll Now
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                className="mb-5 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors -ml-1"
                onClick={exitForgotFlow}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to sign in
              </button>

              <ForgotFlowProgress step={forgotStep} />

              <h2 className="text-xl font-semibold text-slate-900 mb-1.5 tracking-tight">
                {forgotStep === "find" && "Find your account"}
                {forgotStep === "sendCode" && "Confirm your account"}
                {forgotStep === "reset" && "Create a new password"}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {forgotStep === "find" &&
                  "Enter your email to search for your account. If we find a match, you can reset your password with a verification code."}
                {forgotStep === "sendCode" &&
                  "We found an account with this email. Send a verification code to continue — then you’ll set a new password."}
                {forgotStep === "reset" &&
                  `Enter the code we sent to ${forgotEmail.trim() || "your email"}, then choose and confirm your new password.`}
              </p>

              {forgotStep === "find" && (
                <div className="space-y-5">
                  <form onSubmit={handleForgotFindAccount} className="space-y-5">
                    <Input
                      label="Email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setFoundAccountMatch(null);
                        setSelectedForgotAccount(null);
                      }}
                      placeholder="Search Email Address"
                      icon={EmailIcon}
                    />
                    {error && (
                      <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    )}
                    <Button type="submit" loading={searchAccountLoading} fullWidth>
                      Search
                    </Button>
                  </form>

                  {foundAccountMatch && (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-700">Tap your account to continue</p>
                      <ForgotSelectableAccountRow
                        email={foundAccountMatch.email}
                        displayName={foundAccountMatch.displayName}
                        selected={
                          selectedForgotAccount?.email.toLowerCase() === foundAccountMatch.email.toLowerCase()
                        }
                        onSelect={() => setSelectedForgotAccount(foundAccountMatch)}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        disabled={!selectedForgotAccount}
                        onClick={handleContinueAfterAccountSelect}
                      >
                        Continue
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {forgotStep === "sendCode" && (
                <form onSubmit={handleForgotSendVerification} className="space-y-5">
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <ForgotAccountSummary email={forgotEmail} displayName={forgotAccountDisplayName} />
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}
                  <Button type="submit" loading={sendCodeLoading} fullWidth>
                    Send verification code
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                    onClick={() => {
                      setForgotStep("find");
                      setForgotAccountDisplayName("");
                      setFoundAccountMatch(null);
                      setSelectedForgotAccount(null);
                      setError("");
                      setForgotInfo("");
                    }}
                  >
                    Not you?
                  </button>
                </form>
              )}

              {forgotStep === "reset" && (
                <form onSubmit={handleForgotSaveNewPassword} className="space-y-5">
                  {forgotInfo && (
                    <div className="flex items-start gap-2.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100/80 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{forgotInfo}</span>
                    </div>
                  )}

                  <Input
                    label="Verification code"
                    type="text"
                    required
                    autoComplete="one-time-code"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="Enter Verification Code"
                    icon={KeyIcon}
                    className="font-mono text-center text-base sm:text-lg tracking-[0.35em] sm:tracking-[0.45em] placeholder:tracking-normal placeholder:text-slate-300"
                  />

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">New password</p>
                    <Input
                      label="New password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      icon={LockIcon}
                    />
                    <Input
                      label="Confirm password"
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      icon={LockIcon}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" loading={savePasswordLoading} fullWidth>
                    Save
                  </Button>

                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm pt-1">
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
                    <span className="text-slate-300 hidden sm:inline" aria-hidden>
                      ·
                    </span>
                    <button
                      type="button"
                      className="font-medium text-slate-500 hover:text-slate-800 transition-colors"
                      onClick={() => {
                        setForgotStep("sendCode");
                        setVerifyCode("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                        setError("");
                        setForgotInfo("");
                      }}
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
