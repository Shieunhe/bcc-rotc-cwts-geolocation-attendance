import { EnrollmentDocument, AttendanceRecord } from "@/types";

interface Props {
  members: EnrollmentDocument[];
  recordMap: Map<string, AttendanceRecord>;
  graceOver: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  present:  { bg: "bg-green-50 border-green-200", text: "text-green-700", border: "border-l-green-500", label: "Present" },
  late:     { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", border: "border-l-amber-400", label: "Late" },
  absent:   { bg: "bg-red-50 border-red-200",     text: "text-red-700",   border: "border-l-red-400",   label: "Absent" },
  unmarked: { bg: "bg-gray-50 border-gray-200",   text: "text-gray-500",  border: "border-l-gray-300",  label: "Not Yet Marked" },
};

export default function PlatoonAttendanceList({ members, recordMap, graceOver }: Props) {
  if (members.length === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-xs text-gray-400">No members assigned to this platoon.</p>
      </div>
    );
  }

  const sorted = [...members].sort((a, b) => {
    const rawA = recordMap.get(a.uid)?.status;
    const rawB = recordMap.get(b.uid)?.status;
    const statusA = rawA ?? (graceOver ? "absent" : "unmarked");
    const statusB = rawB ?? (graceOver ? "absent" : "unmarked");
    const order: Record<string, number> = { present: 0, late: 1, absent: 2, unmarked: 3 };
    const diff = (order[statusA] ?? 4) - (order[statusB] ?? 4);
    if (diff !== 0) return diff;
    return a.lastName.localeCompare(b.lastName);
  });

  return (
    <div className="divide-y divide-gray-100">
      {sorted.map((m) => {
        const raw = recordMap.get(m.uid)?.status;
        const status = raw ?? (graceOver ? "absent" : "unmarked");
        const cfg = statusConfig[status] ?? statusConfig.absent;
        const middleInitial = m.middleName ? ` ${m.middleName[0]}.` : "";

        return (
          <div key={m.uid} className={`flex items-center gap-3 px-4 py-2.5 border-l-3 ${cfg.border}`}>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700">
                {m.lastName}, {m.firstName}{middleInitial}
              </p>
              {m.studentId && (
                <p className="text-[10px] text-gray-400 mt-0.5">{m.studentId}</p>
              )}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
