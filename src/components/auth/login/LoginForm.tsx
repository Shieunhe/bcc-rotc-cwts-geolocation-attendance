"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ForgotPasswordFlow, { EmailIcon, LockIcon, FormInput, AlertBox, PrimaryButton } from "./ForgotPasswordFlow";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessBanner("");
    setLoading(true);

    const adminEmails = ["bcc.rotc.admin@gmail.com", "bcc.cwts.admin@gmail.com", "bcc.officer.admin@gmail.com"];
    if (adminEmails.includes(email.toLowerCase())) {
      setLoading(false);
      setError("This portal is for students only. Admin and officer accounts must use different portal.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/student/dashboard");
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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <img
          src="/image/student-login.png"
          alt="BCC ROTC Unit"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-white/10 backdrop-blur-md rounded-3xl mb-8 ring-1 ring-white/20 shadow-2xl">
            <img
              src="/image/bcclogo-removebg-preview.png"
              alt="BCC Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
            NSTP Enrollment & Attendance
          </h2>
          <p className="text-gray-200 text-base leading-relaxed drop-shadow-md">
            Buenavista Community College&apos;s ROTC & CWTS management system for enrollment, attendance tracking, and platoon coordination.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="w-2 h-2 rounded-full bg-white/60" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-200 relative">
        <div className="lg:hidden absolute inset-0">
          <img
            src="/image/student-login.png"
            alt="BCC ROTC Unit"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        {/* subtle page overlay to dim everything behind the card */}
        <div className="absolute inset-0 bg-black/8 backdrop-blur-sm pointer-events-none" />

        <div className="relative z-20 w-full max-w-[420px]">
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20 mb-3">
              <img
                src="/image/bcclogo-removebg-preview.png"
                alt="BCC Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
            <h1 className="text-base font-bold text-white text-center drop-shadow-lg">
              NSTP Enrollment & Attendance
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-gray-100 p-6 sm:p-8 relative z-30">
            {!showForgot ? (
              <>
                <div className="mb-7">
                  <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
                  <p className="text-sm text-gray-500 mt-1">Sign in to continue to your dashboard</p>
                </div>

                {successBanner && <AlertBox type="success">{successBanner}</AlertBox>}
                {successBanner && <div className="h-4" />}

                <form onSubmit={handleLogin} className="space-y-5">
                  <FormInput
                    label="Email address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    icon={EmailIcon}
                  />

                  <FormInput
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    icon={LockIcon}
                  />

                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={() => {
                        setShowForgot(true);
                        setError("");
                        setSuccessBanner("");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && <AlertBox type="error">{error}</AlertBox>}

                  <PrimaryButton type="submit" loading={loading}>
                    Sign In
                  </PrimaryButton>
                </form>

                <div className="flex items-center gap-3 my-7">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-medium text-gray-400">OR</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <p className="text-center text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link href="/enrollment" className="text-blue-600 font-semibold hover:text-blue-800 hover:underline underline-offset-2 transition-colors">
                    Enroll Now
                  </Link>
                </p>
              </>
            ) : (
              <ForgotPasswordFlow
                onExit={() => setShowForgot(false)}
                onSuccess={(savedEmail, message) => {
                  setShowForgot(false);
                  setEmail(savedEmail);
                  setSuccessBanner(message);
                }}
                blockedEmails={["bcc.rotc.admin@gmail.com", "bcc.cwts.admin@gmail.com", "bcc.officer.admin@gmail.com"]}
                blockedMessage="This portal is for students only. Admin and officer accounts must use their respective portals."
              />
            )}
          </div>

          <p className="text-center text-xs text-gray-400 lg:text-gray-400 text-gray-200 mt-6 drop-shadow-sm" suppressHydrationWarning>
            Buenavista Community College &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
