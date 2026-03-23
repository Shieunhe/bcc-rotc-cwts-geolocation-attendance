import React from 'react'

interface EnrollmentStatusBannerProps {
    status: {
        label: string;
        description: string;
        timelineStep: number;
        badgeColor: string;
        dot: string;
        color: string;
    };
}

export default function EnrollmentStatusBanner({ status }: EnrollmentStatusBannerProps) {
  return (
    <div className={`rounded-2xl border p-5 ${status.color}`}>
        <div className="flex items-center gap-3 mb-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${status.badgeColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
        </span>
        </div>
        <p className="text-sm text-gray-600">{status.description}</p>
    </div>
  )
}
