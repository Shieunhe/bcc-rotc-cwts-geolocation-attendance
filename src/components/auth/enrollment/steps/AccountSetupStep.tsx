import Input from "@/components/common/Input";
import { EnrollmentStepProps } from "@/types/enrollmentTypes";

const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

interface AccountSetupStepProps extends EnrollmentStepProps {
  photoPreview: string | null;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AccountSetupStep({ form, updateField, photoPreview, onPhotoUpload }: AccountSetupStepProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Email" type="email" placeholder="you@example.com"
          value={form.email} onChange={(e) => updateField("email", e.target.value)} />
        <Input label="Username" type="text" placeholder="e.g. juan.delacruz"
          value={form.username} onChange={(e) => updateField("username", e.target.value.toUpperCase())} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Password" type="password" placeholder="Min. 6 characters"
          value={form.password} onChange={(e) => updateField("password", e.target.value)} />
        <Input label="Confirm Password" type="password" placeholder="Re-enter password"
          value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} />
      </div>

      {/* 2x2 Photo Upload */}
      <div>
        <label className={labelClass}>2x2 Photo</label>
        <div className="flex items-center gap-4">
          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-4 cursor-pointer hover:border-blue-400 transition">
            <svg className="w-7 h-7 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-500">Click to upload photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={onPhotoUpload} />
          </label>
          {photoPreview && (
            <img src={photoPreview} alt="Photo preview" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
          )}
        </div>
      </div>
    </>
  );
}
