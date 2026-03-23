import StudentPageLayout from "@/components/layout/StudentPageLayout";
import ComingSoon from "@/components/common/ComingSoon";

export default function GradesPage() {
  return (
    <StudentPageLayout>
      <ComingSoon
        title="Grades"
        description="Your final grade will be visible here once it has been released by your instructor."
      />
    </StudentPageLayout>
  );
}
