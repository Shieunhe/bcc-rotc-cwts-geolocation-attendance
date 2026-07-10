import { NSTProgram } from '@/types';
import PageIntroPanel from "@/components/common/PageIntroPanel";

interface AdminEnrollmentHeaderProps {
    program: NSTProgram;
}

export default function AdminEnrollmentHeader({ program }: AdminEnrollmentHeaderProps) {
  return (
    <PageIntroPanel
      title="Enrollment List"
      subtitle={`View and manage all ${program} enrollments.`}
      variant={program === "CWTS" ? "emerald" : "sky"}
    />
  )
}
