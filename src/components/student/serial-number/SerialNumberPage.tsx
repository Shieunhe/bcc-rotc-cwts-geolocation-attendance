"use client";

import { useEffect, useState } from "react";
import StudentPageLayout from "@/components/layout/StudentPageLayout";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { studentService } from "@/services/student.service";

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatCertDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = getOrdinal(d.getDate());
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const year = d.getFullYear();
  return { day, month, year };
}

function getComponentLines(program: string) {
  if (program === "ROTC")
    return ["RESERVE OFFICERS TRAINING CORPS (ROTC) COMPONENT", "OF THE", "NATIONAL SERVICE TRAINING PROGRAM (NSTP)"];
  if (program === "CWTS")
    return ["CIVIC WELFARE TRAINING SERVICE (CWTS) COMPONENT", "OF THE", "NATIONAL SERVICE TRAINING PROGRAM (NSTP)"];
  return [`${program} COMPONENT`, "OF THE", "NATIONAL SERVICE TRAINING PROGRAM (NSTP)"];
}

function SealIcon({ className }: { className?: string }) {
  return (
    <div className={`rounded-full bg-gradient-to-br from-gray-200 to-gray-100 border-2 border-gray-300 flex items-center justify-center shadow-sm ${className}`}>
      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    </div>
  );
}

export default function SerialNumberPage() {
  const { profile, uid } = useStudentProfile();
  const [serialData, setSerialData] = useState<{ serialNumber: string; createdAt: string; commandant?: string; schoolRegistrar?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    studentService.getSerialNumber(uid).then((data) => {
      setSerialData(data);
      setLoading(false);
    });
  }, [uid]);

  const isROTC = profile?.nstpComponent === "ROTC";

  const studentFullName = profile
    ? `${profile.firstName} ${profile.middleName ? `${profile.middleName.charAt(0)}` : ""} ${profile.lastName}`.replace(/\s+/g, " ").trim()
    : "";

  return (
    <StudentPageLayout>
      <div className="max-w-4xl mx-auto mt-4 sm:mt-8 px-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : serialData && profile ? (
          <div className="space-y-5">
            {/* Certificate */}
            <div className="bg-white shadow-xl overflow-hidden">
              {/* Outer container */}
              <div className="p-3 sm:p-6">
                {/* Double border frame */}
                <div className="border-[3px] border-gray-800 p-1.5 sm:p-2">
                  <div className="border border-gray-400 px-4 py-6 sm:px-10 sm:py-10">

                    {/* Institution name - 24pt Times New Roman */}
                    <div className="text-center mb-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-wide" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                        BUENAVISTA COMMUNITY COLLEGE
                      </h2>
                      <p className="text-sm sm:text-base text-gray-700" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                        Cangawa, Buenavista, Bohol
                      </p>
                    </div>

                    {/* Logos row */}
                    <div className="flex items-center justify-center gap-3 sm:gap-6 my-4">
                      <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                      <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                      <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                      <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                      <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                    </div>

                    {/* "Award this" - 14pt Monotype Corsiva Bold Italic */}
                    <p className="text-center text-sm sm:text-base italic font-semibold text-gray-600 mb-2" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                      Award this
                    </p>

                    {/* CERTIFICATE OF COMPLETION - 36pt Arial Bold */}
                    <h1 className="text-center text-3xl sm:text-[40px] font-extrabold text-gray-900 tracking-wide leading-tight mb-2" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                      CERTIFICATE OF COMPLETION
                    </h1>

                    {/* "to" - italic */}
                    <p className="text-center text-sm italic text-gray-600 mb-4" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                      to
                    </p>

                    {/* Student name line - 24pt Arial Bold with underline */}
                    <div className="text-center mb-4">
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 inline-block border-b-2 border-gray-800 pb-1 px-2 sm:px-6 leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                        {isROTC ? (
                          <>Pvt {studentFullName} {serialData.serialNumber} PA (Res)</>
                        ) : (
                          <>{studentFullName} {serialData.serialNumber}</>
                        )}
                      </p>
                    </div>

                    {/* "for having satisfactorily completed the" - italic */}
                    <p className="text-center text-sm italic text-gray-600 mb-4" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                      for having satisfactorily completed the
                    </p>

                    {/* Program component - 20pt Arial Bold */}
                    <div className="text-center mb-5">
                      {getComponentLines(profile.nstpComponent).map((line, i) => (
                        <p key={i} className="text-base sm:text-xl font-bold text-gray-900 leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Date line - italic */}
                    <p className="text-center text-xs sm:text-sm italic text-gray-700 mb-8 sm:mb-12" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                      {(() => {
                        const { day, month, year } = formatCertDate(serialData.createdAt);
                        return `Given this ${day} day of ${month} ${year} at Buenavista Community College of Cangawa, Buenavista, Bohol`;
                      })()}
                    </p>

                    {/* Signature lines - 14pt Arial Bold / 14pt Arial Italic */}
                    <div className="flex justify-between items-end px-2 sm:px-12 mt-6">
                      <div className="text-center">
                        {serialData.commandant && (
                          <p className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                            {serialData.commandant}
                          </p>
                        )}
                        <div className="w-36 sm:w-48 border-b border-gray-800 mb-1" />
                        <p className="text-xs sm:text-sm italic text-gray-700" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                          Commandant
                        </p>
                      </div>
                      <div className="text-center">
                        {serialData.schoolRegistrar && (
                          <p className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                            {serialData.schoolRegistrar}
                          </p>
                        )}
                        <div className="w-36 sm:w-48 border-b border-gray-800 mb-1" />
                        <p className="text-xs sm:text-sm italic text-gray-700" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                          School Registrar
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-700">About this certificate</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  This is a digital preview of your NSTP certificate. The official printed certificate will be released by your institution.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Not yet released */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5 border-b border-purple-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Serial Number & Certificate</h1>
                  <p className="text-sm text-gray-500">Your NSTP completion details</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-600">Not yet released</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                Your serial number and certificate will be issued upon completion of the NSTP program.
              </p>
            </div>
          </div>
        )}
      </div>
    </StudentPageLayout>
  );
}
