import Input from "@/components/common/Input";
import { EnrollmentStepProps } from "@/types/enrollmentTypes";

const selectClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

function formatStudentId(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 10);
  if (digits.length > 6) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export default function PersonalInfoStep({ form, updateField, updateBoolean }: EnrollmentStepProps) {
  return (
    <>
      <div>
        <Input label="Student ID" type="text" placeholder="e.g. 000000-0000"
          value={form.studentId}
          maxLength={11}
          onChange={(e) => updateField("studentId", formatStudentId(e.target.value))} />
      </div>
      <div>
        <Input label="Last Name" type="text" placeholder="Last Name"
          value={form.lastName}
          onChange={(e) => updateField("lastName", e.target.value.toUpperCase())} />
      </div>
      <div>
        <Input label="First Name" type="text" placeholder="First Name"
          value={form.firstName}
          onChange={(e) => updateField("firstName", e.target.value.toUpperCase())} />
      </div>
      <div>
        <Input label="Middle Name (Optional)" type="text" placeholder="Middle Name"
          value={form.middleName ?? ""}
          onChange={(e) => updateField("middleName", e.target.value.toUpperCase())} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Contact Number" type="tel" placeholder="09XXXXXXXXX"
          value={form.contactNumber}
          maxLength={11}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "");
            if (!digitsOnly.startsWith("09") && digitsOnly.length >= 2) return;
            updateField("contactNumber", digitsOnly);
          }} />
          <Input label="Religion" type="text" placeholder="Religion"
          value={form.religion} onChange={(e) => updateField("religion", e.target.value.toUpperCase())} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Date of Birth" type="date"
          value={form.birthdate} onChange={(e) => updateField("birthdate", e.target.value)} />
        <div>
          <label className={labelClass}>Gender</label>
          <select value={form.sex} onChange={(e) => updateField("sex", e.target.value)} className={selectClass}>
            <option value="" disabled>Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
      </div>
      <Input label="Place of Birth" type="text" placeholder="Place of Birth"
        value={form.placeOfBirth} onChange={(e) => updateField("placeOfBirth", e.target.value.toUpperCase())} />
      <div>Temporary Address: </div>
      <div className="space-y-3">
        <Input label="No./ St / Vill / Brgy" type="text" placeholder="No./ St / Vill / Brgy"
          value={form.temporaryBarangay} onChange={(e) => updateField("temporaryBarangay", e.target.value.toUpperCase())} />
        <Input label="Municipality" type="text" placeholder="Municipality"
          value={form.temporaryMunicipality} onChange={(e) => updateField("temporaryMunicipality", e.target.value.toUpperCase())} />
        <Input label="Province" type="text" placeholder="Province"
          value={form.temporaryProvince} onChange={(e) => updateField("temporaryProvince", e.target.value.toUpperCase())} />
      </div>
      <div>Permament   Address: </div>
      <div className="space-y-3">
        <Input label="No./ St / Vill / Brgy" type="text" placeholder="No./ St / Vill / Brgy"
          value={form.permanentBarangay} onChange={(e) => updateField("permanentBarangay", e.target.value.toUpperCase())} />
        <Input label="Municipality" type="text" placeholder="Municipality"
          value={form.permanentMunicipality} onChange={(e) => updateField("permanentMunicipality", e.target.value.toUpperCase())} />
        <Input label="Province" type="text" placeholder="Province"
          value={form.permanentProvince} onChange={(e) => updateField("permanentProvince", e.target.value.toUpperCase())} />
        <Input label="Father Name" type="text" placeholder="Father Name"
          value={form.fatherName} onChange={(e) => updateField("fatherName", e.target.value.toUpperCase())} />
        <Input label="Father Occupation" type="text" placeholder="Father Occupation"
          value={form.fatherOccupation} onChange={(e) => updateField("fatherOccupation", e.target.value.toUpperCase())} />
        <Input label="Mother Name" type="text" placeholder="Mother Name"
          value={form.motherName} onChange={(e) => updateField("motherName", e.target.value.toUpperCase())} />
        <Input label="Mother Occupation" type="text" placeholder="Mother Occupation"
          value={form.motherOccupation} onChange={(e) => updateField("motherOccupation", e.target.value.toUpperCase())} />
      </div>
      <div>Person to be notified in case of emergency:</div>
      <div className="space-y-3">
        <Input label="Name" type="text" placeholder="Emergency Contact Name"
          value={form.emergencyContactName} onChange={(e) => updateField("emergencyContactName", e.target.value.toUpperCase())} />
        <Input label="Emergency Contact Address" type="text" placeholder="Emergency Contact Address"
          value={form.emergencyContactAddress} onChange={(e) => updateField("emergencyContactAddress", e.target.value.toUpperCase())} />
        <Input label="Emergency Contact Relationship" type="text" placeholder="Emergency Contact Relationship"
          value={form.emergencyContactRelationship} onChange={(e) => updateField("emergencyContactRelationship", e.target.value.toUpperCase())} />
        <Input label="Emergency Contact Contact Number" type="tel" placeholder="09XXXXXXXXX"
          value={form.emergencyContactContactNumber}
          maxLength={11}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "");
            if (!digitsOnly.startsWith("09") && digitsOnly.length >= 2) return;
            updateField("emergencyContactContactNumber", digitsOnly);
          }} />
      </div>
      <div className="flex items-center gap-3 mt-8">
        <input
          type="checkbox"
          id="willingToTakeAdvanceCourse"
          checked={form.willingToTakeAdvanceCourse}
          onChange={(e) => updateBoolean("willingToTakeAdvanceCourse", e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="willingToTakeAdvanceCourse" className={labelClass + " mb-0 cursor-pointer"}>
          Are you willing to take the advance course?
        </label>
      </div>
    </>
  );
}
