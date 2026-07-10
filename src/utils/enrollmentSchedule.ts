import { EnrollmentSchedule, StudentMsRecord } from "@/types";

export function extractSchoolYearFromScheduleId(scheduleId: string): string {
  const parts = scheduleId.split("_");
  return parts.length >= 3 ? parts.slice(2).join("_") : "";
}

export function buildScheduleId(schedule: EnrollmentSchedule): string {
  return `${schedule.program}_${schedule.msLevel}_${schedule.year}`;
}

export function compareSchedulesDesc(a: EnrollmentSchedule, b: EnrollmentSchedule): number {
  const yearDiff = (b.year || "").localeCompare(a.year || "");
  if (yearDiff !== 0) return yearDiff;

  const openDiff = new Date(b.openDate).getTime() - new Date(a.openDate).getTime();
  if (openDiff !== 0) return openDiff;

  return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
}

export function isScheduleOpenAt(schedule: EnrollmentSchedule, at: Date = new Date()): boolean {
  const time = at.getTime();
  return time >= new Date(schedule.openDate).getTime() && time <= new Date(schedule.deadline).getTime();
}

export function resolveSchoolYearFromRecord(
  record: Pick<StudentMsRecord, "scheduleId" | "msLevel" | "createdAt">,
  schedules: EnrollmentSchedule[],
): string {
  const explicitYear = extractSchoolYearFromScheduleId(record.scheduleId);
  if (explicitYear) return explicitYear;

  const sameLevel = schedules
    .filter((schedule) => schedule.msLevel === record.msLevel)
    .sort(compareSchedulesDesc);

  if (sameLevel.length === 0) return "";

  const createdAt = new Date(record.createdAt).getTime();
  if (Number.isNaN(createdAt)) return sameLevel[0].year;

  const matchingWindow = sameLevel.find((schedule) => {
    const openAt = new Date(schedule.openDate).getTime();
    const closeAt = new Date(schedule.deadline).getTime();
    return createdAt >= openAt && createdAt <= closeAt;
  });
  if (matchingWindow) return matchingWindow.year;

  const alreadyStarted = sameLevel.filter((schedule) => createdAt >= new Date(schedule.openDate).getTime());
  if (alreadyStarted.length > 0) return alreadyStarted[0].year;

  return sameLevel[0].year;
}
