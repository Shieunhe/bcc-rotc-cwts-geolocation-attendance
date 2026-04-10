import Input from "@/components/common/Input";
import { NSTProgram } from "@/types";
import { EnrollmentStepProps } from "@/types/enrollmentTypes";

const selectClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

const nstpPrograms: NSTProgram[] = ["ROTC", "CWTS"];

const ROTC_ONLY_COURSES = ["BS CRIMINOLOGY"];

const MEDICAL_NA_COURSES = ["BS CRIMINOLOGY"];

export default function AcademicInfoStep({ form, updateField, updateBoolean }: EnrollmentStepProps) {
  const isRotcOnly = ROTC_ONLY_COURSES.includes(form.course);

  function resetMedicalFields() {
    updateBoolean("hasMedicalCondition", null as unknown as boolean);
    updateField("medicalCondition", "");
  }

  function handleCourseChange(course: string) {
    updateField("course", course);
    if (ROTC_ONLY_COURSES.includes(course)) {
      updateField("nstpComponent", "ROTC");
    }
    if (MEDICAL_NA_COURSES.includes(course)) {
      resetMedicalFields();
    }
  }

  function handleNstpChange(program: string) {
    updateField("nstpComponent", program);
    if (program === "CWTS") {
      resetMedicalFields();
    }
  }

  return (
    <>
      <div>
        <label className={labelClass}>Course</label>
        <select value={form.course} onChange={(e) => handleCourseChange(e.target.value)} className={selectClass}>
          <option value="" disabled>Select Course</option>
          <option value="BS CRIMINOLOGY">BS CRIMINOLOGY</option>
          <option value="BS HOSPITALITY MANAGEMENT">BS HOSPITALITY MANAGEMENT</option>
          <option value="BS INFORMATION TECHNOLOGY">BS INFORMATION TECHNOLOGY</option>
          <option value="BS TOURISM MANAGEMENT">BS TOURISM MANAGEMENT</option>
          <option disabled>Education:</option>
          <option value="BEED">&nbsp;&nbsp;&nbsp;BEED</option>
          <option value="BEED ENGLISH">&nbsp;&nbsp;&nbsp;BEED ENGLISH</option>
          <option value="BEED MATH">&nbsp;&nbsp;&nbsp;BEED MATH</option>
        </select>
      </div>

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
          <label className={labelClass}>MS Level</label>
          <select value={form.msLevel} onChange={(e) => updateField("msLevel", e.target.value)} className={selectClass}>
            <option value="" disabled>Select MS level</option>
            <option value="1">MS 1</option>
            <option value="2">MS 2</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>NSTP Component</label>
        <div className="grid grid-cols-2 gap-2 mt-1 mb-10">
          {nstpPrograms.map((program) => {
            const isDisabled = isRotcOnly && program === "CWTS";
            return (
              <button key={program} type="button"
                onClick={() => !isDisabled && handleNstpChange(program)}
                disabled={isDisabled}
                className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                  ${isDisabled
                    ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                    : form.nstpComponent === program
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-blue-400"}`}>
                {program}
              </button>
            );
          })}
        </div>
        {isRotcOnly && (
          <p className="text-xs text-amber-600 -mt-9 mb-6">BS Criminology students are required to enroll in ROTC.</p>
        )}
      </div>
    </>
  );
}
