"use client";

import { useState } from "react";
import {
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
  ROTC_PLATOONS_PER_COMPANY, ROTC_PLATOON_SLOT_LIMIT,
} from "@/types";
import { useROTCPlatoonRoster } from "@/hooks/useROTCPlatoonRoster";
import { useEnrollmentSchedule } from "@/hooks/useEnrollmentSchedule";
import { adminService } from "@/services/admin.service";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import Button from "@/components/common/Button";
import ROTCBattalionSection, { countBattalionMembers } from "./components/ROTCBattalionSection";
import ROTCheader from "./components/ROTCheader";
import ROTCAssignSummary from "./components/ROTCAssignSummary";
import ROTCAssignAssignment from "./components/ROTCAssignAssignment";


function isScheduleClosed(deadline: string | undefined): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

export default function ROTCPlatoonRoster() {
  const { roster, isLoading, refetch } = useROTCPlatoonRoster();
  const { schedule } = useEnrollmentSchedule("ROTC");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [result, setResult] = useState<{ assigned: number; alreadyAssigned: number } | null>(null);

  const closed = isScheduleClosed(schedule?.deadline);

  async function handleAssign() {
    setIsAssigning(true);
    setResult(null);
    try {
      const res = await adminService.assignROTCPlatoons();
      setResult(res);
      refetch();
    } finally {
      setIsAssigning(false);
    }
  }

  const toggle = (key: string) => setExpanded((prev) => (prev === key ? null : key));

  const b1Total = roster ? countBattalionMembers(roster.battalion1, ROTC_BATTALION_1_COMPANIES) : 0;
  const b2Total = roster ? countBattalionMembers(roster.battalion2, ROTC_BATTALION_2_COMPANIES) : 0;
  const grandTotal = b1Total + b2Total;
  const b1Capacity = ROTC_BATTALION_1_COMPANIES.length * ROTC_PLATOONS_PER_COMPANY * ROTC_PLATOON_SLOT_LIMIT;
  const b2Capacity = ROTC_BATTALION_2_COMPANIES.length * ROTC_PLATOONS_PER_COMPANY * ROTC_PLATOON_SLOT_LIMIT;

  return (
    <AdminPageLayout program="ROTC">
      <ROTCheader />
      <ROTCAssignSummary 
        isLoading={isLoading} 
        grandTotal={grandTotal} 
        b1Total={b1Total} 
        b2Total={b2Total} 
        b1Capacity={b1Capacity}
        b2Capacity={b2Capacity}
        closed={closed}
      />
      <ROTCAssignAssignment 
        closed={closed} 
        isAssigning={isAssigning} 
        result={result} 
        handleAssign={handleAssign} 
      />
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-400">Loading roster...</p>
        </div>
      ) : roster && (
        <div className="space-y-8">
          <ROTCBattalionSection
            battalionNum={1}
            label="Male"
            companies={ROTC_BATTALION_1_COMPANIES}
            data={roster.battalion1}
            expanded={expanded}
            onToggle={toggle}
          />
          <ROTCBattalionSection
            battalionNum={2}
            label="Female"
            companies={ROTC_BATTALION_2_COMPANIES}
            data={roster.battalion2}
            expanded={expanded}
            onToggle={toggle}
          />
        </div>
      )}
    </AdminPageLayout>
  );
}
