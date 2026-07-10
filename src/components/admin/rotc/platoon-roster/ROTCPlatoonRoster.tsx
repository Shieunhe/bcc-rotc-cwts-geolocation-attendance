"use client";

import { useState, useEffect } from "react";
import {
  ROTC_BATTALION_1_COMPANIES, ROTC_BATTALION_2_COMPANIES,
  ROTC_PLATOONS_PER_COMPANY, ROTC_PLATOON_SLOT_LIMIT,
  SPECIAL_UNITS, SPECIAL_UNIT_SLOT_LIMITS, SpecialUnit, EnrollmentDocument,
} from "@/types";
import { useROTCPlatoonRoster } from "@/hooks/useROTCPlatoonRoster";
import { useCurrentRotcMsLevel } from "@/hooks/useCurrentRotcMsLevel";
import { adminService } from "@/services/admin.service";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import ROTCBattalionSection, { countBattalionMembers } from "./components/ROTCBattalionSection";
import AdvanceCourseSection from "./components/AdvanceCourseSection";
import SpecialBattalionSection from "./components/SpecialBattalionSection";
import ROTCheader from "./components/ROTCheader";
import ROTCAssignSummary from "./components/ROTCAssignSummary";
import ROTCAssignAssignment from "./components/ROTCAssignAssignment";


function isScheduleClosed(deadline: string | undefined): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

function getCurrentSchedule(
  schedules: { msLevel: "1" | "2"; openDate: string; deadline: string }[],
  currentMsLevel: "1" | "2",
) {
  const now = new Date();
  const matching = schedules.filter((s) => s.msLevel === currentMsLevel);
  const activeOrUpcoming = matching
    .filter((s) => new Date(s.deadline) >= now)
    .sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime());

  if (activeOrUpcoming.length > 0) return activeOrUpcoming[0];

  return [...matching].sort(
    (a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  )[0] ?? null;
}

export default function ROTCPlatoonRoster() {
  const { schedules, currentMsLevel } = useCurrentRotcMsLevel();
  const { roster, isLoading, refetch } = useROTCPlatoonRoster(currentMsLevel);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [result, setResult] = useState<{ assigned: number; alreadyAssigned: number } | null>(null);
  const [specialData, setSpecialData] = useState<Record<SpecialUnit, EnrollmentDocument[]> | null>(null);

  useEffect(() => {
    adminService.getSpecialUnitEnrollments(currentMsLevel).then(setSpecialData);
  }, [currentMsLevel]);

  const currentSchedule = getCurrentSchedule(schedules, currentMsLevel);
  const closed = currentSchedule ? isScheduleClosed(currentSchedule.deadline) : false;

  async function handleAssign() {
    setIsAssigning(true);
    setResult(null);
    try {
      const res = await adminService.assignROTCPlatoons(currentMsLevel);
      setResult(res);
      refetch();
      adminService.getSpecialUnitEnrollments(currentMsLevel).then(setSpecialData);
    } finally {
      setIsAssigning(false);
    }
  }

  const toggle = (key: string) => setExpanded((prev) => (prev === key ? null : key));

  const b1Total = roster ? countBattalionMembers(roster.battalion1, ROTC_BATTALION_1_COMPANIES) : 0;
  const b2Total = roster ? countBattalionMembers(roster.battalion2, ROTC_BATTALION_2_COMPANIES) : 0;
  const advanceTotal = roster ? (roster.advanceCourseMale.length + roster.advanceCourseFemale.length) : 0;
  const specialTotal = specialData ? SPECIAL_UNITS.reduce((sum, u) => sum + specialData[u].length, 0) : 0;
  const specialCapacity = SPECIAL_UNITS.reduce((sum, u) => sum + SPECIAL_UNIT_SLOT_LIMITS[u], 0);
  const grandTotal = b1Total + b2Total + advanceTotal + specialTotal;
  const b1Capacity = ROTC_BATTALION_1_COMPANIES.length * ROTC_PLATOONS_PER_COMPANY * ROTC_PLATOON_SLOT_LIMIT;
  const b2Capacity = ROTC_BATTALION_2_COMPANIES.length * ROTC_PLATOONS_PER_COMPANY * ROTC_PLATOON_SLOT_LIMIT;

  return (
    <AdminPageLayout program="ROTC">
      <ROTCheader msLevel={currentMsLevel} />
      <ROTCAssignSummary 
        isLoading={isLoading} 
        grandTotal={grandTotal} 
        b1Total={b1Total} 
        b2Total={b2Total} 
        b1Capacity={b1Capacity}
        b2Capacity={b2Capacity}
        advanceTotal={advanceTotal}
        specialTotal={specialTotal}
        specialCapacity={specialCapacity}
        closed={closed}
      />
      <ROTCAssignAssignment 
        closed={closed} 
        msLevel={currentMsLevel}
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
          <AdvanceCourseSection
            maleStudents={roster.advanceCourseMale}
            femaleStudents={roster.advanceCourseFemale}
          />
          {specialData && (
            <SpecialBattalionSection unitData={specialData} />
          )}
        </div>
      )}
    </AdminPageLayout>
  );
}
