"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import StudentPageLayout from "@/components/layout/StudentPageLayout";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { enrollmentService } from "@/services/enrollment.service";
import { adminService } from "@/services/admin.service";
import { EnrollmentFormData } from "@/types/enrollmentTypes";
import { NSTProgram, EnrollmentDocument } from "@/types";
import Button from "@/components/common/Button";
import PersonalInfoStep from "@/components/auth/enrollment/steps/PersonalInfoStep";
import PhysicalHealthStep from "@/components/auth/enrollment/steps/PhysicalHealthStep";

const STEPS = ["Academic Info", "Personal Info", "Physical & Health"];

function profileToFormData(p: EnrollmentDocument, nextMs: string): EnrollmentFormData {
  return {
    studentId: p.studentId,
    lastName: p.lastName,
    firstName: p.firstName,
    middleName: p.middleName || "",
    religion: p.religion,
    birthdate: p.birthdate,
    sex: p.sex,
    contactNumber: p.contactNumber,
    placeOfBirth: p.placeOfBirth,
    temporaryBarangay: p.temporaryBarangay,
    temporaryMunicipality: p.temporaryMunicipality,
    temporaryProvince: p.temporaryProvince,
    permanentBarangay: p.permanentBarangay,
    permanentMunicipality: p.permanentMunicipality,
    permanentProvince: p.permanentProvince,
    fatherName: p.fatherName,
    fatherOccupation: p.fatherOccupation,
    motherName: p.motherName,
    motherOccupation: p.motherOccupation,
    emergencyContactName: p.emergencyContactName,
    emergencyContactAddress: p.emergencyContactAddress,
    emergencyContactRelationship: p.emergencyContactRelationship,
    emergencyContactContactNumber: p.emergencyContactContactNumber,
    willingToTakeAdvanceCourse: p.willingToTakeAdvanceCourse,
    course: p.course,
    yearLevel: p.yearLevel,
    nstpComponent: p.nstpComponent,
    msLevel: nextMs as EnrollmentFormData["msLevel"],
    height: p.height,
    weight: p.weight,
    bloodType: p.bloodType,
    complexion: p.complexion,
    hasMedicalCondition: p.hasMedicalCondition,
    medicalCondition: p.medicalCondition || "",
    medicalCertificate: null,
    xrayFile: null,
    email: p.email,
    username: p.username,
    password: p.password,
    confirmPassword: "",
    photo: null,
    corFile: null,
  };
}

const COURSES = [
  "BS INFORMATION TECHNOLOGY",
  "BS COMPUTER SCIENCE",
  "BS HOSPITALITY MANAGEMENT",
  "BS BUSINESS ADMINISTRATION",
  "BS CRIMINOLOGY",
  "BS EDUCATION",
  "BS ACCOUNTANCY",
  "BS FISHERIES",
  "BS SOCIAL WORK",
];

const selectClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

export default function ReEnrollmentForm() {
  const router = useRouter();
  const { profile, uid, authLoading, dataLoading } = useStudentProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EnrollmentFormData | null>(null);
  const [validationError, setValidationError] = useState("");
  const [isCheckingSchedule, setIsCheckingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  const nextMs = profile?.msLevel === "1" ? "2" : null;

  useEffect(() => {
    if (profile && nextMs && !formData) {
      setFormData(profileToFormData(profile, nextMs));
    }
  }, [profile, nextMs, formData]);

  useEffect(() => {
    if (!nextMs || !profile?.nstpComponent) return;
    setIsCheckingSchedule(true);
    adminService
      .getEnrollmentSchedule(profile.nstpComponent as NSTProgram, nextMs)
      .then((schedule) => {
        if (!schedule) {
          setScheduleError(`${profile.nstpComponent} MS ${nextMs} is not yet open for enrollment.`);
          return;
        }
        const now = new Date();
        if (now < new Date(schedule.openDate)) {
          setScheduleError(`Enrollment for MS ${nextMs} is not yet open.`);
        } else if (now > new Date(schedule.deadline)) {
          setScheduleError(`Enrollment for MS ${nextMs} is already closed.`);
        }
      })
      .catch(() => setScheduleError("Unable to verify enrollment schedule."))
      .finally(() => setIsCheckingSchedule(false));
  }, [nextMs, profile?.nstpComponent]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!uid || !formData || !profile) throw new Error("Missing data");
      return enrollmentService.submitReEnrollment(uid, formData, profile);
    },
  });

  function updateField(field: keyof EnrollmentFormData, value: string) {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  }
  function updateBoolean(field: keyof EnrollmentFormData, value: boolean) {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  }
  function updateFile(field: keyof EnrollmentFormData, value: File | null) {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function validateCurrentStep(): string {
    if (!formData) return "Form data not loaded.";
    if (currentStep === 0) {
      if (!formData.course) return "Course is required.";
      if (!formData.yearLevel) return "Year level is required.";
    }
    if (currentStep === 1) {
      if (!formData.studentId) return "Student ID is required.";
      if (!/^\d{6}-\d{4}$/.test(formData.studentId)) return "Student ID must be in format 000000-0000.";
      if (!formData.lastName) return "Last name is required.";
      if (!formData.firstName) return "First name is required.";
      if (!formData.contactNumber) return "Contact number is required.";
      if (formData.contactNumber.length !== 11) return "Contact number must be 11 digits.";
      if (!formData.religion) return "Religion is required.";
      if (!formData.birthdate) return "Birthdate is required.";
      if (!formData.sex) return "Gender is required.";
      if (!formData.placeOfBirth) return "Place of birth is required.";
      if (!formData.temporaryBarangay) return "Temporary address is required.";
      if (!formData.temporaryMunicipality) return "Temporary municipality is required.";
      if (!formData.temporaryProvince) return "Temporary province is required.";
      if (!formData.permanentBarangay) return "Permanent address is required.";
      if (!formData.permanentMunicipality) return "Permanent municipality is required.";
      if (!formData.permanentProvince) return "Permanent province is required.";
      if (!formData.fatherName) return "Father name is required.";
      if (!formData.fatherOccupation) return "Father occupation is required.";
      if (!formData.motherName) return "Mother name is required.";
      if (!formData.motherOccupation) return "Mother occupation is required.";
      if (!formData.emergencyContactName) return "Emergency contact name is required.";
      if (!formData.emergencyContactAddress) return "Emergency contact address is required.";
      if (!formData.emergencyContactRelationship) return "Emergency contact relationship is required.";
      if (!formData.emergencyContactContactNumber) return "Emergency contact number is required.";
      if (formData.emergencyContactContactNumber.length !== 11) return "Emergency contact number must be 11 digits.";
    }
    if (currentStep === 2) {
      if (!formData.height) return "Height is required.";
      if (!formData.weight) return "Weight is required.";
      if (!formData.bloodType) return "Blood type is required.";
      if (!formData.complexion) return "Complexion is required.";
      const isCWTS = formData.nstpComponent === "CWTS";
      const isMedicalNA = isCWTS || formData.course === "BS CRIMINOLOGY";
      if (!isMedicalNA) {
        if (formData.hasMedicalCondition === null) return "Please select if you have a medical condition.";
        if (formData.hasMedicalCondition === true && !formData.medicalCondition) return "Please specify your medical condition.";
      }
    }
    return "";
  }

  function handleNext() {
    const error = validateCurrentStep();
    if (error) { setValidationError(error); return; }
    setValidationError("");
    setFileError(null);
    setCurrentStep((prev) => prev + 1);
  }

  function handleBack() {
    setValidationError("");
    setFileError(null);
    setCurrentStep((prev) => prev - 1);
  }

  async function handleSubmit() {
    const error = validateCurrentStep();
    if (error) { setValidationError(error); return; }
    setValidationError("");
    const result = await mutation.mutateAsync();
    if (result.success) {
      // done
    }
  }

  const isLoading = authLoading || dataLoading;
  const displayError = fileError || validationError || (mutation.data?.success === false ? mutation.data.error : null);

  if (isLoading || isCheckingSchedule) {
    return (
      <StudentPageLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentPageLayout>
    );
  }

  if (!profile || !nextMs) {
    return (
      <StudentPageLayout>
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-700">Re-enrollment not available</p>
            <p className="text-sm text-gray-400 mt-1">You are not eligible for re-enrollment at this time.</p>
            <button onClick={() => router.push("/student/dashboard")} className="mt-5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              Back to Dashboard
            </button>
          </div>
        </div>
      </StudentPageLayout>
    );
  }

  if (scheduleError) {
    return (
      <StudentPageLayout>
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-700">{scheduleError}</p>
            <p className="text-sm text-gray-400 mt-1">Please check back later or contact your coordinator.</p>
            <button onClick={() => router.push("/student/dashboard")} className="mt-5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              Back to Dashboard
            </button>
          </div>
        </div>
      </StudentPageLayout>
    );
  }

  if (!formData) {
    return (
      <StudentPageLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentPageLayout>
    );
  }

  if (mutation.data?.success) {
    return (
      <StudentPageLayout>
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Re-enrollment Submitted!</h2>
            <p className="text-sm text-gray-500 mt-2">
              Your MS {nextMs} enrollment has been submitted and is now pending admin approval. You will be notified once it is approved.
            </p>
            <button onClick={() => router.push("/student/dashboard")} className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              Back to Dashboard
            </button>
          </div>
        </div>
      </StudentPageLayout>
    );
  }

  const stepComponents = [
    <AcademicInfoReadOnly
      key="academic"
      form={formData}
      updateField={updateField}
      updateBoolean={updateBoolean}
      nstpComponent={profile.nstpComponent}
      nextMs={nextMs}
    />,
    <PersonalInfoStep key="personal" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} />,
    <PhysicalHealthStep key="physical" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} />,
  ];

  return (
    <StudentPageLayout>
      <div className="max-w-xl mx-auto mt-4 sm:mt-8 px-2">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Re-enrollment for MS {nextMs}</h1>
          <p className="text-sm text-gray-500 mt-1">Review and update your information below.</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((label, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  <div className={`flex-1 h-0.5 transition-all ${index === 0 ? "opacity-0" : index <= currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shrink-0
                    ${index < currentStep ? "bg-blue-600 border-blue-600 text-white"
                    : index === currentStep ? "border-blue-600 text-blue-600 bg-white"
                    : "border-gray-200 text-gray-400 bg-white"}`}>
                    {index < currentStep ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : index + 1}
                  </div>
                  <div className={`flex-1 h-0.5 transition-all ${index === STEPS.length - 1 ? "opacity-0" : index < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
                </div>
                <span className={`text-xs mt-1 hidden sm:block text-center leading-tight
                  ${index === currentStep ? "text-blue-600 font-semibold" : index < currentStep ? "text-blue-400" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs font-semibold text-blue-600 mt-2 sm:hidden">
            Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep]}
          </p>
        </div>

        {/* Existing files info */}
        {currentStep === 2 && (
          <div className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-100">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-700">
                Your previously uploaded files (medical certificate, x-ray) will be kept unless you upload new ones.
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-5">
            Step {currentStep + 1} — {STEPS[currentStep]}
          </h2>

          <div className="space-y-4">
            {stepComponents[currentStep]}

            {displayError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{displayError}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {currentStep > 0 && (
                <Button type="button" variant="secondary" fullWidth onClick={handleBack}>
                  Back
                </Button>
              )}
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" fullWidth onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="button" fullWidth onClick={handleSubmit} loading={mutation.isPending}>
                  Submit Re-enrollment
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentPageLayout>
  );
}

function AcademicInfoReadOnly({
  form,
  updateField,
  updateBoolean,
  nstpComponent,
  nextMs,
}: {
  form: EnrollmentFormData;
  updateField: (field: keyof EnrollmentFormData, value: string) => void;
  updateBoolean: (field: keyof EnrollmentFormData, value: boolean) => void;
  nstpComponent: string;
  nextMs: string;
}) {
  return (
    <div className="space-y-4">
      {/* NSTP Component - Read only */}
      <div>
        <label className={labelClass}>NSTP Component</label>
        <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 bg-gray-50">
          {nstpComponent}
        </div>
        <p className="text-xs text-gray-400 mt-1">Cannot be changed during re-enrollment.</p>
      </div>

      {/* MS Level - Read only */}
      <div>
        <label className={labelClass}>MS Level</label>
        <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 bg-gray-50">
          MS {nextMs}
        </div>
        <p className="text-xs text-gray-400 mt-1">Automatically set for re-enrollment.</p>
      </div>

      {/* Course - Editable */}
      <div>
        <label className={labelClass}>Course</label>
        <select value={form.course} onChange={(e) => updateField("course", e.target.value)} className={selectClass}>
          <option value="">Select course...</option>
          {COURSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Year Level - Editable */}
      <div>
        <label className={labelClass}>Year Level</label>
        <select value={form.yearLevel} onChange={(e) => updateField("yearLevel", e.target.value)} className={selectClass}>
          <option value="">Select year level...</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>
      </div>

      {/* Willing to take Advance Course - only for ROTC */}
      {nstpComponent === "ROTC" && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.willingToTakeAdvanceCourse}
              onChange={(e) => updateBoolean("willingToTakeAdvanceCourse", e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Willing to take Advance Course</p>
              <p className="text-xs text-gray-500 mt-0.5">Check this if you want to enroll in the ROTC Advance Course program.</p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
