import { useState, useEffect } from "react";
import Input from "@/components/common/Input";
import { EnrollmentSchedule, MSLevel, NSTProgram } from "@/types";
import { EnrollmentStepProps } from "@/types/enrollmentTypes";
import { enrollmentService } from "@/services/enrollment.service";

const selectClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

const nstpPrograms: NSTProgram[] = ["ROTC", "CWTS"];

const ROTC_ONLY_COURSES = ["BS Criminology"];

const MEDICAL_NA_COURSES = ["BS Criminology"];

function isScheduleOpen(s: EnrollmentSchedule): boolean {
  const now = new Date();
  return now >= new Date(s.openDate) && now <= new Date(s.deadline);
}

export default function AcademicInfoStep({ form, updateField, updateBoolean }: EnrollmentStepProps) {
  const isRotcOnly = ROTC_ONLY_COURSES.includes(form.course);
  const [openMsLevels, setOpenMsLevels] = useState<MSLevel[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const isFirstTimeLockedProgram = form.nstpComponent === "CWTS" || form.nstpComponent === "ROTC";
  const levelLabel = form.nstpComponent === "CWTS" ? "CWTS Level" : "MS Level";
  const levelPrefix = form.nstpComponent === "CWTS" ? "CWTS" : "MS";

  useEffect(() => {
    if (!form.nstpComponent) {
      setOpenMsLevels([]);
      return;
    }
    let cancelled = false;
    setLoadingSchedules(true);
    enrollmentService.getEnrollmentSchedules(form.nstpComponent as NSTProgram).then((schedules) => {
      if (cancelled) return;
      const open = (schedules ?? []).filter(isScheduleOpen).map((s) => s.msLevel);
      const allowedOpen = isFirstTimeLockedProgram
        ? open.filter((ms): ms is MSLevel => ms === "1")
        : open;
      setOpenMsLevels(allowedOpen);
      if (isFirstTimeLockedProgram) {
        updateField("msLevel", allowedOpen.includes("1") ? "1" : "");
      } else if (form.msLevel && !allowedOpen.includes(form.msLevel as MSLevel)) {
        updateField("msLevel", "");
      }
      setLoadingSchedules(false);
    }).catch(() => {
      if (!cancelled) {
        setOpenMsLevels([]);
        setLoadingSchedules(false);
      }
    });
    return () => { cancelled = true; };
  }, [form.nstpComponent]);

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
    updateField("msLevel", program === "CWTS" || program === "ROTC" ? "1" : "");
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
          <option value="BS Criminology">BS Criminology</option>
          <option value="BS Hospitality Management">BS Hospitality Management</option>
          <option value="BS Information Technology">BS Information Technology</option>
          <option value="BS Tourism Management">BS Tourism Management</option>
          <option disabled>Education:</option>
          <option value="BEED - Bachelor of Elementary Education">&nbsp;&nbsp;&nbsp;BEED - Bachelor of Elementary Education</option>
          <option value="BSED - Major in English">&nbsp;&nbsp;&nbsp;BSED - Major in English</option>
          <option value="BSED - Major in Mathematics">&nbsp;&nbsp;&nbsp;BSED - Major in Mathematics</option>
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
          <label className={labelClass}>{levelLabel}</label>
          {isFirstTimeLockedProgram ? (
            <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 bg-gray-50">
              {!form.nstpComponent
                ? "Select NSTP first"
                : loadingSchedules
                  ? "Loading..."
                  : openMsLevels.includes("1")
                    ? `${levelPrefix} 1`
                    : "No open enrollment"}
            </div>
          ) : (
            <select
              value={form.msLevel}
              onChange={(e) => updateField("msLevel", e.target.value)}
              disabled={!form.nstpComponent || loadingSchedules}
              className={selectClass + (!form.nstpComponent ? " opacity-50 cursor-not-allowed" : "")}
            >
              <option value="" disabled>
                {!form.nstpComponent
                  ? "Select NSTP first"
                  : loadingSchedules
                    ? "Loading..."
                    : openMsLevels.length === 0
                      ? "No open enrollment"
                      : `Select ${levelLabel.toLowerCase()}`}
              </option>
              {(["1", "2"] as MSLevel[]).map((ms) => {
                const isOpen = openMsLevels.includes(ms);
                return (
                  <option key={ms} value={ms} disabled={!isOpen}>
                    {levelPrefix} {ms}{!isOpen && form.nstpComponent ? " (not open)" : ""}
                  </option>
                );
              })}
            </select>
          )}
          {form.nstpComponent && !loadingSchedules && openMsLevels.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No enrollment schedule is currently open for {form.nstpComponent}.</p>
          )}
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
