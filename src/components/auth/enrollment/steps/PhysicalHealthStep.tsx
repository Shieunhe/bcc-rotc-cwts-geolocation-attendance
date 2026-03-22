"use client";

import { useState } from "react";
import Input from "@/components/common/Input";
import { BloodType } from "@/types";
import { EnrollmentStepProps } from "@/types/enrollmentTypes";

const bloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "N/A"];

const selectClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

export default function PhysicalHealthStep({ form, updateField, updateBoolean, updateFile }: EnrollmentStepProps) {
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [xrayPreview, setXrayPreview] = useState<string | null>(null);

  function handleCertificateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    updateFile("medicalCertificate", file);
    if (file) setCertPreview(file.name);
  }

  function handleXrayUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    updateFile("xrayFile", file);
    if (file) setXrayPreview(file.name);
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

      {/* Medical Condition Yes/No */}
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

        {/* Yes: Show Medical Condition Name + Medical Certificate */}
        {form.hasMedicalCondition === true && (
          <div className="space-y-3 pl-6 border-l-2 border-blue-200">
            <Input label="Medical Condition Name" type="text" placeholder="e.g. Asthma, Hypertension"
              value={form.medicalCondition ?? ""} onChange={(e) => updateField("medicalCondition", e.target.value)} />
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
          </div>
        )}

        {/* No: Show X-ray + Medical Certificate Upload */}
        {form.hasMedicalCondition === false && (
          <div className="space-y-3 pl-6 border-l-2 border-blue-200">
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
          </div>
        )}
      </div>
    </>
  );
}
