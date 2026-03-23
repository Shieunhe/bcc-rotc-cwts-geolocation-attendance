import React from 'react'
import { EnrollmentStatus } from '@/types';

interface EnrollmentTimelineProps {
    timelineSteps: {
        label: string;
        description: string;
    }[];
    status: {
        label: string;
        description: string;
        timelineStep: number;
    };
    profileStatus: EnrollmentStatus;
}

export default function EnrollmentTimeline({ timelineSteps, status, profileStatus }: EnrollmentTimelineProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Progress</h3>
        <div className="flex items-start">
        {timelineSteps.map((step, index) => {
            const isDone = index < status.timelineStep;
            const isCurrent = index === status.timelineStep;
            const isRejected = profileStatus === "rejected" && index === 2;

            return (
            <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                <div className={`flex-1 h-0.5 ${index === 0 ? "invisible" : isDone || isCurrent ? "bg-blue-500" : "bg-gray-200"}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2
                    ${isRejected ? "bg-red-100 border-red-400" :
                    isDone ? "bg-blue-600 border-blue-600" :
                    isCurrent ? "bg-white border-blue-500" :
                    "bg-white border-gray-200"}`}
                >
                    {isRejected ? (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    ) : isDone ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    )}
                </div>
                <div className={`flex-1 h-0.5 ${index === timelineSteps.length - 1 ? "invisible" : isDone ? "bg-blue-500" : "bg-gray-200"}`} />
                </div>
                <div className="text-center mt-2 px-1">
                <p className={`text-xs font-semibold ${isDone || isCurrent ? "text-gray-800" : "text-gray-400"}`}>{step.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">{step.description}</p>
                </div>
            </div>
            );
        })}
        </div>
    </div>
  )
}
