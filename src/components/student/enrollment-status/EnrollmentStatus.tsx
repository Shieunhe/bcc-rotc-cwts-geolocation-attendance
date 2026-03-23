"use client";

import StudentPageLayout from "@/components/layout/StudentPageLayout";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useAuthGuard } from "@/hooks/useAuthGuard";
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
    timelineStep: 2,
  },
  rejected: {
    label: "Rejected",
    description: "Your enrollment was not approved. Please contact your NSTP coordinator for further assistance.",
    color: "bg-red-50 border-red-200",
    badgeColor: "bg-red-100 text-red-700 border-red-300",
    dot: "bg-red-500",
    timelineStep: 2,
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
        <EnrollmentStatusBanner status={status} />

        {/* Timeline */}
        <EnrollmentTimeline timelineSteps={timelineSteps} status={status} profileStatus={profile.status} />

        <EnrollmentPersonalInfo profile={profile} />
        <EnrollmentAcademic profile={profile} />
        <EnrollmentPhysicalHealth profile={profile} />
      </div>
    </StudentPageLayout>
  );
}
