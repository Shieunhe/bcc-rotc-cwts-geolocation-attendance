import { useState } from "react";
import { useEffect } from "react";
import { EnrollmentDocument, EnrollmentStatus, SpecialUnit, SPECIAL_UNITS, SPECIAL_UNIT_SLOT_LIMITS } from "@/types";
import { adminService } from "@/services/admin.service";
import FilePreview from "@/components/common/FilePreview";
import Button from "@/components/common/Button";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(date: string | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; className: string; dot: string }> = {
  pending: { label: "Pending Review", className: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  approved: { label: "Approved", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

interface AdminEnrollmentDetailModalProps {
  enrollment: EnrollmentDocument;
  onClose: () => void;
  onStatusChange?: () => void;
}

function toTitleCase(text: string) {
  return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const displayed = typeof value === "string" ? toTitleCase(value) : value;
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-gray-400 mb-1 tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 font-medium break-words leading-relaxed">{displayed || "—"}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50/50 rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">{children}</div>
    </div>
  );
}

const ICONS = {
  person: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  family: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  emergency: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  academic: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  health: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  file: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function AdminEnrollmentDetailModal({ enrollment, onClose, onStatusChange }: AdminEnrollmentDetailModalProps) {
  const statusConfig = STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.pending;
  const [showDisapprove, setShowDisapprove] = useState(false);
  const [disapproveReason, setDisapproveReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const hasMedical = enrollment.hasMedicalCondition === true && enrollment.nstpComponent === "ROTC";
  const [showMedicalAssign, setShowMedicalAssign] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<SpecialUnit | "">("");
  const [unitCounts, setUnitCounts] = useState<Record<SpecialUnit, number>>({ Medics: 0, HQ: 0, MP: 0 });
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    if (!showMedicalAssign) return;
    setLoadingCounts(true);
    Promise.all(SPECIAL_UNITS.map((u) => adminService.getSpecialUnitCount(u)))
      .then(([medics, hq, mp]) => setUnitCounts({ Medics: medics, HQ: hq, MP: mp }))
      .finally(() => setLoadingCounts(false));
  }, [showMedicalAssign]);

  async function handleApprove() {
    if (hasMedical && !showMedicalAssign) {
      setShowMedicalAssign(true);
      return;
    }
    setIsUpdating(true);
    try {
      if (hasMedical && selectedUnit) {
        const result = await adminService.approveWithSpecialUnit(enrollment.uid, selectedUnit);
        if (!result) {
          alert(`${selectedUnit} unit is full (${SPECIAL_UNIT_SLOT_LIMITS[selectedUnit]}/${SPECIAL_UNIT_SLOT_LIMITS[selectedUnit]}). Please select a different unit.`);
          setIsUpdating(false);
          return;
        }
      } else if (enrollment.nstpComponent === "CWTS") {
        const company = await adminService.approveCWTSEnrollment(enrollment.uid);
        if (!company) {
          alert("All companies are full. Cannot approve more CWTS enrollments.");
          setIsUpdating(false);
          return;
        }
      } else {
        await adminService.updateEnrollmentStatus(enrollment.uid, "approved");
      }
      onStatusChange?.();
      onClose();
    } catch {
      setIsUpdating(false);
    }
  }

  async function handleDisapprove() {
    if (!disapproveReason.trim()) return;
    setIsUpdating(true);
    try {
      await adminService.updateEnrollmentStatus(enrollment.uid, "rejected", disapproveReason.trim());
      onStatusChange?.();
      onClose();
    } catch {
      setIsUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3.5">
            {enrollment.photo ? (
              <img src={enrollment.photo} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {enrollment.firstName?.[0]}{enrollment.lastName?.[0]}
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900">{enrollment.lastName}, {enrollment.firstName} {enrollment.middleName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-400">{enrollment.studentId} • {enrollment.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${statusConfig.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Section title="Personal Information" icon={ICONS.person}>
            <Field label="Last Name" value={enrollment.lastName} />
            <Field label="First Name" value={enrollment.firstName} />
            <Field label="Middle Name" value={enrollment.middleName} />
            <Field label="Sex" value={enrollment.sex} />
            <Field label="Birthdate" value={enrollment.birthdate} />
            <Field label="Place of Birth" value={enrollment.placeOfBirth} />
            <Field label="Religion" value={enrollment.religion} />
            <Field label="Contact Number" value={enrollment.contactNumber} />
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Section title="Temporary Address" icon={ICONS.location}>
              <Field label="Barangay" value={enrollment.temporaryBarangay} />
              <Field label="Municipality" value={enrollment.temporaryMunicipality} />
              <Field label="Province" value={enrollment.temporaryProvince} />
            </Section>
            <Section title="Permanent Address" icon={ICONS.location}>
              <Field label="Barangay" value={enrollment.permanentBarangay} />
              <Field label="Municipality" value={enrollment.permanentMunicipality} />
              <Field label="Province" value={enrollment.permanentProvince} />
            </Section>
          </div>

          <Section title="Family Information" icon={ICONS.family}>
            <Field label="Father's Name" value={enrollment.fatherName} />
            <Field label="Father's Occupation" value={enrollment.fatherOccupation} />
            <Field label="Mother's Name" value={enrollment.motherName} />
            <Field label="Mother's Occupation" value={enrollment.motherOccupation} />
          </Section>

          <Section title="Emergency Contact" icon={ICONS.emergency}>
            <Field label="Name" value={enrollment.emergencyContactName} />
            <Field label="Relationship" value={enrollment.emergencyContactRelationship} />
            <Field label="Contact Number" value={enrollment.emergencyContactContactNumber} />
            <Field label="Address" value={enrollment.emergencyContactAddress} />
          </Section>

          <Section title="Academic Information" icon={ICONS.academic}>
            <Field label="Course" value={enrollment.course} />
            <Field label="Year Level" value={enrollment.yearLevel} />
            <Field label="NSTP Component" value={enrollment.nstpComponent} />
            <Field label="MS Level" value={enrollment.msLevel} />
            <Field label="Advance Course" value={enrollment.willingToTakeAdvanceCourse ? "Yes" : "No"} />
            {enrollment.company && (
              <Field label="Company" value={
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                  {enrollment.company}
                </span>
              } />
            )}
            {enrollment.specialUnit && (
              <Field label="Special Unit" value={
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${enrollment.specialUnit === "Medics" ? "bg-red-50 text-red-700 border-red-200" : enrollment.specialUnit === "HQ" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  {enrollment.specialUnit === "Medics" ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 2v4H6a2 2 0 00-2 2v4h4v4a2 2 0 002 2h4v-4h4a2 2 0 002-2V8h-4V4a2 2 0 00-2-2h-4z" />
                    </svg>
                  ) : enrollment.specialUnit === "HQ" ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  {enrollment.specialUnit}
                </span>
              } />
            )}
          </Section>

          <Section title="Physical & Health" icon={ICONS.health}>
            <Field label="Height" value={enrollment.height} />
            <Field label="Weight" value={enrollment.weight} />
            <Field label="Blood Type" value={enrollment.bloodType} />
            <Field label="Complexion" value={enrollment.complexion} />
            <Field label="Medical Condition" value={enrollment.hasMedicalCondition ? enrollment.medicalCondition : "None"} />
          </Section>

          <div className="bg-gray-50/50 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-400">{ICONS.file}</span>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Uploaded Files</h3>
            </div>
            <div className="flex flex-wrap gap-5">
              <div className="space-y-1.5 text-center">
                <FilePreview url={enrollment.photo} label="Photo" size="md" />
                <p className="text-[11px] text-gray-400 font-medium">Photo 2x2</p>
              </div>
              <div className="space-y-1.5 text-center">
                <FilePreview url={enrollment.medicalCertificate} label="Medical Certificate" size="md" />
                <p className="text-[11px] text-gray-400 font-medium">Med. Cert</p>
              </div>
              <div className="space-y-1.5 text-center">
                <FilePreview url={enrollment.xrayFile} label="X-Ray" size="md" />
                <p className="text-[11px] text-gray-400 font-medium">X-Ray</p>
              </div>
              <div className="space-y-1.5 text-center">
                <FilePreview url={enrollment.corFile} label="COR" size="md" />
                <p className="text-[11px] text-gray-400 font-medium">COR</p>
              </div>
            </div>
          </div>

          <Section title="Timeline" icon={ICONS.clock}>
            <Field label="Submitted" value={formatDate(enrollment.createdAt)} />
            <Field label="Last Updated" value={formatDate(enrollment.updatedAt)} />
          </Section>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
          {enrollment.status !== "pending" ? (
            <Button variant="secondary" fullWidth className="!py-2 !text-sm" onClick={onClose}>Close</Button>
          ) : showMedicalAssign ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-700">Medical Condition Detected</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    This student has a medical condition: <span className="font-semibold">{enrollment.medicalCondition}</span>.
                    Please assign them to a special unit.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Assignment</label>
                {loadingCounts ? (
                  <div className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-400 bg-gray-50">Loading slots...</div>
                ) : (
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value as SpecialUnit)}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                  >
                    <option value="" disabled>Select a special unit...</option>
                    {SPECIAL_UNITS.map((unit) => {
                      const limit = SPECIAL_UNIT_SLOT_LIMITS[unit];
                      const isFull = unitCounts[unit] >= limit;
                      return (
                        <option key={unit} value={unit} disabled={isFull}>
                          {unit} ({unitCounts[unit]}/{limit}){isFull ? " — FULL" : ""}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="success"
                  fullWidth
                  className="!py-2 !text-sm"
                  disabled={!selectedUnit}
                  loading={isUpdating}
                  onClick={handleApprove}
                >
                  {selectedUnit ? `Approve & Assign to ${selectedUnit}` : "Select a special unit to approve"}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  className="!py-2 !text-sm"
                  onClick={() => { setShowMedicalAssign(false); setSelectedUnit(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : showDisapprove ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for disapproval</label>
                <textarea
                  value={disapproveReason}
                  onChange={(e) => setDisapproveReason(e.target.value)}
                  placeholder="Enter the reason for disapproving this enrollment..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  fullWidth
                  className="!py-2 !text-sm"
                  disabled={!disapproveReason.trim()}
                  loading={isUpdating}
                  onClick={handleDisapprove}
                >
                  Confirm Disapproval
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  className="!py-2 !text-sm"
                  onClick={() => { setShowDisapprove(false); setDisapproveReason(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="success" fullWidth className="!py-2 !text-sm" onClick={handleApprove} loading={isUpdating}>Approve</Button>
              <Button variant="danger" fullWidth className="!py-2 !text-sm" onClick={() => setShowDisapprove(true)}>Disapprove</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
