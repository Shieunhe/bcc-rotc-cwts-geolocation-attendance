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

type ForgotPasswordStep = "email" | "reset" | "success";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordLoading(true);

    try {
      const res = await fetch("/api/forgot-password/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotPasswordError(data.error || "Failed to send verification code");
        setForgotPasswordLoading(false);
        return;
      }

      setForgotPasswordSuccess("Verification code sent to your email!");
      setForgotPasswordStep("reset");
    } catch {
      setForgotPasswordError("Failed to send verification code. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setForgotPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setForgotPasswordError("Password must be at least 6 characters");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const res = await fetch("/api/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          code: verificationCode,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotPasswordError(data.error || "Failed to reset password");
        setForgotPasswordLoading(false);
        return;
      }

      setForgotPasswordStep("success");
    } catch {
      setForgotPasswordError("Failed to reset password. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  }

  function handleCloseForgotPassword() {
    setShowForgotPassword(false);
    setForgotPasswordStep("email");
    setResetEmail("");
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 text-center">Sign in to your account</h2>
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

            {/* Error message */}
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5 sm:my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Create account link */}
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/enrollment" className="text-blue-600 italic hover:text-blue-700 font-semibold hover:underline">
              Enroll Now
            </Link>
          </p>
        </div>
        <Footer />
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 relative">
            {/* Close button */}
            <button
              onClick={handleCloseForgotPassword}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Step 1: Enter Email */}
            {forgotPasswordStep === "email" && (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Forgot Password</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Enter your email address and we&apos;ll send you a verification code.
                </p>

                <form onSubmit={handleSendCode} className="space-y-4">
                  <Input
                    label="Email address"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="example@email.com"
                    icon={EmailIcon}
                  />

                  {forgotPasswordError && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{forgotPasswordError}</span>
                    </div>
                  )}

                  <Button type="submit" loading={forgotPasswordLoading} fullWidth>
                    Send Verification Code
                  </Button>
                </form>
              </>
            )}

            {/* Step 2: Enter Code and New Password */}
            {forgotPasswordStep === "reset" && (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Reset Password</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Enter the verification code sent to <span className="font-medium">{resetEmail}</span> and your new password.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <Input
                    label="Verification Code"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    icon={KeyIcon}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={LockIcon}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={LockIcon}
                  />

                  {forgotPasswordError && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{forgotPasswordError}</span>
                    </div>
                  )}

                  {forgotPasswordSuccess && (
                    <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{forgotPasswordSuccess}</span>
                    </div>
                  )}

                  <Button type="submit" loading={forgotPasswordLoading} fullWidth>
                    Reset Password
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep("email");
                      setForgotPasswordError("");
                      setForgotPasswordSuccess("");
                    }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    Back to email
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Success */}
            {forgotPasswordStep === "success" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Password Reset Successful!</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button onClick={handleCloseForgotPassword} fullWidth>
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
