"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ForgotPasswordFlow, { EmailIcon, LockIcon, FormInput, AlertBox, PrimaryButton } from "./ForgotPasswordFlow";

export default function OfficerLoginForm() {
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

    if (email.toLowerCase() !== "bcc.officer.admin@gmail.com") {
      setLoading(false);
      setError("This portal is for the NSTP Director only.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/officer/dashboard");
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof Error) {
        if (err.message.includes("user-not-found") || err.message.includes("invalid-credential")) {
          setError("Invalid credentials. Please try again.");
        } else if (err.message.includes("wrong-password")) {
          setError("Incorrect password. Please try again.");
        } else if (err.message.includes("too-many-requests")) {
          setError("Too many failed attempts. Please try again later.");
        } else {
          setError("Login failed. Please try again.");
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <img
          src="/image/officer-login.png"
          alt="NSTP Officer"
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
            NSTP Director Portal
          </h2>
          <p className="text-gray-200 text-base leading-relaxed drop-shadow-md">
            Buenavista Community College&apos;s centralized system for managing ROTC & CWTS operations, attendance, and student records.
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
            src="/image/officer-login.png"
            alt="NSTP Officer"
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
              NSTP Director Portal
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-gray-100 p-6 sm:p-8 relative z-30">
            {!showForgot ? (
              <>
                <div className="mb-7">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">NSTP Director</h2>
                      <p className="text-sm text-gray-500">Sign in to access the director dashboard</p>
                    </div>
                  </div>
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
                    placeholder="Enter your email"
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
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
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

                  <PrimaryButton
                    type="submit"
                    loading={loading}
                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:from-indigo-800 active:to-indigo-900 shadow-indigo-200/50 hover:shadow-indigo-200/60"
                  >
                    Sign In
                  </PrimaryButton>
                </form>
              </>
            ) : (
              <ForgotPasswordFlow
                onExit={() => setShowForgot(false)}
                onSuccess={(savedEmail, message) => {
                  setShowForgot(false);
                  setEmail(savedEmail);
                  setSuccessBanner(message);
                }}
                restrictEmail="bcc.officer.admin@gmail.com"
                restrictMessage="This portal is for the NSTP Director only."
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
