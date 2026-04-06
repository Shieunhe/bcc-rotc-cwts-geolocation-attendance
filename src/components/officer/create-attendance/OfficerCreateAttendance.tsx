"use client";

import { useState, lazy, Suspense } from "react";
import { auth } from "@/lib/firebase";
import { adminService } from "@/services/admin.service";
import { AttendanceLocation, ATTENDANCE_RADIUS_METERS } from "@/types";

const LocationMap = lazy(() => import("@/components/common/LocationMap"));

type Program = "ROTC" | "CWTS" | "";

export default function OfficerCreateAttendance() {
  const [program, setProgram] = useState<Program>("");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [location, setLocation] = useState<AttendanceLocation | null>(null);
  const [locationError, setLocationError] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const stepsOneAndTwoDone = !!(program && openDate && closeDate);

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

  const isReady = program && openDate && closeDate && location;

  async function handleSubmit() {
    if (!isReady) return;
    setSubmitting(true);
    setSuccess(false);
    try {
      await adminService.createAttendanceSession({
        program: program as "ROTC" | "CWTS",
        openDate,
        closeDate,
        location: location!,
        createdBy: auth.currentUser?.email ?? "unknown",
      });
      setSuccess(true);
      setProgram("");
      setOpenDate("");
      setCloseDate("");
    } finally {
      setSubmitting(false);
    }
  }

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
              Set up an attendance session for ROTC or CWTS.
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="mb-4 max-w-xl flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm font-medium text-green-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Attendance session created successfully!
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-xl overflow-hidden">
        {/* Step 1: Program */}
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">1</span>
            </div>
            <h2 className="text-sm font-bold text-gray-800">Select Program</h2>
          </div>

          <div className="relative">
            <select
              value={program}
              onChange={(e) => { setProgram(e.target.value as Program); setSuccess(false); }}
              className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-10"
            >
              <option value="">Select a program...</option>
              <option value="ROTC">ROTC — Reserve Officers&apos; Training Corps</option>
              <option value="CWTS">CWTS — Civic Welfare Training Service</option>
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {program && (
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              program === "ROTC"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {program} selected
            </div>
          )}
        </div>

        {/* Step 2: Schedule */}
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${program ? "bg-indigo-600" : "bg-gray-300"}`}>
              <span className="text-[11px] font-bold text-white">2</span>
            </div>
            <h2 className={`text-sm font-bold ${program ? "text-gray-800" : "text-gray-400"}`}>Set Schedule</h2>
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
                disabled={!program}
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
                disabled={!program}
                min={openDate}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Location */}
        <div className={`p-5 sm:p-6 border-b border-gray-100 ${!stepsOneAndTwoDone ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stepsOneAndTwoDone ? "bg-indigo-600" : "bg-gray-300"}`}>
              <span className="text-[11px] font-bold text-white">3</span>
            </div>
            <h2 className={`text-sm font-bold ${stepsOneAndTwoDone ? "text-gray-800" : "text-gray-400"}`}>Location</h2>
          </div>

          {!stepsOneAndTwoDone ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-gray-400 font-medium">Complete steps 1 and 2 first.</p>
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
          <button
            onClick={handleSubmit}
            disabled={!isReady || submitting}
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
