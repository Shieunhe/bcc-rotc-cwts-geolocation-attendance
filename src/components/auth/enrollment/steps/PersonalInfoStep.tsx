import Input from "@/components/common/Input";
import { EnrollmentStepProps } from "@/types/enrollmentTypes";

const selectClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

export default function PersonalInfoStep({ form, updateField }: EnrollmentStepProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Student ID" type="text" placeholder="e.g. 2021-00001"
          value={form.studentId}
          onChange={(e) => updateField("studentId", e.target.value.replace(/\D/g, ""))} />
        <Input label="Full Name" type="text" placeholder="Last, First Name"
          value={form.fullName}
          onChange={(e) => updateField("fullName", e.target.value.toUpperCase())} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Birthdate" type="date"
          value={form.birthdate} onChange={(e) => updateField("birthdate", e.target.value)} />
        <div>
          <label className={labelClass}>Sex</label>
          <select value={form.sex} onChange={(e) => updateField("sex", e.target.value)} className={selectClass}>
            <option value="" disabled>Select sex</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
      </div>
      <Input label="Contact Number" type="tel" placeholder="09XXXXXXXXX"
        value={form.contactNumber}
        maxLength={11}
        onChange={(e) => {
          const digitsOnly = e.target.value.replace(/\D/g, "");
          if (!digitsOnly.startsWith("09") && digitsOnly.length >= 2) return;
          updateField("contactNumber", digitsOnly);
        }} />
      <Input label="Address" type="text" placeholder="Street, Barangay, City"
        value={form.address} onChange={(e) => updateField("address", e.target.value)} />
    </>
  );
}
