import Button from '@/components/common/Button'
import React from 'react'

interface ROTCAssignAssignmentProps {
  closed: boolean;
  isAssigning: boolean;
  result: { assigned: number; alreadyAssigned: number } | null;
  handleAssign: () => void;
}

export default function ROTCAssignAssignment({ closed, isAssigning, result, handleAssign }: ROTCAssignAssignmentProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${closed ? "bg-green-50" : "bg-amber-50"}`}>
            {closed ? (
              <svg className="w-5 h-5 text-gr   een-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Platoon Assignment</h3>
            <p className="text-xs text-gray-400">
              {closed
                ? "Enrollment is closed. You can now assign cadets to platoons."
                : "Waiting for enrollment schedule to close before assignment."}
            </p>
          </div>
        </div>

        <Button
          onClick={handleAssign}
          loading={isAssigning}
          disabled={!closed}
          fullWidth
          className="!py-2.5 !text-sm"
        >
          {isAssigning ? "Assigning..." : "Assign Platoons"}
        </Button>

        {result && (
          <div className={`mt-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${result.assigned > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
            {result.assigned > 0
              ? `Successfully assigned ${result.assigned} cadet${result.assigned > 1 ? "s" : ""} to platoons. ${result.alreadyAssigned > 0 ? `${result.alreadyAssigned} were already assigned.` : ""}`
              : "All approved cadets are already assigned. No changes made."}
          </div>
        )}
    </div>
  )
}
