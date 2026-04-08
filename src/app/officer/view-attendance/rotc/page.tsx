import OfficerPageLayout from "@/components/layout/OfficerPageLayout";
import OfficerViewAttendance from "@/components/officer/view-attendance/OfficerViewAttendance";

export default function ROTCViewAttendancePage() {
  return (
    <OfficerPageLayout>
      <OfficerViewAttendance section="rotc" />
    </OfficerPageLayout>
  );
}
