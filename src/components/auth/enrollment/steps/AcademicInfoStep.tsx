import Input from "@/components/common/Input";
import { NSTProgram } from "@/types";
import { EnrollmentStepProps } from "@/types/enrollmentTypes";

const selectClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

const nstpPrograms: NSTProgram[] = ["ROTC", "CWTS"];

export default function AcademicInfoStep({ form, updateField }: EnrollmentStepProps) {
  return (
    <>
      <Input label="Course" type="text" placeholder="e.g. BS Information Technology"
        value={form.course} onChange={(e) => updateField("course", e.target.value.toUpperCase())}  />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Year Level</label>
          <select value={form.yearLevel} onChange={(e) => updateField("yearLevel", e.target.value)} className={selectClass}>
            <option value="" disabled>Select year level</option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>4th Year</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>NSTP Level</label>
          <select value={form.nstpLevel} onChange={(e) => updateField("nstpLevel", e.target.value)} className={selectClass}>
            <option value="" disabled>Select NSTP level</option>
            <option>NSTP 1</option>
            <option>NSTP 2</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>NSTP Component</label>
        <div className="grid grid-cols-2 gap-2 mt-1 mb-10">
          {nstpPrograms.map((program) => (
            <button key={program} type="button"
              onClick={() => updateField("nstpComponent", program)}
              className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                ${form.nstpComponent === program
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-blue-400"}`}>
              {program}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
