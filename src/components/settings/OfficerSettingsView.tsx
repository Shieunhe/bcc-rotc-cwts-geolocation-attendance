"use client";

import OfficerPageLayout from "@/components/layout/OfficerPageLayout";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";

export default function OfficerSettingsView() {
  return (
    <OfficerPageLayout>
      <div className="max-w-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5 mb-6">Manage your officer account.</p>
        <ChangePasswordForm />
      </div>
    </OfficerPageLayout>
  );
}
