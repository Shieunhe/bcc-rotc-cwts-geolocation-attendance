"use client";

import StudentPageLayout from "@/components/layout/StudentPageLayout";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";

export default function StudentSettingsView() {
  return (
    <StudentPageLayout>
      <div className="max-w-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5 mb-6">Manage your student account.</p>
        <ChangePasswordForm />
      </div>
    </StudentPageLayout>
  );
}
