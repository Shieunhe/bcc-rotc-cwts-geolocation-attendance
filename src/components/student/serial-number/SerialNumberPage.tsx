"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
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

function safeDownloadSegment(text: string, fallback: string) {
  const cleaned = text
    .trim()
    .replace(/[/\\?%*:|"<>]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const base = cleaned || fallback;
  return base.length > 150 ? base.slice(0, 150) : base;
}

function buildCertificateDownloadFilename(studentName: string, serialNumber: string | undefined) {
  const namePart = safeDownloadSegment(studentName, "student");
  const serialPart = safeDownloadSegment(serialNumber ?? "", "no-serial");
  return `${namePart}-${serialPart}.png`;
}

/** Same as Tailwind max-w-4xl — export at this width so phone downloads match desktop layout. */
const CERTIFICATE_EXPORT_WIDTH_PX = 896;

/** Fixed 2× scale for PNG export. Using devicePixelRatio made phones at 1× DPR half the resolution of desktops at 2×. */
const CERTIFICATE_DOWNLOAD_PIXEL_RATIO = 2;

function ROTCCertificate({ serialData, studentFullName }: {
  serialData: Record<string, string>;
  studentFullName: string;
}) {
  const dateStr = serialData.ceremonyDate || serialData.createdAt;
  const { day, month, year } = formatCertDate(dateStr);
  const academicYear = serialData.academicYear || `${year - 1}-${year}`;

  return (
    <div className="bg-white shadow-xl overflow-hidden">
      {/* Fixed desktop scale at all viewports (mobile uses 896px pan; matches large-screen sm: styles). */}
      <div className="p-6">
        <div className="border-[3px] border-gray-800 p-2">
          <div className="border border-gray-400 px-10 py-10">

            <div className="mb-1 text-center">
              <h2 className="text-2xl font-bold tracking-wide text-gray-900" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                BUENAVISTA COMMUNITY COLLEGE
              </h2>
              <p className="text-base text-gray-700" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                Cangawa, Buenavista, Bohol
              </p>
            </div>

            <div className="my-4 flex items-center justify-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image/nstp-rotc.png"
                  alt="National Service Training Program"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image/commision-rotc.png"
                  alt="Commission ROTC"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image/republika-rotc.png"
                  alt="Republika ROTC"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image/tesda-rotc.png"
                  alt="TESDA ROTC"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            <p className="mb-2 text-center text-base font-semibold italic text-gray-600" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Award this
            </p>

            <h1 className="mb-2 text-center text-[40px] font-extrabold leading-tight tracking-wide text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
              CERTIFICATE OF COMPLETION
            </h1>

            <p className="mb-4 text-center text-sm italic text-gray-600" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              to
            </p>

            <div className="mb-4 text-center">
              <p className="inline-block max-w-full border-b-2 border-gray-800 px-6 pb-1 text-2xl font-bold leading-relaxed text-gray-900 whitespace-normal break-words" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                Pvt {studentFullName} {serialData.serialNumber} PA (Res)
              </p>
            </div>

            <p className="mb-4 text-center text-sm italic text-gray-600" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              for having satisfactorily completed the
            </p>

            <div className="mb-5 text-center">
              <p className="text-xl font-bold leading-relaxed text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                RESERVE OFFICERS TRAINING CORPS (ROTC) COMPONENT
              </p>
              <p className="text-xl font-bold leading-relaxed text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                OF THE
              </p>
              <p className="text-xl font-bold leading-relaxed text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                NATIONAL SERVICE TRAINING PROGRAM (NSTP)
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-700" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                A.Y. {academicYear}
              </p>
            </div>

            <p className="mb-12 text-center text-sm italic text-gray-700" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              {`Given this ${day} day of ${month}, ${year} at Buenavista Community College of Cangawa, Buenavista, Bohol.`}
            </p>

            <div className="mt-6 px-12">
              <div className="mx-auto grid w-full grid-cols-2 items-end gap-10" dir="ltr">
                <div className="flex min-w-0 flex-col items-center text-center">
                  {serialData.commandantSignature && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={serialData.commandantSignature}
                      alt=""
                      className="mx-auto h-20 max-h-24 w-auto max-w-full object-contain -mb-5"
                    />
                  )}
                  {serialData.commandant && (
                    <p className="mb-0.5 text-sm font-bold text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                      {serialData.commandant}
                    </p>
                  )}
                  <div className="mb-1 w-48 max-w-full border-b border-gray-800" />
                  <p className="text-sm italic text-gray-700" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    Commandant
                  </p>
                </div>
                <div className="flex min-w-0 flex-col items-center text-center">
                  {serialData.schoolRegistrarSignature && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={serialData.schoolRegistrarSignature}
                      alt=""
                      className="mx-auto h-20 max-h-24 w-auto max-w-full object-contain -mb-5"
                    />
                  )}
                  {serialData.schoolRegistrar && (
                    <p className="mb-0.5 text-sm font-bold text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                      {serialData.schoolRegistrar}
                    </p>
                  )}
                  <div className="mb-1 w-48 max-w-full border-b border-gray-800" />
                  <p className="text-sm italic text-gray-700" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    School Registrar
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

function CWTSCertificate({ serialData, studentFullName }: {
  serialData: Record<string, string>;
  studentFullName: string;
}) {
  const dateStr = serialData.ceremonyDate || serialData.createdAt;
  const { day, month, year } = formatCertDate(dateStr);
  const academicYear = serialData.academicYear || `${year - 1} \u2013 ${year}`;

  return (
    <div className="bg-white shadow-xl overflow-hidden">
      <div className="p-6">
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
            <div className="bg-white px-10 py-10">

            {/* Header — fixed desktop scale at all viewports (mobile scroll shows full 896px canvas). */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image/ched-logo.png"
                  alt="Commission on Higher Education"
                  className="h-20 w-auto max-w-[8rem] object-contain"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image/bcclogo-removebg-preview.png"
                  alt="Buenavista Community College"
                  className="h-20 w-auto max-w-[8rem] object-contain"
                />
              </div>
              <div className="text-center flex-1 px-2">
                <h2 className="text-xl font-bold text-gray-900 tracking-wide" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  BUENAVISTA COMMUNITY COLLEGE
                </h2>
                <p className="text-sm italic text-gray-600" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  &ldquo;Caring your future&rdquo;
                </p>
                <p className="text-sm text-gray-700" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  Cangawa, Buenavista, Bohol
                </p>
                <p className="text-xs text-gray-500" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  Telefax: (038)5139169/Tel.: 513-9179
                </p>
              </div>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image/cwts-logo.png"
                  alt="Civic Welfare Training Service"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            <p className="mb-1 ml-6 text-base italic font-semibold text-gray-600" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Present this
            </p>

            <h1 className="mb-1 text-center text-[38px] font-extrabold leading-tight tracking-wide text-green-800" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
              CERTIFICATE OF COMPLETION
            </h1>

            <p className="mb-5 text-center text-sm italic text-gray-600" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              to
            </p>

            {/* Student name — same underline box as desktop (max-w-md, text-2xl) */}
            <div className="mb-6 text-center">
              <div className="mx-auto flex min-h-[2rem] w-full max-w-md items-end justify-center border-b-2 border-gray-800 pb-1">
                <p className="whitespace-normal break-words text-2xl font-bold leading-relaxed text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                  {studentFullName}
                </p>
              </div>
            </div>

            <p className="mb-4 px-4 text-sm italic leading-relaxed text-gray-700" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              for having satisfactorily completed the National Service Training Program &ndash; Civic Welfare Training
              Service (NSTP-CWTS) A.Y. {academicYear} with a <span className="font-bold not-italic">SERIAL NUMBER</span> of{" "}
              <span className="border-b border-gray-800 px-1 font-bold not-italic">{serialData.serialNumber}</span>
            </p>

            <p className="mb-10 px-4 text-sm italic text-gray-700" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              {`Given this ${day} day of ${month}, ${year} at the Buenavista Cultural Center, Poblacion, Buenavista, Bohol.`}
            </p>

            {/* Signatures — desktop layout: flex justify-between (not grid), sm: sizes only */}
            <div className="mt-6 flex items-end justify-between px-6" dir="ltr">
              <div className="text-center">
                {serialData.nstpCoordinatorSignature && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={serialData.nstpCoordinatorSignature}
                    alt=""
                    className="mx-auto h-28 object-contain -mb-10"
                  />
                )}
                {serialData.nstpCoordinator && (
                  <p className="mb-0 text-sm font-bold leading-tight text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    {serialData.nstpCoordinator}
                  </p>
                )}
                <div className="mb-1 mt-0.5 w-48 border-b border-gray-800" />
                <p className="text-xs italic text-gray-600" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                  NSTP - Coordinator
                </p>
              </div>
              <div className="text-center">
                {serialData.bccPresidentSignature && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={serialData.bccPresidentSignature}
                    alt=""
                    className="mx-auto h-28 object-contain -mb-10"
                  />
                )}
                {serialData.bccPresident && (
                  <p className="mb-0 text-sm font-bold leading-tight text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    {serialData.bccPresident}
                  </p>
                )}
                <div className="mb-1 mt-0.5 w-48 border-b border-gray-800" />
                <p className="text-xs italic text-gray-600" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                  BCC President
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="text-center">
                {serialData.municipalMayorSignature && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={serialData.municipalMayorSignature}
                    alt=""
                    className="mx-auto h-28 object-contain -mb-10"
                  />
                )}
                {serialData.municipalMayor && (
                  <p className="mb-0 text-sm font-bold leading-tight text-gray-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    {serialData.municipalMayor}
                  </p>
                )}
                <div className="mb-1 mt-0.5 w-52 border-b border-gray-800" />
                <p className="text-xs italic text-gray-600" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
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
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
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

  const handleDownloadCertificate = async () => {
    const node = certificateRef.current;
    if (!node || !serialData) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      if (typeof document.fonts?.ready !== "undefined") {
        await document.fonts.ready;
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const exportHeight = Math.ceil(node.scrollHeight);
      const dataUrl = await toPng(node, {
        width: CERTIFICATE_EXPORT_WIDTH_PX,
        height: exportHeight,
        cacheBust: true,
        pixelRatio: CERTIFICATE_DOWNLOAD_PIXEL_RATIO,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = buildCertificateDownloadFilename(studentFullName, serialData.serialNumber);
      link.rel = "noopener";
      link.click();
    } catch (err) {
      console.error("Certificate download failed:", err);
      setDownloadError("Could not save the image. Try again, or take a screenshot if it keeps failing.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <StudentPageLayout>
      <div className="mx-auto mt-4 sm:mt-8 w-full min-w-0 max-w-4xl px-2 max-sm:overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : serialData && profile ? (
          <div className="space-y-5">
            {/* Mobile only: pan/zoom frame + stone border. Desktop: certificate only (sm:contents unwraps these wrappers). */}
            <div className="w-full min-w-0 max-sm:overflow-hidden max-sm:rounded-xl max-sm:border max-sm:border-gray-200/80 max-sm:bg-stone-100/60 max-sm:shadow-inner sm:contents">
              <div
                className="max-sm:max-h-[min(92vh,1400px)] max-sm:overflow-x-auto max-sm:overflow-y-auto max-sm:overscroll-x-contain max-sm:pl-3 max-sm:touch-auto max-sm:[-webkit-overflow-scrolling:touch] sm:contents"
              >
                {/* 896px must match CERTIFICATE_EXPORT_WIDTH_PX (mobile pan width) */}
                <div
                  ref={certificateRef}
                  className="mx-auto w-full min-w-0 max-w-4xl max-sm:max-w-none max-sm:shrink-0 max-sm:[width:896px] max-sm:[min-width:896px]"
                >
                  {isROTC ? (
                    <ROTCCertificate serialData={serialData} studentFullName={studentFullName} />
                  ) : (
                    <CWTSCertificate serialData={serialData} studentFullName={studentFullName} />
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="order-2 text-xs text-gray-600 leading-relaxed sm:order-1 sm:min-w-0 sm:flex-1">
                  Download a PNG for your records. On a phone, pan inside the gray frame above if needed.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadCertificate}
                  disabled={downloading}
                  className="order-1 flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:order-2 sm:w-auto"
                >
                  {downloading ? (
                    <>
                      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download certificate
                    </>
                  )}
                </button>
              </div>
              {downloadError && (
                <p className="mt-3 text-xs font-medium text-red-600" role="alert">
                  {downloadError}
                </p>
              )}
            </div>

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
