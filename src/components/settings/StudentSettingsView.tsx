"use client";

import StudentPageLayout from "@/components/layout/StudentPageLayout";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";

export default function StudentSettingsView() {
  return (
    <StudentPageLayout>
      <div className="max-w-lg">
        <PageIntroPanel
          title="Settings"
          subtitle="Manage your student account."
          variant="sky"
        />
        <ChangePasswordForm />
      </div>
    </StudentPageLayout>
  );
}



