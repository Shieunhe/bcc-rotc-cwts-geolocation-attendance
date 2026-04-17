"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { auth } from "@/lib/firebase";
import { adminService } from "@/services/admin.service";
import { AttendanceLocation, AttendanceSession, ATTENDANCE_RADIUS_METERS } from "@/types";

const LocationMap = lazy(() => import("@/components/common/LocationMap"));

type Program = "ROTC" | "CWTS" | "ADVANCE_COURSE" | "";
type MIType = "in" | "out";

const MI_COUNT = 15;
const MI_NUMBERS = Array.from({ length: MI_COUNT }, (_, i) => i + 1);

interface MIStatus {
  inCreated: boolean;
  inStatus?: "open" | "closed" | "scheduled";
  outCreated: boolean;
}

function getMIProgress(sessions: AttendanceSession[], program: Program): Map<number, MIStatus> {
  const map = new Map<number, MIStatus>();
  for (let i = 1; i <= MI_COUNT; i++) {
    map.set(i, { inCreated: false, outCreated: false });
  }

  const isAdvance = program === "ADVANCE_COURSE";
  const targetProgram = isAdvance ? "ROTC" : program;

  for (const s of sessions) {
    if (s.program !== targetProgram) continue;
    if (isAdvance && !s.isAdvanceCourse) continue;
    if (!isAdvance && s.program === "ROTC" && s.isAdvanceCourse) continue;

    const mi = s.miNumber;
    const type = s.miType;
    if (!mi || !type) continue;

    const status = map.get(mi);
    if (!status) continue;
    if (type === "in") {
      status.inCreated = true;
      status.inStatus = s.status;
    }
    if (type === "out") status.outCreated = true;
  }

  return map;
}

function getNextAvailable(progress: Map<number, MIStatus>): { mi: number; type: MIType } | null {
  for (let i = 1; i <= MI_COUNT; i++) {
    const s = progress.get(i)!;
    if (!s.inCreated) return { mi: i, type: "in" };
    if (!s.outCreated && s.inStatus === "closed") return { mi: i, type: "out" };
    if (!s.outCreated) return null;
  }
  return null;
}

function getHighestCompletedMI(progress: Map<number, MIStatus>): number {
  if (progress.size === 0) return 0;
  for (let i = MI_COUNT; i >= 1; i--) {
    const s = progress.get(i);
    if (s && (s.inCreated || s.outCreated)) return i;
  }
  return 0;
}

function StepBadge({ num, active }: { num: number; active: boolean }) {
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${active ? "bg-indigo-600" : "bg-gray-300"}`}>
      <span className="text-[11px] font-bold text-white">{num}</span>
    </div>
  );
}

function StepTitle({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <h2 className={`text-sm font-bold ${active ? "text-gray-800" : "text-gray-400"}`}>{children}</h2>;
}

export default function OfficerCreateAttendance() {
  const [program, setProgram] = useState<Program>("");
  const [miNumber, setMiNumber] = useState<number>(0);
  const [miType, setMiType] = useState<MIType>("in");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [location, setLocation] = useState<AttendanceLocation | null>(null);
  const [locationError, setLocationError] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [loadingSessions, setLoadingSessions] = useState(false);
  const [miProgress, setMiProgress] = useState<Map<number, MIStatus>>(new Map());

  const fetchSessionsForProgram = useCallback(async (prog: Program) => {
    if (!prog) return;
    setLoadingSessions(true);
    try {
      const isAdvance = prog === "ADVANCE_COURSE";
      const targetProgram = isAdvance ? "ROTC" : prog;
      const sessions = await adminService.getSessionsByProgram(
        targetProgram as "ROTC" | "CWTS",
        isAdvance || undefined
      );
      const progress = getMIProgress(sessions, prog);
      setMiProgress(progress);

      const next = getNextAvailable(progress);
      if (next) {
        setMiNumber(next.mi);
        setMiType(next.type);
      } else {
        setMiNumber(0);
      }
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (!program) {
      setMiProgress(new Map());
      setMiNumber(0);
      return;
    }
    fetchSessionsForProgram(program);
  }, [program, fetchSessionsForProgram]);

  function isMISelectable(mi: number): boolean {
    if (miProgress.size === 0) return mi === 1;
    for (let i = 1; i < mi; i++) {
      const s = miProgress.get(i);
      if (!s || !s.inCreated || !s.outCreated) return false;
    }
    const s = miProgress.get(mi);
    if (!s) return false;
    return !s.inCreated || !s.outCreated;
  }

  function isMIComplete(mi: number): boolean {
    const s = miProgress.get(mi);
    return !!s && s.inCreated && s.outCreated;
  }

  function handleMISelect(mi: number) {
    if (!isMISelectable(mi)) return;
    setMiNumber(mi);
    const s = miProgress.get(mi)!;
    setMiType(s.inCreated ? "out" : "in");
    setOpenDate("");
    setCloseDate("");
    setLocation(null);
    setSuccess(false);
  }

  function handleTypeSelect(type: MIType) {
    if (!miNumber) return;
    const s = miProgress.get(miNumber);
    if (!s) return;
    if (type === "in" && s.inCreated) return;
    if (type === "out" && !s.inCreated) return;
    if (type === "out" && s.inStatus !== "closed") return;
    if (type === "out" && s.outCreated) return;
    setMiType(type);
    setOpenDate("");
    setCloseDate("");
    setLocation(null);
    setSuccess(false);
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingLocation(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLoadingLocation(false);
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? "Location access denied. Please allow location in your browser settings."
            : "Unable to retrieve your location. Please try again."
        );
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const stepMIDone = miNumber > 0;
  const stepTypeDone = stepMIDone;
  const stepScheduleDone = !!(openDate && closeDate);
  const allStepsDone = !!(program && stepMIDone && stepScheduleDone && location);

  const isAdvanceCourse = program === "ADVANCE_COURSE";
  const actualProgram = isAdvanceCourse ? "ROTC" : program;

  const allComplete = program && miProgress.size > 0 && (() => {
    for (let i = 1; i <= MI_COUNT; i++) {
      const s = miProgress.get(i);
      if (!s || !s.inCreated || !s.outCreated) return false;
    }
    return true;
  })();

  async function handleSubmit() {
    if (!allStepsDone) return;
    setSubmitting(true);
    setSuccess(false);
    try {
      await adminService.createAttendanceSession({
        program: actualProgram as "ROTC" | "CWTS",
        ...(isAdvanceCourse ? { isAdvanceCourse: true } : {}),
        miNumber,
        miType,
        openDate,
        closeDate,
        location: location!,
        createdBy: auth.currentUser?.email ?? "unknown",
      });
      const label = `MI ${miNumber} ${miType.toUpperCase()}`;
      setSuccessMessage(`${label} attendance session created successfully!`);
      setSuccess(true);
      setOpenDate("");
      setCloseDate("");
      setLocation(null);

      await fetchSessionsForProgram(program);
    } finally {
      setSubmitting(false);
    }
  }

  const highestMI = getHighestCompletedMI(miProgress);
  const completedCount = (() => {
    let count = 0;
    miProgress.forEach((s) => {
      if (s.inCreated) count++;
      if (s.outCreated) count++;
    });
    return count;
  })();

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Create Attendance</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Set up MI attendance sessions for ROTC, CWTS, or Advance Course.
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="mb-4 max-w-xl flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm font-medium text-green-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-xl overflow-hidden">
        {/* Step 1: Program */}
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-4">
            <StepBadge num={1} active />
            <StepTitle active>Select Program</StepTitle>
          </div>

          <div className="relative">
            <select
              value={program}
              onChange={(e) => {
                setProgram(e.target.value as Program);
                setSuccess(false);
                setOpenDate("");
                setCloseDate("");
                setLocation(null);
              }}
              className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-10"
            >
              <option value="">Select a program...</option>
              <option value="ROTC">ROTC — Reserve Officers&apos; Training Corps</option>
              <option value="CWTS">CWTS — Civic Welfare Training Service</option>
              <option value="ADVANCE_COURSE">Advance Course — ROTC Advanced Training</option>
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {program && (
            <div className="mt-3 space-y-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                program === "ROTC"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : program === "ADVANCE_COURSE"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {program === "ADVANCE_COURSE" ? "Advance Course" : program} selected
              </div>
              {!loadingSessions && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Progress: {completedCount} / {MI_COUNT * 2} sessions created
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: MI Selection */}
        <div className={`p-5 sm:p-6 border-b border-gray-100 ${!program ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2.5 mb-4">
            <StepBadge num={2} active={!!program} />
            <StepTitle active={!!program}>Select MI (Military Instruction)</StepTitle>
          </div>

          {loadingSessions ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Loading sessions...</p>
            </div>
          ) : allComplete ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-green-700 font-medium">All 15 MI sessions (IN & OUT) have been created for this program.</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {MI_NUMBERS.map((mi) => {
                const complete = isMIComplete(mi);
                const selectable = isMISelectable(mi);
                const selected = miNumber === mi;
                const s = miProgress.get(mi);
                const partial = s && s.inCreated && !s.outCreated;

                let className = "relative flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl text-xs font-bold transition border ";
                if (complete) {
                  className += "bg-green-50 border-green-200 text-green-600 cursor-not-allowed opacity-60";
                } else if (selected) {
                  className += "bg-indigo-600 border-indigo-600 text-white shadow-sm";
                } else if (selectable) {
                  className += "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer";
                } else {
                  className += "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed";
                }

                return (
                  <button
                    key={mi}
                    onClick={() => handleMISelect(mi)}
                    disabled={!selectable || complete}
                    className={className}
                  >
                    <span>MI {mi}</span>
                    {complete && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {program && !loadingSessions && !allComplete && highestMI > 0 && (
            <div className="mt-3 flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-100 border border-green-300 inline-block" /> Complete</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300 inline-block" /> Partial (IN only)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-100 border border-gray-200 inline-block" /> Locked</span>
            </div>
          )}
        </div>

        {/* Step 3: IN / OUT */}
        <div className={`p-5 sm:p-6 border-b border-gray-100 ${!stepMIDone ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2.5 mb-4">
            <StepBadge num={3} active={stepMIDone} />
            <StepTitle active={stepMIDone}>
              {miNumber > 0 ? `MI ${miNumber} — Select Type` : "Select Type"}
            </StepTitle>
          </div>

          {stepMIDone && (
            <div className="grid grid-cols-2 gap-3">
              {(["in", "out"] as MIType[]).map((type) => {
                const s = miProgress.get(miNumber);
                const created = type === "in" ? s?.inCreated : s?.outCreated;
                const inStillOpen = type === "out" && s?.inCreated && s?.inStatus !== "closed";
                const locked = type === "out" && (!s?.inCreated || inStillOpen);
                const disabled = !!created || locked;
                const selected = miType === type && !disabled;

                let className = "relative flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition border ";
                if (created) {
                  className += "bg-green-50 border-green-200 text-green-600 cursor-not-allowed opacity-60";
                } else if (selected) {
                  className += "bg-indigo-600 border-indigo-600 text-white shadow-sm";
                } else if (locked) {
                  className += "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed";
                } else {
                  className += "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer";
                }

                return (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    disabled={disabled}
                    className={className}
                  >
                    {type === "in" ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    )}
                    {type.toUpperCase()}
                    {created && (
                      <svg className="w-3.5 h-3.5 absolute top-1.5 right-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {stepMIDone && (() => {
            const s = miProgress.get(miNumber);
            if (s?.inCreated && s?.inStatus !== "closed" && !s?.outCreated) {
              return (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  OUT is locked — MI {miNumber} IN session is still {s.inStatus}. It must be closed first.
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Step 4: Schedule */}
        <div className={`p-5 sm:p-6 border-b border-gray-100 ${!stepTypeDone ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2.5 mb-4">
            <StepBadge num={4} active={stepTypeDone} />
            <StepTitle active={stepTypeDone}>Set Schedule</StepTitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Open Date & Time
              </label>
              <input
                type="datetime-local"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                disabled={!stepTypeDone}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Close Date & Time
              </label>
              <input
                type="datetime-local"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                disabled={!stepTypeDone}
                min={openDate}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Step 5: Location */}
        <div className={`p-5 sm:p-6 border-b border-gray-100 ${!stepScheduleDone || !stepTypeDone ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2.5 mb-4">
            <StepBadge num={5} active={stepScheduleDone && stepTypeDone} />
            <StepTitle active={stepScheduleDone && stepTypeDone}>Location</StepTitle>
          </div>

          {!stepScheduleDone || !stepTypeDone ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-gray-400 font-medium">Complete previous steps first.</p>
            </div>
          ) : loadingLocation ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Detecting your location...</p>
            </div>
          ) : location ? (
            <div className="space-y-3">
              <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-xs font-semibold text-green-700">Location captured</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-green-600 tabular-nums">
                  <span>Lat: <strong>{location.latitude.toFixed(6)}</strong></span>
                  <span>Lng: <strong>{location.longitude.toFixed(6)}</strong></span>
                </div>
                <button
                  onClick={captureLocation}
                  className="mt-2 text-[11px] font-medium text-green-700 underline hover:text-green-800"
                >
                  Recapture location
                </button>
              </div>

              <div className="rounded-xl overflow-hidden border border-gray-200">
                <Suspense fallback={
                  <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Loading map...</p>
                  </div>
                }>
                  <LocationMap
                    latitude={location.latitude}
                    longitude={location.longitude}
                    radiusMeters={ATTENDANCE_RADIUS_METERS}
                  />
                </Suspense>
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                Blue circle shows the {ATTENDANCE_RADIUS_METERS}m attendance radius.
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={captureLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Capture My Location
              </button>
              {locationError && (
                <p className="mt-2 text-xs font-medium text-red-600">{locationError}</p>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="p-5 sm:p-6 bg-gray-50/50">
          {miNumber > 0 && (
            <div className="mb-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-medium text-indigo-700">
                Creating: <strong>MI {miNumber} — {miType.toUpperCase()}</strong> for {program === "ADVANCE_COURSE" ? "Advance Course" : program}
              </p>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!allStepsDone || submitting || !!allComplete}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Attendance
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
