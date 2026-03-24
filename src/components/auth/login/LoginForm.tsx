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

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      } else if (email === "officer@email.com") {
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
    </div>
  );
}
