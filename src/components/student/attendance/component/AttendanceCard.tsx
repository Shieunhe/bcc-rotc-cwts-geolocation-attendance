"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { AttendanceSession, AttendanceRecord } from "@/types";
import { studentService } from "@/services/student.service";
import { auth } from "@/lib/firebase";

const LocationMap = lazy(() => import("@/components/common/LocationMap"));

const LATE_THRESHOLD_MINUTES = 15;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getLateDeadline(closeDate: string) {
  const close = new Date(closeDate);
  return new Date(close.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);
}

type SessionStatus = "open" | "late" | "closed";

function getSessionStatus(session: AttendanceSession): SessionStatus {
  const now = new Date();
  const open = new Date(session.openDate);
  const close = new Date(session.closeDate);
  const lateDeadline = getLateDeadline(session.closeDate);

  if (now < open || now >= lateDeadline) return "closed";
  if (now >= close) return "late";
  return "open";
}

function getDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const statusConfig: Record<SessionStatus, {
  gradient: string;
  badge: string;
  badgeLabel: string;
  message: string;
  buttonLabel: string;
}> = {
  open: {
    gradient: "bg-gradient-to-r from-green-500 to-emerald-600",
    badge: "bg-white/20 text-white backdrop-blur",
    badgeLabel: "Open",
    message: "Session is currently active — you can now mark your attendance.",
    buttonLabel: "Mark Attendance",
  },
  late: {
    gradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    badge: "bg-white/20 text-white backdrop-blur",
    badgeLabel: "Late",
    message: "You're past the on-time window — attendance will be marked as late.",
    buttonLabel: "Mark as Late",
  },
  closed: {
    gradient: "bg-gradient-to-r from-gray-400 to-gray-500",
    badge: "bg-white/20 text-white backdrop-blur",
    badgeLabel: "Closed",
    message: "This session has ended.",
    buttonLabel: "Session Closed",
  },
};

interface AttendanceCardProps {
  session: AttendanceSession;
}

export default function AttendanceCard({ session }: AttendanceCardProps) {
  const status = getSessionStatus(session);
  const config = statusConfig[status];
  const lateDeadline = getLateDeadline(session.closeDate);

  const [studentLat, setStudentLat] = useState<number | null>(null);
  const [studentLng, setStudentLng] = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null);
  const [checkingRecord, setCheckingRecord] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [justMarked, setJustMarked] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setCheckingRecord(false); return; }
    studentService.getAttendanceRecord(uid, session.id).then((record) => {
      setExistingRecord(record);
      setCheckingRecord(false);
    }).catch(() => setCheckingRecord(false));
  }, [session.id]);

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }
    setLocLoading(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStudentLat(pos.coords.latitude);
        setStudentLng(pos.coords.longitude);
        setLocLoading(false);
      },
      (err) => {
        setLocError(
          err.code === 1
            ? "Location access denied. Please allow location in your browser settings."
            : "Unable to retrieve your location. Please try again."
        );
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  useEffect(() => {
    if (status !== "closed") captureLocation();
    else setLocLoading(false);
  }, [status]);

  const distance =
    studentLat !== null && studentLng !== null
      ? getDistanceMeters(studentLat, studentLng, session.location.latitude, session.location.longitude)
      : null;

  const isWithinRadius = distance !== null && distance <= session.radiusMeters;
  const isClosed = status === "closed";
  const alreadyMarked = !!existingRecord || justMarked;
  const canMark = !isClosed && isWithinRadius && !locLoading && !alreadyMarked && !checkingRecord;

  async function handleMarkAttendance() {
    const uid = auth.currentUser?.uid;
    if (!uid || !canMark) return;

    setSubmitting(true);
    try {
      const attendanceStatus = status === "late" ? "late" : "present";
      await studentService.markAttendance(uid, session.id, attendanceStatus, session.miNumber, session.miType);
      setJustMarked(true);
      setExistingRecord({
        id: "",
        studentUid: uid,
        attendanceSessionId: session.id,
        status: attendanceStatus,
        miNumber: session.miNumber,
        miType: session.miType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const markedStatus = existingRecord?.status;

  const buttonClass = alreadyMarked
    ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
    : isClosed
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : canMark
        ? status === "open"
          ? "bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-200"
          : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200"
        : "bg-gray-100 text-gray-400 cursor-not-allowed";

  const buttonLabel = submitting
    ? "Marking..."
    : alreadyMarked
      ? markedStatus === "late"
        ? "Marked as Late"
        : markedStatus === "absent"
          ? "Marked as Absent"
          : "Attendance Marked"
      : config.buttonLabel;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Session header */}
      <div className={`px-5 py-4 ${config.gradient}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{session.program} Attendance</h3>
              <p className="text-[11px] text-white/70 font-medium">{formatDate(session.openDate)}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${config.badge}`}>
            {config.badgeLabel}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Schedule */}
        <div className="flex items-center gap-2">
          <div className="shrink-0 text-center">
            <p className="text-[10px] text-green-500 font-semibold uppercase tracking-wide">Open</p>
            <p className="text-[11px] font-bold text-gray-700">{formatTime(session.openDate)}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-semibold text-green-500 uppercase tracking-wider">On Time</span>
            <div className="w-full h-0.5 bg-green-400 rounded-full" />
          </div>
          <div className="shrink-0 text-center">
            <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">Close</p>
            <p className="text-[11px] font-bold text-gray-700">{formatTime(session.closeDate)}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider">Late</span>
            <div className="w-full h-0.5 bg-amber-400 rounded-full" />
          </div>
          <div className="shrink-0 text-center">
            <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide">+{LATE_THRESHOLD_MINUTES}m</p>
            <p className="text-[11px] font-bold text-amber-600">{formatTime(lateDeadline.toISOString())}</p>
          </div>
        </div>

        {/* Status message */}
        {status === "open" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[11px] font-medium text-green-700">{config.message}</p>
          </div>
        )}
        {status === "late" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[11px] font-medium text-amber-700">{config.message}</p>
          </div>
        )}
        {status === "closed" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-[11px] font-medium text-gray-500">{config.message}</p>
          </div>
        )}

        {/* Already marked banner */}
        {alreadyMarked && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${
            markedStatus === "late"
              ? "bg-amber-50 border-amber-200"
              : markedStatus === "absent"
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
          }`}>
            <svg className={`w-4 h-4 shrink-0 ${
              markedStatus === "late" ? "text-amber-500" : markedStatus === "absent" ? "text-red-500" : "text-green-500"
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className={`text-[11px] font-semibold ${
                markedStatus === "late" ? "text-amber-700" : markedStatus === "absent" ? "text-red-700" : "text-green-700"
              }`}>
                {markedStatus === "late"
                  ? "You were marked as late for this session."
                  : markedStatus === "absent"
                    ? "You were marked as absent for this session."
                    : "Your attendance has been recorded successfully!"}
              </p>
              {existingRecord?.createdAt && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Recorded at {new Date(existingRecord.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Location status */}
        {!isClosed && !alreadyMarked && (
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-[11px] font-semibold text-gray-600">Location Check</p>
              </div>
              {!locLoading && !locError && (
                <button
                  onClick={captureLocation}
                  className="text-[10px] font-semibold text-blue-500 hover:text-blue-600 transition"
                >
                  Refresh
                </button>
              )}
            </div>

            {locLoading && (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] text-gray-400">Getting your location...</p>
              </div>
            )}

            {locError && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-red-50 border border-red-100">
                  <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-[11px] font-medium text-red-600">{locError}</p>
                </div>
                <button
                  onClick={captureLocation}
                  className="w-full py-2 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Try Again
                </button>
              </div>
            )}

            {!locLoading && !locError && distance !== null && (
              <>
                <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border ${
                  isWithinRadius
                    ? "bg-green-50 border-green-100"
                    : "bg-red-50 border-red-100"
                }`}>
                  {isWithinRadius ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-[11px] font-medium text-green-700">
                        You&apos;re within range — {Math.round(distance)}m away ({session.radiusMeters}m radius)
                      </p>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-[11px] font-medium text-red-600">
                        Too far — {Math.round(distance)}m away (must be within {session.radiusMeters}m)
                      </p>
                    </>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <Suspense fallback={
                    <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center">
                      <p className="text-xs text-gray-400">Loading map...</p>
                    </div>
                  }>
                    <LocationMap
                      latitude={session.location.latitude}
                      longitude={session.location.longitude}
                      radiusMeters={session.radiusMeters}
                      studentLatitude={studentLat ?? undefined}
                      studentLongitude={studentLng ?? undefined}
                    />
                  </Suspense>
                </div>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-4 flex items-center justify-center">
                      <svg className="w-3 h-4" viewBox="0 0 12 20" fill="#2563eb"><path d="M6 0C2.7 0 0 2.7 0 6c0 4.5 6 14 6 14s6-9.5 6-14c0-3.3-2.7-6-6-6z"/></svg>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">Attendance Area</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                    <span className="text-[10px] text-gray-500 font-medium">Your Location</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-sm bg-indigo-500/20 border border-indigo-500" />
                    <span className="text-[10px] text-gray-500 font-medium">{session.radiusMeters}m Radius</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="px-5 pb-5">
        <button
          onClick={handleMarkAttendance}
          disabled={!canMark || submitting}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition flex items-center justify-center gap-2 ${buttonClass}`}
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : alreadyMarked ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
