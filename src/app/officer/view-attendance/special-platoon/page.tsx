import OfficerPageLayout from "@/components/layout/OfficerPageLayout";
import OfficerViewAttendance from "@/components/officer/view-attendance/OfficerViewAttendance";

export default function SpecialPlatoonViewAttendancePage() {
  return (
    <OfficerPageLayout>
      <OfficerViewAttendance section="special-platoon" />
    </OfficerPageLayout>
  );
}
