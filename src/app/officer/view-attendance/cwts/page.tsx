import OfficerPageLayout from "@/components/layout/OfficerPageLayout";
import OfficerViewAttendance from "@/components/officer/view-attendance/OfficerViewAttendance";

export default function CWTSViewAttendancePage() {
  return (
    <OfficerPageLayout>
      <OfficerViewAttendance section="cwts" />
    </OfficerPageLayout>
  );
}
