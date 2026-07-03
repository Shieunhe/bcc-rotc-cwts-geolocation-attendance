"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/common/Button";
import { EnrollmentFormData, defaultEnrollmentForm } from "@/types/enrollmentTypes";
import { useEnrollment } from "@/hooks/useEnrollment";
import { validateFileSize } from "@/utils/fileUtils";
import { adminService } from "@/services/admin.service";
import { NSTProgram } from "@/types";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import AcademicInfoStep from "./steps/AcademicInfoStep";
import PhysicalHealthStep from "./steps/PhysicalHealthStep";
import AccountSetupStep from "./steps/AccountSetupStep";
import Footer from "@/components/common/Footer";
import SuccessModalStep from "./steps/successModalStep";

const STEPS = ["Academic Info", "Personal Info", "Physical & Health", "Account Setup"];

export default function EnrollmentForm() {
  const { submitEnrollment, isSubmitting, isSuccess, error: submitError, clearError } = useEnrollment();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EnrollmentFormData>(defaultEnrollmentForm);
  const [validationError, setValidationError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function updateField(field: keyof EnrollmentFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateBoolean(field: keyof EnrollmentFormData, value: boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateFile(field: keyof EnrollmentFormData, value: File | null) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    
    if (file) {
      const validation = validateFileSize(file);
      if (!validation.valid) {
        setFileError(validation.error || "File too large");
        e.target.value = "";
        return;
      }
      setPhotoPreview(URL.createObjectURL(file));
    }
    setFormData((prev) => ({ ...prev, photo: file }));
  }

  function handleFileError(error: string | null) {
    setFileError(error);
  }

  function validateCurrentStep(): string {
    if (currentStep === 0) {
      const levelLabel = formData.nstpComponent === "CWTS" ? "CWTS level" : "MS level";
      if (!formData.course) return "Course is required.";
      if (!formData.yearLevel) return "Year level is required.";
      if (!formData.nstpComponent) return "NSTP component is required.";
      if (!formData.msLevel) return `${levelLabel} is required.`;
    }
    if (currentStep === 1) {    
      if (!formData.studentId) return "Student ID is required.";
      if (!/^\d{6}-\d{4}$/.test(formData.studentId)) return "Student ID must be in format 000000-0000 (e.g. 202020-0404).";
      if (!formData.lastName) return "Last name is required.";
      if (!formData.firstName) return "First name is required.";
      if (!formData.contactNumber) return "Contact number is required.";
      if (formData.contactNumber.length !== 11) return "Contact number must be 11 digits (e.g. 09XXXXXXXXX).";
      if (!formData.religion) return "Religion is required.";
      if (!formData.birthdate) return "Birth of date is required.";
      if (!formData.sex) return "Gender is required.";
      if (!formData.placeOfBirth) return "Place of birth is required.";
      if (!formData.temporaryBarangay) return "Temporary No./ St / Vill / Brgy is required.";
      if (!formData.temporaryMunicipality) return "Temporary Municipality is required.";
      if (!formData.temporaryProvince) return "Temporary Province is required.";
      if (!formData.permanentBarangay) return "Permanent No./ St / Vill / Brgy is required.";
      if (!formData.permanentMunicipality) return "Permanent Municipality is required.";
      if (!formData.permanentProvince) return "Permanent Province is required.";
      if (!formData.fatherName) return "Father name is required.";
      if (!formData.fatherOccupation) return "Father occupation is required.";
      if (!formData.motherName) return "Mother name is required.";
      if (!formData.motherOccupation) return "Mother occupation is required.";
      if (!formData.emergencyContactName) return "Emergency contact name is required.";
      if (!formData.emergencyContactAddress) return "Emergency contact address is required.";
      if (!formData.emergencyContactRelationship) return "Emergency contact relationship is required.";
      if (!formData.emergencyContactContactNumber) return "Emergency contact contact number is required.";
      if (formData.emergencyContactContactNumber.length !== 11) return "Emergency contact number must be 11 digits (e.g. 09XXXXXXXXX).";
    }
    if (currentStep === 2) {
      if (!formData.height) return "Height is required.";
      if (!formData.weight) return "Weight is required."; 
      if (!formData.bloodType) return "Blood type is required.";
      if (!formData.complexion) return "Complexion is required.";
      const isCWTS = formData.nstpComponent === "CWTS";
      const isMedicalNA = isCWTS || formData.course === "BS CRIMINOLOGY";
      if (!formData.medicalCertificate) return "Medical certificate is required.";
      if (!isMedicalNA) {
        if (formData.hasMedicalCondition === null) return "Please select if you have a medical condition.";
        if (formData.hasMedicalCondition === true && !formData.medicalCondition) return "Please specify your medical condition.";
      }
      if (!isCWTS && !formData.xrayFile) return "X-ray is required.";
    }
    if (currentStep === 3) {
      if (!formData.email) return "Email is required.";
      if (!formData.username) return "Username is required.";
      if (!formData.password) return "Password is required.";
      if (formData.password.length < 6) return "Password must be at least 6 characters.";
      if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
      if (!formData.photo) return "2x2 photo is required.";
      if (!formData.corFile) return "Certificate of Registration (COR) is required.";
    }
    return "";
  }

  const [isCheckingSchedule, setIsCheckingSchedule] = useState(false);

  async function handleNext() {
    const error = validateCurrentStep();
    if (error) { setValidationError(error); return; }

    if (currentStep === 0 && formData.nstpComponent && formData.msLevel) {
      setIsCheckingSchedule(true);
      const levelLabel = formData.nstpComponent === "CWTS" ? "CWTS" : "MS";
      try {
        const schedule = await adminService.getEnrollmentSchedule(formData.nstpComponent as NSTProgram, formData.msLevel);
        if (!schedule) {
          setValidationError(`${formData.nstpComponent} ${levelLabel} ${formData.msLevel} is not yet open for enrollment.`);
          setIsCheckingSchedule(false);
          return;
        }
        const now = new Date();
        const open = new Date(schedule.openDate);
        const end = new Date(schedule.deadline);
        if (now < open) {
          setValidationError(`${formData.nstpComponent} ${levelLabel} ${formData.msLevel} enrollment is not yet open. It opens on ${schedule.openDate}.`);
          setIsCheckingSchedule(false);
          return;
        }
        if (now > end) {
          setValidationError(`${formData.nstpComponent} ${levelLabel} ${formData.msLevel} enrollment is already closed. The deadline was ${schedule.deadline}.`);
          setIsCheckingSchedule(false);
          return;
        }
      } catch {
        setValidationError("Unable to verify enrollment schedule. Please try again.");
        setIsCheckingSchedule(false);
        return;
      }
      setIsCheckingSchedule(false);
    }

    setValidationError("");
    setFileError(null);
    clearError();
    setCurrentStep((prev) => prev + 1);
  }

  function handleBack() {
    setValidationError("");
    setFileError(null);
    clearError();
    setCurrentStep((prev) => prev - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateCurrentStep();
    if (error) { setValidationError(error); return; }
    setValidationError("");
    clearError();
    
    await submitEnrollment(formData);
  }

  const stepComponents = [
    <AcademicInfoStep key="academic" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} />,
    <PersonalInfoStep key="personal" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} />,
    <PhysicalHealthStep key="physical" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} />,
    <AccountSetupStep key="account" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} photoPreview={photoPreview} onPhotoUpload={handlePhotoUpload} onFileError={handleFileError} />,
  ];

  const displayError = fileError || validationError || submitError;

  if (isSuccess) {
    return <SuccessModalStep />;
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6"
      style={{
        background:
          "radial-gradient(circle at top center, rgba(255,255,255,0.95), rgba(255,255,255,0.82) 20%, rgba(206,225,250,0.92) 52%, rgba(184,208,242,1) 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(59,130,246,0.06),rgba(37,99,235,0.12))]" />
        <div className="absolute left-[-5rem] bottom-[-4rem] h-72 w-72 rounded-full bg-blue-300/70 blur-3xl" />
        <div className="absolute right-[-6rem] top-[-3rem] h-80 w-80 rounded-full bg-sky-200/90 blur-3xl" />
        <div className="absolute left-1/2 top-12 h-24 w-72 -translate-x-1/2 rounded-full bg-white/70 blur-2xl" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">

        {/* Progress Steps */}
        <div
          className="mb-7 rounded-[2.2rem] bg-white px-6 py-6 sm:px-8"
          style={{
            border: "1px solid rgba(241, 245, 249, 1)",
            boxShadow: "0 44px 116px rgba(37,99,235,0.28), 0 24px 58px rgba(15,23,42,0.16), inset 0 2px 0 rgba(255,255,255,0.98)",
          }}
        >
          <div
            className="mb-5 rounded-3xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 px-5 py-4 text-center"
            style={{ boxShadow: "0 18px 40px rgba(37, 99, 235, 0.14)" }}
          >
            <p className="text-2xl font-extrabold uppercase tracking-[0.16em] text-blue-700 sm:text-3xl">
              Enrollment Form
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Complete these steps to finish your enrollment.
            </p>
          </div>

          <div className="flex items-center justify-between">
            {STEPS.map((label, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  <div className={`flex-1 h-1 transition-all ${index === 0 ? "opacity-0" : index <= currentStep ? "bg-blue-300" : "bg-slate-200"}`} />
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold border-2 transition-all shrink-0
                    ${index < currentStep ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                    : index === currentStep ? "border-blue-600 text-white bg-blue-600 shadow-lg"
                    : "border-slate-300 text-slate-500 bg-white"}`}>
                    {index < currentStep ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : index + 1}
                  </div>
                  <div className={`flex-1 h-1 transition-all ${index === STEPS.length - 1 ? "opacity-0" : index < currentStep ? "bg-blue-300" : "bg-slate-200"}`} />
                </div>
                <span className={`mt-3 hidden text-center text-sm leading-tight sm:block
                  ${index === currentStep ? "font-semibold text-blue-600" : index < currentStep ? "text-blue-500" : "text-slate-500"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs font-semibold text-blue-600 mt-2 sm:hidden">
            Step {currentStep + 1} of {STEPS.length} - {STEPS[currentStep]}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[2.2rem] bg-white p-6 sm:p-8"
          style={{
            border: "1px solid rgba(241, 245, 249, 1)",
            boxShadow: "0 52px 132px rgba(37,99,235,0.30), 0 28px 68px rgba(15,23,42,0.18), inset 0 2px 0 rgba(255,255,255,1)",
          }}
        >
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-[0_10px_24px_rgba(37,99,235,0.10)]">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3Zm-7.59 8.47L12 15.53l7.59-4.06L12 7.41 4.41 11.47ZM6 14.78V18c0 1.66 2.69 3 6 3s6-1.34 6-3v-3.22l-6 3.27-6-3.27Z" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold text-slate-900 sm:text-2xl"
              style={{ fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", letterSpacing: "-0.02em" }}
            >
              Step {currentStep + 1} - {STEPS[currentStep]}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {stepComponents[currentStep]}
            {/* Error message */}
            {displayError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{displayError}</span>
              </div>
            )}
            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              {currentStep > 0 && (
                <Button type="button" variant="secondary" fullWidth onClick={handleBack}>
                  Back
                </Button>
              )}
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" fullWidth onClick={handleNext} loading={isCheckingSchedule}>
                  Next
                </Button>
              ) : (
                <Button type="submit" fullWidth loading={isSubmitting}>
                  Submit Enrollment
                </Button>
              )}
            </div>

          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
        <Footer />
      </div>
    </div>
  );
}
