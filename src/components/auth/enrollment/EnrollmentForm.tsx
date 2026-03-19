"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/common/Button";
import { EnrollmentFormData, defaultEnrollmentForm } from "@/types/enrollmentTypes";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import AcademicInfoStep from "./steps/AcademicInfoStep";
import PhysicalHealthStep from "./steps/PhysicalHealthStep";
import AccountSetupStep from "./steps/AccountSetupStep";

const STEPS = ["Personal Info", "Academic Info", "Physical & Health", "Account Setup"];

export default function EnrollmentForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EnrollmentFormData>(defaultEnrollmentForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
    setFormData((prev) => ({ ...prev, photo: file }));
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  function validateCurrentStep(): string {
    if (currentStep === 0) {
      if (!formData.studentId) return "Student ID is required.";
      if (!formData.fullName) return "Full name is required.";
      if (!formData.birthdate) return "Birthdate is required.";
      if (!formData.sex) return "Sex is required.";
      if (!formData.contactNumber) return "Contact number is required.";
      if (!formData.address) return "Address is required.";
    }
    if (currentStep === 1) {
      if (!formData.course) return "Course is required.";
      if (!formData.yearLevel) return "Year level is required.";
      if (!formData.nstpComponent) return "NSTP component is required.";
      if (!formData.nstpLevel) return "NSTP level is required.";
    }
    if (currentStep === 2) {
      if (!formData.height) return "Height is required.";
      if (!formData.weight) return "Weight is required.";
      if (!formData.bloodType) return "Blood type is required.";
      if (!formData.activityLevel) return "Activity level is required.";
      if (!formData.trainingCapability) return "Training capability is required.";
      if (formData.hasMedicalCondition && !formData.medicalCondition) return "Please specify your medical condition.";
      if (formData.hasMedicalCondition && !formData.medicalCertificate) return "Medical certificate is required.";
    }
    if (currentStep === 3) {
      if (!formData.email) return "Email is required.";
      if (!formData.username) return "Username is required.";
      if (!formData.password) return "Password is required.";
      if (formData.password.length < 6) return "Password must be at least 6 characters.";
      if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
      if (!formData.photo) return "2x2 photo is required.";
    }
    return "";
  }

  function handleNext() {
    const error = validateCurrentStep();
    if (error) { setErrorMessage(error); return; }
    setErrorMessage("");
    setCurrentStep((prev) => prev + 1);
  }

  function handleBack() {
    setErrorMessage("");
    setCurrentStep((prev) => prev - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateCurrentStep();
    if (error) { setErrorMessage(error); return; }
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      // TODO: connect Firebase Auth + Firestore here
      console.log("Enrollment data:", formData);
      alert("Enrollment submitted! (Firebase not yet connected)");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Enrollment failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepComponents = [
    <PersonalInfoStep key="personal" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} />,
    <AcademicInfoStep key="academic" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} />,
    <PhysicalHealthStep key="physical" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} />,
    <AccountSetupStep key="account" form={formData} updateField={updateField} updateBoolean={updateBoolean} updateFile={updateFile} photoPreview={photoPreview} onPhotoUpload={handlePhotoUpload} />,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">NSTP Enrollment</h1>
          <p className="text-sm text-gray-500 mt-1">BCC ROTC / CWTS System</p>
        </div>

        {/* Progress Steps */}
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

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-5">
            Step {currentStep + 1} — {STEPS[currentStep]}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {stepComponents[currentStep]}
            {/* Error message */}
            {errorMessage && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
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
                <Button type="button" fullWidth onClick={handleNext}>
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
        <p className="text-center text-xs text-gray-400 mt-3">
          Buenavista Community College &copy; {new Date().getFullYear()}
        </p>

      </div>
    </div>
  );
}
