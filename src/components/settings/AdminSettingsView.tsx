"use client";

import AdminPageLayout from "@/components/layout/AdminPageLayout";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import { NSTProgram } from "@/types";

interface AdminSettingsViewProps {
  program: NSTProgram;
}

export default function AdminSettingsView({ program }: AdminSettingsViewProps) {
  return (
    <AdminPageLayout program={program}>
      <div className="max-w-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5 mb-6">Manage your admin account.</p>
        <ChangePasswordForm />
      </div>
    </AdminPageLayout>
  );
}
