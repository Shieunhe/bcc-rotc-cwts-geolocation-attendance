import OfficerPageLayout from "@/components/layout/OfficerPageLayout";
import OfficerViewAttendance from "@/components/officer/view-attendance/OfficerViewAttendance";

export default function AdvanceCourseViewAttendancePage() {
  return (
    <OfficerPageLayout>
      <OfficerViewAttendance section="advance-course" />
    </OfficerPageLayout>
  );
}
