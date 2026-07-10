"use client";

import { useEnrollmentSchedule } from "@/hooks/useEnrollmentSchedule";

function getCurrentRosterMsLevel(schedules: { msLevel: "1" | "2"; openDate: string; deadline: string }[]): "1" | "2" {
  if (schedules.length === 0) return "1";

  const now = new Date();
  const activeOrUpcoming = schedules
    .filter((s) => new Date(s.deadline) >= now)
    .sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime());

  if (activeOrUpcoming.length > 0) return activeOrUpcoming[0].msLevel;

  const latestClosed = [...schedules].sort(
    (a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  )[0];

  return latestClosed?.msLevel ?? "1";
}

export function useCurrentRotcMsLevel() {
  const { schedules, isLoading } = useEnrollmentSchedule("ROTC");

  return {
    currentMsLevel: getCurrentRosterMsLevel(schedules),
    schedules,
    isLoading,
  };
}
