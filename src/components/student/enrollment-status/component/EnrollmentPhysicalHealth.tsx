import { EnrollmentDocument } from "@/types";
import EnrollmentDetailRow from "./EnrollmentDetailRow";

interface Props {
  profile: EnrollmentDocument;
}

export default function EnrollmentPhysicalHealth({ profile }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Physical & Health</h3>
      <EnrollmentDetailRow label="Height" value={profile.height} />
      <EnrollmentDetailRow label="Weight" value={profile.weight} />
      <EnrollmentDetailRow label="Blood Type" value={profile.bloodType} />
      <EnrollmentDetailRow label="Complexion" value={profile.complexion} />
      <EnrollmentDetailRow label="Medical Condition" value={profile.hasMedicalCondition ? profile.medicalCondition || "Yes" : "None"} />
    </div>
  );
}
