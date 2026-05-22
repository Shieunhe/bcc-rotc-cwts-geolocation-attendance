import { EnrollmentWithMs } from "@/types";
import EnrollmentDetailRow from "./EnrollmentDetailRow";

interface Props {
  profile: EnrollmentWithMs;
}

export default function EnrollmentAcademic({ profile }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Academic Information</h3>
      <EnrollmentDetailRow label="Course" value={profile.course} />
      <EnrollmentDetailRow label="Year Level" value={profile.yearLevel} />
      <EnrollmentDetailRow label="NSTP Component" value={profile.nstpComponent} />
      <EnrollmentDetailRow label="MS Level" value={profile.msRecords.map((r) => `MS ${r.msLevel}`).join(", ") || "—"} />
    </div>
  );
}
