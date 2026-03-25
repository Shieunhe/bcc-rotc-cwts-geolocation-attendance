import { NSTProgram } from '@/types';
import React from 'react'

interface AdminEnrollmentHeaderProps {
    program: NSTProgram;
}

export default function AdminEnrollmentHeader({ program }: AdminEnrollmentHeaderProps) {
  return (
    <div>
        <h1 className="text-xl font-bold text-gray-800">Enrollment List</h1>
        <p className="text-sm text-gray-400 mt-0.5">
        {program} enrollment list
        </p>
    </div>
  )
}
