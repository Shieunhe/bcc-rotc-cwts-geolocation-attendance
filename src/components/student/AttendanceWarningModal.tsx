"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { studentService } from "@/services/student.service";
import { AttendanceOffense } from "@/types";

export default function AttendanceWarningModal() {
  const [offense, setOffense] = useState<AttendanceOffense | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const data = await studentService.getAttendanceOffense(user.uid);
        if (!data) return;

        const isBlocked = data.offend >= 2 && !data.settled;
        const needsWarningAck = data.offend === 1 && (!data.warningAcknowledgedAt || data.updatedAt > data.warningAcknowledgedAt);

        if (isBlocked || needsWarningAck) {
          setOffense(data);
          setVisible(true);
        }
      } catch {
        /* silent */
      }
    });
    return () => unsub();
  }, []);

  const handleDismiss = async () => {
    if (!offense || offense.offend >= 2) return;
    setDismissing(true);
    try {
      await studentService.acknowledgeWarning(offense.student_uid);
    } catch {
      /* silent */
    }
    setVisible(false);
    setDismissing(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut(auth);
    router.push("/login");
  };

  if (!visible || !offense) return null;

  const isBlocked = offense.offend >= 2 && !offense.settled;

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-red-600 to-red-700" />

          <div className="px-6 pt-6 pb-2 text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-50 border-2 border-red-100">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-gray-800">
              Action Required: Attendance Violation
            </h2>

            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-red-50 text-red-600 border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              2nd Instance — Action Required
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="bg-red-50/50 rounded-xl p-4 space-y-3 border border-red-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                This is your <span className="font-bold">second occurrence</span> of being marked present but not found during verification. Your attendance has been updated to <span className="font-semibold text-red-600">absent</span>.
              </p>

              <div className="h-px bg-red-200/60" />

              <p className="text-sm text-red-700 font-semibold leading-relaxed">
                Your access to the system is now restricted.
              </p>
              <p className="text-sm text-red-600 leading-relaxed">
                You are required to report to the office to settle this matter before you can proceed with any system actions.
              </p>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full py-3 rounded-xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loggingOut ? (
                "Logging out..."
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />

        <div className="px-6 pt-6 pb-2 text-center">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-amber-50">
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-gray-800">Warning: Attendance Violation</h2>

          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            1st Instance — Warning
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              You were marked as <span className="font-semibold">present</span>, but were not found during verification.
              Your attendance has been updated to <span className="font-semibold text-red-600">absent</span>.
            </p>

            <div className="h-px bg-gray-200" />

            <p className="text-sm text-gray-500 leading-relaxed">
              Please ensure you are present during attendance checks to avoid further action.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {dismissing ? "Please wait..." : "Got it, I understand"}
          </button>
        </div>
      </div>
    </div>
  );
}
