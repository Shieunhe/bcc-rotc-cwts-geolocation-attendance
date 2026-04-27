"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StudentPageLayout from "@/components/layout/StudentPageLayout";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { adminService } from "@/services/admin.service";
import { NSTProgram } from "@/types";
import EnrollmentTimeline from "./component/EnrollmentTimeline";
import EnrollmentStatusBanner from "./component/EnrollmentStatusBanner";
import EnrollmentPersonalInfo from "./component/EnrollmentPersonalInfo";
import EnrollmentAcademic from "./component/EnrollmentAcademic";
import EnrollmentPhysicalHealth from "./component/EnrollmentPhysicalHealth";


const statusConfig = {
  pending: {
    label: "Pending Approval",
    description: "Your enrollment has been submitted and is currently under review by the admin. Please wait for approval.",
    color: "bg-yellow-50 border-yellow-200",
    badgeColor: "bg-yellow-100 text-yellow-700 border-yellow-300",
    dot: "bg-yellow-400",
    timelineStep: 1,
  },
  approved: {
    label: "Approved",
    description: "Your enrollment has been approved. You are now officially enrolled in the NSTP program.",
    color: "bg-green-50 border-green-200",
    badgeColor: "bg-green-100 text-green-700 border-green-300",
    dot: "bg-green-500",
    timelineStep: 3,
  },
  rejected: {
    label: "Rejected",
    description: "Your enrollment was not approved. Please contact your NSTP coordinator for further assistance.",
    color: "bg-red-50 border-red-200",
    badgeColor: "bg-red-100 text-red-700 border-red-300",
    dot: "bg-red-500",
    timelineStep: 3,
  },
};

const timelineSteps = [
  { label: "Enrollment Submitted", description: "Your form was received." },
  { label: "Under Review", description: "Admin is reviewing your application." },
  { label: "Decision", description: "Approval or rejection by admin." },
];


export default function EnrollmentStatus() {
  const { profile, authLoading, dataLoading, uid } = useStudentProfile();
  useAuthGuard({ authLoading, uid });
  const [reEnrollAvailable, setReEnrollAvailable] = useState(false);

  const nextMs = profile?.msLevel === "1" && profile?.status === "approved" ? "2" : null;

  useEffect(() => {
    if (!nextMs || !profile?.nstpComponent) return;
    adminService
      .getEnrollmentSchedule(profile.nstpComponent as NSTProgram, nextMs)
      .then((schedule) => {
        if (!schedule) return;
        const now = new Date();
        if (now >= new Date(schedule.openDate) && now <= new Date(schedule.deadline)) {
          setReEnrollAvailable(true);
        }
      })
      .catch(() => {});
  }, [nextMs, profile?.nstpComponent]);

  if (authLoading || dataLoading) {
    return (
      <StudentPageLayout>
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </StudentPageLayout>
    );
  }

  if (!profile) {
    return (
      <StudentPageLayout>
        <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
          <p className="text-base font-semibold text-red-500">Profile not found.</p>
        </div>
      </StudentPageLayout>
    );
  }

  const status = statusConfig[profile.status] ?? statusConfig.pending;

  return (
    <StudentPageLayout>
      <div className="max-w-2xl w-full mx-auto space-y-4">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">Enrollment Status</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {profile.createdAt ? `Submitted on ${new Date(profile.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}` : "Submission date unavailable"}
          </p>
        </div>

        {/* Status banner */}
        <EnrollmentStatusBanner status={status} rejectionReason={profile.rejectionReason} />

        {/* Re-enrollment banner */}
        {reEnrollAvailable && nextMs && (
          <Link href="/student/re-enrollment" className="block bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">MS {nextMs} Enrollment is Open</p>
                  <p className="text-xs text-indigo-600/70 mt-0.5">Tap here to apply for re-enrollment. Your information will be pre-filled.</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-indigo-300 group-hover:text-indigo-500 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        {/* Timeline */}
        <EnrollmentTimeline timelineSteps={timelineSteps} status={status} profileStatus={profile.status} />

        <EnrollmentPersonalInfo profile={profile} />
        <EnrollmentAcademic profile={profile} />
        <EnrollmentPhysicalHealth profile={profile} />
      </div>
    </StudentPageLayout>
  );
}
