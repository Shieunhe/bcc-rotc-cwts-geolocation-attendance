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

function SealIcon({ className }: { className?: string }) {
  return (
    <div className={`rounded-full bg-gradient-to-br from-gray-200 to-gray-100 border-2 border-gray-300 flex items-center justify-center shadow-sm ${className}`}>
      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    </div>
  );
}

function ROTCCertificate({ serialData, studentFullName }: {
  serialData: Record<string, string>;
  studentFullName: string;
}) {
  const dateStr = serialData.ceremonyDate || serialData.createdAt;
  const { day, month, year } = formatCertDate(dateStr);
  const academicYear = serialData.academicYear || `${year - 1}-${year}`;

  return (
    <div className="bg-white shadow-xl overflow-hidden">
      <div className="p-3 sm:p-6">
        <div className="border-[3px] border-gray-800 p-1.5 sm:p-2">
          <div className="border border-gray-400 px-4 py-6 sm:px-10 sm:py-10">

            <div className="text-center mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-wide" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                BUENAVISTA COMMUNITY COLLEGE
              </h2>
              <p className="text-sm sm:text-base text-gray-700" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                Cangawa, Buenavista, Bohol
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-6 my-4">
              <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
              <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
              <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
              <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
              <SealIcon className="w-12 h-12 sm:w-14 sm:h-14" />
            </div>

            <p className="text-center text-sm sm:text-base italic font-semibold text-gray-600 mb-2" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Award this
            </p>

            <h1 className="text-center text-3xl sm:text-[40px] font-extrabold text-gray-900 tracking-wide leading-tight mb-2" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
              CERTIFICATE OF COMPLETIONasdsadsadsadsdasdsad
            </h1>

            <p className="text-center text-sm italic text-gray-600 mb-4" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              to
            </p>

            <div className="text-center mb-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 inline-block border-b-2 border-gray-800 pb-1 px-2 sm:px-6 leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                Pvt {studentFullName} {serialData.serialNumber} PA (Res)
              </p>
            </div>

            <p className="text-center text-sm italic text-gray-600 mb-4" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              for having satisfactorily completed the
            </p>

            <div className="text-center mb-5">
              <p className="text-base sm:text-xl font-bold text-gray-900 leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                RESERVE OFFICERS TRAINING CORPS (ROTC) COMPONENT
              </p>
              <p className="text-base sm:text-xl font-bold text-gray-900 leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                OF THE
              </p>
              <p className="text-base sm:text-xl font-bold text-gray-900 leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                NATIONAL SERVICE TRAINING PROGRAM (NSTP)
              </p>
              <p className="text-sm font-semibold text-gray-700 mt-1" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                A.Y. {academicYear}
              </p>
            </div>

            <p className="text-center text-xs sm:text-sm italic text-gray-700 mb-8 sm:mb-12" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              {`Given this ${day} day of ${month}, ${year} at Buenavista Community College of Cangawa, Buenavista, Bohol.`}
            </p>

            <div className="flex justify-between items-end px-2 sm:px-12 mt-6">
              <div className="text-center">
                {serialData.commandantSignature && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={serialData.commandantSignature} alt="" className="h-14 sm:h-20 mx-auto object-contain -mb-15 sm:-mb-5" />
                )}
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
                {serialData.schoolRegistrarSignature && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={serialData.schoolRegistrarSignature} alt="" className="h-14 sm:h-20 mx-auto object-contain -mb-4 sm:-mb-5" />
                )}
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
  );
}

function CWTSCertificate({ serialData, studentFullName }: {
  serialData: Record<string, string>;
  studentFullName: string;
}) {
  const dateStr = serialData.ceremonyDate || serialData.createdAt;
  const { day, month, year } = formatCertDate(dateStr);
  const academicYear = serialData.academicYear || `${year - 1} \u2013 ${year}`;

  return (
    <div className="bg-white shadow-xl overflow-hidden">
      <div className="p-3 sm:p-6">
        <div className="border-[5px] relative" style={{ borderColor: "#e9c6ac" }}>
          {/* Back L shape on upper-left */}
          <div className="absolute -top-[15px] -left-[17px] w-[30px] h-2/3 z-10" style={{ backgroundColor: "#182845" }} />
          <div className="absolute -top-[15px] -left-[15px] h-[30px] w-1/2 z-10" style={{ backgroundColor: "#182845" }} />
          {/* Orange L — upper-left, below navy with gap */}
          <div className="absolute top-[20px] left-[20px] w-1/3 h-[7px] z-10" style={{ backgroundColor: "#c8580d" }} />
          <div className="absolute top-[20px] left-[20px] w-[7px] h-1/2 z-10" style={{ backgroundColor: "#c8580d" }} />
          {/* Navy L — bottom-right (mirrored) */}
          <div className="absolute -bottom-[15px] -right-[17px] w-[30px] h-2/3 z-10" style={{ backgroundColor: "#182845" }} />
          <div className="absolute -bottom-[15px] -right-[15px] h-[30px] w-1/2 z-10" style={{ backgroundColor: "#182845" }} />
          {/* Orange L — bottom-right, above navy with gap */}
          <div className="absolute bottom-[20px] right-[20px] w-1/3 h-[7px] z-10" style={{ backgroundColor: "#c8580d" }} />
          <div className="absolute bottom-[20px] right-[20px] w-[7px] h-1/2 z-10" style={{ backgroundColor: "#c8580d" }} />
          <div>
            <div className="bg-white px-4 py-6 sm:px-10 sm:py-10">

            {/* Header: 2 logos left, college info center, 1 logo right */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SealIcon className="w-11 h-11 sm:w-14 sm:h-14" />
                <SealIcon className="w-11 h-11 sm:w-14 sm:h-14" />
              </div>
              <div className="text-center flex-1 px-2">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 tracking-wide" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  BUENAVISTA COMMUNITY COLLEGE
                </h2>
                <p className="text-xs sm:text-sm italic text-gray-600" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  &ldquo;Caring your future&rdquo;
                </p>
                <p className="text-xs sm:text-sm text-gray-700" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  Cangawa, Buenavista, Bohol
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  Telefax: (038)5139169/Tel.: 513-9179
                </p>
              </div>
              <SealIcon className="w-11 h-11 sm:w-14 sm:h-14" />
            </div>

            {/* "Present this" — left aligned italic */}
            <p className="text-sm sm:text-base italic font-semibold text-gray-600 mb-1 ml-2 sm:ml-6" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Present this
            </p>

            {/* CERTIFICATE OF COMPLETION — green per sample */}
            <h1 className="text-center text-2xl sm:text-[38px] font-extrabold text-green-800 tracking-wide leading-tight mb-1" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
              CERTIFICATE OF COMPLETION
            </h1>

            {/* "to" */}
            <p className="text-center text-sm italic text-gray-600 mb-5" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              to
            </p>

            {/* Student name — long underline */}
            <div className="text-center mb-6">
              <div className="w-full max-w-sm sm:max-w-md mx-auto border-b-2 border-gray-800 pb-1 min-h-[2rem] flex items-end justify-center">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                  {studentFullName}
                </p>
              </div>
            </div>

            {/* Body paragraph with serial number inline */}
            <p className="text-xs sm:text-sm italic text-gray-700 leading-relaxed mb-4 px-2 sm:px-4" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              for having satisfactorily completed the National Service Training Program &ndash; Civic Welfare Training
              Service (NSTP-CWTS) A.Y. {academicYear} with a <span className="font-bold not-italic">SERIAL NUMBER</span> of{" "}
              <span className="font-bold not-italic border-b border-gray-800 px-1">{serialData.serialNumber}</span>
            </p>

            {/* Date line */}
            <p className="text-xs sm:text-sm italic text-gray-700 mb-8 sm:mb-10 px-2 sm:px-4" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              {`Given this ${day} day of ${month}, ${year} at the Buenavista Cultural Center, Poblacion, Buenavista, Bohol.`}
            </p>

            {/* Signatures — NSTP Coordinator (left), BCC President (right) */}
            <div className="flex justify-between items-end px-2 sm:px-6 mt-6">
              <div className="text-center">
                {serialData.nstpCoordinatorSignature && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={serialData.nstpCoordinatorSignature} alt="" className="h-14 sm:h-20 mx-auto object-contain -mb-4 sm:-mb-5" />
                )}
                {serialData.nstpCoordinator && (
                  <p className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    {serialData.nstpCoordinator}
                  </p>
                )}
                <div className="w-32 sm:w-48 border-b border-gray-800 mb-1" />
                <p className="text-[10px] sm:text-xs italic text-gray-600" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                  NSTP - Coordinator
                </p>
              </div>
              <div className="text-center">
                {serialData.bccPresidentSignature && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={serialData.bccPresidentSignature} alt="" className="h-14 sm:h-20 mx-auto object-contain -mb-4 sm:-mb-5" />
                )}
                {serialData.bccPresident && (
                  <p className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    {serialData.bccPresident}
                  </p>
                )}
                <div className="w-32 sm:w-48 border-b border-gray-800 mb-1" />
                <p className="text-[10px] sm:text-xs italic text-gray-600" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                  BCC President
                </p>
              </div>
            </div>

            {/* Municipal Mayor — centered below */}
            <div className="flex justify-center mt-6 sm:mt-8">
              <div className="text-center">
                {serialData.municipalMayorSignature && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={serialData.municipalMayorSignature} alt="" className="h-14 sm:h-20 mx-auto object-contain -mb-4 sm:-mb-5" />
                )}
                {serialData.municipalMayor && (
                  <p className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    {serialData.municipalMayor}
                  </p>
                )}
                <div className="w-36 sm:w-52 border-b border-gray-800 mb-1" />
                <p className="text-[10px] sm:text-xs italic text-gray-600" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                  Municipal Mayor/Chairman, BCC-BOT
                </p>
              </div>
            </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SerialNumberPage() {
  const { profile, uid } = useStudentProfile();
  const [serialData, setSerialData] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const program = profile?.nstpComponent;

  useEffect(() => {
    if (!uid || !program) return;
    Promise.all([
      studentService.getSerialNumber(uid),
      studentService.getSignatorySettings(program),
    ]).then(([serial, settings]) => {
      if (serial && settings) {
        setSerialData({ ...serial, ...settings });
      } else {
        setSerialData(serial);
      }
      setLoading(false);
    });
  }, [uid, program]);

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
            {isROTC ? (
              <ROTCCertificate serialData={serialData} studentFullName={studentFullName} />
            ) : (
              <CWTSCertificate serialData={serialData} studentFullName={studentFullName} />
            )}

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
