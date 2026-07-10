"use client";

import AdminPageLayout from "@/components/layout/AdminPageLayout";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import { NSTProgram } from "@/types";

interface AdminSettingsViewProps {
  program: NSTProgram;
}

export default function AdminSettingsView({ program }: AdminSettingsViewProps) {
  return (
    <AdminPageLayout program={program}>
      <div className="max-w-lg">
        <PageIntroPanel
          title="Settings"
          subtitle="Manage your admin account."
          variant={program === "CWTS" ? "emerald" : "sky"}
        />
        <ChangePasswordForm />
      </div>
    </AdminPageLayout>
  );
}
