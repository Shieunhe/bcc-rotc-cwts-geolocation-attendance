"use client";

import { useState } from "react";
import Input from "@/components/common/Input";
import { BloodType } from "@/types";
import { EnrollmentStepProps } from "@/types/enrollmentTypes";
import { validateFileSize, formatFileSize } from "@/utils/fileUtils";

const bloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "N/A"];

const selectClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

const MEDICAL_NA_COURSES = ["BS CRIMINOLOGY"];

export default function PhysicalHealthStep({ form, updateField, updateBoolean, updateFile }: EnrollmentStepProps) {
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [xrayPreview, setXrayPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const isCWTS = form.nstpComponent === "CWTS";
  const isMedicalNA = isCWTS || MEDICAL_NA_COURSES.includes(form.course);

  function handleCertificateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    
    if (file) {
      const validation = validateFileSize(file);
      if (!validation.valid) {
        setFileError(validation.error || "File too large");
        e.target.value = "";
        return;
      }
      setCertPreview(`${file.name} (${formatFileSize(file.size)})`);
    }
    updateFile("medicalCertificate", file);
  }

  function handleXrayUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    
    if (file) {
      const validation = validateFileSize(file);
      if (!validation.valid) {
        setFileError(validation.error || "File too large");
        e.target.value = "";
        return;
      }
      setXrayPreview(`${file.name} (${formatFileSize(file.size)})`);
    }
    updateFile("xrayFile", file);
  }

  function handleMedicalConditionChange(value: boolean) {
    updateBoolean("hasMedicalCondition", value);
    if (value) {
      updateFile("xrayFile", null);
      setXrayPreview(null);
    } else {
      updateField("medicalCondition", "");
    }
    updateFile("medicalCertificate", null);
    setCertPreview(null);
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Height (cm)" type="number" placeholder="e.g. 165"
          value={form.height} onChange={(e) => updateField("height", e.target.value)} />
        <Input label="Weight (kg)" type="number" placeholder="e.g. 60"
          value={form.weight} onChange={(e) => updateField("weight", e.target.value)} />
        <div>
          <label className={labelClass}>Blood Type</label>
          <select value={form.bloodType} onChange={(e) => updateField("bloodType", e.target.value)} className={selectClass}>
            <option value="" disabled>Select blood type</option>
            {bloodTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Input label="Complexion" type="text" placeholder="e.g. Brown, Fair, etc."
            value={form.complexion} onChange={(e) => updateField("complexion", e.target.value)} />
      </div>

      {/* Medical Condition */}
      {!isMedicalNA && (
        <div className="space-y-3">
          <label className={labelClass}>Do you have any medical condition?</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="hasMedicalCondition"
                checked={form.hasMedicalCondition === true}
                onChange={() => handleMedicalConditionChange(true)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="hasMedicalCondition"
                checked={form.hasMedicalCondition === false}
                onChange={() => handleMedicalConditionChange(false)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>

          {form.hasMedicalCondition === true && (
            <div className="pl-6 border-l-2 border-blue-200">
              <Input label="Medical Condition Name" type="text" placeholder="e.g. Asthma, Hypertension"
                value={form.medicalCondition ?? ""} onChange={(e) => updateField("medicalCondition", e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* Uploads */}
      {(isMedicalNA || form.hasMedicalCondition !== null) && (
        <div className="space-y-3">
          {isCWTS && (
            <label className={labelClass}>Upload your Medical Certificate</label>
          )}
          {isMedicalNA && !isCWTS && (
            <label className={labelClass}>Upload your Medical Certificate and X-ray</label>
          )}
          <div>
            <label className={labelClass}>Medical Certificate</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-4 cursor-pointer hover:border-blue-400 transition">
              <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-xs text-gray-500">
                {certPreview ?? "Click to attach certificate"}
              </span>
              <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleCertificateUpload} />
            </label>
          </div>
          {!isCWTS && (
            <div>
              <label className={labelClass}>X-ray</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-4 cursor-pointer hover:border-blue-400 transition">
                <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-xs text-gray-500">
                  {xrayPreview ?? "Click to attach X-ray"}
                </span>
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleXrayUpload} />
              </label>
            </div>
          )}

          {fileError && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{fileError}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
