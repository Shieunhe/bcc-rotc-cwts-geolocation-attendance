"use client";

import OfficerPageLayout from "@/components/layout/OfficerPageLayout";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";

export default function OfficerSettingsView() {
  return (
    <OfficerPageLayout>
      <div className="max-w-lg">
        <PageIntroPanel
          title="Settings"
          subtitle="Manage your officer account."
          variant="sky"
        />
        <ChangePasswordForm />
      </div>
    </OfficerPageLayout>
  );
}
