import StudentPageLayout from "@/components/layout/StudentPageLayout";
import ComingSoon from "@/components/common/ComingSoon";

export default function SerialNumberPage() {
  return (
    <StudentPageLayout>
      <ComingSoon
        title="Serial Number"
        description="Your serial number will be issued here upon completion of the NSTP program."
      />
    </StudentPageLayout>
  );
}
