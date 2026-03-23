import StudentPageLayout from "@/components/layout/StudentPageLayout";
import ComingSoon from "@/components/common/ComingSoon";

export default function AttendancePage() {
  return (
    <StudentPageLayout>
      <ComingSoon
        title="Attendance"
        description="Mark your attendance using geolocation and view your attendance history here."
      />
    </StudentPageLayout>
  );
}
