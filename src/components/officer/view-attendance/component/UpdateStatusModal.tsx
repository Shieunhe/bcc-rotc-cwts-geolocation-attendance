"use client";

import { useState } from "react";
import { adminService } from "@/services/admin.service";
import { AttendanceRecordStatus, EnrollmentDocument } from "@/types";

const STATUS_OPTIONS: { value: AttendanceRecordStatus; label: string; bg: string; border: string; text: string; ring: string }[] = [
  { value: "present", label: "Present", bg: "bg-green-50", border: "border-green-200", text: "text-green-700", ring: "ring-green-400" },
  { value: "late",    label: "Late",    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", ring: "ring-amber-400" },
  { value: "absent",  label: "Absent",  bg: "bg-red-50",   border: "border-red-200",   text: "text-red-700",   ring: "ring-red-400" },
];

interface Props {
  recordId: string;
  currentStatus: AttendanceRecordStatus;
  student?: EnrollmentDocument;
  studentUid: string;
  onClose: () => void;
  onUpdated: (recordId: string, newStatus: AttendanceRecordStatus) => void;
}

export default function UpdateStatusModal({ recordId, currentStatus, student, studentUid, onClose, onUpdated }: Props) {
  const [selected, setSelected] = useState<AttendanceRecordStatus>(currentStatus);
  const [saving, setSaving] = useState(false);

  const name = student
    ? `${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName[0]}.` : ""}`
    : studentUid;

  const hasChanged = selected !== currentStatus;

  const handleSave = async () => {
    if (!hasChanged) return;
    setSaving(true);
    try {
      await adminService.updateAttendanceStatus(recordId, selected);
      onUpdated(recordId, selected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Update Attendance</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Change the status for this student</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Student info */}
          <div className="rounded-xl border border-gray-100 p-3">
            <p className="text-xs font-bold text-gray-800">{name}</p>
            {student && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {student.studentId}{student.course ? ` · ${student.course}` : ""}{student.yearLevel ? ` · ${student.yearLevel}` : ""}
              </p>
            )}
          </div>

          {/* Status selection */}
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Select New Status</p>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = selected === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelected(opt.value)}
                    className={`py-3 rounded-xl border-2 text-xs font-bold transition ${
                      isSelected
                        ? `${opt.bg} ${opt.border} ${opt.text} ring-2 ${opt.ring} ring-offset-1`
                        : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current vs new indicator */}
          {hasChanged && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[10px] text-blue-700 font-medium">
                Status will change from <span className="font-bold capitalize">{currentStatus}</span> to <span className="font-bold capitalize">{selected}</span>
              </p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!hasChanged || saving}
            className="w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
          >
            {saving ? "Saving..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
