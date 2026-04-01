"use client";

import { useState } from "react";
import {
  ROTC_BATTALION_2_COMPANIES,
  ROTC_PLATOONS_PER_COMPANY,
  ROTC_PLATOON_SLOT_LIMIT,
} from "@/types";
import { useROTCPlatoonRoster } from "@/hooks/useROTCPlatoonRoster";
import ROTCBattalionSection, { countBattalionMembers } from "@/components/admin/rotc/platoon-roster/components/ROTCBattalionSection";

export default function OfficerBattalionTwo() {
  const { roster, isLoading } = useROTCPlatoonRoster();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (key: string) => setExpanded((prev) => (prev === key ? null : key));

  const total = roster ? countBattalionMembers(roster.battalion2, ROTC_BATTALION_2_COMPANIES) : 0;
  const capacity = ROTC_BATTALION_2_COMPANIES.length * ROTC_PLATOONS_PER_COMPANY * ROTC_PLATOON_SLOT_LIMIT;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Battalion 2 — Female</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View all female cadettes assigned to Battalion 2 companies and platoons.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Total Cadettes</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{isLoading ? "—" : total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Capacity</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {isLoading ? "—" : total}
            <span className="text-sm text-gray-400 font-medium">/{capacity}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Companies</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{ROTC_BATTALION_2_COMPANIES.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-400">Loading roster...</p>
        </div>
      ) : roster && (
        <ROTCBattalionSection
          battalionNum={2}
          label="Female"
          companies={ROTC_BATTALION_2_COMPANIES}
          data={roster.battalion2}
          expanded={expanded}
          onToggle={toggle}
        />
      )}
    </>
  );
}
