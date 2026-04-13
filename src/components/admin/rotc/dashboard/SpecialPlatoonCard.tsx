"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SPECIAL_UNITS, SPECIAL_UNIT_SLOT_LIMITS, SpecialUnit, EnrollmentDocument } from "@/types";
import { adminService } from "@/services/admin.service";

interface SpecialPlatoonCardProps {
  base: string;
}

export default function SpecialPlatoonCard({ base }: SpecialPlatoonCardProps) {
  const [data, setData] = useState<Record<SpecialUnit, EnrollmentDocument[]> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminService.getSpecialUnitEnrollments()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  const total = data ? SPECIAL_UNITS.reduce((sum, u) => sum + data[u].length, 0) : 0;
  const capacity = SPECIAL_UNITS.reduce((sum, u) => sum + SPECIAL_UNIT_SLOT_LIMITS[u], 0);

  return (
    <Link href={`${base}/special-platoon`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 2v4H6a2 2 0 00-2 2v4h4v4a2 2 0 002 2h4v-4h4a2 2 0 002-2V8h-4V4a2 2 0 00-2-2h-4z" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-red-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Special Platoon List</p>
      {isLoading ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
          Loading...
        </span>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold bg-red-100 text-red-700 border-red-200">
            {total}/{capacity} Assigned
          </span>
          {data && SPECIAL_UNITS.map((unit) => data[unit].length > 0 && (
            <span key={unit} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
              unit === "Medics" ? "bg-red-50 text-red-600 border-red-200" :
              unit === "HQ" ? "bg-blue-50 text-blue-600 border-blue-200" :
              "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}>
              {unit}: {data[unit].length}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">Tap to view special unit assignments.</p>
    </Link>
  );
}
