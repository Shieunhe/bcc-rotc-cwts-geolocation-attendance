import { EnrollmentDocument } from "@/types";
import EnrollmentDetailRow from "./EnrollmentDetailRow";

interface Props {
  profile: EnrollmentDocument;
}

export default function EnrollmentPersonalInfo({ profile }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
      <EnrollmentDetailRow label="Student ID" value={profile.studentId} />
      <EnrollmentDetailRow label="Last Name" value={profile.lastName} />
      <EnrollmentDetailRow label="First Name" value={profile.firstName} />
      <EnrollmentDetailRow label="Middle Name" value={profile.middleName} />
      <EnrollmentDetailRow label="Sex" value={profile.sex} />
      <EnrollmentDetailRow label="Birthdate" value={profile.birthdate} />
      <EnrollmentDetailRow label="Contact Number" value={profile.contactNumber} />
      <EnrollmentDetailRow label="Religion" value={profile.religion} />
      <EnrollmentDetailRow label="Place of Birth" value={profile.placeOfBirth} />
    </div>
  );
}
